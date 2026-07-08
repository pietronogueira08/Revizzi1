export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cepDestino } = req.body;
  if (!cepDestino) return res.status(400).json({ error: 'CEP é obrigatório' });

  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Token do Melhor Envio não configurado.' });
  }

  try {
    const payload = {
        from: { postal_code: "28200000" },
        to: { postal_code: cepDestino.replace(/\D/g, '') },
        products: [
            {
                id: "produto_1",
                width: 20,
                height: 20,
                length: 20,
                weight: 1, // 1kg default
                insurance_value: 10,
                quantity: 1
            }
        ]
    };

    const meRes = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/calculate', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'Revizzi (revizzi@revizzi.com.br)'
        },
        body: JSON.stringify(payload)
    });

    if (!meRes.ok) {
        const errTxt = await meRes.text();
        console.error("ME Frete API Error:", errTxt);
        return res.status(500).json({ error: `Erro na API do Melhor Envio: ${meRes.status}`, details: errTxt });
    }

    const data = await meRes.json();
    
    let pacOption = null;
    let sedexOption = null;
    let fallbackOption = null;
    
    for (let option of data) {
        if (option.error) continue; 
        
        let nome = option.name.toLowerCase();
        let preco = parseFloat(option.custom_price || option.price);
        let prazo = parseInt(option.custom_delivery_time || option.delivery_time);

        if (nome.includes('pac')) {
            pacOption = { preco: preco, prazo: prazo };
        } else if (nome.includes('sedex')) {
            sedexOption = { preco: preco, prazo: prazo };
        } else if (!fallbackOption) {
            fallbackOption = { preco: preco, prazo: prazo };
        }
    }
    
    // Se falhar em achar pac/sedex, tenta o fallback logico
    if (!pacOption && fallbackOption) pacOption = fallbackOption;
    if (!sedexOption && fallbackOption) sedexOption = fallbackOption;

    return res.status(200).json({
        pac: pacOption,
        sedex: sedexOption
    });

  } catch (error) {
    console.error('ME API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
