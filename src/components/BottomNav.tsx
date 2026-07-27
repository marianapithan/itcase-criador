"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Lightbulb, BookOpen,
  CalendarDays, Library, Radar, MoreHorizontal,
  Settings, Sparkles, LogOut, User, FileBarChart, Megaphone, ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { CONFIG } from "@/lib/config";
import { ThemeToggle } from "./ThemeToggle";

const mainNav = [
  { href: "/dashboard",  label: "Início",     icon: LayoutDashboard },
  { href: "/roteiros",   label: "Roteiros",   icon: BookOpen },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/trafego",    label: "Tráfego",    icon: Megaphone },
  { href: "/objecoes",   label: "Objeções",   icon: ShieldAlert },
];

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : "";
}

export function BottomNav() {
  const path = usePathname();
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Menu "Mais" aberto */}
      {menuAberto && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuAberto(false)}>
          <div
            className="absolute bottom-16 left-0 right-0 shadow-2xl rounded-t-2xl p-4"
            style={{ background: "var(--card-bg)", borderTop: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-2 py-3 mb-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#c8d92a" }}>
                <Sparkles size={14} style={{ color: "#0d2b1e" }} />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{CONFIG.nome}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{getCookie("itcase_user")}</div>
              </div>
            </div>

            {[
              { href: "/temas",     label: "Temas & Microtemas",  icon: Lightbulb,    color: "var(--foreground)" },
              { href: "/biblioteca",label: "Biblioteca",           icon: Library,      color: "var(--foreground)" },
              { href: "/tendencias",label: "Radar IA",             icon: Radar,        color: "#9b8fd4" },
              { href: "/persona",   label: "Estudo de Persona",    icon: User,         color: "#9b8fd4" },
              { href: "/relatorio", label: "Relatório PDF",        icon: FileBarChart, color: "#9b8fd4" },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link key={href} href={href} onClick={() => setMenuAberto(false)}
                className="flex items-center gap-3 px-2 py-3 rounded-xl transition-colors"
                style={{ color: "var(--foreground)" }}
              >
                <Icon size={18} style={{ color }} />
                <span className="text-sm">{label}</span>
              </Link>
            ))}

            <div className="flex items-center justify-between px-2 py-3">
              <span className="text-sm" style={{ color: "var(--foreground)" }}>Aparência</span>
              <ThemeToggle compact />
            </div>

            <Link href="/configuracoes" onClick={() => setMenuAberto(false)}
              className="flex items-center gap-3 px-2 py-3 rounded-xl transition-colors"
              style={{ color: "var(--foreground)" }}
            >
              <Settings size={18} style={{ color: "var(--muted)" }} />
              <span className="text-sm">Configurações</span>
            </Link>

            <button onClick={sair}
              className="w-full flex items-center gap-3 px-2 py-3 rounded-xl transition-colors text-left"
              style={{ color: "#f06080" }}
            >
              <LogOut size={18} style={{ color: "#f06080" }} />
              <span className="text-sm">Sair</span>
            </button>
          </div>
        </div>
      )}

      {/* Barra inferior */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-1 h-16 safe-area-pb"
        style={{ background: "var(--card-bg)", borderTop: "1px solid var(--border)" }}
      >
        {mainNav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== "/dashboard" && path.startsWith(href));
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors">
              <Icon size={20} style={{ color: active ? "#c8d92a" : "var(--muted)" }} />
              <span className="text-[10px] font-medium" style={{ color: active ? "#c8d92a" : "var(--muted)" }}>
                {label}
              </span>
              {active && <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: "#c8d92a" }} />}
            </Link>
          );
        })}
        <button onClick={() => setMenuAberto((v) => !v)}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2">
          <MoreHorizontal size={20} style={{ color: menuAberto ? "#c8d92a" : "var(--muted)" }} />
          <span className="text-[10px] font-medium" style={{ color: menuAberto ? "#c8d92a" : "var(--muted)" }}>Mais</span>
        </button>
      </nav>
    </>
  );
}
