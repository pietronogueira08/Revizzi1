import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { products, categories } from '../data/mock';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = !category || p.category === category;
    return matchSearch && matchCat;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-5xl text-white tracking-widest uppercase"
          style={{ fontFamily: '"Bebas Neue", Impact, sans-serif' }}
        >
          Produtos
        </h1>
        <button
          className="flex items-center gap-2 px-4 h-9 text-[13px] font-medium text-[#0A0A0A] bg-white transition-opacity hover:opacity-90"
        >
          <Plus size={14} />
          Adicionar Produto
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-0 mb-6">
        <div
          className="flex items-center gap-2 px-3 h-9 flex-1 max-w-sm"
          style={{
            background: '#171717',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Search size={13} style={{ color: '#888888' }} />
          <input
            type="text"
            placeholder="Buscar por nome ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-[13px] outline-none flex-1 placeholder:text-[#555555]"
            style={{ color: '#FFFFFF' }}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 px-3 text-[13px] outline-none cursor-pointer"
          style={{
            background: '#171717',
            border: '1px solid rgba(255,255,255,0.08)',
            borderLeft: 'none',
            color: category ? '#FFFFFF' : '#888888',
          }}
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Contagem */}
      <p className="text-[12px] mb-3" style={{ color: '#555555' }}>
        {filtered.length} produto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Table */}
      <div style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ background: '#171717', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Produto', 'Categoria', 'Estoque', 'Preço', ''].map((col) => (
                <th
                  key={col}
                  className="text-left px-4 py-3 font-medium uppercase tracking-widest text-[11px]"
                  style={{ color: '#555555' }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr
                key={product.id}
                className="group transition-colors hover:bg-[#1E1E1E] cursor-default"
                style={{
                  background: '#171717',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {/* Produto: imagem + nome + SKU */}
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.img}
                      alt={product.name}
                      className="w-10 h-10 object-cover shrink-0"
                      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                    <div className="flex flex-col leading-snug">
                      <span className="text-white font-medium">{product.name}</span>
                      <span className="text-[11px] font-mono" style={{ color: '#555555' }}>
                        {product.sku}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Categoria */}
                <td className="px-4 py-2.5" style={{ color: '#888888' }}>
                  {product.category}
                </td>

                {/* Estoque */}
                <td className="px-4 py-2.5">
                  <span
                    className={product.stock < 5 ? 'font-semibold' : ''}
                    style={{ color: product.stock < 5 ? '#f87171' : '#888888' }}
                  >
                    {product.stock}
                    {product.stock < 5 && (
                      <span className="ml-1 text-[10px] uppercase tracking-wide">baixo</span>
                    )}
                  </span>
                </td>

                {/* Preço */}
                <td className="px-4 py-2.5 font-medium text-white">
                  {product.price}
                </td>

                {/* Ações — visíveis só no hover */}
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="flex items-center justify-center w-7 h-7 transition-colors hover:bg-[#252525]"
                      style={{ color: '#888888', border: '1px solid rgba(255,255,255,0.08)' }}
                      aria-label={`Editar ${product.name}`}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      className="flex items-center justify-center w-7 h-7 transition-colors hover:bg-[#2a1515]"
                      style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
                      aria-label={`Excluir ${product.name}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-16 text-center"
            style={{ background: '#171717' }}
          >
            <Search size={24} style={{ color: '#555555', marginBottom: 12 }} />
            <p className="text-[14px]" style={{ color: '#888888' }}>Nenhum produto encontrado</p>
            <button
              onClick={() => { setSearch(''); setCategory(''); }}
              className="mt-4 text-[12px] uppercase tracking-wider underline transition-colors hover:text-white"
              style={{ color: '#555555' }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
