import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, Link, ImageOff, Loader2, Package, Ruler,
  Weight, Check, AlertCircle,
} from 'lucide-react';
import type { Product } from '../../data/mock';
import { uploadProductImage } from '../../services/imageUpload';

interface ProductEditModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Product>) => Promise<{ error: unknown }>;
}

type ImageMode = 'url' | 'upload';

export default function ProductEditModal({ product, onClose, onSave }: ProductEditModalProps) {
  const [imgMode, setImgMode] = useState<ImageMode>('url');
  const [imgUrl, setImgUrl]   = useState('');
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [weightG,   setWeightG]   = useState('');
  const [widthMm,   setWidthMm]   = useState('');
  const [heightMm,  setHeightMm]  = useState('');
  const [lengthMm,  setLengthMm]  = useState('');
  const [status,    setStatus]    = useState('Ativo');
  const [logisticBox, setLogisticBox] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pré-popular campos ao abrir
  useEffect(() => {
    if (!product) return;
    setImgUrl(product.img_url ?? '');
    setImgPreview(product.img_url ?? null);
    setWeightG(product.weight != null ? String(product.weight) : '');
    setWidthMm(product.dimensions?.width  != null ? String(product.dimensions.width)  : '');
    setHeightMm(product.dimensions?.height != null ? String(product.dimensions.height) : '');
    setLengthMm(product.dimensions?.length != null ? String(product.dimensions.length) : '');
    setStatus(product.status || 'Ativo');
    setLogisticBox(product.logistic_box || '');
    setSaved(false);
    setSaveError(null);
    setUploadError(null);
  }, [product]);

  if (!product) return null;

  // ── Imagem via URL ──────────────────────────────────────────────
  const handleUrlChange = (val: string) => {
    setImgUrl(val);
    setImgPreview(val.trim() || null);
    setUploadError(null);
  };

  // ── Upload de arquivo ───────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview imediato
    const localUrl = URL.createObjectURL(file);
    setImgPreview(localUrl);
    setUploading(true);
    setUploadError(null);

    const { url, error } = await uploadProductImage(file, product.id);
    setUploading(false);

    if (error) {
      setUploadError(error);
      setImgPreview(product.img_url ?? null);
    } else {
      setImgUrl(url!);
      setImgPreview(url!);
    }
  };

  // ── Salvar ──────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    const dims =
      widthMm || heightMm || lengthMm
        ? {
            width:  Number(widthMm)  || 0,
            height: Number(heightMm) || 0,
            length: Number(lengthMm) || 0,
          }
        : null;

    const updates: Partial<Product> = {
      img_url:    imgUrl.trim() || null,
      weight:     weightG ? Number(weightG) : null,
      dimensions: dims,
      status:     status || undefined,
      logistic_box: logisticBox || undefined,
    };

    const { error } = await onSave(product.id, updates);
    setSaving(false);

    if (error) {
      setSaveError('Erro ao salvar. Tente novamente.');
    } else {
      setSaved(true);
      setTimeout(() => onClose(), 1200);
    }
  };

  // ── Shared input style ──────────────────────────────────────────
  const inputCls =
    'w-full h-9 px-3 text-[13px] outline-none bg-[#111] text-white ' +
    'border border-white/10 focus:border-white/30 transition-colors';

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-lg max-h-[90vh] overflow-y-auto"
          style={{
            background: '#161616',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div>
              <h2 className="text-white font-semibold text-[15px]">Editar Produto</h2>
              <p className="text-[12px] mt-0.5" style={{ color: '#555' }}>
                {product.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: '#888' }}
            >
              <X size={14} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* ── SEÇÃO: Imagem ── */}
            <section>
              <SectionLabel icon={<ImageOff size={13} />} label="Imagem do Produto" />

              {/* Preview */}
              <div
                className="w-full h-44 mb-4 flex items-center justify-center overflow-hidden relative"
                style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {imgPreview ? (
                  <img
                    src={imgPreview}
                    alt="preview"
                    className="w-full h-full object-contain"
                    onError={() => setImgPreview(null)}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2" style={{ color: '#444' }}>
                    <Package size={32} />
                    <span className="text-[12px]">Sem imagem</span>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <Loader2 size={24} className="animate-spin text-white" />
                    <span className="ml-2 text-white text-[13px]">Enviando…</span>
                  </div>
                )}
              </div>

              {/* Mode Toggle */}
              <div className="flex mb-3" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                {(['url', 'upload'] as ImageMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setImgMode(mode)}
                    className="flex-1 flex items-center justify-center gap-2 h-9 text-[12px] font-medium uppercase tracking-wider transition-colors"
                    style={{
                      background: imgMode === mode ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color:      imgMode === mode ? '#fff' : '#555',
                      borderRight: mode === 'url' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    }}
                  >
                    {mode === 'url' ? <Link size={12} /> : <Upload size={12} />}
                    {mode === 'url' ? 'Colar URL' : 'Upload Arquivo'}
                  </button>
                ))}
              </div>

              {imgMode === 'url' ? (
                <input
                  type="text"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={imgUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={inputCls}
                />
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-9 flex items-center justify-center gap-2 text-[12px] font-medium uppercase tracking-wider transition-colors disabled:opacity-50"
                    style={{
                      background: '#222',
                      border: '1px dashed rgba(255,255,255,0.2)',
                      color: '#888',
                    }}
                  >
                    <Upload size={12} />
                    {uploading ? 'Enviando para Supabase Storage…' : 'Selecionar arquivo'}
                  </button>
                </div>
              )}

              {uploadError && (
                <p className="mt-2 text-[11px] flex items-center gap-1" style={{ color: '#f87171' }}>
                  <AlertCircle size={11} /> {uploadError}
                </p>
              )}
            </section>

            {/* ── SEÇÃO: Status e Logística ── */}
            <section className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest mb-1.5" style={{ color: '#555' }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={inputCls}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Fora de estoque">Fora de estoque</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest mb-1.5" style={{ color: '#555' }}>
                  Caixa Logística
                </label>
                <select
                  value={logisticBox}
                  onChange={(e) => setLogisticBox(e.target.value)}
                  className={inputCls}
                >
                  <option value="">(Nenhuma)</option>
                  <option value="Caixa 500ml">Caixa 500ml</option>
                  <option value="Caixa 1,5L">Caixa 1,5L</option>
                  <option value="Caixa 5L">Caixa 5L</option>
                  <option value="Personalizada">Personalizada</option>
                </select>
              </div>
            </section>

            {/* ── SEÇÃO: Peso e Dimensões ── */}
            <section>
              <SectionLabel icon={<Ruler size={13} />} label="Peso e Dimensões" />

              {/* Peso */}
              <div className="mb-3">
                <label className="block text-[11px] uppercase tracking-widest mb-1.5" style={{ color: '#555' }}>
                  <Weight size={10} className="inline mr-1" />
                  Peso (g)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="ex: 500"
                  value={weightG}
                  onChange={(e) => setWeightG(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Dimensões */}
              <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: '#555' }}>
                Dimensões (mm)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Largura', value: widthMm,  setter: setWidthMm,  placeholder: 'ex: 100' },
                  { label: 'Altura',  value: heightMm, setter: setHeightMm, placeholder: 'ex: 200' },
                  { label: 'Compr.',  value: lengthMm, setter: setLengthMm, placeholder: 'ex: 50'  },
                ].map(({ label, value, setter, placeholder }) => (
                  <div key={label}>
                    <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: '#444' }}>
                      {label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder={placeholder}
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Feedback de erro */}
            {saveError && (
              <p className="text-[12px] flex items-center gap-1.5" style={{ color: '#f87171' }}>
                <AlertCircle size={12} /> {saveError}
              </p>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 px-6 py-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              onClick={onClose}
              className="h-9 px-4 text-[13px] transition-colors hover:bg-white/5"
              style={{ color: '#666', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved || uploading}
              className="h-9 px-5 text-[13px] font-medium flex items-center gap-2 transition-all disabled:opacity-60"
              style={{
                background: saved ? '#22c55e' : '#fff',
                color:      saved ? '#fff'    : '#000',
              }}
            >
              {saving ? (
                <><Loader2 size={13} className="animate-spin" /> Salvando…</>
              ) : saved ? (
                <><Check size={13} /> Salvo!</>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Helper ──────────────────────────────────────────────────────────
function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest mb-3 pb-2"
      style={{ color: '#666', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      {icon}
      {label}
    </div>
  );
}
