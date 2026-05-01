import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

export const DEMO_ADMIN_COOKIE = "cea_admin_demo";

export function isDemoLoginEnabled() {
  const explicitlyEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true";
  const supabaseMissing = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return explicitlyEnabled || supabaseMissing;
}

export function hasDemoAdminCookie(request: NextRequest) {
  return request.cookies.get(DEMO_ADMIN_COOKIE)?.value === "1";
}

export async function hasAdminSession(request: NextRequest) {
  if (hasDemoAdminCookie(request)) {
    return true;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return false;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          return;
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return Boolean(user);
}
