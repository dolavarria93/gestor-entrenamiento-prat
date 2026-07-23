import { createClient } from "@supabase/supabase-js";

// Cliente con la service_role key — solo para usarse dentro de server actions
// que necesiten la Auth Admin API (crear usuarios). Nunca importar desde un
// componente cliente: bypassa RLS por completo.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
