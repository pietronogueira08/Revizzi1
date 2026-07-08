const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lpovueymplmwuljohysj.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_R515ACD0X12zo_inHPj_1w_ElYu0B0A';

const clientId = '5b76c6ac2c067ae57225fb7b5a3d24ccf70a0ab8';
const clientSecret = '852612b7ac9fd86bd94e74ae6aacab3be0654271b6e80316c622697cde02';
const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

async function getBlingAccessToken() {
    // 1. Pegar refresh token atual do banco
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?id=eq.bling_tokens`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    const configData = await dbRes.json();
        
    if (!configData || configData.length === 0 || !configData[0].value) {
        throw new Error("Tokens do Bling não encontrados no banco de dados.");
    }

    const tokens = JSON.parse(configData[0].value);
    const refreshToken = tokens.refresh_token;

    // 2. Renovar token na API do Bling
    const response = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': '1.0'
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        })
    });

    const newData = await response.json();

    if (!newData.access_token) {
        throw new Error("Falha ao renovar token do Bling: " + JSON.stringify(newData));
    }

    // 3. Salvar o NOVO refresh_token no banco para não perder acesso
    const newTokens = {
        access_token: newData.access_token,
        refresh_token: newData.refresh_token,
        updated_at: new Date().toISOString()
    };

    await fetch(`${SUPABASE_URL}/rest/v1/site_settings?id=eq.bling_tokens`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: JSON.stringify(newTokens) })
    });

    return newData.access_token;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { orderId, customerName, customerEmail, customerDocument, customerPhone, items, shipping, total, cep, street, number, complement, neighborhood, city, state } = req.body;

        const accessToken = await getBlingAccessToken();

        // Montar Payload do Pedido para o Bling V3
        const blingOrder = {
            numero: orderId,
            data: new Date().toISOString().split('T')[0],
            contato: {
                nome: customerName,
                tipoPessoa: customerDocument.length > 14 ? 'J' : 'F',
                numeroDocumento: customerDocument.replace(/\D/g, ''),
                telefone: customerPhone,
                email: customerEmail,
                endereco: {
                    geral: {
                        endereco: street,
                        numero: number,
                        complemento: complement || '',
                        bairro: neighborhood,
                        municipio: city,
                        uf: state,
                        cep: cep.replace(/\D/g, '')
                    }
                }
            },
            itens: items.map(item => ({
                codigo: item.product_id || item.id || `PROD-${Math.random().toString(36).substring(7)}`,
                descricao: item.name || item.title || 'Produto',
                unidade: 'UN',
                quantidade: Number(item.quantity) || 1,
                valor: Number(item.price || item.unit_price || 0)
            })),
            transporte: {
                fretePorConta: 0,
                frete: Number(shipping) || 0
            }
        };

        const blingRes = await fetch('https://api.bling.com.br/Api/v3/pedidos/vendas', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(blingOrder)
        });

        const result = await blingRes.json();

        if (!blingRes.ok) {
            console.error('Bling API Error:', JSON.stringify(result));
            return res.status(400).json({ error: 'Erro ao criar pedido no Bling', details: result });
        }

        return res.status(200).json({ success: true, bling_order_id: result.data.id });

    } catch (error) {
        console.error('Bling Order Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
