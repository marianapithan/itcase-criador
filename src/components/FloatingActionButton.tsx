"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

export function FloatingActionButton() {
  const path = usePathname();
  // Ocultar nas páginas que já têm botão de criação proeminente
  if (path.startsWith("/roteiros") || path.startsWith("/calendario")) return null;

  return (
    <Link
      href="/roteiros?novo=1"
      className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-700 active:scale-95 transition-all"
      aria-label="Novo conteúdo"
    >
      <Plus size={24} />
    </Link>
  );
}
