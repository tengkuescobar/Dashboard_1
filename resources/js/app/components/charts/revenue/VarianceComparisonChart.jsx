import React, { useState } from "react";
import { BarChart2, TrendingUp, TrendingDown } from "lucide-react";
import { exportToCSV } from "../../../utils/csvExport";
import { Card, SectionTitle, ChartDownloadButton } from "../../ui/ChartUIComponents";

export function VarianceComparisonChart({
  title = "Variance Analysis (Jan - Dec)"
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const data = [
    { month: "Jan", previous: 237, current: 216 },
    { month: "Feb", previous: 220, current: 245 },
    { month: "Mar", previous: 240, current: 230 },
    { month: "Apr", previous: 250, current: 260 },
    { month: "May", previous: 260, current: 255 },
    { month: "Jun", previous: 280, current: 300 },
    { month: "Jul", previous: 290, current: 285 },
    { month: "Aug", previous: 285, current: 310 },
    { month: "Sep", previous: 310, current: 330 },
    { month: "Oct", previous: 320, current: 315 },
    { month: "Nov", previous: 330, current: 350 },
    { month: "Dec", previous: 340, current: 360 }
  ];
  const maxVal = Math.max(...data.flatMap((d) => [d.previous, d.current])) * 1.2;
  const containerHeight = 275;

  return <Card>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle icon={BarChart2} label={title} />
        <div className="flex items-center gap-4 text-xs font-medium" style={{ color: "var(--dt-text-2)" }}>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#EF4444" }} />
            <span>Previous Year</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#0284C7" }} />
            <span>Current Year</span>
          </div>
          <ChartDownloadButton
            onClick={() => {
              const headers = ["Month", "Previous Year", "Current Year", "Variance Difference", "Growth (%)"];
              const rows = data.map(d => {
                const diff = d.current - d.previous;
                const pct = d.previous === 0 ? 0 : (diff / d.previous) * 100;
                return [d.month, Math.round(d.previous).toLocaleString("en-US"), Math.round(d.current).toLocaleString("en-US"), `${diff >= 0 ? '+' : ''}${Math.round(diff).toLocaleString("en-US")}`, `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`];
              });
              const totPrev = data.reduce((acc, d) => acc + d.previous, 0);
              const totCurr = data.reduce((acc, d) => acc + d.current, 0);
              const totDiff = totCurr - totPrev;
              const totPct = totPrev === 0 ? 0 : (totDiff / totPrev) * 100;
              const summaryRow = ["Total", Math.round(totPrev).toLocaleString("en-US"), Math.round(totCurr).toLocaleString("en-US"), `${totDiff >= 0 ? '+' : ''}${Math.round(totDiff).toLocaleString("en-US")}`, `${totPct >= 0 ? '+' : ''}${totPct.toFixed(1)}%`];
              exportToCSV({
                filename: "Variance_Analysis_Report",
                title: title || "Variance Analysis Report (Jan - Dec)",
                subtitle: "Comparison between Previous Year and Current Year",
                headers,
                rows,
                summaryRow
              });
            }}
          />
        </div>
      </div>
      <div className="w-full pt-4 pb-6 relative" onMouseLeave={() => setHoveredIdx(null)}>
        <div className="w-full grid grid-cols-12 gap-1 sm:gap-2 items-end" style={{ height: containerHeight }}>
          {data.map((d, i) => {
            const diff = d.current - d.previous;
            const pct = d.previous === 0 ? 0 : (diff / d.previous) * 100;
            const isUp = diff >= 0;
            const barAreaH = 200;
            const h1 = Math.max(18, (d.previous / maxVal) * (barAreaH - 45));
            const h2 = Math.max(18, (d.current / maxVal) * (barAreaH - 45));
            const Y_red = barAreaH - h1;
            const Y_blue = barAreaH - h2;
            const Y_top = Math.max(20, Math.min(Y_red, Y_blue) - 32);
            const isHovered = hoveredIdx === i;

            return <div
              key={`group-${i}`}
              className="flex flex-col items-center justify-end h-full w-full group transition-colors hover:bg-slate-500/10 rounded p-0.5 cursor-pointer relative"
              onMouseEnter={() => setHoveredIdx(i)}
            >
              {/* HOVER POPOVER CARD */}
              {isHovered && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    left: i >= 9 ? "auto" : i <= 2 ? "0" : "50%",
                    right: i >= 9 ? "0" : "auto",
                    transform: i >= 9 ? "none" : i <= 2 ? "none" : "translateX(-50%)",
                    marginBottom: 10,
                    zIndex: 99999,
                    pointerEvents: "none"
                  }}
                  className="animate-in fade-in-0 zoom-in-95 duration-100"
                >
                  <div style={{
                    background: "var(--dt-card, #ffffff)",
                    border: "3px solid #2563EB",
                    borderRadius: 16,
                    color: "var(--dt-text-1)",
                    fontSize: 12,
                    padding: "12px 14px",
                    boxShadow: "0 20px 35px -10px rgba(37, 99, 235, 0.25), 0 0 0 1px rgba(0,0,0,0.05)",
                    minWidth: 220,
                    maxWidth: 260,
                    whiteSpace: "nowrap"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--dt-row-border, #e2e8f0)", paddingBottom: 6, marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>PERIOD</span>
                        <span style={{ fontWeight: 800, fontSize: 13, color: "var(--dt-text-1)", fontFamily: "Inter, sans-serif" }}>{d.month}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>TOTAL</span>
                        <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 13, color: "#2563EB" }}>{Math.round(d.previous + d.current).toLocaleString("en-US")}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", borderRadius: 8, background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#EF4444" }} />
                          <span style={{ fontWeight: 600, fontSize: 11 }}>Previous Year</span>
                        </div>
                        <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 12, color: "#EF4444" }}>{Math.round(d.previous).toLocaleString("en-US")}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", borderRadius: 8, background: "rgba(2, 132, 199, 0.08)", border: "1px solid rgba(2, 132, 199, 0.2)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#0284C7" }} />
                          <span style={{ fontWeight: 600, fontSize: 11 }}>Current Year</span>
                        </div>
                        <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 12, color: "#0284C7" }}>{Math.round(d.current).toLocaleString("en-US")}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", borderRadius: 8, background: isUp ? "rgba(34, 197, 94, 0.08)" : "rgba(244, 63, 94, 0.08)", border: `1px solid ${isUp ? "rgba(34, 197, 94, 0.2)" : "rgba(244, 63, 94, 0.2)"}` }}>
                        <span style={{ fontWeight: 600, fontSize: 11, color: isUp ? "#22C55E" : "#F43F5E" }}>Variance / Growth</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 12, color: isUp ? "#22C55E" : "#F43F5E" }}>
                          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {isUp ? "+" : ""}{Math.round(diff).toLocaleString("en-US")} ({isUp ? "+" : ""}{pct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BARS & DYNAMIC CONNECTOR AREA */}
              <div className="w-full max-w-[76px] relative px-1 sm:px-2" style={{ height: barAreaH }}>
                {/* DYNAMIC DASHED CONNECTOR SVG */}
                <svg
                  width="100%"
                  height={barAreaH}
                  viewBox={`0 0 100 ${barAreaH}`}
                  fill="none"
                  className="absolute inset-0 overflow-visible pointer-events-none z-10"
                >
                  <path
                    d={`M 25 ${Y_red} L 25 ${Y_top} L 75 ${Y_top} L 75 ${Y_blue - 8}`}
                    fill="none"
                    stroke={isUp ? "#10B981" : "#EF4444"}
                    strokeWidth="2.2"
                    strokeDasharray="4 3"
                  />
                  <polygon
                    points={`69,${Y_blue - 9} 81,${Y_blue - 9} 75,${Y_blue}`}
                    fill={isUp ? "#10B981" : "#EF4444"}
                  />
                </svg>

                {/* FLOATING PERCENTAGE BADGE ABOVE CONNECTOR */}
                <div
                  className="absolute w-full flex justify-center pointer-events-none z-20"
                  style={{ top: `${Math.max(2, Y_top - 18)}px` }}
                >
                  <span className={`text-[10px] sm:text-[11px] font-black font-mono ${isUp ? "text-emerald-500" : "text-rose-500"} whitespace-nowrap bg-white/90 dark:bg-slate-900/90 px-1 rounded backdrop-blur-xs shadow-xs`}>
                    {isUp ? "+" : ""}{pct.toFixed(1)}%
                  </span>
                </div>

                {/* RED AND BLUE BARS */}
                <div className="w-full h-full flex items-end justify-center gap-1 relative z-0">
                  <div
                    className="w-1/2 rounded-t-md flex items-start justify-center pt-1.5 text-white font-black text-[9px] sm:text-xs transition-opacity group-hover:opacity-90 shadow-sm"
                    style={{ height: `${h1}px`, backgroundColor: "#EF4444" }}
                  >
                    <span className="opacity-95 leading-none">{Math.round(d.previous)}</span>
                  </div>
                  <div
                    className="w-1/2 rounded-t-md flex items-start justify-center pt-1.5 text-white font-black text-[9px] sm:text-xs transition-opacity group-hover:opacity-90 shadow-sm"
                    style={{ height: `${h2}px`, backgroundColor: "#0284C7" }}
                  >
                    <span className="opacity-95 leading-none">{Math.round(d.current)}</span>
                  </div>
                </div>
              </div>

              {/* MONTH LABEL BELOW X-AXIS */}
              <div className="mt-3 text-center text-xs font-black tracking-wide pb-1" style={{ color: "var(--dt-text-1)" }}>
                {d.month}
              </div>
            </div>;
          })}
        </div>
      </div>
    </Card>;
}
