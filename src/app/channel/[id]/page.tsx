import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Download, ExternalLink, Tv, VideoOff } from "lucide-react";
import {
  getCategories,
  getChannels,
  getCountries,
  getFeeds,
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
  return { title: channel ? `${channel.name} — RATV` : "Canal não encontrado" };
}

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const channel = await findChannel(id);
  if (!channel) notFound();

  const [countries, categories, logos, streams, feeds] = await Promise.all([
    getCountries(),
    getCategories(),
    getLogoMap(),
    getStreams(),
    getFeeds(),
  ]);

  const country = countries.find((c) => c.code === channel.country);
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const logo = logos.get(channel.id);
  const channelStreams = streams.filter((s) => s.channel === channel.id);
  const channelFeeds = feeds.filter((f) => f.channel === channel.id);

  const facts: [string, React.ReactNode][] = [];
  const add = (label: string, value: React.ReactNode) => {
    if (value) facts.push([label, value]);
  };
  add(
    "ID",
    <code className="bg-muted/60 rounded px-1.5 py-0.5 font-mono text-xs">
      {channel.id}
    </code>,
  );
  add("Rede", channel.network);
  add("Proprietários", channel.owners.join(", "));
  add("Nomes alternativos", channel.alt_names.join(", "));
  add("Lançamento", channel.launched);
  add("Encerramento", channel.closed);
  add(
    "Substituído por",
    channel.replaced_by && (
      <Link
        className="font-medium underline underline-offset-4 hover:no-underline"
        href={`/channel/${encodeURIComponent(channel.replaced_by)}`}
      >
        {channel.replaced_by}
      </Link>
    ),
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2",
        )}
      >
        <ArrowLeft />
        Voltar
      </Link>

      <Card className="relative mt-5">
        {logo && (
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt=""
              className="size-full scale-150 object-cover opacity-20 blur-3xl"
            />
          </div>
        )}
        <CardHeader className="relative flex-row items-center gap-4 space-y-0">
          <div className="bg-muted/40 ring-border/50 relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 sm:size-20">
            {logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logo}
                alt={`Logo do canal ${channel.name}`}
                className="max-h-[70%] max-w-[70%] object-contain drop-shadow-sm"
              />
            ) : (
              <Tv aria-hidden className="text-muted-foreground/50 size-8" />
            )}
          </div>
          <div className="min-w-0 space-y-2">
            <CardTitle className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {channel.name}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {country ? `${country.flag} ${country.name}` : channel.country}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {channel.categories.map((c) => (
                <Badge key={c} variant="outline">
                  {categoryName.get(c) ?? c}
                </Badge>
              ))}
              {channel.closed && <Badge variant="destructive">encerrado</Badge>}
              {channel.is_nsfw && <Badge variant="destructive">NSFW</Badge>}
              {channelStreams.length === 0 && (
                <Badge variant="secondary">
                  <VideoOff aria-hidden />
                  sem stream
                </Badge>
              )}
            </div>
            {channel.website && (
              <a
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm underline underline-offset-4 hover:no-underline"
                href={channel.website}
                target="_blank"
                rel="noreferrer"
              >
                <span className="truncate">{channel.website}</span>
                <ExternalLink className="size-3.5 shrink-0" aria-hidden />
              </a>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3">
              {facts.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-muted-foreground text-xs">{label}</dt>
                  <dd className="wrap-break-word mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>

            {channelFeeds.length > 0 && (
              <div className="border-border/60 mt-4 border-t pt-4">
                <p className="text-muted-foreground mb-2 text-xs">
                  Feeds ({channelFeeds.length.toLocaleString("pt-BR")})
                </p>
                <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {channelFeeds.map((f) => (
                    <li key={f.id} className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{f.name}</span>
                        {f.is_main && (
                          <Badge variant="secondary">principal</Badge>
                        )}
                        {f.format && (
                          <Badge variant="outline">{f.format}</Badge>
                        )}
                      </div>
                      {(f.broadcast_area.length > 0 ||
                        f.timezones.length > 0) && (
                        <p className="text-muted-foreground mt-0.5 truncate text-xs">
                          {[f.broadcast_area.join(", "), f.timezones.join(", ")]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              Streams{" "}
              <span className="text-muted-foreground font-normal">
                ({channelStreams.length})
              </span>
            </h2>
            {channelStreams.length > 0 && (
              <a
                href={`/playlist.m3u?id=${encodeURIComponent(channel.id)}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                <Download />
                Baixar M3U
              </a>
            )}
          </div>
          {channelStreams.length === 0 ? (
            <Card className="items-center gap-2 py-10 text-center">
              <VideoOff
                aria-hidden
                className="text-muted-foreground/40 size-8"
              />
              <p className="text-muted-foreground text-sm">
                Nenhum stream público catalogado para este canal.
              </p>
            </Card>
          ) : (
            <ul className="space-y-2">
              {channelStreams.map((s) => (
                <li key={s.url}>
                  <Card size="sm" className="gap-2">
                    <CardContent className="flex flex-col gap-1.5">
                      <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        {s.title}
                        {s.quality && (
                          <Badge variant="secondary">{s.quality}</Badge>
                        )}
                        {s.labels.map((label) => (
                          <Badge key={label} variant="outline">
                            {label}
                          </Badge>
                        ))}
                      </CardTitle>
                      <p className="text-muted-foreground font-mono text-xs break-all">
                        {s.url}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
