/**
 * Camada de dados da API pública iptv-org.
 *
 * channels.json tem ~8MB e logos.json ~5.7MB, acima do limite de 2MB do data
 * cache do Next, então os arquivos são memoizados em memória no módulo.
 *
 * O cache é por processo e só expira no restart (TTL abaixo). Se um dia
 * precisar de invalidação sob demanda, trocar por `unstable_cache`/Redis.
 */

const API = "https://iptv-org.github.io/api";
const TTL = 1000 * 60 * 60 * 12; // 12h

export type Channel = {
  id: string;
  name: string;
  alt_names: string[];
  network: string | null;
  owners: string[];
  country: string;
  subdivision?: string | null;
  city?: string | null;
  categories: string[];
  is_nsfw: boolean;
  launched: string | null;
  closed: string | null;
  replaced_by: string | null;
  website: string | null;
};

export type Country = {
  name: string;
  code: string;
  languages: string[];
  flag: string;
};

export type Category = { id: string; name: string; description?: string };

export type Logo = {
  channel: string;
  feed: string | null;
  in_use: boolean;
  tags: string[];
  url: string;
  width: number;
  height: number;
  format: string | null;
};

export type Feed = {
  channel: string;
  id: string;
  name: string;
  alt_names: string[];
  is_main: boolean;
  broadcast_area: string[];
  timezones: string[];
  languages: string[];
  format: string | null;
};

export type Stream = {
  channel: string | null;
  feed: string | null;
  title: string;
  url: string;
  referrer: string | null;
  user_agent: string | null;
  quality: string | null;
  labels: string[];
};

type Entry<T> = { value: Promise<T> };
const cache = new Map<string, Entry<unknown>>();

function load<T>(file: string): Promise<T> {
  const hit = cache.get(file) as Entry<T> | undefined;
  if (hit) return hit.value;

  const value = fetch(`${API}/${file}.json`, { cache: "no-store" }).then(
    (res) => {
      if (!res.ok) throw new Error(`iptv-org ${file}.json: HTTP ${res.status}`);
      return res.json() as Promise<T>;
    },
  );
  // Não envenena o cache com uma promise rejeitada.
  value.catch(() => cache.delete(file));
  cache.set(file, { value });
  // Expiração agendada em vez de comparar Date.now() no render: com
  // cacheComponents o Next rejeita leituras de relógio durante o prerender.
  setTimeout(() => cache.delete(file), TTL).unref?.();
  return value;
}

export const getChannels = () => load<Channel[]>("channels");
export const getCountries = () => load<Country[]>("countries");
export const getCategories = () => load<Category[]>("categories");
export const getStreams = () => load<Stream[]>("streams");
export const getFeeds = () => load<Feed[]>("feeds");

/**
 * Mapa de logos com duas chaves por logo: `channel` e `channel@feed`.
 * Prefere logo em uso e, em empate, a de maior largura.
 */
export async function getLogoMap(): Promise<Map<string, string>> {
  const logos = await load<Logo[]>("logos");
  const best = new Map<string, Logo>();
  const keep = (key: string, logo: Logo) => {
    const cur = best.get(key);
    const better =
      !cur ||
      (logo.in_use !== cur.in_use ? logo.in_use : logo.width > cur.width);
    if (better) best.set(key, logo);
  };
  for (const logo of logos) {
    keep(logo.channel, logo);
    if (logo.feed) keep(`${logo.channel}@${logo.feed}`, logo);
  }
  return new Map([...best].map(([key, logo]) => [key, logo.url]));
}

export type Filters = {
  id?: string;
  q?: string;
  country?: string;
  category?: string;
  nsfw?: boolean;
  closed?: boolean;
};

type SearchParams = Record<string, string | string[] | undefined>;

/** País pré-selecionado na primeira visita (sem `country` na URL). */
export const DEFAULT_COUNTRY = "BR";

/** Sentinela para "todos os países", distinguindo-o da ausência do parâmetro. */
export const ALL_COUNTRIES = "all";

/** Lê os filtros do `searchParams` de uma page ou de uma URL de route handler. */
export function parseFilters(sp: SearchParams | URLSearchParams): Filters {
  const has = (key: string) =>
    sp instanceof URLSearchParams ? sp.has(key) : sp[key] !== undefined;
  const get = (key: string) => {
    const value = sp instanceof URLSearchParams ? sp.get(key) : sp[key];
    return (Array.isArray(value) ? value[0] : value) || "";
  };

  // Sem `country` na URL → aplica o país padrão. `country=all` → sem filtro
  // (intenção explícita de "Todos", sem reverter ao padrão).
  const rawCountry = has("country") ? get("country") : DEFAULT_COUNTRY;
  const country = rawCountry === ALL_COUNTRIES ? "" : rawCountry;

  return {
    id: get("id"),
    q: get("q"),
    country,
    category: get("category"),
    nsfw: get("nsfw") === "1",
    closed: get("closed") === "1",
  };
}

/** Inverso de `parseFilters`, para montar links que preservam o estado. */
export function filtersToQuery(f: Filters, extra?: Record<string, string>) {
  const params = new URLSearchParams();
  if (f.id) params.set("id", f.id);
  if (f.q) params.set("q", f.q);
  if (f.country) params.set("country", f.country);
  if (f.category) params.set("category", f.category);
  if (f.nsfw) params.set("nsfw", "1");
  if (f.closed) params.set("closed", "1");
  for (const [k, v] of Object.entries(extra ?? {})) params.set(k, v);
  return params.toString();
}

export function filterChannels(channels: Channel[], f: Filters): Channel[] {
  const q = f.q?.trim().toLowerCase();
  return channels.filter((c) => {
    if (f.id) return c.id === f.id;
    if (!f.nsfw && c.is_nsfw) return false;
    if (!f.closed && c.closed) return false;
    if (f.country && c.country !== f.country) return false;
    if (f.category && !c.categories.includes(f.category)) return false;
    if (
      q &&
      !c.name.toLowerCase().includes(q) &&
      !c.alt_names.some((n) => n.toLowerCase().includes(q)) &&
      !(c.network ?? "").toLowerCase().includes(q)
    )
      return false;
    return true;
  });
}
