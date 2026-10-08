"use client";

import * as React from "react";

type FiltersUI = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Nº de filtros ativos, para o badge dos botões de abrir. */
  activeCount: number;
  setActiveCount: (n: number) => void;
  /** Verdadeiro quando há um FilterBar montado (ex.: só na home). */
  ready: boolean;
  setReady: (v: boolean) => void;
  /** Estado do dialog de editar/baixar playlist (compartilhado com o header). */
  playlistOpen: boolean;
  setPlaylistOpen: (open: boolean) => void;
};

const Ctx = React.createContext<FiltersUI | null>(null);

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [activeCount, setActiveCount] = React.useState(0);
  const [ready, setReady] = React.useState(false);
  const [playlistOpen, setPlaylistOpen] = React.useState(false);
  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      activeCount,
      setActiveCount,
      ready,
      setReady,
      playlistOpen,
      setPlaylistOpen,
    }),
    [open, activeCount, ready, playlistOpen],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFiltersUI() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useFiltersUI deve ser usado dentro de FiltersProvider");
  return ctx;
}
