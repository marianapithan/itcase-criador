"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Lightbulb, BookOpen,
  CalendarDays, Library, Radar, MoreHorizontal,
  Settings, Sparkles, LogOut, User,
} from "lucide-react";
import { useState } from "react";
import { CONFIG } from "@/lib/config";

const mainNav = [
  { href: "/dashboard",  label: "Início",     icon: LayoutDashboard },
  { href: "/roteiros",   label: "Roteiros",   icon: BookOpen },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/biblioteca", label: "Biblioteca", icon: Library },
  { href: "/tendencias", label: "Radar IA",   icon: Radar },
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
          <div className="absolute bottom-16 left-0 right-0 bg-white border-t border-gray-100 shadow-2xl rounded-t-2xl p-4"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-2 py-3 border-b border-gray-100 mb-2">
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{CONFIG.nome}</div>
                <div className="text-xs text-gray-400">{getCookie("itcase_user")}</div>
              </div>
            </div>
            <Link href="/temas" onClick={() => setMenuAberto(false)}
              className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-gray-50 transition-colors">
              <Lightbulb size={18} className="text-gray-500" />
              <span className="text-sm text-gray-700">Temas & Microtemas</span>
            </Link>
            <Link href="/persona" onClick={() => setMenuAberto(false)}
              className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-gray-50 transition-colors">
              <User size={18} className="text-purple-500" />
              <span className="text-sm text-gray-700">Estudo de Persona</span>
            </Link>
            <Link href="/configuracoes" onClick={() => setMenuAberto(false)}
              className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-gray-50 transition-colors">
              <Settings size={18} className="text-gray-500" />
              <span className="text-sm text-gray-700">Configurações</span>
            </Link>
            <button onClick={sair}
              className="w-full flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-red-50 transition-colors text-left">
              <LogOut size={18} className="text-red-400" />
              <span className="text-sm text-red-500">Sair</span>
            </button>
          </div>
        </div>
      )}

      {/* Barra inferior */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 flex items-center justify-around px-1 h-16 safe-area-pb">
        {mainNav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== "/dashboard" && path.startsWith(href));
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors">
              <Icon size={20} className={active ? "text-gray-900" : "text-gray-400"} />
              <span className={`text-[10px] font-medium ${active ? "text-gray-900" : "text-gray-400"}`}>
                {label}
              </span>
              {active && <div className="w-1 h-1 rounded-full bg-gray-900 mt-0.5" />}
            </Link>
          );
        })}
        <button onClick={() => setMenuAberto((v) => !v)}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2">
          <MoreHorizontal size={20} className={menuAberto ? "text-gray-900" : "text-gray-400"} />
          <span className={`text-[10px] font-medium ${menuAberto ? "text-gray-900" : "text-gray-400"}`}>Mais</span>
        </button>
      </nav>
    </>
  );
}
