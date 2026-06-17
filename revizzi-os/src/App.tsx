import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Shell from './components/layout/Shell';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h1
          className="text-4xl uppercase tracking-widest"
          style={{ fontFamily: '"Bebas Neue", Impact, sans-serif', color: '#333333' }}
        >
          {title}
        </h1>
        <p className="text-[13px] mt-2" style={{ color: '#555555' }}>
          Em construção
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/" element={<Shell />}>
          <Route index element={<DashboardPage />} />
          <Route path="produtos"  element={<ProductsPage />} />
          <Route path="pedidos"   element={<PlaceholderPage title="Pedidos" />} />
          <Route path="clientes"  element={<PlaceholderPage title="Clientes" />} />
          <Route path="config"    element={<PlaceholderPage title="Configurações" />} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
