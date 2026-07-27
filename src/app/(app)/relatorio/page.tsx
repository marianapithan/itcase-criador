"use client";
import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, parseISO, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Printer, BarChart2 } from "lucide-react";
import { FORMATOS_CONFIG, STATUS_CONFIG } from "@/lib/constants";

type Conteudo = {
  id: string; titulo: string; formato: string; status: string;
  dataplanejada?: string; canal?: string; objetivo?: string; etapaFunil?: string;
  responsavel?: string; legenda?: string;
  metricaAlcance?: number | null; metricaImpressoes?: number | null;
  metricaCurtidas?: number | null; metricaComentarios?: number | null; metricaSalvamentos?: number | null;
};

function getCfg(fmt: string) {
  return FORMATOS_CONFIG[fmt] ?? { label: fmt, bg: "#F3F4F6", border: "#9CA3AF", text: "#374151", dot: "#9CA3AF" };
}

function temMetricas(c: Conteudo) {
  return c.metricaAlcance || c.metricaImpressoes || c.metricaCurtidas || c.metricaComentarios || c.metricaSalvamentos;
}

export default function RelatorioPage() {
  const [refDate, setRefDate] = useState(new Date());
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [carregando, setCarregando] = useState(true);

  const inicioMes = startOfMonth(refDate);
  const fimMes = endOfMonth(refDate);
  const mesLabel = format(refDate, "MMMM 'de' yyyy", { locale: ptBR });

  useEffect(() => {
    setCarregando(true);
    fetch("/api/conteudos?comData=true")
      .then((r) => r.json())
      .then((todos: Conteudo[]) => {
        const doMes = todos.filter((c) => {
          if (!c.dataplanejada) return false;
          const d = parseISO(c.dataplanejada);
          return d >= inicioMes && d <= fimMes;
        });
        setConteudos(doMes);
      })
      .finally(() => setCarregando(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refDate]);

  const publicados = conteudos.filter((c) => c.status === "PUBLICADO");
  const planejados = conteudos.length;

  const porFormato = Object.entries(
    conteudos.reduce<Record<string, number>>((acc, c) => {
      acc[c.formato] = (acc[c.formato] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const totalAlcance = publicados.reduce((s, c) => s + (c.metricaAlcance ?? 0), 0);
  const totalImpressoes = publicados.reduce((s, c) => s + (c.metricaImpressoes ?? 0), 0);
  const totalCurtidas = publicados.reduce((s, c) => s + (c.metricaCurtidas ?? 0), 0);
  const totalComentarios = publicados.reduce((s, c) => s + (c.metricaComentarios ?? 0), 0);
  const totalSalvamentos = publicados.reduce((s, c) => s + (c.metricaSalvamentos ?? 0), 0);
  const engajamento = totalCurtidas + totalComentarios + totalSalvamentos;
  const taxaEngajamento = totalAlcance > 0 ? ((engajamento / totalAlcance) * 100).toFixed(1) : "—";

  const comMetricas = publicados.filter(temMetricas);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header — no-print */}
      <div className="no-print flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => setRefDate((d) => subMonths(d, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronLeft size={15} /></button>
          <span className="text-sm font-semibold text-gray-900 capitalize min-w-[160px] text-center">{mesLabel}</span>
          <button onClick={() => setRefDate((d) => addMonths(d, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronRight size={15} /></button>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          <Printer size={14} /> Exportar PDF
        </button>
      </div>

      {/* Conteúdo imprimível */}
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full" id="relatorio-conteudo">

        {/* Cabeçalho do relatório */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={20} className="text-gray-400" />
            <h1 className="text-lg font-bold text-gray-900">Relatório Editorial</h1>
          </div>
          <div className="text-sm text-gray-500 capitalize">{mesLabel}</div>
        </div>

        {carregando ? (
          <div className="text-sm text-gray-400">Carregando...</div>
        ) : (
          <>
            {/* KPIs principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Planejados", value: planejados },
                { label: "Publicados", value: publicados.length },
                { label: "Taxa de publicação", value: planejados > 0 ? `${Math.round((publicados.length / planejados) * 100)}%` : "—" },
                { label: "Engajamento total", value: engajamento > 0 ? engajamento.toLocaleString("pt-BR") : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">{label}</div>
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                </div>
              ))}
            </div>

            {/* Métricas de alcance */}
            {totalAlcance > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Alcance e Engajamento</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: "Alcance total", value: totalAlcance },
                    { label: "Impressões", value: totalImpressoes },
                    { label: "Curtidas", value: totalCurtidas },
                    { label: "Comentários", value: totalComentarios },
                    { label: "Salvamentos", value: totalSalvamentos },
                    { label: "Taxa de engajamento", value: `${taxaEngajamento}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-xl p-3 border border-gray-200">
                      <div className="text-[11px] text-gray-400 mb-1">{label}</div>
                      <div className="text-xl font-bold text-gray-800">{typeof value === "number" ? value.toLocaleString("pt-BR") : value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Distribuição por formato */}
            {porFormato.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Distribuição por Formato</h2>
                <div className="space-y-2">
                  {porFormato.map(([fmt, qtd]) => {
                    const cfg = getCfg(fmt);
                    const pct = planejados > 0 ? Math.round((qtd / planejados) * 100) : 0;
                    return (
                      <div key={fmt} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
                        <span className="text-xs text-gray-700 w-28 shrink-0">{cfg.label}</span>
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cfg.dot }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{qtd}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lista de conteúdos publicados com métricas */}
            {comMetricas.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Desempenho por Conteúdo</h2>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">Conteúdo</th>
                        <th className="text-right px-2 py-2 text-gray-500 font-medium">Alcance</th>
                        <th className="text-right px-2 py-2 text-gray-500 font-medium hidden md:table-cell">Impr.</th>
                        <th className="text-right px-2 py-2 text-gray-500 font-medium">❤️</th>
                        <th className="text-right px-2 py-2 text-gray-500 font-medium hidden md:table-cell">💬</th>
                        <th className="text-right px-2 py-2 text-gray-500 font-medium hidden md:table-cell">🔖</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comMetricas.map((c) => {
                        const cfg = getCfg(c.formato);
                        return (
                          <tr key={c.id} className="border-b border-gray-100 last:border-0">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
                                <span className="font-medium text-gray-800 truncate max-w-[140px]">{c.titulo}</span>
                              </div>
                              <div className="text-gray-400 text-[10px] ml-3">{cfg.label}</div>
                            </td>
                            <td className="px-2 py-2 text-right text-gray-700">{c.metricaAlcance?.toLocaleString("pt-BR") ?? "—"}</td>
                            <td className="px-2 py-2 text-right text-gray-700 hidden md:table-cell">{c.metricaImpressoes?.toLocaleString("pt-BR") ?? "—"}</td>
                            <td className="px-2 py-2 text-right text-gray-700">{c.metricaCurtidas?.toLocaleString("pt-BR") ?? "—"}</td>
                            <td className="px-2 py-2 text-right text-gray-700 hidden md:table-cell">{c.metricaComentarios?.toLocaleString("pt-BR") ?? "—"}</td>
                            <td className="px-2 py-2 text-right text-gray-700 hidden md:table-cell">{c.metricaSalvamentos?.toLocaleString("pt-BR") ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Lista completa */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Todos os Conteúdos do Mês</h2>
              {conteudos.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-8">Nenhum conteúdo planejado neste mês</div>
              ) : (
                <div className="space-y-1.5">
                  {conteudos
                    .sort((a, b) => (a.dataplanejada ?? "").localeCompare(b.dataplanejada ?? ""))
                    .map((c) => {
                      const cfg = getCfg(c.formato);
                      const stCfg = STATUS_CONFIG[c.status];
                      const dp = c.dataplanejada ? parseISO(c.dataplanejada) : null;
                      return (
                        <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 bg-white">
                          <div className="w-1.5 h-4 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">{c.titulo}</div>
                            <div className="text-[11px] text-gray-400">{cfg.label}{dp ? ` · ${format(dp, "d MMM", { locale: ptBR })}` : ""}</div>
                          </div>
                          {stCfg && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${stCfg.cor}`}>{stCfg.label}</span>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Rodapé */}
            <div className="mt-8 pt-4 border-t border-gray-100 text-[11px] text-gray-300 text-center">
              Gerado em {format(new Date(), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
