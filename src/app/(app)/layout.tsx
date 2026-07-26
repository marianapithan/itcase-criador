import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      {/* Sidebar — apenas desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto bg-white mobile-main-pb md:pb-0">
        {children}
      </main>
      {/* Bottom nav — apenas mobile */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
