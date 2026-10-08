import { Tv } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading UI (Suspense fallback do App Router). Espelha o layout da home com
 * skeletons animados — a primeira requisição baixa ~14MB da API do iptv-org,
 * então este estado aparece de verdade.
 */

function Shimmer({ className }: { className?: string }) {
  return (
    <Skeleton className={cn("skeleton-shimmer bg-muted/60", className)} />
  );
}

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-10">
      {/* Título */}
      <div className="loading-fade-in mb-8">
        <Shimmer className="h-10 w-64 sm:h-12 sm:w-80" />
        <Shimmer className="mt-3 h-5 w-full max-w-2xl" />
      </div>

      {/* Barra de filtros */}
      <div
        className="loading-fade-in from-card to-card/40 ring-foreground/10 mb-8 rounded-2xl bg-gradient-to-b p-5 shadow-lg shadow-black/5 ring-1"
        style={{ animationDelay: "60ms" }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Shimmer className="size-4 rounded" />
          <Shimmer className="h-4 w-16" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Shimmer className="h-3 w-14" />
              <Shimmer className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="border-border/60 mt-5 flex items-center gap-5 border-t pt-4">
          <Shimmer className="h-4 w-36" />
          <Shimmer className="h-4 w-28" />
        </div>
      </div>

      {/* Barra de resultados */}
      <div
        className="loading-fade-in mb-5 flex items-center justify-between"
        style={{ animationDelay: "120ms" }}
      >
        <Shimmer className="h-6 w-40" />
        <Shimmer className="h-8 w-48 rounded-lg" />
      </div>

      {/* Grid de cards */}
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 20 }).map((_, i) => (
          <li
            key={i}
            className="loading-fade-in ring-foreground/10 overflow-hidden rounded-xl shadow-sm ring-1"
            style={{ animationDelay: `${160 + i * 35}ms` }}
          >
            <div className="bg-muted/40 relative flex h-28 items-center justify-center overflow-hidden">
              <div className="skeleton-shimmer absolute inset-0" />
              <Tv className="text-muted-foreground/20 size-9" aria-hidden />
            </div>
            <div className="flex flex-col gap-2 p-3">
              <Shimmer className="h-4 w-3/4" />
              <Shimmer className="h-3 w-1/2" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
