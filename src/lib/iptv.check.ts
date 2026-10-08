/** Check do filtro: `node src/lib/iptv.check.ts` (type stripping nativo do Node 22+). */
import assert from "node:assert/strict";
import { filterChannels, parseFilters, type Channel } from "./iptv.ts";
import { buildM3U, isPlayableUrl } from "./m3u.ts";

const ch = (over: Partial<Channel>): Channel => ({
  id: "X.br",
  name: "Canal X",
  alt_names: [],
  network: null,
  owners: [],
  country: "BR",
  categories: ["general"],
  is_nsfw: false,
  launched: null,
  closed: null,
  replaced_by: null,
  website: null,
  ...over,
});

const all = [
  ch({ id: "globo.br", name: "Globo", network: "Globo" }),
  ch({ id: "sbt.br", name: "SBT", alt_names: ["Silvio Santos"] }),
  ch({ id: "cnn.us", name: "CNN", country: "US", categories: ["news"] }),
  ch({ id: "old.br", name: "Antigo", closed: "2020-01-01" }),
  ch({ id: "hot.br", name: "Picante", is_nsfw: true }),
];

const ids = (f: Parameters<typeof filterChannels>[1]) =>
  filterChannels(all, f).map((c) => c.id);

// Sem flags: esconde encerrados e NSFW.
assert.deepEqual(ids({}), ["globo.br", "sbt.br", "cnn.us"]);
assert.deepEqual(ids({ closed: true }).includes("old.br"), true);
assert.deepEqual(ids({ nsfw: true }).includes("hot.br"), true);

// Busca cobre nome, apelido e rede, case-insensitive.
assert.deepEqual(ids({ q: "glo" }), ["globo.br"]);
assert.deepEqual(ids({ q: "silvio santos" }), ["sbt.br"]);
assert.deepEqual(ids({ q: "  CNN " }), ["cnn.us"]);
assert.deepEqual(ids({ q: "inexistente" }), []);

// País e categoria combinam entre si.
assert.deepEqual(ids({ country: "US" }), ["cnn.us"]);
assert.deepEqual(ids({ category: "news" }), ["cnn.us"]);
assert.deepEqual(ids({ country: "BR", category: "news" }), []);

// `id` é exato e ignora os demais filtros (inclusive encerrado/NSFW).
assert.deepEqual(ids({ id: "hot.br" }), ["hot.br"]);
assert.deepEqual(ids({ id: "old.br", q: "nada a ver" }), ["old.br"]);
assert.deepEqual(ids({ id: "nao.existe" }), []);

// --- parseFilters: país padrão (BR) na primeira visita ---

// Sem `country` na URL: assume BR.
assert.equal(parseFilters({}).country, "BR");
assert.equal(parseFilters(new URLSearchParams("")).country, "BR");
// `country=all` é "Todos" explícito (sem filtro), não reverte ao padrão.
assert.equal(parseFilters({ country: "all" }).country, "");
assert.equal(parseFilters(new URLSearchParams("country=all")).country, "");
// País explícito é respeitado.
assert.equal(parseFilters({ country: "US" }).country, "US");

// --- M3U ---

const m3u = buildM3U([
  {
    url: "https://cdn.exemplo.com/globo/index.m3u8",
    title: "Globo São Paulo",
    tvgId: "RedeGlobo.br@SaoPaulo",
    logo: "https://cdn.exemplo.com/logo.png",
    group: "General;News",
    referrer: "https://exemplo.com/",
    userAgent: "Mozilla/5.0",
  },
]);

assert.equal(
  m3u,
  [
    "#EXTM3U",
    '#EXTINF:-1 tvg-id="RedeGlobo.br@SaoPaulo" tvg-logo="https://cdn.exemplo.com/logo.png" group-title="General;News",Globo São Paulo',
    "#EXTVLCOPT:http-referrer=https://exemplo.com/",
    "#EXTVLCOPT:http-user-agent=Mozilla/5.0",
    "https://cdn.exemplo.com/globo/index.m3u8",
    "",
  ].join("\n"),
);

// Atributos opcionais ausentes não viram atributos vazios.
assert.equal(
  buildM3U([{ url: "http://a.tv/s.m3u8", title: "A" }]),
  "#EXTM3U\n#EXTINF:-1,A\nhttp://a.tv/s.m3u8\n",
);

// Injeção: newline em atributo/título não cria linhas novas.
const injected = buildM3U([
  {
    url: "http://a.tv/s.m3u8",
    title: "Mau\n#EXTINF:-1,Falso",
    group: 'x" tvg-id="fake',
  },
]);
assert.equal(injected.split("\n").filter((l) => l.startsWith("#EXTINF")).length, 1);
assert.equal(injected.includes('tvg-id="fake'), false);
assert.equal(injected.includes("Mau #EXTINF:-1,Falso"), true);

// URL não-http, com espaço ou vazia é descartada junto com a entrada toda.
for (const bad of ["javascript:alert(1)", "http://a.tv/ b", "", "a.tv/x.m3u8"]) {
  assert.equal(isPlayableUrl(bad), false, bad);
  assert.equal(buildM3U([{ url: bad, title: "X" }]), "#EXTM3U\n", bad);
}
assert.equal(isPlayableUrl(" https://a.tv/x.m3u8 "), true);

// Referrer inválido é omitido sem derrubar a entrada.
const badRef = buildM3U([
  { url: "http://a.tv/s.m3u8", title: "A", referrer: "nao-é-url" },
]);
assert.equal(badRef.includes("http-referrer"), false);
assert.equal(badRef.includes("http://a.tv/s.m3u8"), true);

console.log("ok");
