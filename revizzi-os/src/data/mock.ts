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

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  stock: number;
  price: string;
  img: string;
}

export const categories = ['Polimento', 'Lavagem', 'Películas', 'Vitrificação', 'Acessórios'];

export const products: Product[] = [
  { id:  1, sku: 'RVZ-001', name: 'Cera de Carnaúba Premium',      category: 'Polimento',    stock: 42,  price: 'R$ 89,90',  img: 'https://picsum.photos/seed/rvz1/80/80'  },
  { id:  2, sku: 'RVZ-002', name: 'Composto Polidor 3M Ultra',      category: 'Polimento',    stock: 18,  price: 'R$ 134,00', img: 'https://picsum.photos/seed/rvz2/80/80'  },
  { id:  3, sku: 'RVZ-003', name: 'Shampoo Automotivo pH Neutro',   category: 'Lavagem',      stock: 73,  price: 'R$ 49,90',  img: 'https://picsum.photos/seed/rvz3/80/80'  },
  { id:  4, sku: 'RVZ-004', name: 'Pretinho de Pneu Spray 500ml',   category: 'Lavagem',      stock: 31,  price: 'R$ 38,00',  img: 'https://picsum.photos/seed/rvz4/80/80'  },
  { id:  5, sku: 'RVZ-005', name: 'Película Fumê 35% — 1m x 30cm', category: 'Películas',    stock: 4,   price: 'R$ 220,00', img: 'https://picsum.photos/seed/rvz5/80/80'  },
  { id:  6, sku: 'RVZ-006', name: 'Película Espelhada Silver',      category: 'Películas',    stock: 2,   price: 'R$ 310,00', img: 'https://picsum.photos/seed/rvz6/80/80'  },
  { id:  7, sku: 'RVZ-007', name: 'Vitrificador de Pintura 50ml',   category: 'Vitrificação', stock: 9,   price: 'R$ 195,00', img: 'https://picsum.photos/seed/rvz7/80/80'  },
  { id:  8, sku: 'RVZ-008', name: 'Nano Cerâmica Pro 30ml',         category: 'Vitrificação', stock: 5,   price: 'R$ 420,00', img: 'https://picsum.photos/seed/rvz8/80/80'  },
  { id:  9, sku: 'RVZ-009', name: 'Esponja Aplicadora Dupla Face',  category: 'Acessórios',   stock: 120, price: 'R$ 14,90',  img: 'https://picsum.photos/seed/rvz9/80/80'  },
  { id: 10, sku: 'RVZ-010', name: 'Microfibra Premium 40x40cm',     category: 'Acessórios',   stock: 88,  price: 'R$ 24,90',  img: 'https://picsum.photos/seed/rvz10/80/80' },
  { id: 11, sku: 'RVZ-011', name: 'Removedor de Chuva Ácida',       category: 'Polimento',    stock: 3,   price: 'R$ 79,00',  img: 'https://picsum.photos/seed/rvz11/80/80' },
  { id: 12, sku: 'RVZ-012', name: 'Limpa Vidros Anti-Embaçante',    category: 'Lavagem',      stock: 55,  price: 'R$ 59,90',  img: 'https://picsum.photos/seed/rvz12/80/80' },
];
