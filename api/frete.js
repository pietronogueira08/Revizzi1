export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cepDestino, pesoTotal, comprimento, largura, altura } = req.body;
  if (!cepDestino) return res.status(400).json({ error: 'CEP é obrigatório' });

  const cepDest = cepDestino.replace(/\D/g, '');
  const cepOrigem = '28200000'; // CEP da Loja (SJB)

  // Credenciais do Contrato dos Correios
  const CNPJ     = process.env.CORREIOS_CNPJ      || '52826087000154';
  const SENHA_API = process.env.CORREIOS_SENHA_API || 'fn8kxySsVhNn9RnPj4KwosPQj9qXD3CdyryXaWvn';
  const CARTAO   = process.env.CORREIOS_CARTAO    || '0080201750';

  // Códigos de Serviço do Contrato PJ
  const COD_PAC   = '03298';
  const COD_SEDEX = '03220';

  // ── Peso e dimensões reais ──
  // Correios exigem peso mínimo de 300g e máximo de 30.000g
  const PESO_MINIMO = 300;
  const PESO_PADRAO = 500; // usado quando o produto não tem peso cadastrado

  const pesoRaw = Number(pesoTotal) || PESO_PADRAO;
  const peso    = Math.max(PESO_MINIMO, Math.round(pesoRaw));   // aplica mínimo de 300g

  // Dimensões — Correios exigem mínimo 1cm em cada eixo, máximo 100cm
  const comp = Math.max(1, Math.min(100, Math.round(Number(comprimento) || 20)));
  const larg = Math.max(1, Math.min(100, Math.round(Number(largura)    || 15)));
  const alt  = Math.max(1, Math.min(100, Math.round(Number(altura)     || 15)));

  try {
    // ── 1. Autenticar no CWS dos Correios ──
    const credentials = Buffer.from(`${CNPJ}:${SENHA_API}`).toString('base64');
    const authRes = await fetch('https://api.correios.com.br/token/v1/autentica/cartaopostagem', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ numero: CARTAO })
    });

    const authData = await authRes.json();
    if (!authData.token) {
      throw new Error('Falha na autenticação Correios CWS');
    }
    const token = authData.token;

    // ── 2. Buscar Preço (PAC + SEDEX em uma única chamada) ──
    const produtoBase = {
      cepOrigem,
      cepDestino: cepDest,
      psObjeto: peso,       // peso real em gramas
      tpObjeto: 2,          // 2 = caixa/pacote
      comprimento: comp,
      largura: larg,
      altura: alt,
      diametro: 0,
      vlDeclarado: 0
    };

    const payloadPreco = {
      idLote: '1',
      parametrosProduto: [
        { ...produtoBase, coProduto: COD_PAC,   nuRequisicao: '1' },
        { ...produtoBase, coProduto: COD_SEDEX, nuRequisicao: '2' }
      ]
    };

    const precoRes = await fetch('https://api.correios.com.br/preco/v1/nacional', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payloadPreco)
    });

    // ── 3. Buscar Prazo (PAC + SEDEX em uma única chamada) ──
    const payloadPrazo = {
      idLote: '1',
      parametrosPrazo: [
        { coProduto: COD_PAC,   nuRequisicao: '1', cepOrigem, cepDestino: cepDest },
        { coProduto: COD_SEDEX, nuRequisicao: '2', cepOrigem, cepDestino: cepDest }
      ]
    };

    const prazoRes = await fetch('https://api.correios.com.br/prazo/v1/nacional', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payloadPrazo)
    });

    const precoData = await precoRes.json();
    const prazoData = await prazoRes.json();

    // ── 4. Montar resposta ──
    let pac   = null;
    let sedex = null;

    if (Array.isArray(precoData) && Array.isArray(prazoData)) {
      const precoPac   = precoData.find(p => p.coProduto === COD_PAC   && p.pcFinal && !p.txErro);
      const precoSedex = precoData.find(p => p.coProduto === COD_SEDEX && p.pcFinal && !p.txErro);
      const prazoPac   = prazoData.find(p => p.coProduto === COD_PAC   && !p.txErro);
      const prazoSedex = prazoData.find(p => p.coProduto === COD_SEDEX && !p.txErro);

      if (precoPac) {
        pac = {
          preco: parseFloat(precoPac.pcFinal.replace(',', '.')),
          prazo: prazoPac ? prazoPac.prazoEntrega : 10
        };
      }
      if (precoSedex) {
        sedex = {
          preco: parseFloat(precoSedex.pcFinal.replace(',', '.')),
          prazo: prazoSedex ? prazoSedex.prazoEntrega : 5
        };
      }
    }

    if (!pac && !sedex) {
      return res.status(500).json({ error: 'Correios indisponível para este CEP.' });
    }

    // Retornar também o peso usado (para debug/log)
    return res.status(200).json({ pac, sedex, pesoUsado: peso, dimsUsadas: { comp, larg, alt } });

  } catch (error) {
    console.error('Correios CWS Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
