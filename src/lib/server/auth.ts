import { createServerClient } from "@supabase/ssr";
import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const DEMO_ADMIN_COOKIE = "cea_admin_demo";

export function isDemoLoginEnabled() {
  const explicitlyEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true";
  const supabaseMissing = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return explicitlyEnabled || supabaseMissing || Boolean(process.env.ADMIN_PASSWORD);
}

export function getConfiguredAdminPassword() {
  if (process.env.ADMIN_PASSWORD) {
    return process.env.ADMIN_PASSWORD;
  }

  if (process.env.NODE_ENV !== "production") {
    return "admin";
  }

  return null;
}

export function verifyAdminPassword(password: string) {
  const configuredPassword = getConfiguredAdminPassword();

  if (!configuredPassword) {
    return false;
  }

  const submitted = Buffer.from(password);
  const expected = Buffer.from(configuredPassword);

  return submitted.length === expected.length && timingSafeEqual(submitted, expected);
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
