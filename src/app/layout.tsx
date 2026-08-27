import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://circuitode-ajedrez.vercel.app"),
  title: {
    default: "Circuitos de Ajedrez | Paraguay juega",
    template: "%s | Circuitos de Ajedrez",
  },
  description: "Torneos, resultados oficiales y rankings de ajedrez en un solo lugar, diseñado para jugadores y familias.",
  applicationName: "Circuitos de Ajedrez",
  keywords: ["ajedrez", "torneos de ajedrez", "ranking escolar", "ajedrez Paraguay", "resultados de ajedrez"],
  openGraph: {
    title: "Circuitos de Ajedrez | Paraguay juega",
    description: "Encontrá tu torneo, seguí tus resultados y viví cada partida.",
    url: "/rankings",
    siteName: "Circuitos de Ajedrez",
    locale: "es_PY",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Circuitos de Ajedrez — Tu torneo. Tu partida. Tu historia." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Circuitos de Ajedrez | Paraguay juega",
    description: "Encontrá tu torneo, seguí tus resultados y viví cada partida.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
