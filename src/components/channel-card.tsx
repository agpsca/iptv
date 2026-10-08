import Link from "next/link";
import { Tv } from "lucide-react";
import type { Channel, Country } from "@/lib/iptv";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ChannelCard({
  channel,
  logo,
  country,
}: {
  channel: Channel;
  logo?: string;
  country?: Country;
}) {
  return (
    <li>
      <Link
        href={`/channel/${encodeURIComponent(channel.id)}`}
        className="group block h-full"
      >
        <Card className="ring-foreground/10 hover:ring-ring/50 hover:shadow-primary/5 relative h-full gap-0 overflow-hidden py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
          <div className="bg-muted/40 relative flex h-28 items-center justify-center overflow-hidden">
            {logo ? (
              <>
                {/* Fundo: o próprio logo borrado e ampliado — cor sempre
                    harmônica com o canal, sem destoar do tema. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className="pointer-events-none absolute inset-0 size-full scale-150 object-cover opacity-40 blur-2xl"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo}
                  alt={`Logo do canal ${channel.name}`}
                  loading="lazy"
                  className="relative max-h-16 max-w-[80%] object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                />
              </>
            ) : (
              <Tv
                aria-hidden
                className="text-muted-foreground/50 size-9 transition-transform duration-200 group-hover:scale-105"
              />
            )}
            {channel.closed && (
              <Badge
                variant="destructive"
                title={`Encerrado em ${channel.closed}`}
                className="absolute top-2 right-2 shadow-sm backdrop-blur-sm"
              >
                encerrado
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-1 p-3">
            <p
              className="group-hover:text-primary truncate font-medium transition-colors"
              title={channel.name}
            >
              {channel.name}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {country ? `${country.flag} ${country.name}` : channel.country}
              {channel.categories.length > 0 &&
                ` · ${channel.categories.join(", ")}`}
            </p>
          </div>
        </Card>
      </Link>
    </li>
  );
}
