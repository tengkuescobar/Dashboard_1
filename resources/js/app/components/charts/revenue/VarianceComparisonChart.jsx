import React, { useState, useEffect, useMemo } from "react";
import { BarChart2, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import axios from "axios";
import { Card, SectionTitle } from "../../ui/ChartUIComponents";
import { useDateFilter } from "../../Layout";
import { ChartSkeleton } from "../../ui/skeleton";

/* ─── Smart Bn Formatter ─── */
function fmtBn(val) {
  if (val === 0 || isNaN(val)) return "0.00";
  return Number(val).toFixed(2);
}

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

/* ─── Toggle Pill Component ─── */
function ModePill({ mode, onChange }) {
  return (
    <div
      style={{
        display: "inline-flex",
        borderRadius: 8,
        overflow: "hidden",
        border: "1.5px solid var(--dt-card-border, #e2e8f0)",
        background: "var(--dt-header-bg, #f1f5f9)",
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {[
        { key: "monthly", label: "Monthly" },
        { key: "cumulative", label: "Cumulative" },
      ].map(({ key, label }) => {
        const active = mode === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              padding: "5px 12px",
              cursor: "pointer",
              border: "none",
              outline: "none",
              transition: "all 0.2s ease",
              background: active
                ? "linear-gradient(135deg, #3B82F6, #2563EB)"
                : "transparent",
              color: active ? "#fff" : "var(--dt-text-3, #64748B)",
              fontWeight: active ? 700 : 600,
              fontSize: 11,
              letterSpacing: "0.02em",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Outlier Detection (mean +/- 2 sigma) ─── */
function detectOutliers(data) {
  const variances = data.map((d) => {
    if (d.previous === 0) return d.current > 0 ? 100 : 0;
    return ((d.current - d.previous) / d.previous) * 100;
  });

  const mean = variances.reduce((a, b) => a + b, 0) / variances.length;
  const stddev = Math.sqrt(
    variances.reduce((sum, v) => sum + (v - mean) ** 2, 0) / variances.length
  );

  // Use a minimum threshold of 5% to prevent false positives when variance is mostly flat
  const threshold = Math.max(2 * stddev, 5); 
  return variances.map((v) => Math.abs(v - mean) > threshold);
}

export function VarianceComparisonChart({
  title = "Variance Analysis (Jan - Dec)"
}) {
  const { dateFilter } = useDateFilter();
  const [rawData, setRawData] = useState(DUMMY_DATA);
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [mode, setMode] = useState("monthly");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios.get("/api/dashboard/variance-analysis", { params: { year: dateFilter.year } })
      .then((res) => {
        if (cancelled) return;
        try {
          if (Array.isArray(res.data) && res.data.length > 0) {
            const sanitized = res.data.map(item => ({
              month: item.month || "?",
              previous: Number(item.previous) || 0,
              current: Number(item.current) || 0,
            }));
            setRawData(sanitized);
          } else {
            setRawData(DUMMY_DATA);
          }
        } catch (e) {
          console.error("VarianceChart parse error:", e);
          setRawData(DUMMY_DATA);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("VarianceChart API error:", err);
        setRawData(DUMMY_DATA);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [dateFilter.year]);

  // Compute display data based on mode
  const data = useMemo(() => {
    if (mode === "cumulative") {
      let cumPrev = 0, cumCurr = 0;
      return rawData.map((d) => {
        cumPrev += d.previous;
        cumCurr += d.current;
        return { month: d.month, previous: cumPrev, current: cumCurr };
      });
    }
    return rawData;
  }, [rawData, mode]);

  // Outlier detection
  const outliers = useMemo(() => detectOutliers(rawData), [rawData]);

  // Summary variance (excluding outliers)
  const summary = useMemo(() => {
    let totalPrev = 0, totalCurr = 0;
    rawData.forEach((d, i) => {
      if (!outliers[i]) {
        totalPrev += d.previous;
        totalCurr += d.current;
      }
    });
    const diff = totalCurr - totalPrev;
    const pct = totalPrev > 0 ? (diff / totalPrev) * 100 : 0;
    return { totalPrev, totalCurr, diff, pct };
  }, [rawData, outliers]);

  // Reset hover on mode change
  useEffect(() => {
    setHoveredIdx(null);
  }, [mode]);

  // Safe computation - all values guaranteed numeric from sanitization above
  const maxVal = data.length > 0
    ? Math.max(...data.map(d => Math.max(d.previous, d.current))) * 1.2
    : 100;
  const containerHeight = 275;

  if (loading) {
    return <Card><SectionTitle icon={BarChart2} label={title} /><ChartSkeleton height={containerHeight} /></Card>;
  }

  const modeLabel = mode === "monthly" ? "Monthly Value" : "Cumulative YTD";

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle icon={BarChart2} label={`${title} — ${dateFilter.year - 1} vs ${dateFilter.year}`} />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#EF4444" }} /><span className="text-xs font-medium" style={{ color: "var(--dt-text-2)" }}>{dateFilter.year - 1}</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#3B82F6" }} /><span className="text-xs font-medium" style={{ color: "var(--dt-text-2)" }}>{dateFilter.year}</span></div>
          </div>
          {/* Summary Variance Badge */}
          <div className="flex items-center gap-1.5" style={{ fontFamily: "DM Mono, monospace", fontSize: 11.5, fontWeight: 700, color: summary.diff >= 0 ? "#10B981" : "#EF4444" }}>
            <span style={{ color: "var(--dt-text-3)", fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.5px" }}>Variance~&gt;</span>
            {summary.diff >= 0 ? "+" : ""}{fmtBn(summary.diff)} Bn ({summary.pct >= 0 ? "+" : ""}{summary.pct.toFixed(1)}%)
          </div>
          {/* Mode Toggle */}
          <ModePill mode={mode} onChange={setMode} />
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
            const isOutlier = outliers[i];
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
                    border: isOutlier ? "3px solid #F59E0B" : "3px solid #2563EB",
                    borderRadius: 16,
                    color: "var(--dt-text-1)",
                    fontSize: 12,
                    padding: "12px 14px",
                    boxShadow: isOutlier
                      ? "0 20px 35px -10px rgba(245, 158, 11, 0.25), 0 0 0 1px rgba(0,0,0,0.05)"
                      : "0 20px 35px -10px rgba(37, 99, 235, 0.25), 0 0 0 1px rgba(0,0,0,0.05)",
                    minWidth: 220,
                    maxWidth: 280,
                    whiteSpace: "nowrap"
                  }}>
                    {/* Mode indicator */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: "#fff",
                        background: mode === "monthly" ? "#3B82F6" : "#8B5CF6",
                        padding: "2px 6px",
                        borderRadius: 4,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}>
                        {modeLabel}
                      </span>
                      {isOutlier && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: "#92400E",
                          background: "rgba(245, 158, 11, 0.15)",
                          padding: "2px 6px",
                          borderRadius: 4,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                        }}>
                          <AlertTriangle size={9} /> DATA ANOMALY
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--dt-row-border, #e2e8f0)", paddingBottom: 6, marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>PERIOD</span>
                        <span style={{ fontWeight: 800, fontSize: 13, color: "var(--dt-text-1)", fontFamily: "Inter, sans-serif" }}>
                          {mode === "cumulative" ? `Jan → ${d.month}` : d.month}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "4px 8px", borderRadius: 6, background: "rgba(37, 99, 235, 0.04)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#EF4444" }} />
                          <span style={{ color: "var(--dt-text-1)", fontWeight: 600, fontSize: 11 }}>{dateFilter.year - 1}</span>
                        </div>
                        <span style={{ color: "var(--dt-text-1)", fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 11.5 }}>
                          {fmtBn(prev)} Bn
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "4px 8px", borderRadius: 6, background: "rgba(37, 99, 235, 0.04)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#3B82F6" }} />
                          <span style={{ color: "var(--dt-text-1)", fontWeight: 600, fontSize: 11 }}>{dateFilter.year}</span>
                        </div>
                        <span style={{ color: "var(--dt-text-1)", fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 11.5 }}>
                          {fmtBn(curr)} Bn
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 5, borderTop: "1px solid var(--dt-row-border, #e2e8f0)", marginTop: 3 }}>
                        <span style={{ color: "#64748B", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>Variance</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 12, color: isUp ? "#22C55E" : "#F43F5E" }}>
                          {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {isUp ? "+" : ""}{fmtBn(diff)} Bn ({pctLabel})
                        </span>
                      </div>
                      {isOutlier && (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "5px 8px",
                          borderRadius: 6,
                          background: "rgba(245, 158, 11, 0.08)",
                          border: "1px solid rgba(245, 158, 11, 0.2)",
                          marginTop: 3,
                        }}>
                          <AlertTriangle size={11} style={{ color: "#D97706", flexShrink: 0 }} />
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#92400E", lineHeight: 1.3 }}>
                            Possible incomplete data — excluded from avg variance
                          </span>
                        </div>
                      )}
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
                    style={{
                      height: h1,
                      background: "linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)",
                      boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)",
                      opacity: isOutlier ? 0.55 : 1,
                    }}>
                  </div>
                  <div className="w-[30%] max-w-[20px] rounded-t-sm mx-[2px] transition-all duration-300 relative group-hover:brightness-110"
                    style={{
                      height: h2,
                      background: "linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)",
                      boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)",
                      opacity: isOutlier ? 0.55 : 1,
                    }}>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-center text-xs font-black tracking-wide pb-1 flex flex-col items-center gap-0.5" style={{ color: isOutlier ? "#D97706" : "var(--dt-text-1)" }}>
                <span>{d.month}</span>
                {isOutlier && (
                  <AlertTriangle size={10} style={{ color: "#F59E0B" }} />
                )}
              </div>
            </div>;
          })}
        </div>
      </div>
    </Card>
  );
}
