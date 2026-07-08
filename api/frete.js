export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cepDestino } = req.body;
  if (!cepDestino) return res.status(400).json({ error: 'CEP é obrigatório' });

  const cepDest = cepDestino.replace(/\D/g, '');
  const cepOrigem = '28200000'; // CEP da Loja (SJB)
  
  // Credenciais da Loja
  const CNPJ = process.env.CORREIOS_CNPJ || '52826087000154';
  const SENHA_API = process.env.CORREIOS_SENHA_API || 'fn8kxySsVhNn9RnPj4KwosPQj9qXD3CdyryXaWvn';
  const CARTAO = process.env.CORREIOS_CARTAO || '0080201750';
  
  // Códigos de Serviço do Contrato
  const COD_PAC = '03298';
  const COD_SEDEX = '03220';

  async function getCorreiosToken() {
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
          throw new Error('Falha ao autenticar na nova API dos Correios: ' + JSON.stringify(authData));
      }
      return authData.token;
  }

  async function fetchPrice(token, codigoServico) {
      const payload = {
        idLote: "1",
        parametrosPrazo: [
          {
            coProduto: codigoServico,
            cepOrigem: cepOrigem,
            cepDestino: cepDest,
            nuPeso: 1,
            nuFormato: 1,
            nuComprimento: 20,
            nuAltura: 20,
            nuLargura: 20,
            nuDiametro: 0,
            vlDeclarado: 0
          }
        ]
      };

      const res = await fetch('https://api.correios.com.br/preco/v1/nacional', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data && data.length > 0 && data[0].pcFinal) {
          return {
              preco: parseFloat(data[0].pcFinal.replace(',', '.')),
              prazo: parseInt(data[0].prazoEntrega)
          };
      }
      return null;
  }

  try {
      // 1. Pega Token CWS
      const token = await getCorreiosToken();

      // 2. Busca PAC e SEDEX em paralelo
      const [pac, sedex] = await Promise.all([
          fetchPrice(token, COD_PAC).catch(e => null),
          fetchPrice(token, COD_SEDEX).catch(e => null)
      ]);

      if (!pac && !sedex) {
          return res.status(500).json({ error: 'Correios indisponível para este CEP.' });
      }

      return res.status(200).json({
          pac: pac,
          sedex: sedex
      });

  } catch (error) {
      console.error('Correios CWS Error:', error);
      return res.status(500).json({ error: error.message });
  }
}
