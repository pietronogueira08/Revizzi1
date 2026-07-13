import { supabaseAdmin, SUPABASE_URL, STORAGE_BUCKET } from '../lib/supabase';

/**
 * Faz upload de um arquivo de imagem para o Supabase Storage
 * e retorna a URL pública da imagem.
 */
export async function uploadProductImage(
  file: File,
  productId: string
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${productId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return { url: data.publicUrl, error: null };
}

/**
 * Garante que o bucket 'product-images' existe e é público.
 * Chamar uma vez na inicialização do app (ou ignorar se já existir).
 */
export async function ensureStorageBucket(): Promise<void> {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === STORAGE_BUCKET);

  if (!exists) {
    await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 5 * 1024 * 1024, // 5 MB
    });
  }
}

export function getPublicImageUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}
