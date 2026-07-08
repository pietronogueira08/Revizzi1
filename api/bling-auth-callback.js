export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { code, state } = req.query;

    if (!code) {
        return res.status(400).send('<h1>Erro</h1><p>Nenhum código recebido.</p>');
    }

    const clientId = '5b76c6ac2c067ae57225fb7b5a3d24ccf70a0ab8';
    const clientSecret = '852612b7ac9fd86bd94e74ae6aacab3be0654271b6e80316c622697cde02';
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
        const response = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': '1.0'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code
            })
        });

        const data = await response.json();

        if (data.refresh_token) {
            // Sucesso! Retorna na tela para o Pietro copiar
            return res.status(200).send(`
                <html><body style="font-family: sans-serif; background: #111; color: #fff; padding: 40px;">
                <h1 style="color: #4ade80;">Conectado ao Bling com Sucesso!</h1>
                <p>Copie e cole o Token de Atualização (Refresh Token) abaixo e envie para o Pietro no chat:</p>
                <textarea style="width: 100%; height: 100px; padding: 10px; background: #222; color: #fff; border: 1px solid #4ade80;">${data.refresh_token}</textarea>
                <p>Pode fechar esta janela.</p>
                </body></html>
            `);
        } else {
            return res.status(400).send(`
                <html><body><h1>Erro do Bling</h1><pre>${JSON.stringify(data, null, 2)}</pre></body></html>
            `);
        }

    } catch (e) {
        return res.status(500).send(`
            <html><body><h1>Erro Interno</h1><pre>${e.message}</pre></body></html>
        `);
    }
}
