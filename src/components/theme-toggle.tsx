"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Alterna entre tema claro e escuro. A classe `dark` no <html> é a fonte da
 * verdade (definida antes do paint pelo script no layout). Os ícones seguem
 * essa classe via `dark:`, então o botão não precisa de estado React.
 */
export function ThemeToggle() {
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // ignora (modo privado / storage indisponível)
    }
    window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Alternar tema claro/escuro"
      onClick={toggle}
    >
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
    </Button>
  );
}
