const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lpovueymplmwuljohysj.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_R515ACD0X12zo_inHPj_1w_ElYu0B0A';
const SERVICE_KEY  = process.env.VITE_SUPABASE_SERVICE_ROLE || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxwb3Z1ZXltcGxtd3Vsam9oeXNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE3ODY0MCwiZXhwIjoyMDkzNzU0NjQwfQ._HMesJL9z2gCsqp-IN26I7mAD5S58JVxZDagmOZ7RII';

// ─── Generates a random 5-digit number (10000-99999) ───────────────────────
function generateTicketNumber() {
    return Math.floor(Math.random() * 90000) + 10000;
}

// ─── Gets existing ticket numbers for this month to check uniqueness ────────
async function getExistingTickets(month) {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/raffle_tickets?select=ticket_number&raffle_month=eq.${encodeURIComponent(month)}&limit=500`,
        {
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`
            }
        }
    );
    if (!res.ok) return new Set();
    const data = await res.json();
    return new Set(data.map(r => r.ticket_number));
}

// ─── Generates unique ticket number not already in the DB ──────────────────
async function generateUniqueTicket(month) {
    const existing = await getExistingTickets(month);
    let attempts = 0;
    while (attempts < 50) {
        const num = generateTicketNumber();
        if (!existing.has(num)) return num;
        attempts++;
    }
    // Ultra-fallback: try a much wider range
    while (attempts < 200) {
        const num = Math.floor(Math.random() * 900000) + 100000; // 6-digit fallback
        if (!existing.has(num)) return num;
        attempts++;
    }
    throw new Error('Não foi possível gerar um número único para o sorteio.');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            order_id,
            customer_name,
            customer_email,
            customer_phone,
            order_total
        } = req.body;

        // Validar que o pedido é elegível (>= R$ 100)
        const total = Number(order_total) || 0;
        if (total < 100) {
            return res.status(200).json({
                eligible: false,
                message: 'Pedido abaixo de R$100 — não elegível para o sorteio.'
            });
        }

        // Mês atual no formato YYYY-MM
        const now = new Date();
        const raffleMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Gerar número único
        const ticketNumber = await generateUniqueTicket(raffleMonth);

        // Inserir na tabela raffle_tickets
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/raffle_tickets`, {
            method: 'POST',
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                order_id:      order_id || null,
                ticket_number: ticketNumber,
                customer_name:  customer_name  || null,
                customer_email: customer_email || null,
                customer_phone: customer_phone || null,
                order_total:    total,
                raffle_month:   raffleMonth
            })
        });

        if (!insertRes.ok) {
            const errBody = await insertRes.text();
            // Se o erro for conflito de número único, tenta novamente
            if (insertRes.status === 409 || errBody.includes('unique')) {
                const retryNumber = await generateUniqueTicket(raffleMonth);
                const retryRes = await fetch(`${SUPABASE_URL}/rest/v1/raffle_tickets`, {
                    method: 'POST',
                    headers: {
                        'apikey': SERVICE_KEY,
                        'Authorization': `Bearer ${SERVICE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        order_id:      order_id || null,
                        ticket_number: retryNumber,
                        customer_name:  customer_name  || null,
                        customer_email: customer_email || null,
                        customer_phone: customer_phone || null,
                        order_total:    total,
                        raffle_month:   raffleMonth
                    })
                });
                if (!retryRes.ok) {
                    console.error('Raffle retry failed:', await retryRes.text());
                    return res.status(500).json({ error: 'Falha ao registrar número do sorteio.' });
                }
                const retryData = await retryRes.json();
                return res.status(200).json({
                    eligible: true,
                    ticket_number: retryNumber,
                    raffle_month: raffleMonth
                });
            }
            console.error('Raffle insert error:', errBody);
            return res.status(500).json({ error: 'Falha ao registrar número do sorteio.', details: errBody });
        }

        // Notificar via Telegram sobre o número do sorteio
        const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;
        if (telegramToken && telegramChatId) {
            fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: telegramChatId,
                    text: `🎲 *NÚMERO DO SORTEIO GERADO!*\n\n` +
                          `👤 *Cliente:* ${customer_name || 'N/A'}\n` +
                          `📧 *E-mail:* ${customer_email || 'N/A'}\n` +
                          `📱 *Telefone:* ${customer_phone || 'N/A'}\n` +
                          `💰 *Valor do pedido:* R$ ${total.toFixed(2)}\n\n` +
                          `🎯 *Número do sorteio: ${ticketNumber}*\n` +
                          `📅 Mês do sorteio: ${raffleMonth}`,
                    parse_mode: 'Markdown'
                })
            }).catch(e => console.error('Telegram raffle notify error:', e));
        }

        return res.status(200).json({
            eligible: true,
            ticket_number: ticketNumber,
            raffle_month: raffleMonth
        });

    } catch (error) {
        console.error('Raffle API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
