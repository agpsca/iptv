"use client";

import { ChevronsUpDown, Search } from "lucide-react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { cn } from "@/lib/utils";

export type ComboOption = { value: string; label: string };

/**
 * Select com busca: o trigger se comporta como um select normal (mostra o
 * rótulo selecionado); o campo de busca vive DENTRO do popup, no topo da lista.
 * Assim digitar filtra a lista sem bagunçar o valor exibido no campo.
 */
export function FilterCombobox({
  options,
  value,
  onChange,
  ariaLabel,
  placeholder,
  searchPlaceholder = "Buscar…",
  emptyText = "Nada encontrado.",
}: {
  options: ComboOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}) {
  const selected = options.find((o) => o.value === value) ?? null;

  return (
    <Combobox
      items={options}
      value={selected}
      onValueChange={(item: ComboOption | null) => onChange(item?.value ?? "")}
      itemToStringLabel={(item: ComboOption) => item?.label ?? ""}
    >
      <ComboboxPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          "border-input bg-transparent backdrop-blur-md focus-visible:border-ring focus-visible:ring-ring/50 aria-expanded:border-ring flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-lg border px-2.5 text-sm transition-colors outline-none focus-visible:ring-3 dark:bg-input/50 dark:hover:bg-input/70",
        )}
      >
        <ComboboxValue>
          {(item: ComboOption | null) =>
            item ? (
              <span className="min-w-0 flex-1 truncate text-left">
                {item.label}
              </span>
            ) : (
              <span className="flex-1 text-left text-muted-foreground">
                {placeholder}
              </span>
            )
          }
        </ComboboxValue>
        <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
      </ComboboxPrimitive.Trigger>

      <ComboboxContent className="w-(--anchor-width) min-w-(--anchor-width) p-0">
        <div className="border-border/60 flex items-center gap-2 border-b px-2.5">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <ComboboxPrimitive.Input
            placeholder={searchPlaceholder}
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <ComboboxEmpty className="py-6">{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item: ComboOption) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
