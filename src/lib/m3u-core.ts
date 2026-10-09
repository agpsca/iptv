/**
 * Núcleo puro da geração M3U — sem dependências de dados/servidor, para ser
 * usado tanto no servidor (route handler) quanto no cliente (editor).
 */

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
export const clean = (value: string) =>
  value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/"/g, "'").trim();

/** Só aceita URL http(s) de uma única linha; qualquer outra coisa é descartada. */
export const isPlayableUrl = (url: string) =>
  /^https?:\/\/[^\s"]+$/.test(url.trim());

export function playlistFilename(name: string, fallback: string): string {
  const base =
    name.trim().replace(/[\u0000-\u001f\u007f"/\\]+/g, "-") ||
    fallback.trim() ||
    "playlist";
  return base.endsWith(".m3u") ? base : `${base}.m3u`;
}

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
