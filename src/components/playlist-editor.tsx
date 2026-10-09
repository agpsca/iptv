"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight,
  Download,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  buildM3U,
  isPlayableUrl,
  playlistFilename,
  type PlaylistItem,
} from "@/lib/m3u-core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

type EditorItem = PlaylistItem & { _id: string };
type Group = { id: string; name: string; items: EditorItem[] };
type Status = "loading" | "ready" | "error";

let idSeq = 0;
const nextId = () => `i${idSeq++}`;
const GROUP_PREFIX = "group:";

function toGroups(items: PlaylistItem[]): Group[] {
  const order: string[] = [];
  const map = new Map<string, EditorItem[]>();
  for (const it of items) {
    const name = it.group?.trim() || "Sem grupo";
    if (!map.has(name)) {
      map.set(name, []);
      order.push(name);
    }
    map.get(name)!.push({ ...it, _id: nextId() });
  }
  return order.map((name, i) => ({
    id: `g${i}-${nextId()}`,
    name,
    items: map.get(name)!,
  }));
}

function flatten(groups: Group[]): PlaylistItem[] {
  const out: PlaylistItem[] = [];
  for (const g of groups) {
    for (const it of g.items) {
      const { _id, ...rest } = it;
      void _id;
      out.push({ ...rest, group: g.name });
    }
  }
  return out;
}

/** Localiza o índice do grupo que contém um item (ou um grupo pelo seu id). */
function findGroupIndexByItem(groups: Group[], itemId: string): number {
  return groups.findIndex((g) => g.items.some((it) => it._id === itemId));
}

function SortableItem({
  item,
  onPatch,
  onRemove,
}: {
  item: EditorItem;
  onPatch: (patch: Partial<PlaylistItem>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item._id, data: { type: "item" } });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group/row bg-card/40 flex items-center gap-2.5 px-3 py-2",
        isDragging && "opacity-40",
      )}
    >
      <button
        type="button"
        aria-label="Arrastar canal"
        className="text-muted-foreground/40 hover:text-foreground flex size-7 shrink-0 touch-none items-center justify-center rounded-md transition-colors active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1 space-y-0.5">
        <Input
          aria-label="Título do canal"
          value={item.title}
          placeholder="Nome do canal"
          onChange={(e) => onPatch({ title: e.currentTarget.value })}
          className="h-8 border-transparent bg-transparent shadow-none hover:bg-background/50 focus-visible:bg-background dark:bg-transparent dark:hover:bg-input/30"
        />
        <Input
          aria-label="URL do stream"
          value={item.url}
          placeholder="https://… (sem URL o canal não entra no arquivo)"
          // Vazio só mostra o placeholder; o vermelho fica para URL inválida.
          aria-invalid={
            item.url.trim() !== "" && !isPlayableUrl(item.url) ? true : undefined
          }
          onChange={(e) => onPatch({ url: e.currentTarget.value })}
          className="text-muted-foreground h-7 border-transparent bg-transparent text-xs shadow-none hover:bg-background/50 focus-visible:bg-background md:text-xs dark:bg-transparent dark:hover:bg-input/30"
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Remover item"
        className="shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/row:opacity-100"
        onClick={onRemove}
      >
        <Trash2 className="text-destructive" />
      </Button>
    </li>
  );
}

