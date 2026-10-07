import { parseFilters } from "@/lib/iptv";
import { buildPlaylist } from "@/lib/m3u";

/**
 * GET /playlist.m3u?q=&country=&category=&nsfw=1&closed=1
 * Mesmos filtros da listagem. A extensão no path é de propósito: players
 * (VLC, Kodi, TiviMate) costumam inferir o formato pela URL.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseFilters(searchParams);
  const body = await buildPlaylist(filters);

  // Vem da query string: só caracteres seguros no header.
  const name =
    [filters.country, filters.category]
      .filter(Boolean)
      .join("-")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 40) || "playlist";
  return new Response(body, {
    headers: {
      "Content-Type": "audio/x-mpegurl; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.m3u"`,
      "Cache-Control": "no-store",
    },
  });
}
