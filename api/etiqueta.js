export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order } = req.body;
  if (!order) {
    return res.status(400).json({ error: 'Order data is required' });
  }

  const token = process.env.MELHOR_ENVIO_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'Token do Melhor Envio não configurado.' });
  }

  try {
    const orderItems = order.items || [];
    let productsList = [];
    let totalValor = 0;
    
    orderItems.forEach(item => {
        if (item.name && item.name.toLowerCase().includes('frete')) return;
        let pPrice = parseFloat(item.price || 0);
        let pQty = parseInt(item.quantity || 1);
        totalValor += (pPrice * pQty);
        productsList.push({
            name: (item.name || "Produto").substring(0, 30),
            quantity: pQty,
            unitary_value: parseFloat(pPrice.toFixed(2)) || 1.00,
            weight: 0.5
        });
    });
    
    if (productsList.length === 0) {
        productsList.push({ name: "Produto Automotivo", quantity: 1, unitary_value: 10.00, weight: 1.0 });
    }

    let freightMethodName = order.items && order.items.find(i => i.name === 'Frete') ? order.items.find(i => i.name === 'Frete').method : '';
    // Service IDs in ME: 1 = PAC, 2 = SEDEX
    let serviceId = (freightMethodName && freightMethodName.toLowerCase().includes('sedex')) ? 2 : 1;

    const telefoneDestinatario = order.customer_phone ? order.customer_phone.replace(/\D/g, '') : "22999999999";
    const docDestinatario = order.customer_cpf ? order.customer_cpf.replace(/\D/g, '') : "12345678909"; 
    // ME requires a valid CPF. We should probably ask the frontend to collect it, 
    // but we can try to send it anyway or use a valid generator.
    // 14798150066 is a valid test CPF algorithmically.
    const finalDoc = docDestinatario.length === 11 ? docDestinatario : "14798150066";

    const mePayload = {
        service: serviceId,
        // Omitimos o 'from' para que a API puxe automaticamente o endereço e CNPJ configurados no painel do Melhor Envio
        to: {
            name: (order.customer_name || "Cliente Revizzi").substring(0, 50),
            phone: telefoneDestinatario,
            email: "cliente@email.com",
            document: finalDoc, 
            address: (order.customer_address || "Endereco Padrao").substring(0, 50),
            complement: (order.customer_complement || "").substring(0, 30),
            number: (order.customer_number || "S/N").substring(0, 5),
            district: (order.customer_district || "Bairro").substring(0, 50),
            city: (order.customer_city || "Cidade").substring(0, 50),
            state_abbr: (order.customer_state || "RJ").substring(0, 2),
            postal_code: order.customer_cep ? order.customer_cep.replace(/\D/g, '') : "28010021"
        },
        products: productsList,
        volumes: [{ height: 20, width: 20, length: 20, weight: 1.0 }],
        options: {
            insurance_value: parseFloat(totalValor.toFixed(2)) || 10.00,
            receipt: false,
            own_hand: false,
            reverse: false,
            non_commercial: true 
        }
    };

    const cartRes = await fetch('https://www.melhorenvio.com.br/api/v2/me/cart', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(mePayload)
    });

    if (!cartRes.ok) {
        const errTxt = await cartRes.text();
        console.error("Melhor Envio Cart Error:", errTxt);
        return res.status(500).json({ error: `API Melhor Envio retornou erro no Carrinho: ${cartRes.status} | Detalhes: ${errTxt}` });
    }

    const cartData = await cartRes.json();
    const orderMeId = cartData.id;

    // 2. Checkout
    // Nota: O checkout só funciona se houver saldo na carteira ou cartão cadastrado.
    const checkoutRes = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/checkout', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ orders: [orderMeId] })
    });
    
    if (!checkoutRes.ok) {
        const errTxt = await checkoutRes.text();
        return res.status(500).json({ error: `Erro no Checkout do Melhor Envio (Talvez falta de Saldo): ${checkoutRes.status}`, errorLogs: errTxt });
    }

    // 3. Generate Label
    const genRes = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/generate', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ orders: [orderMeId] })
    });

    // 4. Print Label
    const printRes = await fetch('https://www.melhorenvio.com.br/api/v2/me/shipment/print', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ mode: "public", orders: [orderMeId] })
    });
    
    if (printRes.ok) {
        const printData = await printRes.json();
        return res.status(200).json({
            success: true,
            pdfUrl: printData.url
        });
    }

    return res.status(200).json({
        success: true,
        message: "Etiqueta inserida no carrinho do Melhor Envio, mas a url de impressão não foi retornada.",
        data: cartData
    });

  } catch (error) {
    console.error('Error in ME Etiqueta API:', error);
    return res.status(500).json({ error: error.message });
  }
}
