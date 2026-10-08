import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteBackground } from "@/components/site-background";
import { IntroSplash } from "@/components/intro-splash";
import { FiltersProvider } from "@/components/filters-ui";
import { Analytics } from "@vercel/analytics/next";
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
  title: "RATV",
  description: "Catálogo de canais de TV baseado na API pública do iptv-org",
  other: { "darkreader-lock": "true" },
};

// Fundo e esquema escuros: o navegador pinta a área antes/durante o carregamento
// com a cor do shader, evitando o flash branco em navegações.
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08030d" },
    { media: "(prefers-color-scheme: light)", color: "#f7f1f1" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Aplica o tema antes do primeiro paint (sem flash). Padrão: escuro. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'){document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})();`,
          }}
        />
      </head>
      <body
        className="text-foreground flex min-h-full flex-col font-sans"
        suppressHydrationWarning
      >
        <SiteBackground />
        <IntroSplash />
        <FiltersProvider>
          <SiteHeader />
          {children}
        </FiltersProvider>
        <Analytics />
      </body>
    </html>
  );
}
