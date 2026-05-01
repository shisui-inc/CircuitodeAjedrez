"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ClipboardCheck,
  FileDown,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Medal,
  School,
  Settings,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/importar", label: "Importar Chess-Results", icon: Upload },
  { href: "/admin/revision", label: "Revision de importacion", icon: ClipboardCheck },
  { href: "/admin/fechas", label: "Fechas", icon: CalendarDays },
  { href: "/admin/jugadores", label: "Jugadores", icon: Users },
  { href: "/admin/colegios", label: "Colegios", icon: School },
  { href: "/admin/ranking-individual", label: "Ranking Individual", icon: Trophy },
  { href: "/admin/ranking-colegios", label: "Ranking Colegios", icon: Medal },
  { href: "/admin/configuracion-puntos", label: "Configuracion de puntos", icon: Settings },
  { href: "/admin/reportes", label: "Reportes / Exportar", icon: FileDown },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await getSupabaseBrowserClient()?.auth.signOut();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
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
            <p className="truncate text-sm text-muted-foreground">Circuito Escolar de Ajedrez Paranaense</p>
            <h1 className="truncate text-base font-semibold">Panel administrativo</h1>
          </div>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/rankings">
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
          <div className="flex size-10 items-center justify-center rounded-md bg-emerald-700 text-white">
            <Trophy className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Circuito Escolar</p>
            <p className="text-xs text-muted-foreground">Ajedrez Paranaense</p>
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
