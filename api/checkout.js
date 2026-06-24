export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, customerName, customerEmail } = req.body;
    
    const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
    
    // Fallback if environment variable is not set yet
    if (!MP_TOKEN) {
      return res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado no painel da Vercel.' });
    }

    const payload = {
      items: items.map(item => ({
        title: item.title || item.name || 'Produto',
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price || item.price || 0),
        currency_id: 'BRL'
      })),
      payer: {
        name: customerName,
        email: customerEmail || 'cliente@email.com'
      },
      back_urls: {
        success: req.headers.origin || 'https://revizzi.com.br',
        failure: req.headers.origin || 'https://revizzi.com.br',
        pending: req.headers.origin || 'https://revizzi.com.br'
      },
      auto_return: "approved"
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago Error:', data);
      return res.status(400).json({ error: 'Erro ao gerar pagamento no Mercado Pago.', details: data });
    }

    // Retorna a URL de checkout do Mercado Pago
    return res.status(200).json({ init_point: data.init_point });
    
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}
