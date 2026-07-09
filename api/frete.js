export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cepDestino } = req.body;
  if (!cepDestino) return res.status(400).json({ error: 'CEP é obrigatório' });

  const cepDest = cepDestino.replace(/\D/g, '');
  const cepOrigem = '28200000'; // CEP da Loja (SJB)
  
  // Credenciais do Contrato dos Correios
  const CNPJ = process.env.CORREIOS_CNPJ || '52826087000154';
  const SENHA_API = process.env.CORREIOS_SENHA_API || 'fn8kxySsVhNn9RnPj4KwosPQj9qXD3CdyryXaWvn';
  const CARTAO = process.env.CORREIOS_CARTAO || '0080201750';
  
  // Códigos de Serviço do Contrato PJ
  const COD_PAC = '03298';
  const COD_SEDEX = '03220';

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
      const payloadPreco = {
          idLote: "1",
          parametrosProduto: [
              {
                  coProduto: COD_PAC,
                  nuRequisicao: "1",
                  cepOrigem: cepOrigem,
                  cepDestino: cepDest,
                  psObjeto: 1000,
                  tpObjeto: 2,
                  comprimento: 20,
                  largura: 20,
                  altura: 20,
                  diametro: 0,
                  vlDeclarado: 0
              },
              {
                  coProduto: COD_SEDEX,
                  nuRequisicao: "2",
                  cepOrigem: cepOrigem,
                  cepDestino: cepDest,
                  psObjeto: 1000,
                  tpObjeto: 2,
                  comprimento: 20,
                  largura: 20,
                  altura: 20,
                  diametro: 0,
                  vlDeclarado: 0
              }
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
          idLote: "1",
          parametrosPrazo: [
              { coProduto: COD_PAC, nuRequisicao: "1", cepOrigem: cepOrigem, cepDestino: cepDest },
              { coProduto: COD_SEDEX, nuRequisicao: "2", cepOrigem: cepOrigem, cepDestino: cepDest }
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
      let pac = null;
      let sedex = null;

      if (Array.isArray(precoData) && Array.isArray(prazoData)) {
          const precoPac = precoData.find(p => p.coProduto === COD_PAC && p.pcFinal && !p.txErro);
          const precoSedex = precoData.find(p => p.coProduto === COD_SEDEX && p.pcFinal && !p.txErro);
          const prazoPac = prazoData.find(p => p.coProduto === COD_PAC && !p.txErro);
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

      return res.status(200).json({ pac, sedex });

  } catch (error) {
      console.error('Correios CWS Error:', error);
      return res.status(500).json({ error: error.message });
  }
}
