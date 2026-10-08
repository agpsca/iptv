"use client";

import * as React from "react";
import { Rat } from "lucide-react";

const SESSION_KEY = "ratv-intro-seen";

export function IntroSplash() {
  // Inicia oculto (igual ao SSR, evitando mismatch de hidratação). Após montar,
  // mostra o splash só se ainda não foi exibido nesta sessão.
  const [show, setShow] = React.useState(false);
  const decided = React.useRef(false);

  React.useEffect(() => {
    // Guard de idempotência: no Strict Mode (dev) o effect roda 2x; só
    // decidimos uma vez para não desincronizar sessionStorage e estado.
    if (decided.current) return;
    decided.current = true;

    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      seen = false;
    }
    if (!seen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(true);
    }
  }, []);

  // Agenda o fim do splash quando ele é exibido (robusto a re-renders).
  React.useEffect(() => {
    if (!show) return;
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const t = setTimeout(() => setShow(false), reduce ? 1300 : 5100);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;

  return (
    <div
      className="crt-intro bg-background fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      aria-hidden
    >
      {/* Tela com fade suave. */}
      <div className="crt-intro__screen from-background via-muted/20 to-background absolute inset-0 bg-gradient-to-b" />
      {/* Brilho muito sutil ao surgir. */}
      <div className="crt-intro__flash pointer-events-none absolute inset-0 bg-white" />
      {/* Scanlines sutis. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, #fff 0 1px, transparent 1px 3px)",
        }}
      />
      {/* Logo. */}
      <div className="crt-intro__logo relative flex flex-col items-center gap-3">
        <span className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-2xl shadow-lg sm:size-20">
          <Rat className="size-9 sm:size-11" aria-hidden />
        </span>
        <span className="text-3xl font-semibold tracking-tight sm:text-4xl">
          RATV
        </span>
      </div>
    </div>
  );
}
