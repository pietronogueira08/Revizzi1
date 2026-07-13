export type OrderStatus = 'Entregue' | 'Pendente' | 'Cancelado';

export const kpis = [
  { label: 'Receita Total',  value: 'R$ 84.320', delta: '+12%',  up: true  },
  { label: 'Pedidos',        value: '1.248',      delta: '+8%',   up: true  },
  { label: 'Ticket Médio',   value: 'R$ 67,57',   delta: '-3%',   up: false },
  { label: 'Conversão',      value: '4,2%',       delta: '+0.5%', up: true  },
];

export const revenueData = [
  { date: 'Jan', value: 42000 },
  { date: 'Fev', value: 51000 },
  { date: 'Mar', value: 48000 },
  { date: 'Abr', value: 63000 },
  { date: 'Mai', value: 59000 },
  { date: 'Jun', value: 74000 },
  { date: 'Jul', value: 68000 },
  { date: 'Ago', value: 82000 },
  { date: 'Set', value: 77000 },
  { date: 'Out', value: 91000 },
  { date: 'Nov', value: 88000 },
  { date: 'Dez', value: 84320 },
];

export interface Order {
  id: string;
  client: string;
  date: string;
  status: OrderStatus;
  total: string;
}

export const recentOrders: Order[] = [
  { id: '#4821', client: 'Rafael Souza',    date: '17/06/2026', status: 'Entregue',  total: 'R$ 189,90' },
  { id: '#4820', client: 'Camila Torres',   date: '17/06/2026', status: 'Pendente',  total: 'R$ 74,50'  },
  { id: '#4819', client: 'Marcos Lima',     date: '16/06/2026', status: 'Entregue',  total: 'R$ 310,00' },
  { id: '#4818', client: 'Ana Beatriz',     date: '16/06/2026', status: 'Cancelado', total: 'R$ 55,00'  },
  { id: '#4817', client: 'Lucas Ferreira',  date: '15/06/2026', status: 'Pendente',  total: 'R$ 142,00' },
];

export const categories = ['Polimento', 'Lavagem', 'Películas', 'Vitrificação', 'Acessórios'];

/** Tipo do produto como vem do Supabase */
export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock?: number;
  img_url: string | null;
  description: string | null;
  badge_text: string | null;
  created_at: string;
  weight: number | null;        // em gramas (g)
  dimensions: {                 // em milímetros (mm)
    width: number;
    height: number;
    length: number;
  } | null;
  status?: string;              // 'Ativo', 'Inativo', 'Fora de estoque'
  logistic_box?: string;        // 'Caixa 500ml', 'Caixa 1,5L', 'Caixa 5L', etc.
}
