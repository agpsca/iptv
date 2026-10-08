import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Download, Tv } from "lucide-react";
import {
  getCategories,
  getChannels,
  getCountries,
  getLogoMap,
  getStreams,
} from "@/lib/iptv";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const instant = false;

async function findChannel(rawId: string) {
  const id = decodeURIComponent(rawId);
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
    ["ID", <code key="id" className="font-mono text-xs">{channel.id}</code>],
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
          className="font-medium underline underline-offset-4 hover:no-underline"
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
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
      >
        <ArrowLeft />
        Voltar
      </Link>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <div className="bg-muted/40 relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-border/50 sm:size-24">
            {logo ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute inset-0 size-full scale-150 object-cover opacity-40 blur-2xl"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo}
                  alt={`Logo do canal ${channel.name}`}
                  className="relative max-h-[70%] max-w-[70%] object-contain drop-shadow-sm"
                />
              </>
            ) : (
              <Tv aria-hidden className="text-muted-foreground/50 size-8 sm:size-10" />
            )}
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {channel.name}
            </CardTitle>
            {channel.website && (
              <a
                className="text-muted-foreground text-sm underline underline-offset-4 hover:no-underline"
                href={channel.website}
                target="_blank"
                rel="noreferrer"
              >
                {channel.website}
              </a>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <dl className="grid gap-y-1 text-sm sm:grid-cols-[10rem_1fr] sm:gap-y-2.5">
            {facts.map(([label, value]) => (
              <div
                key={label}
                className="border-border/40 flex flex-col border-b py-1.5 last:border-0 sm:contents sm:border-0 sm:py-0"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="wrap-break-word">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            Streams ({channelStreams.length})
          </h2>
          {channelStreams.length > 0 && (
            <a
              href={`/playlist.m3u?id=${encodeURIComponent(channel.id)}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Download />
              Baixar M3U
            </a>
          )}
        </div>
        {channelStreams.length === 0 ? (
          <Card className="py-8">
            <CardContent className="text-muted-foreground text-center text-sm">
              Nenhum stream público catalogado para este canal.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {channelStreams.map((s) => (
              <li key={s.url}>
                <Card className="gap-2 py-3">
                  <CardContent className="flex flex-col gap-1">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      {s.title}
                      {s.quality && (
                        <Badge variant="secondary">{s.quality}</Badge>
                      )}
                    </CardTitle>
                    <p className="text-muted-foreground break-all text-xs">
                      {s.url}
                    </p>
                    {s.labels.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {s.labels.map((label) => (
                          <Badge key={label} variant="outline">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
