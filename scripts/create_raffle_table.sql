-- SQL para criar a tabela raffle_tickets no Supabase
-- Execute no SQL Editor: https://supabase.com/dashboard/project/lpovueymplmwuljohysj/sql/new

CREATE TABLE IF NOT EXISTS public.raffle_tickets (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id        uuid,
  ticket_number   integer NOT NULL UNIQUE,
  customer_name   text,
  customer_email  text,
  customer_phone  text,
  order_total     numeric,
  raffle_month    text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_raffle_month ON public.raffle_tickets(raffle_month);
CREATE INDEX IF NOT EXISTS idx_raffle_ticket_number ON public.raffle_tickets(ticket_number);
