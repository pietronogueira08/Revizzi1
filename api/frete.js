export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cep } = req.query;
  if (!cep) return res.status(400).json({ error: 'CEP é obrigatório' });

  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Token do Melhor Envio não configurado.' });
  }

  try {
    const payload = {
        from: { postal_code: "28200000" },
        to: { postal_code: cep.replace(/\D/g, '') },
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
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (!meRes.ok) {
        throw new Error(`Melhor Envio falhou: ${meRes.status}`);
    }

    const data = await meRes.json();
    
    // Filtra opções dos Correios (PAC e SEDEX) ou transportadoras úteis.
    // O id das transportadoras e serviços varia, mas geralmente:
    // Correios PAC = id 1, Correios Sedex = id 2
    let pacOption = null;
    let sedexOption = null;
    let fallbackOption = null;
    
    for (let option of data) {
        if (option.error) continue; // Ignora se não entrega na região
        
        let nome = option.name.toLowerCase();
        let preco = parseFloat(option.custom_price || option.price);
        let prazo = option.custom_delivery_time || option.delivery_time;

        if (nome.includes('pac')) {
            pacOption = { Servico: "PAC", Preco: preco, Prazo: prazo };
        } else if (nome.includes('sedex')) {
            sedexOption = { Servico: "SEDEX", Preco: preco, Prazo: prazo };
        } else if (!fallbackOption) {
            fallbackOption = { Servico: option.name, Preco: preco, Prazo: prazo };
        }
    }
    
    // Retorna no formato compatível com o frontend atual
    let results = [];
    if (pacOption) results.push(pacOption);
    if (sedexOption) results.push(sedexOption);
    if (results.length === 0 && fallbackOption) results.push(fallbackOption);
    if (results.length === 0) throw new Error("Nenhuma opção de frete disponível para este CEP.");
    
    // Transforma para o frontend que espera array bruto
    let xmlMock = results.map(r => `<cServico><Codigo>${r.Servico === 'SEDEX' ? '04014' : '04510'}</Codigo><Valor>${r.Preco.toString().replace('.', ',')}</Valor><PrazoEntrega>${r.Prazo}</PrazoEntrega><Erro>0</Erro></cServico>`).join('');

    return res.status(200).send(`<?xml version="1.0" encoding="ISO-8859-1"?><Servicos>${xmlMock}</Servicos>`);

  } catch (error) {
    console.error('ME API Error:', error);
    // Fallback caso a API do Melhor Envio caia, usamos um fixo só pra não travar a venda
    const fallbackXml = `<Servicos><cServico><Codigo>04510</Codigo><Valor>25,00</Valor><PrazoEntrega>10</PrazoEntrega><Erro>0</Erro></cServico><cServico><Codigo>04014</Codigo><Valor>45,00</Valor><PrazoEntrega>3</PrazoEntrega><Erro>0</Erro></cServico></Servicos>`;
    return res.status(200).send(`<?xml version="1.0" encoding="ISO-8859-1"?><Servicos>${fallbackXml}</Servicos>`);
  }
}
