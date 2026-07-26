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
} from "lucide-react";
import { CONFIG } from "@/lib/config";

const nav = [
  { href: "/dashboard",   label: "Dashboard",          icon: LayoutDashboard },
  { href: "/temas",       label: "Temas & Microtemas",  icon: Lightbulb },
  { href: "/roteiros",    label: "Roteiros",            icon: BookOpen },
  { href: "/calendario",  label: "Calendário",          icon: CalendarDays },
  { href: "/biblioteca",  label: "Biblioteca",          icon: Library },
  { href: "/tendencias",  label: "Radar IA",            icon: Radar },
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
    <aside className="w-56 shrink-0 flex flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[var(--sidebar-border)]">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-gray-800" />
          <div>
            <div className="font-semibold text-gray-900 text-sm leading-tight">{CONFIG.nome}</div>
            <div className="text-[11px] text-gray-500 leading-tight">{CONFIG.tagline}</div>
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
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-[var(--sidebar-border)] space-y-0.5">
        <Link
          href="/configuracoes"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
            path.startsWith("/configuracoes")
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <Settings size={15} />
          Configurações
        </Link>

        {/* Usuário logado + logout */}
        {nomeUsuario && (
          <div className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-500">
            <span className="text-xs font-medium truncate">{nomeUsuario}</span>
            <button
              onClick={sair}
              title="Sair"
              className="text-gray-400 hover:text-red-500 transition-colors ml-2 shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
