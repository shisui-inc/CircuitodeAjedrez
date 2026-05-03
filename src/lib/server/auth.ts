import { createServerClient } from "@supabase/ssr";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const DEMO_ADMIN_COOKIE = "cea_admin_demo";
const DEMO_ADMIN_COOKIE_MESSAGE = "cea_admin_demo:v1";

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

export function verifyAdminPassword(password: unknown) {
  const configuredPassword = getConfiguredAdminPassword();

  if (!configuredPassword || typeof password !== "string") {
    return false;
  }

  const submitted = Buffer.from(password);
  const expected = Buffer.from(configuredPassword);

  return submitted.length === expected.length && timingSafeEqual(submitted, expected);
}

export function getDemoAdminCookieValue() {
  const configuredPassword = getConfiguredAdminPassword();

  if (!configuredPassword) {
    return null;
  }

  return createHmac("sha256", configuredPassword).update(DEMO_ADMIN_COOKIE_MESSAGE).digest("hex");
}

export function hasDemoAdminCookie(request: NextRequest) {
  const expected = getDemoAdminCookieValue();
  const submittedValue = request.cookies.get(DEMO_ADMIN_COOKIE)?.value;

  if (!expected || !submittedValue) {
    return false;
  }

  const submitted = Buffer.from(submittedValue);
  const signed = Buffer.from(expected);

  return submitted.length === signed.length && timingSafeEqual(submitted, signed);
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
