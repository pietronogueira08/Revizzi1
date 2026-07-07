export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cepDestino } = req.body;
  if (!cepDestino) {
    return res.status(400).json({ error: 'cepDestino is required' });
  }

  const rawCepDestino = cepDestino.replace(/\D/g, '');

  const user = process.env.CORREIOS_USER;
  const pass = process.env.CORREIOS_PASS;
  // If not configured in Vercel yet, return a simulated fallback
  if (!user || !pass) {
    return res.status(200).json({
      pac: { preco: 35.00, prazo: 8 },
      sedex: { preco: 60.00, prazo: 4 },
      warning: 'Credenciais dos Correios não configuradas. Retornando frete simulado.'
    });
  }

  try {
    // 1. Generate Token
    const authString = Buffer.from(`${user}:${pass}`).toString('base64');
    let tokenRes = await fetch('https://api.correios.com.br/token/v1/autentica/cartaopostagem', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        numero: process.env.CORREIOS_CARTAO || ''
      })
    });

    let tokenData;
    if (!tokenRes.ok) {
        // Fallback to standard autentica
        const tokenResAlt = await fetch('https://api.correios.com.br/token/v1/autentica', {
            method: 'POST',
            headers: { 'Authorization': `Basic ${authString}` }
        });
        if (!tokenResAlt.ok) throw new Error('Falha na autenticação dos Correios');
        tokenData = await tokenResAlt.json();
    } else {
        tokenData = await tokenRes.json();
    }

    const token = tokenData.token;

    // 2. Fetch Pricing
    const originCep = '28200000'; // São João da Barra
    const params = new URLSearchParams({
      coProduto: '03220,03298', // PAC (03220) and SEDEX (03298) for contract
      cepOrigem: originCep,
      cepDestino: rawCepDestino,
      psObjeto: '1000', // 1kg
      tpFormato: '1', // Caixa/Pacote
      comprimento: '20',
      largura: '20',
      altura: '20',
      vlDeclarado: '0'
    });

    const priceRes = await fetch(`https://api.correios.com.br/preco/v1/nacional?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!priceRes.ok) {
        const errorText = await priceRes.text();
        console.error('Correios price error:', errorText);
        throw new Error('Falha ao calcular frete nos Correios');
    }

    const priceData = await priceRes.json();
    
    // Parse response
    let pac = { preco: 35.00, prazo: 8 };
    let sedex = { preco: 60.00, prazo: 4 };

    if (Array.isArray(priceData)) {
      priceData.forEach(item => {
        const price = parseFloat(item.pcBaseGeral.replace(',', '.'));
        const days = parseInt(item.prazoEntrega, 10);
        if (item.coProduto === '03220' || item.coProduto === '04510') {
            pac = { preco: price, prazo: days };
        } else if (item.coProduto === '03298' || item.coProduto === '04014' || item.coProduto === '03140') {
            sedex = { preco: price, prazo: days };
        }
      });
    }

    return res.status(200).json({ pac, sedex });
  } catch (error) {
    console.error('Error fetching Correios API:', error);
    // Return fallback so checkout doesn't break
    return res.status(200).json({
      pac: { preco: 35.00, prazo: 8 },
      sedex: { preco: 60.00, prazo: 4 },
      warning: 'Erro na API dos Correios. Retornando frete simulado.'
    });
  }
}
