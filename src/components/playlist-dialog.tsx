"use client";

import type { Filters } from "@/lib/iptv";
import { filtersToQuery } from "@/lib/iptv";
import { useFiltersUI } from "@/components/filters-ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlaylistEditor } from "@/components/playlist-editor";

export function PlaylistDialog({ filters }: { filters: Filters }) {
  const { playlistOpen, setPlaylistOpen } = useFiltersUI();

  const qs = filtersToQuery(filters);
  const jsonHref = `/playlist.m3u?${qs ? `${qs}&` : ""}format=json`;
  const filename =
    [filters.country, filters.category]
      .filter(Boolean)
      .join("-")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 40) || "playlist";

  return (
    <Dialog open={playlistOpen} onOpenChange={setPlaylistOpen}>
      <DialogContent className="flex h-[88vh] max-h-[88vh] w-[92vw] max-w-[92vw] flex-col gap-6 p-5 sm:max-w-5xl sm:p-6">
        <DialogHeader>
          <DialogTitle>Editor da playlist M3U</DialogTitle>
          <DialogDescription>
            Organize os canais e grupos — reordene, renomeie, mova entre grupos
            ou remova — e baixe o arquivo final.
          </DialogDescription>
        </DialogHeader>

        {playlistOpen && (
          <PlaylistEditor
            key={jsonHref}
            previewHref={jsonHref}
            filename={filename}
            onClose={() => setPlaylistOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
