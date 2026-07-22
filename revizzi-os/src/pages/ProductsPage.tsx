import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Pencil, Trash2, Weight, Ruler, ImageOff, Loader2 } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import ProductEditModal from '../components/ui/ProductEditModal';
import type { Product } from '../data/mock';

const PLACEHOLDER = 'https://placehold.co/80x80/1a1a1a/444444?text=IMG';

export default function ProductsPage() {
  const { products, loading, error, updateProduct } = useProducts();
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand]       = useState('');
  const [editing, setEditing]   = useState<Product | null>(null);

  // Categorias dinâmicas do banco
  const categories = [...new Set(products.map((p) => p.category))].sort();
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = !category || p.category === category;
    const matchBrand = !brand || p.brand === brand;
    return matchSearch && matchCat && matchBrand;
  });

  const formatPrice = (price: number | null | undefined) => {
    if (price == null) return '—';
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDimensions = (dims: Product['dimensions']) => {
    if (!dims) return null;
    return `${dims.width}×${dims.height}×${dims.length} mm`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-5xl text-white tracking-widest uppercase"
              style={{ fontFamily: '"Bebas Neue", Impact, sans-serif' }}
            >
              Produtos
            </h1>
            <p className="text-[12px] mt-1" style={{ color: '#555' }}>
              {products.length} produtos no estoque
            </p>
          </div>
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
            style={{ background: '#171717', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Search size={13} style={{ color: '#888888' }} />
            <input
              type="text"
              placeholder="Buscar por nome ou marca…"
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
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="h-9 px-3 text-[13px] outline-none cursor-pointer"
            style={{
              background: '#171717',
              border: '1px solid rgba(255,255,255,0.08)',
              borderLeft: 'none',
              color: brand ? '#FFFFFF' : '#888888',
            }}
          >
            <option value="">Todas as marcas</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Contagem */}
        <p className="text-[12px] mb-3" style={{ color: '#555555' }}>
          {filtered.length} produto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24 gap-3" style={{ color: '#555' }}>
            <Loader2 size={20} className="animate-spin" />
            <span className="text-[14px]">Carregando produtos…</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="py-12 text-center text-[13px]" style={{ color: '#f87171' }}>
            Erro ao carregar: {error}
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ background: '#171717', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Produto', 'Status', 'Categoria', 'Peso / Dim.', 'Preço', ''].map((col) => (
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
                    {/* Produto: imagem + nome + marca */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden"
                          style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#111' }}
                        >
                          {product.img_url ? (
                            <img
                              src={product.img_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                              }}
                            />
                          ) : (
                            <ImageOff size={14} style={{ color: '#444' }} />
                          )}
                        </div>
                        <div className="flex flex-col leading-snug">
                          <span className="text-white font-medium">{product.name}</span>
                          <span className="text-[11px] font-mono" style={{ color: '#555555' }}>
                            {product.brand}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2.5">
                      {product.status ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap"
                          style={{
                            background:
                              product.status === 'Ativo' ? 'rgba(34, 197, 94, 0.15)' :
                              product.status === 'Inativo' ? 'rgba(239, 68, 68, 0.15)' :
                              'rgba(245, 158, 11, 0.15)',
                            color:
                              product.status === 'Ativo' ? '#4ade80' :
                              product.status === 'Inativo' ? '#f87171' :
                              '#fbbf24',
                          }}
                        >
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
                            background:
                              product.status === 'Ativo' ? '#4ade80' :
                              product.status === 'Inativo' ? '#f87171' :
                              '#fbbf24',
                          }} />
                          {product.status}
                        </span>
                      ) : (
                        <span style={{ color: '#333', fontSize: 11 }}>—</span>
                      )}
                    </td>

                    {/* Categoria */}
                    <td className="px-4 py-2.5" style={{ color: '#888888' }}>
                      {product.category}
                    </td>

                    {/* Peso + Dimensões */}
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        {product.weight != null ? (
                          <span
                            className="flex items-center gap-1 text-[11px]"
                            style={{ color: '#888' }}
                          >
                            <Weight size={10} />
                            {product.weight}g
                          </span>
                        ) : (
                          <span className="text-[11px]" style={{ color: '#333' }}>— g</span>
                        )}
                        {product.dimensions ? (
                          <span
                            className="flex items-center gap-1 text-[11px]"
                            style={{ color: '#888' }}
                          >
                            <Ruler size={10} />
                            {formatDimensions(product.dimensions)}
                          </span>
                        ) : (
                          <span className="text-[11px]" style={{ color: '#333' }}>— mm</span>
                        )}
                        {product.logistic_box && (
                          <span
                            className="text-[10px] mt-0.5 uppercase tracking-wider"
                            style={{ color: '#666' }}
                          >
                            📦 {product.logistic_box}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Preço */}
                    <td className="px-4 py-2.5 font-medium text-white">
                      {formatPrice(product.price)}
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditing(product)}
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

            {filtered.length === 0 && !loading && (
              <div
                className="flex flex-col items-center justify-center py-16 text-center"
                style={{ background: '#171717' }}
              >
                <Search size={24} style={{ color: '#555555', marginBottom: 12 }} />
                <p className="text-[14px]" style={{ color: '#888888' }}>Nenhum produto encontrado</p>
                <button
                  onClick={() => { setSearch(''); setCategory(''); setBrand(''); }}
                  className="mt-4 text-[12px] uppercase tracking-wider underline transition-colors hover:text-white"
                  style={{ color: '#555555' }}
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Modal de edição */}
      {editing && (
        <ProductEditModal
          product={editing}
          onClose={() => setEditing(null)}
          onSave={updateProduct}
        />
      )}
    </>
  );
}
