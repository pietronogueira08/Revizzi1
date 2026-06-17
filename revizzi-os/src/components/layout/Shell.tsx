import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const crumbMap: Record<string, string[]> = {
  '/':         ['Dashboard'],
  '/pedidos':  ['Dashboard', 'Pedidos'],
  '/produtos': ['Dashboard', 'Produtos'],
  '/clientes': ['Dashboard', 'Clientes'],
  '/config':   ['Dashboard', 'Configurações'],
};

export default function Shell() {
  const { pathname } = useLocation();
  const crumbs = crumbMap[pathname] ?? ['Dashboard'];

  return (
    <div className="flex min-h-screen" style={{ background: '#0A0A0A' }}>
      <Sidebar />
      <div className="ml-60 flex-1 flex flex-col min-h-screen">
        <TopBar crumbs={crumbs} />
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
