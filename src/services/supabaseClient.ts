import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Usado apenas para leituras públicas simples, se necessário no futuro.
// Toda ESCRITA de dados críticos (atletas, partidas, eventos) passa pelas
// Vercel Functions em /api, que usam a service role key no servidor.
export const supabase = createClient(url, key);
