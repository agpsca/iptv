"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFiltersUI } from "@/components/filters-ui";

export function PlaylistButton({
  size = "sm",
  label = "Editar e baixar M3U",
}: {
  size?: "sm" | "default";
  label?: string;
}) {
  const { setPlaylistOpen, ready } = useFiltersUI();
  if (!ready) return null;
  return (
    <Button variant="outline" size={size} onClick={() => setPlaylistOpen(true)}>
      <Download />
      {label}
    </Button>
  );
}
