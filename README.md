# iptv

Catálogo de canais de TV e gerador de playlist M3U, usando os dados públicos da
[API do iptv-org](https://github.com/iptv-org/api).

## Rodando

Requer Node 22.18+ (o Next 16 aceita 20.9+, mas o `npm run check` usa o type
stripping nativo, que só vem habilitado por padrão a partir do 22.18).

```bash
npm install
npm run dev     # http://localhost:3000
```

A primeira requisição baixa ~14MB de JSON da API do iptv-org; depois os
datasets ficam em memória por 12h.

Outros scripts: `npm run build` + `npm start` (produção), `npm run lint`,
e `npm run check` (self-check do filtro e do builder M3U, sem framework).

## O que tem

- **`/`** — listagem com busca por nome/apelido/rede, filtro por país e
  categoria, toggles de encerrados e NSFW, paginação. A barra de filtros usa
  componentes shadcn (`Select`/`Checkbox`/`Input`, estilo `base-nova` sobre
  `@base-ui/react`) num client component que escreve o estado na URL via
  `router.push` — o SSR continua fazendo a filtragem a partir do query string.
- **`/channel/[id]`** — metadados do canal e streams disponíveis.
- **`/playlist.m3u`** — playlist M3U estendida gerada a partir dos mesmos
  filtros da listagem. Aceita `q`, `country`, `category`, `id`, `nsfw=1`,
  `closed=1`.

```bash
curl "localhost:3000/playlist.m3u?country=BR&category=news" -o br-news.m3u
```

Inclui `tvg-id`, `tvg-logo`, `group-title` e as linhas `#EXTVLCOPT` de
`http-referrer` / `http-user-agent` quando o stream exige.

## Estrutura

| Arquivo | Papel |
| --- | --- |
| `src/lib/iptv.ts` | carga memoizada dos datasets, tipos, `filterChannels`, parse/serialização dos filtros |
| `src/lib/m3u.ts` | `buildM3U` (puro) e `buildPlaylist` (cruza streams + canais + logos + feeds) |
| `src/lib/iptv.check.ts` | self-check com `node:assert` |

## Notas

- Os dados são de terceiros e tratados como não confiáveis: atributos têm
  caracteres de controle e aspas removidos, e só URLs `http(s)` de uma única
  linha entram na playlist — sem isso um `\n` nos dados injetaria entradas
  falsas.
- Os datasets não cabem no data cache do Next (limite de 2MB por entrada),
  por isso o cache em memória no módulo em vez de `fetch` cacheado.

Este projeto não hospeda nem redistribui conteúdo: apenas consome os índices
públicos do iptv-org.
