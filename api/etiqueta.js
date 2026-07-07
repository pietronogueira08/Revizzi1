export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order } = req.body;
  if (!order) {
    return res.status(400).json({ error: 'Order data is required' });
  }

  const user = process.env.CORREIOS_USER;
  const pass = process.env.CORREIOS_PASS;
  const cartao = process.env.CORREIOS_CARTAO || '0080201750';

  if (!user || !pass) {
    return res.status(500).json({ error: 'Credenciais dos Correios não configuradas no servidor.' });
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
      body: JSON.stringify({ numero: cartao })
    });

    let tokenData;
    if (!tokenRes.ok) {
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

    // 2. Build items for Declaracao de Conteudo
    const orderItems = order.items || [];
    let itensDeclaracao = [];
    let totalValorDeclarado = 0;
    
    orderItems.forEach(item => {
        // Ignora frete na declaracao
        if (item.name && item.name.toLowerCase().includes('frete')) return;
        
        let val = parseFloat(item.price || 0);
        totalValorDeclarado += (val * (item.quantity || 1));
        
        itensDeclaracao.push({
            conteudo: (item.name || "Produto").substring(0, 30),
            quantidade: parseInt(item.quantity || 1),
            valor: parseFloat(val.toFixed(2)),
            peso: 500 // Peso padrao 500g por item
        });
    });
    
    if (itensDeclaracao.length === 0) {
        itensDeclaracao.push({
            conteudo: "Produtos Diversos",
            quantidade: 1,
            valor: 10.00,
            peso: 1000
        });
    }

    // 3. Create Pre-postagem (PLP)
    const telefoneDestinatario = order.customer_phone ? order.customer_phone.replace(/\D/g, '') : "22999999999";
    const cepDestinatario = order.customer_cep ? order.customer_cep.replace(/\D/g, '') : "28010021";
    let freightMethodName = order.items && order.items.find(i => i.name === 'Frete') ? order.items.find(i => i.name === 'Frete').method : '';
    let codigoServico = (freightMethodName && freightMethodName.toLowerCase().includes('sedex')) ? '03140' : '03220';

    const plpPayload = {
        cartaoPostagem: cartao,
        remetente: {
            nome: "Revizzi Centro Automotivo",
            cpfCnpj: user, 
            telefone: {
                ddd: "22",
                numero: "999999999"
            },
            endereco: {
                cep: "28200000",
                logradouro: "Avenida Genecy Mendonca",
                numero: "10",
                bairro: "Fatima",
                cidade: "Sao Joao da Barra",
                uf: "RJ"
            }
        },
        destinatario: {
            nome: (order.customer_name || "Cliente Revizzi").substring(0, 50),
            telefone: {
                ddd: telefoneDestinatario.substring(0, 2),
                numero: telefoneDestinatario.substring(2)
            },
            endereco: {
                cep: cepDestinatario,
                logradouro: (order.customer_address || "Endereco Padrao").substring(0, 50),
                numero: (order.customer_number || "SN").substring(0, 5),
                complemento: (order.customer_complement || "").substring(0, 30),
                bairro: (order.customer_district || "Bairro").substring(0, 50),
                cidade: (order.customer_city || "Cidade").substring(0, 50),
                uf: (order.customer_state || "RJ").substring(0, 2)
            }
        },
        codigoServico: codigoServico,
        codigoFormatoObjeto: "1",
        pesoInformado: "1000",
        alturaInformada: "20",
        larguraInformada: "20",
        comprimentoInformado: "20",
        indicadorObjetosProibidos: "N",
        itensDeclaracaoConteudo: itensDeclaracao
    };

    const prepostagemRes = await fetch('https://api.correios.com.br/prepostagem/v1/prepostagens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(plpPayload)
    });

    if (!prepostagemRes.ok) {
        const errTxt = await prepostagemRes.text();
        console.error("Correios Prepostagem Error:", errTxt);
        return res.status(500).json({ 
            error: `API Correios retornou erro: ${prepostagemRes.status}`,
            errorLogs: errTxt
        });
    }

    const prepostagemData = await prepostagemRes.json();
    
    // Se deu certo, a API retorna o ID ou o código de rastreio
    // A Etiqueta real em PDF precisa ser baixada na rota de emissão do rótulo
    // Vamos verificar se a API já retorna a url no prepostagemData
    
    return res.status(200).json({
        success: true,
        data: prepostagemData,
        message: "Pré-postagem gerada com sucesso!"
    });

  } catch (error) {
    console.error('Error in Correios Etiqueta API:', error);
    return res.status(500).json({ error: error.message });
  }
}
