"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  if (compact) {
    return (
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        title={isDark ? "Modo claro" : "Modo escuro"}
        className="p-2 rounded-lg transition-colors"
        style={{ color: "var(--muted)" }}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
      style={{ color: "#6a9a78" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#163025"; (e.currentTarget as HTMLElement).style.color = "#e4f0de"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "#6a9a78"; }}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
      {isDark ? "Modo claro" : "Modo escuro"}
    </button>
  );
}
