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
  getCategories,
  getChannels,
  getFeeds,
  getLogoMap,
  getStreams,
  type Filters,
} from "./iptv.ts";
import { buildM3U, type PlaylistItem } from "./m3u-core.ts";

export { buildM3U, isPlayableUrl, type PlaylistItem } from "./m3u-core.ts";

/**
 * Coleta os itens de playlist a partir dos filtros, cruzando streams + canais +
 * logos + feeds. Separado da serialização para alimentar o editor (JSON).
 *
 * Streams com `channel: null` ficam de fora — sem ID não há como
 * aplicar filtro, logo ou EPG. Se um dia precisar, entram como grupo "Undefined".
 */
export async function collectPlaylistItems(
  filters: Filters,
): Promise<PlaylistItem[]> {
  const [channels, streams, logos, feeds, categories] = await Promise.all([
    getChannels(),
    getStreams(),
    getLogoMap(),
    getFeeds(),
    getCategories(),
  ]);

  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const feedName = new Map(feeds.map((f) => [`${f.channel}@${f.id}`, f.name]));

  const allowed = new Map(
    filterChannels(channels, filters).map((c) => [c.id, c]),
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
  return items;
}

/** Converte os filtros da UI diretamente no texto M3U. */
export async function buildPlaylist(filters: Filters): Promise<string> {
  return buildM3U(await collectPlaylistItems(filters));
}
