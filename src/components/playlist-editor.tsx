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
import { Download, GripVertical, Loader2, Trash2 } from "lucide-react";
import { buildM3U, type PlaylistItem } from "@/lib/m3u-core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  onRename,
  onRemove,
}: {
  item: EditorItem;
  onRename: (title: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item._id, data: { type: "item" } });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group/row bg-card/40 flex items-center gap-1.5 px-1.5 py-1.5 sm:gap-2 sm:px-2",
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
      <div className="min-w-0 flex-1">
        <Input
          aria-label="Título do canal"
          value={item.title}
          onChange={(e) => onRename(e.currentTarget.value)}
          className="h-8 border-transparent bg-transparent shadow-none hover:bg-background/50 focus-visible:bg-background dark:bg-transparent dark:hover:bg-input/30"
        />
        <p className="text-muted-foreground mt-0.5 truncate pl-2.5 text-xs">
          {item.url}
        </p>
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
  onRename,
  onRemove,
  children,
}: {
  group: Group;
  onRename: (name: string) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: GROUP_PREFIX + group.id, data: { type: "group" } });

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "bg-card/60 border-border/60 overflow-hidden rounded-xl border transition-colors",
        isDragging && "opacity-50",
      )}
    >
      <header className="bg-muted/30 flex items-center gap-1.5 px-1.5 py-1.5 sm:px-2">
        <button
          type="button"
          aria-label="Arrastar grupo"
          className="text-muted-foreground/50 hover:text-foreground flex size-7 shrink-0 touch-none items-center justify-center rounded-md transition-colors active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <Input
          aria-label="Nome do grupo"
          value={group.name}
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
      <ul className="divide-border/60 min-h-10 divide-y">{children}</ul>
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const renameGroup = (gi: number, name: string) =>
    setGroups((gs) => gs.map((g, i) => (i === gi ? { ...g, name } : g)));
  const removeGroup = (gi: number) =>
    setGroups((gs) => gs.filter((_, i) => i !== gi));
  const removeItem = (gi: number, id: string) =>
    setGroups((gs) =>
      gs.map((g, i) =>
        i === gi ? { ...g, items: g.items.filter((x) => x._id !== id) } : g,
      ),
    );
  const renameItem = (gi: number, id: string, title: string) =>
    setGroups((gs) =>
      gs.map((g, i) =>
        i === gi
          ? {
              ...g,
              items: g.items.map((x) => (x._id === id ? { ...x, title } : x)),
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

    // Reordenar item dentro do mesmo grupo (entre-grupos já tratado no over).
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
    a.download = filename.endsWith(".m3u") ? filename : `${filename}.m3u`;
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

  // Ao arrastar um GRUPO, só considera outros grupos como alvo (senão os itens
  // "dominam" a detecção e o over fica inválido). Itens usam closestCenter.
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
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden pr-1">
        {groups.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            Nenhum item para editar.
          </p>
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
                    onRename={(name) => renameGroup(gi, name)}
                    onRemove={() => removeGroup(gi)}
                  >
                    <SortableContext
                      items={g.items.map((it) => it._id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {g.items.length === 0 ? (
                        <li className="text-muted-foreground/60 px-3 py-3 text-center text-xs">
                          Arraste canais para cá
                        </li>
                      ) : (
                        g.items.map((it) => (
                          <SortableItem
                            key={it._id}
                            item={it}
                            onRename={(title) => renameItem(gi, it._id, title)}
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
                <div className="bg-popover ring-primary/40 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm shadow-lg ring-1">
                  <GripVertical className="text-muted-foreground size-4" />
                  <span className="truncate font-medium">{activeItem.title}</span>
                </div>
              ) : activeGroup ? (
                <div className="bg-popover ring-primary/40 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium shadow-lg ring-1">
                  <GripVertical className="text-muted-foreground size-4" />
                  {activeGroup.name}
                  <Badge variant="secondary">{activeGroup.items.length}</Badge>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <div className="border-border/60 mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs">
          {groups.length.toLocaleString("pt-BR")} grupo(s) ·{" "}
          {totalItems.toLocaleString("pt-BR")} canal(is)
        </p>
        <Button
          type="button"
          onClick={download}
          disabled={totalItems === 0}
          className="w-full sm:w-auto"
        >
          <Download />
          Baixar .m3u
        </Button>
      </div>
    </>
  );
}
