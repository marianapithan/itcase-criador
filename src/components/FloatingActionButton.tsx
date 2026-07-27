"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

export function FloatingActionButton() {
  const path = usePathname();
  if (path.startsWith("/roteiros") || path.startsWith("/calendario")) return null;

  return (
    <Link
      href="/roteiros?novo=1"
      className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-all"
      style={{
        background: "#c8d92a",
        color: "#0d2b1e",
        boxShadow: "0 0 24px rgba(200,217,42,0.45), 0 4px 12px rgba(0,0,0,0.3)",
      }}
      aria-label="Novo conteúdo"
    >
      <Plus size={24} strokeWidth={2.5} />
    </Link>
  );
}