function SortableGroup({
  group,
  open,
  onToggle,
  onRename,
  onRemove,
  onAddItem,
  children,
}: {
  group: Group;
  open: boolean;
  onToggle: () => void;
  onRename: (name: string) => void;
  onRemove: () => void;
  onAddItem: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: GROUP_PREFIX + group.id, data: { type: "group" } });
  const listId = React.useId();

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "bg-card/60 border-border/60 overflow-hidden rounded-xl border transition-colors",
        isDragging && "opacity-50",
      )}
    >
      <header className="bg-muted/30 flex items-center gap-2 px-2 py-2">
        <button
          type="button"
          aria-label="Arrastar grupo"
          className="text-muted-foreground/50 hover:text-foreground flex size-7 shrink-0 touch-none items-center justify-center rounded-md transition-colors active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={listId}
          aria-label={open ? "Recolher grupo" : "Expandir grupo"}
          className="text-muted-foreground hover:text-foreground hover:bg-background/50 flex size-7 shrink-0 items-center justify-center rounded-md transition-colors"
        >
          <ChevronRight
            className={cn("size-4 transition-transform", open && "rotate-90")}
          />
        </button>
        <Input
          aria-label="Nome do grupo"
          value={group.name}
          placeholder="Nome do grupo"
          onChange={(e) => onRename(e.currentTarget.value)}
          className="h-8 min-w-0 flex-1 border-transparent bg-transparent font-medium shadow-none hover:bg-background/50 focus-visible:bg-background dark:bg-transparent dark:hover:bg-input/30"
        />
        <Badge variant="secondary" className="shrink-0">
          {group.items.length}
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Remover grupo"
          className="shrink-0"
          onClick={onRemove}
        >
          <Trash2 className="text-destructive" />
        </Button>
      </header>
      {open && (
        <>
          <ul id={listId} className="divide-border/60 min-h-12 divide-y">
            {children}
          </ul>
          <div className="border-border/60 border-t px-3 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={onAddItem}
            >
              <Plus />
              Adicionar canal
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

export function PlaylistEditor({
  previewHref,
  filename,
  onClose,
}: {
  previewHref: string;
  filename: string;
  onClose?: () => void;
}) {
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [listName, setListName] = React.useState(filename);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [status, setStatus] = React.useState<Status>("loading");
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const fetchItems = React.useCallback(
    (setLoading: boolean) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      if (setLoading) setStatus("loading");
      fetch(previewHref, { signal: ac.signal })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json() as Promise<{ items: PlaylistItem[] }>;
        })
        .then((data) => {
          setGroups(toGroups(data.items));
          setStatus("ready");
        })
        .catch((e) => {
          if (e.name === "AbortError") return;
          setStatus("error");
        });
    },
    [previewHref],
  );

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems(false);
    return () => abortRef.current?.abort();
  }, [fetchItems]);

  const retry = () => fetchItems(true);
  const totalItems = groups.reduce((n, g) => n + g.items.length, 0);
  const exportable = groups.reduce(
    (n, g) => n + g.items.filter((it) => isPlayableUrl(it.url)).length,
    0,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const toggleGroup = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const openGroup = (id: string) =>
    setExpanded((s) => (s.has(id) ? s : new Set(s).add(id)));

  const renameGroup = (gi: number, name: string) =>
    setGroups((gs) => gs.map((g, i) => (i === gi ? { ...g, name } : g)));
  const removeGroup = (gi: number) =>
    setGroups((gs) => gs.filter((_, i) => i !== gi));
  const addGroup = () => {
    const id = `g${nextId()}`;
    setGroups((gs) => [...gs, { id, name: "", items: [] }]);
    openGroup(id); // grupo novo já aberto, senão não dá pra preencher
  };
  const addItem = (gi: number) =>
    setGroups((gs) =>
      gs.map((g, i) =>
        i === gi
          ? { ...g, items: [...g.items, { _id: nextId(), title: "", url: "" }] }
          : g,
      ),
    );
  const removeItem = (gi: number, id: string) =>
    setGroups((gs) =>
      gs.map((g, i) =>
        i === gi ? { ...g, items: g.items.filter((x) => x._id !== id) } : g,
      ),
    );
  const patchItem = (gi: number, id: string, patch: Partial<PlaylistItem>) =>
    setGroups((gs) =>
      gs.map((g, i) =>
        i === gi
          ? {
              ...g,
              items: g.items.map((x) => (x._id === id ? { ...x, ...patch } : x)),
            }
          : g,
      ),
    );

  const isGroupId = (id: string) => id.startsWith(GROUP_PREFIX);

  // Move item entre grupos durante o arraste (padrão "multiple containers").
  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (isGroupId(activeId)) return; // grupos tratados no end

    const toId = isGroupId(overId)
      ? overId.slice(GROUP_PREFIX.length)
      : groups.find((g) => g.items.some((x) => x._id === overId))?.id;
    if (toId) openGroup(toId);

    setGroups((gs) => {
      const fromGi = findGroupIndexByItem(gs, activeId);
      if (fromGi === -1) return gs;

      // Grupo de destino: se solto sobre um grupo (header) ou sobre um item.
      let toGi: number;
      let overItemIndex = -1;
      if (isGroupId(overId)) {
        toGi = gs.findIndex((g) => GROUP_PREFIX + g.id === overId);
      } else {
        toGi = findGroupIndexByItem(gs, overId);
        if (toGi !== -1) {
          overItemIndex = gs[toGi].items.findIndex((x) => x._id === overId);
        }
      }
      if (toGi === -1 || toGi === fromGi) return gs;

      const item = gs[fromGi].items.find((x) => x._id === activeId);
      if (!item) return gs;

      return gs.map((g, i) => {
        if (i === fromGi)
          return { ...g, items: g.items.filter((x) => x._id !== activeId) };
        if (i === toGi) {
          const insert = overItemIndex >= 0 ? overItemIndex : g.items.length;
          const items = g.items.slice();
          items.splice(insert, 0, item);
          return { ...g, items };
        }
        return g;
      });
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const aId = String(active.id);
    const oId = String(over.id);

    // Reordenar grupos. `over` pode ser o grupo ou um item dentro dele.
    if (isGroupId(aId)) {
      setGroups((gs) => {
        const from = gs.findIndex((g) => GROUP_PREFIX + g.id === aId);
        const to = isGroupId(oId)
          ? gs.findIndex((g) => GROUP_PREFIX + g.id === oId)
          : findGroupIndexByItem(gs, oId);
        if (from === -1 || to === -1 || from === to) return gs;
        return arrayMove(gs, from, to);
      });
      return;
    }

    if (!isGroupId(oId)) {
      setGroups((gs) => {
        const gi = findGroupIndexByItem(gs, aId);
        if (gi === -1) return gs;
        const from = gs[gi].items.findIndex((x) => x._id === aId);
        const to = gs[gi].items.findIndex((x) => x._id === oId);
        if (from === -1 || to === -1 || from === to) return gs;
        return gs.map((g, i) =>
          i === gi ? { ...g, items: arrayMove(g.items, from, to) } : g,
        );
      });
    }
  };

  const download = () => {
    const text = buildM3U(flatten(groups));
    const blob = new Blob([text], { type: "audio/x-mpegurl" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = playlistFilename(listName, filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onClose?.();
  };

  // Item/grupo ativo para o DragOverlay.
  const activeItem = React.useMemo(() => {
    if (!activeId || isGroupId(activeId)) return null;
    for (const g of groups) {
      const it = g.items.find((x) => x._id === activeId);
      if (it) return it;
    }
    return null;
  }, [activeId, groups]);
  const activeGroup = React.useMemo(() => {
    if (!activeId || !isGroupId(activeId)) return null;
    return groups.find((g) => GROUP_PREFIX + g.id === activeId) ?? null;
  }, [activeId, groups]);

  const collisionDetection = React.useCallback<CollisionDetection>(
    (args) => {
      if (activeId && isGroupId(activeId)) {
        const groupContainers = args.droppableContainers.filter(
          (c) =>
            String(c.id).startsWith(GROUP_PREFIX) &&
            String(c.id) !== activeId,
        );
        const within = pointerWithin({
          ...args,
          droppableContainers: groupContainers,
        });
        if (within.length) return within;
        return closestCenter({ ...args, droppableContainers: groupContainers });
      }
      return closestCenter(args);
    },
    [activeId],
  );

  if (status === "loading") {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Carregando itens…
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm">
        <p className="text-destructive">Não foi possível carregar os itens.</p>
        <Button variant="outline" size="sm" onClick={retry}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden pr-2">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-muted-foreground text-sm">
              Nenhum item para editar — monte a lista do zero.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={addGroup}>
              <Plus />
              Adicionar grupo
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <SortableContext
              items={groups.map((g) => GROUP_PREFIX + g.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {groups.map((g, gi) => (
                  <SortableGroup
                    key={g.id}
                    group={g}
                    open={expanded.has(g.id)}
                    onToggle={() => toggleGroup(g.id)}
                    onRename={(name) => renameGroup(gi, name)}
                    onRemove={() => removeGroup(gi)}
                    onAddItem={() => addItem(gi)}
                  >
                    <SortableContext
                      items={g.items.map((it) => it._id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {g.items.length === 0 ? (
                        <li className="text-muted-foreground/60 px-3 py-5 text-center text-xs">
                          Arraste canais para cá
                        </li>
                      ) : (
                        g.items.map((it) => (
                          <SortableItem
                            key={it._id}
                            item={it}
                            onPatch={(patch) => patchItem(gi, it._id, patch)}
                            onRemove={() => removeItem(gi, it._id)}
                          />
                        ))
                      )}
                    </SortableContext>
                  </SortableGroup>
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeItem ? (
                <div className="bg-popover ring-primary/40 flex items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-lg ring-1">
                  <GripVertical className="text-muted-foreground size-4" />
                  <span className="truncate font-medium">{activeItem.title}</span>
                </div>
              ) : activeGroup ? (
                <div className="bg-popover ring-primary/40 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium shadow-lg ring-1">
                  <GripVertical className="text-muted-foreground size-4" />
                  {activeGroup.name}
                  <Badge variant="secondary">{activeGroup.items.length}</Badge>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {groups.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={addGroup}>
            <Plus />
            Adicionar grupo
          </Button>
        )}
      </div>

      <div className="border-border/60 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:gap-4">
        <InputGroup className="sm:w-56">
          <InputGroupInput
            aria-label="Nome da lista"
            value={listName}
            placeholder={filename}
            onChange={(e) => setListName(e.currentTarget.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>.m3u</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <p className="text-muted-foreground text-xs sm:flex-1">
          {groups.length.toLocaleString("pt-BR")} grupo(s) ·{" "}
          {totalItems.toLocaleString("pt-BR")} canal(is)
          {totalItems > exportable && (
            <>
              {" · "}
              <span className="text-destructive">
                {(totalItems - exportable).toLocaleString("pt-BR")} sem URL
                válida
              </span>{" "}
              (ficam fora do arquivo)
            </>
          )}
        </p>
        <Button
          type="button"
          onClick={download}
          disabled={exportable === 0}
          className="w-full sm:w-auto"
        >
          <Download />
          Baixar .m3u
        </Button>
      </div>
    </>
  );
}
