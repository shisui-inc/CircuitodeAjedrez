import { afterEach, describe, expect, it } from "vitest";
import { DEMO_ADMIN_COOKIE, getDemoAdminCookieValue, hasDemoAdminCookie, verifyAdminPassword } from "@/lib/server/auth";
import type { NextRequest } from "next/server";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("admin demo cookie", () => {
  it("firma la cookie con la contrasena admin", () => {
    process.env.ADMIN_PASSWORD = "secret-admin";

    const signedCookie = getDemoAdminCookieValue();

    expect(signedCookie).toBeTruthy();
    expect(signedCookie).not.toBe("1");
    expect(hasDemoAdminCookie(requestWithCookie(signedCookie!))).toBe(true);
  });

  it("rechaza la cookie antigua falsificable", () => {
    process.env.ADMIN_PASSWORD = "secret-admin";

    expect(hasDemoAdminCookie(requestWithCookie("1"))).toBe(false);
  });

  it("rechaza payloads de password que no son texto sin romper el servidor", () => {
    process.env.ADMIN_PASSWORD = "secret-admin";

    expect(verifyAdminPassword({ value: "secret-admin" })).toBe(false);
  });
});

function requestWithCookie(value: string) {
  return {
    cookies: {
      get(name: string) {
        return name === DEMO_ADMIN_COOKIE ? { value } : undefined;
      },
    },
  } as unknown as NextRequest;
}
