-- ================================================================
-- REVIZZI - PERMISSÕES COMPLETAS PARA PAINEL E LOJA
-- Cole e execute este script no SQL Editor do Supabase
-- ================================================================

-- 1. PRODUTOS: Permitir criar, editar e excluir pelo painel
DROP POLICY IF EXISTS "Permitir criacao de produtos para todos" ON public.products;
CREATE POLICY "Permitir criacao de produtos para todos" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de produtos para todos" ON public.products;
CREATE POLICY "Permitir atualizacao de produtos para todos" ON public.products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir exclusao de produtos para todos" ON public.products;
CREATE POLICY "Permitir exclusao de produtos para todos" ON public.products FOR DELETE USING (true);

-- 2. PEDIDOS: Permitir listar e atualizar status no painel
DROP POLICY IF EXISTS "Permitir leitura de pedidos para todos" ON public.orders;
CREATE POLICY "Permitir leitura de pedidos para todos" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir atualizacao de pedidos para todos" ON public.orders;
CREATE POLICY "Permitir atualizacao de pedidos para todos" ON public.orders FOR UPDATE USING (true);

-- 3. CONFIGURAÇÕES (site_settings): Permitir salvar tokens e taxas
DROP POLICY IF EXISTS "Permitir insercao de site_settings" ON public.site_settings;
CREATE POLICY "Permitir insercao de site_settings" ON public.site_settings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualizacao de site_settings" ON public.site_settings;
CREATE POLICY "Permitir atualizacao de site_settings" ON public.site_settings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir exclusao de site_settings" ON public.site_settings;
CREATE POLICY "Permitir exclusao de site_settings" ON public.site_settings FOR DELETE USING (true);

-- 4. STORAGE (FOTOS): Permitir upload e edição de imagens pelos buckets
DROP POLICY IF EXISTS "Permitir upload publico em produtos" ON storage.objects;
CREATE POLICY "Permitir upload publico em produtos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'produtos');

DROP POLICY IF EXISTS "Permitir edicao publica em produtos" ON storage.objects;
CREATE POLICY "Permitir edicao publica em produtos" ON storage.objects FOR UPDATE USING (bucket_id = 'produtos');

DROP POLICY IF EXISTS "Permitir exclusao publica em produtos" ON storage.objects;
CREATE POLICY "Permitir exclusao publica em produtos" ON storage.objects FOR DELETE USING (bucket_id = 'produtos');

DROP POLICY IF EXISTS "Permitir upload publico em product-images" ON storage.objects;
CREATE POLICY "Permitir upload publico em product-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Permitir edicao publica em product-images" ON storage.objects;
CREATE POLICY "Permitir edicao publica em product-images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Permitir exclusao publica em product-images" ON storage.objects;
CREATE POLICY "Permitir exclusao publica em product-images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Permitir upload publico em hero-images" ON storage.objects;
CREATE POLICY "Permitir upload publico em hero-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hero-images');

DROP POLICY IF EXISTS "Permitir edicao publica em hero-images" ON storage.objects;
CREATE POLICY "Permitir edicao publica em hero-images" ON storage.objects FOR UPDATE USING (bucket_id = 'hero-images');

DROP POLICY IF EXISTS "Permitir exclusao publica em hero-images" ON storage.objects;
CREATE POLICY "Permitir exclusao publica em hero-images" ON storage.objects FOR DELETE USING (bucket_id = 'hero-images');
