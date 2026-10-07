import Link from "next/link";
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
  const { q = "", country = "", category = "", nsfw, closed } = filters;
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
  const playlistHref = `/playlist.m3u?${filtersToQuery(filters)}`;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Canais de TV</h1>
        <p className="text-sm text-neutral-500">
          Dados públicos do{" "}
          <a
            className="underline hover:no-underline"
            href="https://github.com/iptv-org/api"
            target="_blank"
            rel="noreferrer"
          >
            iptv-org/api
          </a>{" "}
          — {channels.length.toLocaleString("pt-BR")} canais indexados.
        </p>
      </header>

      <form
        method="GET"
        action="/"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-500">Buscar</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="nome, apelido ou rede"
            className="w-64 rounded border border-neutral-300 bg-transparent px-2 py-1.5 dark:border-neutral-700"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-500">País</span>
          <select
            name="country"
            defaultValue={country}
            className="w-56 rounded border border-neutral-300 bg-transparent px-2 py-1.5 dark:border-neutral-700"
          >
            <option value="">Todos</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-500">Categoria</span>
          <select
            name="category"
            defaultValue={category}
            className="w-48 rounded border border-neutral-300 bg-transparent px-2 py-1.5 dark:border-neutral-700"
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 py-2 text-sm">
          <input type="checkbox" name="closed" value="1" defaultChecked={closed} />
          Incluir encerrados
        </label>

        <label className="flex items-center gap-2 py-2 text-sm">
          <input type="checkbox" name="nsfw" value="1" defaultChecked={nsfw} />
          Incluir NSFW
        </label>

        <button
          type="submit"
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Filtrar
        </button>
        <Link
          href="/"
          className="px-2 py-2 text-sm text-neutral-500 underline hover:no-underline"
        >
          Limpar
        </Link>
      </form>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-neutral-500">
          {found.length.toLocaleString("pt-BR")} resultado(s) · página {current}{" "}
          de {pages}
        </p>
        <a
          href={playlistHref}
          className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          ⬇ Baixar M3U destes filtros
        </a>
      </div>

      {slice.length === 0 ? (
        <p className="py-16 text-center text-neutral-500">
          Nenhum canal encontrado com esses filtros.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
        <nav className="mt-8 flex items-center justify-center gap-3 text-sm">
          {current > 1 && (
            <Link className="underline hover:no-underline" href={pageHref(current - 1)}>
              ← Anterior
            </Link>
          )}
          <span className="text-neutral-500">
            {current} / {pages}
          </span>
          {current < pages && (
            <Link className="underline hover:no-underline" href={pageHref(current + 1)}>
              Próxima →
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
