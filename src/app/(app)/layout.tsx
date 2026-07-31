import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { AlertaHoje } from "@/components/AlertaHoje";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { PersonaBanner } from "@/components/PersonaBanner";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { garantirMigracoes } from "@/lib/db/migracoes";
import { getConfigGeral } from "@/lib/db/config-geral";
import { cookies } from "next/headers";
import { verificarSessao, COOKIE } from "@/lib/session";
import { prisma } from "@/lib/db/client";
import { OnboardingWrapper } from "@/components/OnboardingWrapper";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await garantirMigracoes();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  const sessao = token ? await verificarSessao(token) : null;
  const userId = sessao?.userId ?? "admin-default";
  const config = await getConfigGeral(userId);
  const nomeNegocio = config.nomeNegocio;

  // Verifica se o usuário precisa do onboarding (apenas contas criadas via cadastro)
  let precisaOnboarding = false;
  if (userId !== "admin-default" && !userId.startsWith("team-")) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { onboardingConcluido: true } }).catch(() => null);
    precisaOnboarding = user ? !user.onboardingConcluido : false;
  }

  const adminBackup = cookieStore.get("admin_impersonate_backup")?.value;

  return (
    <div className="flex flex-col h-full">
      {adminBackup && <ImpersonationBanner nome={sessao?.nome ?? "usuário"} />}
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <Sidebar nomeNegocio={nomeNegocio} />
        </div>
        <main className="flex-1 overflow-y-auto mobile-main-pb md:pb-0" style={{ background: "var(--background)" }}>
          {children}
        </main>
        <div className="md:hidden">
          <BottomNav nomeNegocio={nomeNegocio} />
        </div>
      </div>
      <AlertaHoje />
      <FloatingActionButton />
      <PersonaBanner />
      {precisaOnboarding && <OnboardingWrapper />}
    </div>
  );
}
