import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

export function getSupabaseAdminConfigStatus() {
  return {
    hasUrl: Boolean(getSupabaseUrl()),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

export function isSupabaseAdminConfigured() {
  const status = getSupabaseAdminConfigStatus();
  return status.hasUrl && status.hasServiceRoleKey;
}

export function getSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(
      getSupabaseUrl()!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return adminClient;
}
