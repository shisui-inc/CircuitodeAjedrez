"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabaseConfigured = isSupabaseBrowserConfigured();

  async function loginWithSupabase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        throw new Error("Supabase no esta configurado.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        throw signInError;
      }

      router.push(next);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo iniciar sesion.");
    } finally {
      setLoading(false);
    }
  }

  async function loginWithAdminPassword(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "No se pudo iniciar sesion.");
      }

      router.push(next);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo iniciar el modo demo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md rounded-lg">
      <CardHeader>
        <div className="mb-3 flex size-11 items-center justify-center rounded-md bg-emerald-700 text-white">
          <ShieldCheck className="size-5" />
        </div>
        <CardTitle>Ingreso administrador</CardTitle>
        <CardDescription>Acceso privado para cargar fechas, corregir datos y publicar rankings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {supabaseConfigured ? (
          <>
            <form className="space-y-4" onSubmit={loginWithSupabase}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@colegio.edu.py"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contrasena</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                />
              </div>
              {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                <LogIn className="size-4" />
                Ingresar con Supabase
              </Button>
            </form>
            <Button type="button" variant="outline" className="w-full" onClick={() => loginWithAdminPassword()} disabled={loading}>
              Entrar con contrasena admin
            </Button>
          </>
        ) : (
          <>
            <form className="space-y-4" onSubmit={loginWithAdminPassword}>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Contrasena</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                <LogIn className="size-4" />
                Entrar al panel
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
