"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Category, Country, Filters } from "@/lib/iptv";
import { ALL_COUNTRIES, filtersToQuery } from "@/lib/iptv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FilterCombobox, type ComboOption } from "@/components/filter-combobox";
import { useFiltersUI } from "@/components/filters-ui";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const ALL = "__all__";

export function FilterBar({
  filters,
  countries,
  categories,
}: {
  filters: Filters;
  countries: Country[];
  categories: Category[];
}) {
  const router = useRouter();
  const { open, setOpen, setActiveCount, setReady } = useFiltersUI();

  // Sinaliza que há filtros disponíveis nesta rota (os botões de abrir no
  // título e no header só aparecem quando isto é verdadeiro).
  React.useEffect(() => {
    setReady(true);
    return () => setReady(false);
  }, [setReady]);
  
  const country = filters.country || ALL;
  const category = filters.category || ALL;
  const closed = Boolean(filters.closed);
  const nsfw = Boolean(filters.nsfw);

  const appliedQ = filters.q ?? "";
  const [q, setQ] = React.useState(appliedQ);

  // Navega para a URL que representa um conjunto de filtros. Centraliza a
  // serialização (inclusive o sentinela `all` para "Todos os países").
  const apply = React.useCallback(
    (next: {
      q: string;
      country: string;
      category: string;
      closed: boolean;
      nsfw: boolean;
    }) => {
      const f: Filters = {
        q: next.q.trim() || undefined,
        country: next.country === ALL ? undefined : next.country,
        category: next.category === ALL ? undefined : next.category,
        closed: next.closed || undefined,
        nsfw: next.nsfw || undefined,
      };
      const extra = next.country === ALL ? { country: ALL_COUNTRIES } : undefined;
      const qs = filtersToQuery(f, extra);
      router.push(qs ? `/?${qs}` : "/");
    },
    [router],
  );

  const state = { q, country, category, closed, nsfw };

  // Busca com debounce: evita navegar a cada tecla. O Enter aplica na hora.
  const debounce = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearch = (value: string) => {
    setQ(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => apply({ ...state, q: value }), 400);
  };
  const flushSearch = () => {
    if (debounce.current) clearTimeout(debounce.current);
    apply(state);
  };

  const onCountry = (v: string | null) =>
    apply({ ...state, country: v ?? ALL });
  const onCategory = (v: string | null) =>
    apply({ ...state, category: v ?? ALL });
  const onClosed = (v: boolean) => apply({ ...state, closed: v });
  const onNsfw = (v: boolean) => apply({ ...state, nsfw: v });

  const clear = () => {
    if (debounce.current) clearTimeout(debounce.current);
    setQ("");
    // Zera todos os filtros. País vai para "Todos" (sentinela `all`) em vez de
    // voltar ao padrão BR — "limpar" deve remover o filtro de país também.
    apply({ q: "", country: ALL, category: ALL, closed: false, nsfw: false });
  };

  const current: Filters = {
    q: q.trim() || undefined,
    country: country === ALL ? undefined : country,
    category: category === ALL ? undefined : category,
    closed: closed || undefined,
    nsfw: nsfw || undefined,
  };

  const activeCount =
    (current.q ? 1 : 0) +
    (current.country ? 1 : 0) +
    (current.category ? 1 : 0) +
    (current.closed ? 1 : 0) +
    (current.nsfw ? 1 : 0);

  // Publica a contagem para os botões de abrir (título e cabeçalho).
  React.useEffect(() => {
    setActiveCount(activeCount);
  }, [activeCount, setActiveCount]);

  // Opções dos comboboxes (a primeira é o "limpar filtro" = sentinela ALL).
  const countryOptions: ComboOption[] = [
    { value: ALL, label: "Todos os países" },
    ...countries.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` })),
  ];
  const categoryOptions: ComboOption[] = [
    { value: ALL, label: "Todas as categorias" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  // Chips removíveis dos filtros ativos (exibidos fora do sheet).
  const chips: { key: string; label: string; remove: () => void }[] = [];
  if (current.q)
    chips.push({
      key: "q",
      label: `"${current.q}"`,
      remove: () => {
        setQ("");
        apply({ ...state, q: "" });
      },
    });
  if (current.country) {
    const label = countryOptions.find((o) => o.value === country)?.label;
    chips.push({
      key: "country",
      label: label ?? country,
      remove: () => onCountry(ALL),
    });
  }
  if (current.category) {
    const label = categoryOptions.find((o) => o.value === category)?.label;
    chips.push({
      key: "category",
      label: label ?? category,
      remove: () => onCategory(ALL),
    });
  }
  if (current.closed)
    chips.push({ key: "closed", label: "Encerrados", remove: () => onClosed(false) });
  if (current.nsfw)
    chips.push({ key: "nsfw", label: "NSFW", remove: () => onNsfw(false) });

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" aria-hidden />
              Filtros
            </SheetTitle>
          </SheetHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              flushSearch();
            }}
            className="flex flex-1 flex-col gap-5 overflow-y-auto p-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="q" className="text-muted-foreground text-xs">
                Buscar
              </Label>
              <div className="relative">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                  id="q"
                  value={q}
                  onChange={(e) => onSearch(e.currentTarget.value)}
                  placeholder="nome, apelido ou rede"
                  className="h-9 w-full px-8"
                />
                {q && (
                  <button
                    type="button"
                    aria-label="Limpar busca"
                    onClick={() => {
                      setQ("");
                      apply({ ...state, q: "" });
                    }}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded-md transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground text-xs">País</Label>
              <FilterCombobox
                options={countryOptions}
                value={country}
                onChange={(v) => onCountry(v || ALL)}
                ariaLabel="Filtrar por país"
                searchPlaceholder="Buscar país…"
                emptyText="Nenhum país encontrado."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground text-xs">Categoria</Label>
              <FilterCombobox
                options={categoryOptions}
                value={category}
                onChange={(v) => onCategory(v || ALL)}
                ariaLabel="Filtrar por categoria"
                searchPlaceholder="Buscar categoria…"
                emptyText="Nenhuma categoria encontrada."
              />
            </div>

            <div className="border-border/60 flex flex-col gap-3 border-t pt-4">
              <Label className="group/field-label text-sm font-normal">
                <Checkbox checked={closed} onCheckedChange={onClosed} />
                Incluir encerrados
              </Label>
              <Label className="group/field-label text-sm font-normal">
                <Checkbox checked={nsfw} onCheckedChange={onNsfw} />
                Incluir NSFW
              </Label>
            </div>
          </form>

          <SheetFooter className="flex-row gap-2 border-t">
            {activeCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={clear}
                className="flex-1"
              >
                <X />
                Limpar
              </Button>
            )}
            <SheetClose
              render={<Button className="flex-1">Ver resultados</Button>}
            />
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Chips dos filtros ativos, visíveis fora do sheet. */}
      {activeCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="bg-muted/60 ring-foreground/10 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 backdrop-blur-md"
            >
              {chip.label}
              <button
                type="button"
                aria-label={`Remover filtro ${chip.label}`}
                onClick={chip.remove}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            Limpar tudo
          </Button>
        </div>
      )}
    </>
  );
}
