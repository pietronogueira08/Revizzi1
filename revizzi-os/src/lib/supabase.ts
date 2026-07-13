import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabaseServiceRole = import.meta.env.VITE_SUPABASE_SERVICE_ROLE as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client com service_role para uploads de imagem (bypassa RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

export const SUPABASE_URL = supabaseUrl;
export const STORAGE_BUCKET = 'product-images';
