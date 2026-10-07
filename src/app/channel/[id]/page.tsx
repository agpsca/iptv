import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCategories,
  getChannels,
  getCountries,
  getLogoMap,
  getStreams,
} from "@/lib/iptv";

// Depende de params + fetch remoto: renderiza sob demanda, sem prerender.
export const instant = false;

async function findChannel(rawId: string) {  const id = decodeURIComponent(rawId);
  const channels = await getChannels();
  return channels.find((c) => c.id === id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const channel = await findChannel((await params).id);
  return { title: channel ? `${channel.name} — Canais` : "Canal não encontrado" };
}

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const channel = await findChannel(id);
  if (!channel) notFound();

  const [countries, categories, logos, streams] = await Promise.all([
    getCountries(),
    getCategories(),
    getLogoMap(),
    getStreams(),
  ]);

  const country = countries.find((c) => c.code === channel.country);
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const logo = logos.get(channel.id);
  const channelStreams = streams.filter((s) => s.channel === channel.id);

  const facts: [string, React.ReactNode][] = [
    ["ID", <code key="id">{channel.id}</code>],
    ["País", country ? `${country.flag} ${country.name}` : channel.country],
    [
      "Categorias",
      channel.categories.map((c) => categoryName.get(c) ?? c).join(", ") || "—",
    ],
    ["Rede", channel.network ?? "—"],
    ["Proprietários", channel.owners.join(", ") || "—"],
    ["Nomes alternativos", channel.alt_names.join(", ") || "—"],
    ["Lançamento", channel.launched ?? "—"],
    ["Encerramento", channel.closed ?? "—"],
    [
      "Substituído por",
      channel.replaced_by ? (
        <Link
          key="rep"
          className="underline hover:no-underline"
          href={`/channel/${encodeURIComponent(channel.replaced_by)}`}
        >
          {channel.replaced_by}
        </Link>
      ) : (
        "—"
      ),
    ],
    ["NSFW", channel.is_nsfw ? "sim" : "não"],
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm text-neutral-500 underline hover:no-underline">
        ← Voltar
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded bg-neutral-100 dark:bg-neutral-900">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={`Logo do canal ${channel.name}`}
              className="max-h-20 max-w-20 object-contain"
            />
          ) : (
            <span aria-hidden className="text-3xl text-neutral-400">
              📺
            </span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{channel.name}</h1>
          {channel.website && (
            <a
              className="text-sm underline hover:no-underline"
              href={channel.website}
              target="_blank"
              rel="noreferrer"
            >
              {channel.website}
            </a>
          )}
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
        {facts.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-neutral-500">{label}</dt>
            <dd className="break-words">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-8">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            Streams ({channelStreams.length})
          </h2>
          {channelStreams.length > 0 && (
            <a
              href={`/playlist.m3u?id=${encodeURIComponent(channel.id)}`}
              className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              ⬇ Baixar M3U
            </a>
          )}
        </div>
        {channelStreams.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Nenhum stream público catalogado para este canal.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {channelStreams.map((s) => (
              <li
                key={s.url}
                className="rounded border border-neutral-200 p-3 dark:border-neutral-800"
              >
                <p className="font-medium">
                  {s.title}
                  {s.quality && (
                    <span className="ml-2 rounded bg-neutral-200 px-1.5 py-0.5 text-xs dark:bg-neutral-800">
                      {s.quality}
                    </span>
                  )}
                </p>
                <p className="mt-1 break-all text-xs text-neutral-500">{s.url}</p>
                {s.labels.length > 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    {s.labels.join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
