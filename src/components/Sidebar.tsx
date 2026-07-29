"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Lightbulb,
  BookOpen,
  CalendarDays,
  Library,
  Settings,
  Sparkles,
  Radar,
  LogOut,
  User,
  FileBarChart,
  Megaphone,
  ShieldAlert,
} from "lucide-react";
import { CONFIG } from "@/lib/config";

const nav = [
  { href: "/dashboard",   label: "Dashboard",          icon: LayoutDashboard },
  { href: "/temas",       label: "Temas & Microtemas",  icon: Lightbulb },
  { href: "/roteiros",    label: "Roteiros",            icon: BookOpen },
  { href: "/calendario",  label: "Calendário",          icon: CalendarDays },
  { href: "/biblioteca",  label: "Biblioteca",          icon: Library },
  { href: "/tendencias",  label: "Radar IA",            icon: Radar },
  { href: "/trafego",     label: "Tráfego Pago",        icon: Megaphone },
  { href: "/objecoes",    label: "Mapa de Objeções",    icon: ShieldAlert },
  { href: "/persona",     label: "Estudo de Público",   icon: User },
  { href: "/relatorio",   label: "Relatório PDF",       icon: FileBarChart },
];

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : "";
}

export function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [nomeUsuario, setNomeUsuario] = useState("");

  useEffect(() => {
    setNomeUsuario(getCookie("itcase_user"));
  }, []);

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col h-full" style={{ background: "var(--sidebar-bg)", borderRight: "1px solid #1e4535" }}>
      {/* Logo */}
      <div className="px-4 py-5" style={{ borderBottom: "1px solid #1e4535", background: "linear-gradient(135deg, rgba(139,116,200,0.10) 0%, transparent 70%)" }}>
        <div className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: "#c8d92a" }} />
          <div>
            <div className="font-bold text-sm leading-tight gradient-text-brand" style={{ fontFamily: "var(--font-syne, inherit)" }}>{CONFIG.nome}</div>
            <div className="text-[11px] leading-tight" style={{ color: "#9b8fd4" }}>{CONFIG.tagline}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== "/dashboard" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
              style={active
                ? { background: "#c8d92a", color: "#0d2b1e", fontWeight: 600 }
                : { color: "#6a9a78" }
              }
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "#163025"; (e.currentTarget as HTMLElement).style.color = "#e4f0de"; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "#6a9a78"; } }}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 space-y-0.5" style={{ borderTop: "1px solid #1e4535" }}>
        <Link
          href="/configuracoes"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
          style={path.startsWith("/configuracoes")
            ? { background: "#c8d92a", color: "#0d2b1e", fontWeight: 600 }
            : { color: "#6a9a78" }
          }
        >
          <Settings size={15} />
          Configurações
        </Link>

        {nomeUsuario && (
          <div className="flex items-center justify-between px-3 py-2 rounded-md text-sm" style={{ color: "#4a7055" }}>
            <span className="text-xs font-medium truncate">{nomeUsuario}</span>
            <button
              onClick={sair}
              title="Sair"
              className="transition-colors ml-2 shrink-0 hover:text-[#f06080]"
              style={{ color: "#4a7055" }}
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
