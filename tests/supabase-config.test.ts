import { afterEach, describe, expect, it } from "vitest";
import { getSupabaseAdminConfigStatus, isSupabaseAdminConfigured } from "@/lib/server/supabase";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("supabase admin config", () => {
  it("no exige anon key para el cliente admin", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_example";

    expect(isSupabaseAdminConfigured()).toBe(true);
    expect(getSupabaseAdminConfigStatus()).toMatchObject({
      hasUrl: true,
      hasAnonKey: false,
      hasServiceRoleKey: true,
    });
  });

  it("exige service role para escrituras admin", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(isSupabaseAdminConfigured()).toBe(false);
  });
});
