/**
 * Geração de playlist M3U (formato estendido, como o iptv-org/iptv).
 *
 *   #EXTM3U
 *   #EXTINF:-1 tvg-id="RedeGlobo.br" tvg-logo="https://..." group-title="General",Rede Globo
 *   #EXTVLCOPT:http-referrer=https://exemplo.com/
 *   #EXTVLCOPT:http-user-agent=Mozilla/5.0
 *   https://exemplo.com/stream.m3u8
 */

import {
  filterChannels,
  getBlocklist,
  getCategories,
  getChannels,
  getFeeds,
  getLogoMap,
  getStreams,
  type Filters,
} from "./iptv.ts";

export type PlaylistItem = {
  url: string;
  title: string;
  tvgId?: string;
  logo?: string;
  group?: string;
  referrer?: string | null;
  userAgent?: string | null;
};

/**
 * Dados remotos são não confiáveis: um `\n` dentro de um atributo ou da URL
 * injetaria entradas falsas na playlist. Removemos controles e aspas.
 */
const clean = (value: string) =>
  value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/"/g, "'").trim();

/** Só aceita URL http(s) de uma única linha; qualquer outra coisa é descartada. */
export const isPlayableUrl = (url: string) =>
  /^https?:\/\/[^\s"]+$/.test(url.trim());

function extinf(item: PlaylistItem): string {
  const attrs = [
    ["tvg-id", item.tvgId],
    ["tvg-logo", item.logo],
    ["group-title", item.group],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => ` ${k}="${clean(String(v))}"`)
    .join("");
  return `#EXTINF:-1${attrs},${clean(item.title)}`;
}

/** Monta o texto da playlist. Itens com URL inválida são omitidos. */
export function buildM3U(items: PlaylistItem[]): string {
  const lines = ["#EXTM3U"];
  for (const item of items) {
    if (!isPlayableUrl(item.url)) continue;
    lines.push(extinf(item));
    if (item.referrer && isPlayableUrl(item.referrer))
      lines.push(`#EXTVLCOPT:http-referrer=${clean(item.referrer)}`);
    if (item.userAgent)
      lines.push(`#EXTVLCOPT:http-user-agent=${clean(item.userAgent)}`);
    lines.push(item.url.trim());
  }
  return lines.join("\n") + "\n";
}

/**
 * Converte os filtros da UI em itens de playlist, cruzando streams + canais +
 * logos + feeds e removendo o que está na blocklist (DMCA/NSFW).
 *
 * ponytail: streams com `channel: null` ficam de fora — sem ID não há como
 * aplicar filtro, logo ou EPG. Se um dia precisar, entram como grupo "Undefined".
 */
export async function buildPlaylist(filters: Filters): Promise<string> {
  const [channels, streams, logos, feeds, categories, blocklist] =
    await Promise.all([
      getChannels(),
      getStreams(),
      getLogoMap(),
      getFeeds(),
      getCategories(),
      getBlocklist(),
    ]);

  const blocked = new Set(blocklist.map((b) => b.channel));
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const feedName = new Map(feeds.map((f) => [`${f.channel}@${f.id}`, f.name]));

  const allowed = new Map(
    filterChannels(channels, filters)
      .filter((c) => !blocked.has(c.id))
      .map((c) => [c.id, c]),
  );

  const items: PlaylistItem[] = [];
  for (const stream of streams) {
    const channel = stream.channel ? allowed.get(stream.channel) : undefined;
    if (!channel) continue;

    const key = stream.feed ? `${channel.id}@${stream.feed}` : channel.id;
    const feed = stream.feed ? feedName.get(key) : undefined;
    items.push({
      url: stream.url,
      title: feed ? `${channel.name} ${feed}` : channel.name,
      tvgId: key,
      logo: logos.get(key) ?? logos.get(channel.id),
      group:
        channel.categories.map((c) => categoryName.get(c) ?? c).join(";") ||
        "Undefined",
      referrer: stream.referrer,
      userAgent: stream.user_agent,
    });
  }

  items.sort((a, b) => a.title.localeCompare(b.title));
  return buildM3U(items);
}
