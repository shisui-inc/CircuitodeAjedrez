"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CircuitBoard,
  ClipboardCheck,
  FilePenLine,
  FileDown,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Medal,
  School,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Circuit } from "@/lib/types";

const navigation = [
  { href: "/admin/fechas", label: "Fechas y resultados", icon: ClipboardCheck },
  { href: "/admin/circuitos", label: "Circuitos y publicación", icon: CircuitBoard },
  { href: "/admin/dashboard", label: "Resumen y rankings", icon: LayoutDashboard },
  { href: "/admin/correcciones", label: "Correcciones", icon: FilePenLine },
  { href: "/admin/jugadores", label: "Jugadores", icon: Users },
  { href: "/admin/colegios", label: "Colegios", icon: School },
  { href: "/admin/auditoria", label: "Auditoria", icon: ShieldCheck },
  { href: "/admin/ranking-individual", label: "Ranking Individual", icon: Trophy },
  { href: "/admin/ranking-colegios", label: "Ranking Colegios", icon: Medal },
  { href: "/admin/configuracion-puntos", label: "Configuracion de puntos", icon: Settings },
  { href: "/admin/reportes", label: "Reportes / Exportar", icon: FileDown },
];

export function AppShell({ children, circuits, selectedCircuit }: { children: React.ReactNode; circuits: Circuit[]; selectedCircuit: Circuit }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await getSupabaseBrowserClient()?.auth.signOut();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function selectCircuit(circuitId: string) {
    await fetch("/api/admin/circuit-selection", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ circuitId }),
    });
    router.refresh();
  }

  const nav = <NavList pathname={pathname} onLogout={logout} />;

  return (
    <div className="min-h-dvh bg-stone-50 text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-white lg:flex lg:flex-col">{nav}</aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-white/95 px-4 backdrop-blur lg:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetTitle className="sr-only">Menu principal</SheetTitle>
              {nav}
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-muted-foreground">{selectedCircuit.name}</p>
            <h1 className="truncate text-base font-semibold">Panel administrativo</h1>
          </div>
          <Select value={selectedCircuit.id} onValueChange={selectCircuit}>
            <SelectTrigger className="w-36 bg-white sm:w-48 md:w-56" aria-label="Circuito administrado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {circuits.map((circuit) => <SelectItem key={circuit.id} value={circuit.id}>{circuit.shortName} · {circuit.status}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href={selectedCircuit.isPublished ? `/circuitos/${selectedCircuit.slug}` : "/rankings"}>
              <Globe2 className="size-4" />
              Pagina publica
            </Link>
          </Button>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function NavList({ pathname, onLogout }: { pathname: string; onLogout: () => void }) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white">
            <Image
              src="/logoflash.png"
              alt="Circuito Escolar de Ajedrez"
              width={72}
              height={72}
              className="h-14 w-14 object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Software oficial</p>
            <p className="text-xs text-muted-foreground">Administrador de circuitos de ajedrez</p>
          </div>
        </div>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors",
                active ? "bg-emerald-50 text-emerald-800" : "hover:bg-stone-100 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="space-y-3 border-t p-4">
        <Button asChild variant="outline" className="w-full justify-start sm:hidden">
          <Link href="/rankings">
            <Globe2 className="size-4" />
            Pagina publica
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
          <LogOut className="size-4" />
          Cerrar sesion
        </Button>
      </div>
    </div>
  );
}
