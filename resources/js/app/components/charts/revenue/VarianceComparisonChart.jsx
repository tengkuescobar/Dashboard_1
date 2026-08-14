import React, { useState, useEffect } from "react";
import { BarChart2, TrendingUp, TrendingDown } from "lucide-react";
import axios from "axios";
import { Card, SectionTitle } from "../../ui/ChartUIComponents";
import { useDateFilter } from "../../Layout";
import { ChartSkeleton } from "../../ui/skeleton";

const DUMMY_DATA = [
  { month: "Jan", previous: 10.5, current: 12.1 },
  { month: "Feb", previous: 11.2, current: 13.4 },
  { month: "Mar", previous: 12.1, current: 11.0 },
  { month: "Apr", previous: 13.5, current: 14.2 },
  { month: "May", previous: 14.1, current: 15.6 },
  { month: "Jun", previous: 15.8, current: 17.2 },
  { month: "Jul", previous: 16.2, current: 16.0 },
  { month: "Aug", previous: 15.5, current: 18.1 },
  { month: "Sep", previous: 17.1, current: 19.5 },
  { month: "Oct", previous: 18.4, current: 20.1 },
  { month: "Nov", previous: 19.2, current: 21.5 },
  { month: "Dec", previous: 20.5, current: 22.8 },
];

export function VarianceComparisonChart({
  title = "Variance Analysis (Jan - Dec)"
}) {
  const { dateFilter } = useDateFilter();
  const [data, setData] = useState(DUMMY_DATA);
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios.get("/api/dashboard/variance-analysis", { params: { year: dateFilter.year } })
      .then((res) => {
        if (cancelled) return;
        try {
          if (Array.isArray(res.data) && res.data.length > 0) {
            // Sanitize each item to ensure numeric values
            const sanitized = res.data.map(item => ({
              month: item.month || "?",
              previous: Number(item.previous) || 0,
              current: Number(item.current) || 0,
            }));
            setData(sanitized);
          } else {
            setData(DUMMY_DATA);
          }
        } catch (e) {
          console.error("VarianceChart parse error:", e);
          setData(DUMMY_DATA);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("VarianceChart API error:", err);
        setData(DUMMY_DATA);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [dateFilter.year]);

  // Safe computation - all values guaranteed numeric from sanitization above
  const maxVal = data.length > 0
    ? Math.max(...data.map(d => Math.max(d.previous, d.current))) * 1.2
    : 100;
  const containerHeight = 275;

  if (loading) {
    return <Card><SectionTitle icon={BarChart2} label={title} /><ChartSkeleton height={containerHeight} /></Card>;
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle icon={BarChart2} label={`${title} — ${dateFilter.year - 1} vs ${dateFilter.year}`} />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#EF4444" }} /><span className="text-xs font-medium" style={{ color: "var(--dt-text-2)" }}>{dateFilter.year - 1}</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#3B82F6" }} /><span className="text-xs font-medium" style={{ color: "var(--dt-text-2)" }}>{dateFilter.year}</span></div>
          </div>
        </div>
      </div>
      <div className="w-full pt-4 pb-6 relative" onMouseLeave={() => setHoveredIdx(null)}>
        <div className="w-full grid grid-cols-12 gap-1 sm:gap-2 items-end" style={{ height: containerHeight }}>
          {data.map((d, i) => {
            const prev = d.previous;
            const curr = d.current;
            const diff = curr - prev;
            const pct = prev === 0 ? (curr > 0 ? 100 : 0) : (diff / prev) * 100;
            const pctLabel = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
            const isUp = diff >= 0;
            const barAreaH = 200;
            const h1 = Math.max(18, (prev / (maxVal || 1)) * (barAreaH - 45));
            const h2 = Math.max(18, (curr / (maxVal || 1)) * (barAreaH - 45));
            const Y_red = barAreaH - h1;
            const Y_blue = barAreaH - h2;
            const Y_top = Math.max(20, Math.min(Y_red, Y_blue) - 32);
            const isHovered = hoveredIdx === i;

            return <div
              key={`group-${i}`}
              className="flex flex-col items-center justify-end h-full w-full group transition-colors hover:bg-slate-500/10 rounded p-0.5 cursor-pointer relative"
              onMouseEnter={() => setHoveredIdx(i)}
            >
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
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "4px 8px", borderRadius: 6, background: "rgba(37, 99, 235, 0.04)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#EF4444" }} />
                          <span style={{ color: "var(--dt-text-1)", fontWeight: 600, fontSize: 11 }}>{dateFilter.year - 1}</span>
                        </div>
                        <span style={{ color: "var(--dt-text-1)", fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 11.5 }}>
                          {prev.toFixed(2)} Bn
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "4px 8px", borderRadius: 6, background: "rgba(37, 99, 235, 0.04)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#3B82F6" }} />
                          <span style={{ color: "var(--dt-text-1)", fontWeight: 600, fontSize: 11 }}>{dateFilter.year}</span>
                        </div>
                        <span style={{ color: "var(--dt-text-1)", fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 11.5 }}>
                          {curr.toFixed(2)} Bn
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 5, borderTop: "1px solid var(--dt-row-border, #e2e8f0)", marginTop: 3 }}>
                        <span style={{ color: "#64748B", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>Variance</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 12, color: isUp ? "#22C55E" : "#F43F5E" }}>
                          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {isUp ? "+" : ""}{diff.toFixed(2)} Bn ({pctLabel})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative w-full overflow-visible pointer-events-none" style={{ height: barAreaH }}>
                <svg
                  width="100%"
                  height={barAreaH}
                  viewBox={`0 0 100 ${barAreaH}`}
                  fill="none"
                  className="absolute inset-0 overflow-visible pointer-events-none z-10"
                  preserveAspectRatio="none"
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
                  <text
                    x="50"
                    y={Y_top - 6}
                    textAnchor="middle"
                    fill={isUp ? "#10B981" : "#EF4444"}
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="DM Mono, monospace"
                  >
                    {pctLabel}
                  </text>
                </svg>

                <div className="absolute bottom-0 w-full flex justify-center items-end" style={{ height: "100%" }}>
                  <div className="w-[30%] max-w-[20px] rounded-t-sm mx-[2px] transition-all duration-300 relative group-hover:brightness-110"
                    style={{ height: h1, background: "linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)" }}>
                  </div>
                  <div className="w-[30%] max-w-[20px] rounded-t-sm mx-[2px] transition-all duration-300 relative group-hover:brightness-110"
                    style={{ height: h2, background: "linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)" }}>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-center text-xs font-black tracking-wide pb-1" style={{ color: "var(--dt-text-1)" }}>
                {d.month}
              </div>
            </div>;
          })}
        </div>
      </div>
    </Card>
  );
}
