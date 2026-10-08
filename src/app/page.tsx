import { RatIcon, TvMinimal } from "lucide-react";
import {
  filterChannels,
  filtersToQuery,
  getCategories,
  getChannels,
  getCountries,
  getLogoMap,
  parseFilters,
} from "@/lib/iptv";
import { ChannelCard } from "@/components/channel-card";
import { FilterBar } from "@/components/filter-bar";
import { FiltersButton } from "@/components/filters-button";
import { PlaylistDialog } from "@/components/playlist-dialog";
import { PlaylistButton } from "@/components/playlist-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PER_PAGE = 60;

// Rota depende de searchParams + fetch remoto: renderiza sob demanda, sem prerender.
export const instant = false;

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const rawPage = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(rawPage) || 1);

  const [channels, countries, categories, logos] = await Promise.all([
    getChannels(),
    getCountries(),
    getCategories(),
    getLogoMap(),
  ]);

  const countryName = new Map(countries.map((c) => [c.code, c]));
  const found = filterChannels(channels, filters);
  const pages = Math.max(1, Math.ceil(found.length / PER_PAGE));
  const current = Math.min(page, pages);
  const slice = found.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const pageHref = (n: number) => {
    const qs = filtersToQuery(filters, n > 1 ? { page: String(n) } : undefined);
    return qs ? `/?${qs}` : "/";
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-10">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            <RatIcon className="text-foreground size-9 shrink-0 sm:size-11" aria-hidden />
            <span className="from-foreground to-foreground/60 bg-linear-to-br bg-clip-text text-transparent">
              RATV
            </span>
          </h1>
          <div className="flex shrink-0 items-center gap-2 pt-1">
            <ThemeToggle />
            <FiltersButton />
          </div>
        </div>
        <p className="bg-muted/50 ring-border/50 text-muted-foreground mt-4 inline-block max-w-2xl rounded-xl px-4 py-3 text-sm ring-1 backdrop-blur-md sm:text-base">
          Explore{" "}
          <span className="text-foreground font-medium">
            {channels.length.toLocaleString("pt-BR")}
          </span>{" "}
          canais indexados a partir dos dados públicos do iptv-org — filtre,
          pré-visualize e exporte sua playlist M3U.
        </p>
      </div>

      <FilterBar
        filters={filters}
        countries={countries}
        categories={categories}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-foreground text-lg font-semibold">
            {found.length.toLocaleString("pt-BR")}
          </span>
          <span className="text-muted-foreground text-sm">
            {found.length === 1 ? "resultado" : "resultados"}
            {pages > 1 && (
              <>
                {" · "}página {current} de {pages}
              </>
            )}
          </span>
        </div>
        <PlaylistButton />
      </div>

      {slice.length === 0 ? (
        <Card className="items-center gap-2 py-20 text-center">
          <TvMinimal className="text-muted-foreground/40 size-10" aria-hidden />
          <p className="text-muted-foreground">
            Nenhum canal encontrado com esses filtros.
          </p>
        </Card>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {slice.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              logo={logos.get(channel.id)}
              country={countryName.get(channel.country)}
            />
          ))}
        </ul>
      )}

      {pages > 1 && (
        <Pagination className="border-border/60 mt-10 border-t pt-6">
          <PaginationContent>
            {current > 1 && (
              <PaginationItem>
                <PaginationPrevious href={pageHref(current - 1)} />
              </PaginationItem>
            )}
            <PaginationItem>
              <span className="text-muted-foreground px-4 text-sm tabular-nums">
                {current} / {pages}
              </span>
            </PaginationItem>
            {current < pages && (
              <PaginationItem>
                <PaginationNext href={pageHref(current + 1)} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}

      <PlaylistDialog filters={filters} />
    </main>
  );
}
