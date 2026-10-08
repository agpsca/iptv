import { parseFilters } from "@/lib/iptv";
import { buildM3U, collectPlaylistItems } from "@/lib/m3u";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseFilters(searchParams);

  // `format=json`: devolve os itens estruturados para o editor carregar.
  if (searchParams.get("format") === "json") {
    const items = await collectPlaylistItems(filters);
    return Response.json(
      { items },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = buildM3U(await collectPlaylistItems(filters));

  // `preview=1`: devolve o mesmo corpo como texto inline (sem forçar download),
  // para a prévia no modal. Sem o parâmetro, mantém o comportamento de anexo.
  const preview = searchParams.get("preview") === "1";
  if (preview) {
    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

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
