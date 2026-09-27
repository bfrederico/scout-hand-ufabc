import { createClient } from "@supabase/supabase-js";

// Usa a service role key — só existe no servidor (Vercel Functions), nunca
// é enviada ao navegador (seção 11 do spec: segredos administrativos).
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } }
);
