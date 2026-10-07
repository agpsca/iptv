import Link from "next/link";
import type { Channel, Country } from "@/lib/iptv";

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
    <li className="rounded-lg border border-neutral-200 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600">
      <Link
        href={`/channel/${encodeURIComponent(channel.id)}`}
        className="flex h-full flex-col gap-2 p-3"
      >
        <div className="flex h-20 items-center justify-center rounded bg-neutral-100 dark:bg-neutral-900">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={`Logo do canal ${channel.name}`}
              loading="lazy"
              className="max-h-16 max-w-full object-contain"
            />
          ) : (
            <span aria-hidden className="text-2xl text-neutral-400">
              📺
            </span>
          )}
        </div>
        <div>
          <p className="truncate font-medium" title={channel.name}>
            {channel.name}
          </p>
          <p className="truncate text-xs text-neutral-500">
            {country ? `${country.flag} ${country.name}` : channel.country}
            {channel.categories.length > 0 && ` · ${channel.categories.join(", ")}`}
          </p>
          {channel.closed && (
            <p className="text-xs text-red-500">encerrado em {channel.closed}</p>
          )}
        </div>
      </Link>
    </li>
  );
}
