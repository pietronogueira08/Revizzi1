export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cepDestino } = req.body;
  if (!cepDestino) return res.status(400).json({ error: 'CEP é obrigatório' });

  const cepDest = cepDestino.replace(/\D/g, '');
  const cepOrigem = '28200000'; // CEP da Loja (SJB)
  
  // Para usar o contrato, configure no Vercel: CORREIOS_EMPRESA, CORREIOS_SENHA
  const nCdEmpresa = process.env.CORREIOS_EMPRESA || '';
  const sDsSenha = process.env.CORREIOS_SENHA || '';
  
  // Códigos de serviço: se tiver contrato, geralmente usa 03298 (PAC) e 03220 (SEDEX)
  // Sem contrato: 04510 (PAC) e 04014 (SEDEX)
  const codPac = nCdEmpresa ? (process.env.CORREIOS_PAC_COD || '03298') : '04510';
  const codSedex = nCdEmpresa ? (process.env.CORREIOS_SEDEX_COD || '03220') : '04014';

  async function fetchCorreios(codigoServico) {
      const url = `http://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx?nCdEmpresa=${nCdEmpresa}&sDsSenha=${sDsSenha}&sCepOrigem=${cepOrigem}&sCepDestino=${cepDest}&nVlPeso=1&nCdFormato=1&nVlComprimento=20&nVlAltura=20&nVlLargura=20&sCdMaoPropria=N&nVlValorDeclarado=0&sCdAvisoRecebimento=N&nCdServico=${codigoServico}&nVlDiametro=0`;
      
      const response = await fetch(url);
      const xml = await response.text();
      
      // Regex para extrair do XML sem precisar de bibliotecas pesadas
      const valorMatch = xml.match(/<Valor>(.*?)<\/Valor>/);
      const prazoMatch = xml.match(/<PrazoEntrega>(.*?)<\/PrazoEntrega>/);
      const erroMatch = xml.match(/<MsgErro><!\[CDATA\[(.*?)\]\]><\/MsgErro>/);
      
      if (erroMatch && erroMatch[1].trim() !== '') {
          throw new Error(erroMatch[1]);
      }
      
      if (valorMatch && prazoMatch) {
          return {
              preco: parseFloat(valorMatch[1].replace(',', '.')),
              prazo: parseInt(prazoMatch[1])
          };
      }
      throw new Error("Resposta inválida dos Correios");
  }

  try {
      // Busca PAC e SEDEX em paralelo
      const [pac, sedex] = await Promise.all([
          fetchCorreios(codPac).catch(e => { console.warn('Erro PAC:', e.message); return null; }),
          fetchCorreios(codSedex).catch(e => { console.warn('Erro SEDEX:', e.message); return null; })
      ]);

      if (!pac && !sedex) {
          return res.status(500).json({ error: 'Correios indisponível para este CEP.' });
      }

      return res.status(200).json({
          pac: pac,
          sedex: sedex
      });

  } catch (error) {
      console.error('Correios WS Error:', error);
      return res.status(500).json({ error: error.message });
  }
}
