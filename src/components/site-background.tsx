"use client";

import * as React from "react";
import CRTWarp from "@/components/CRTWarp";

/**
 * Fundo animado do site (shader CRT), fixo cobrindo a viewport, atrás de tudo.
 * As cores acompanham o tema ativo (classe `dark` no <html>). No claro usamos
 * um fundo claro e a marca mais suave; no escuro, as cores originais.
 */
export function SiteBackground() {
  const [dark, setDark] = React.useState(true);

  React.useEffect(() => {
    const read = () =>
      setDark(document.documentElement.classList.contains("dark"));
    read();
    // Observa mudanças na classe do <html> (toggle de tema).
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    window.addEventListener("themechange", read);
    return () => {
      obs.disconnect();
      window.removeEventListener("themechange", read);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <CRTWarp
        color={dark ? "#923434" : "#d98c8c"}
        backgroundColor={dark ? "#08030d" : "#f7f1f1"}
        speed={0.3}
        curvature={0}
        scanlineStrength={0.53}
        scanlineFrequency={200}
        waveAmplitude={0.3}
        waveFrequency={4.2}
        bloom={dark ? 1.2 : 0.8}
        bloomRadius={0.6}
        noise={0.1}
        vignette={0}
        brightness={dark ? 1.25 : 1.1}
        pixelation={1}
        rgbShift={0.015}
        mouseReact={false}
        mouseStrength={0.5}
        dpr={1}
        fps={30}
        paused={false}
      />
    </div>
  );
}
