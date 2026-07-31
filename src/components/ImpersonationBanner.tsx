"use client";
import { useRouter } from "next/navigation";
import { UserX } from "lucide-react";

export function ImpersonationBanner({ nome }: { nome: string }) {
  const router = useRouter();

  async function voltar() {
    await fetch("/api/admin/impersonate", { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <div
      className="flex items-center justify-between px-4 py-2 text-xs font-medium"
      style={{ background: "#7c3aed", color: "white", zIndex: 9999 }}
    >
      <span className="flex items-center gap-2">
        <UserX size={13} />
        Modo admin: acessando como <strong className="ml-0.5">{nome}</strong>
      </span>
      <button
        onClick={voltar}
        className="px-3 py-1 rounded text-xs font-semibold transition-opacity hover:opacity-80"
        style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}
      >
        Sair e voltar ao admin →
      </button>
    </div>
  );
}
