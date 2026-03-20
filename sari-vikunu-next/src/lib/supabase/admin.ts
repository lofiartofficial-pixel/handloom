import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// ============================================
// ADMIN CLIENT - Service Role (Full Access)
// ⚠️  NEVER import in Client Components!
// ⚠️  NEVER expose SUPABASE_SERVICE_KEY to browser!
// Use in: API Route Handlers, Server Actions only
// ============================================
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_SERVICE_KEY is not set')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
