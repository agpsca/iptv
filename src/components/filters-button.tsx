"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFiltersUI } from "@/components/filters-ui";

export function FiltersButton({
  size = "default",
}: {
  size?: "sm" | "default";
}) {
  const { setOpen, activeCount, ready } = useFiltersUI();
  if (!ready) return null;
  return (
    <Button variant="outline" size={size} onClick={() => setOpen(true)}>
      <SlidersHorizontal />
      Filtros
      {activeCount > 0 && (
        <span className="bg-primary text-primary-foreground ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold">
          {activeCount}
        </span>
      )}
    </Button>
  );
}
