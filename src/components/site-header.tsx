"use client";

import * as React from "react";
import Link from "next/link";
import { Github, RatIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { FiltersButton } from "@/components/filters-button";
import { PlaylistButton } from "@/components/playlist-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

// A partir de quantos px de rolagem o cabeçalho aparece.
const SHOW_AFTER = 80;

export function SiteHeader() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll(); // estado inicial (ex.: recarregar já rolado)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      aria-hidden={!visible}
      className={cn(
        "bg-background/80 fixed inset-x-0 top-0 z-40 border-b backdrop-blur-sm transition-all duration-300",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-full opacity-0",
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80"
        >
          <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
            <RatIcon className="size-4" aria-hidden />
          </span>
          RATV
        </Link>

        <div className="flex items-center gap-2">
          <FiltersButton size="sm" />
          <PlaylistButton size="sm" label="Baixar M3U" />
          <ThemeToggle />
          <a
            href="https://github.com/iptv-org/api"
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <Github aria-hidden />
            <span className="hidden lg:inline">iptv-org/api</span>
          </a>
        </div>
      </div>
    </header>
  );
}
