import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, ChevronDown, Download, Eye, EyeOff } from "lucide-react";
import { C, fmt, pctSign, formatValue, getRawValue, formatTooltipNum } from "../../utils/formatters";

export function ChartDownloadButton({ onClick, label = "CSV" }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      title="Download Chart Table (CSV)"
      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 border shadow-sm hover:opacity-90 active:scale-95 ml-1"
      style={{
        background: "var(--dt-pill-bg, rgba(59, 130, 246, 0.08))",
        borderColor: "var(--dt-pill-border, rgba(59, 130, 246, 0.2))",
        color: "var(--dt-accent-text, #3B82F6)"
      }}
    >
      <Download className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}

export function SeriesIndicator({ item, isLine }) {
  const color = item.stroke || item.fill || item.color || "#888";
  if (isLine) {
    return <svg width={22} height={14} style={{ flexShrink: 0 }}>
        <line x1={1} y1={7} x2={21} y2={7} stroke={color} strokeWidth={2} strokeDasharray={item.strokeDasharray ?? "none"} />
        <circle cx={11} cy={7} r={3.5} fill={color} />
      </svg>;
  }
  return <div style={{
    width: 16,
    height: 12,
    borderRadius: 3,
    flexShrink: 0,
    background: item.fill || item.color || "#888"
  }} />;
}

export function CustomTooltip({ active, payload, label, coordinate, viewBox }) {
  if (!active || !payload || !payload.length) return null;
  let formingItems = payload.filter((p) => {
    if (!p || p.dataKey == null) return false;
    const strKey = String(p.dataKey).toLowerCase();
    const strName = String(p.name || "").toLowerCase();
    if (strKey === "total" || strName === "total" || strName.includes("total line") || strName === "trend") {
      return false;
    }
    return true;
  });
  if (!formingItems.length) {
    formingItems = payload;
  }
  const rawSum = formingItems.reduce((acc, item) => acc + getRawValue(item), 0);
  const rowObj = formingItems[0]?.payload || {};
  const totalKey = Object.keys(rowObj).find(k => k.endsWith("_total") || k === "total" || k === "rv_total" || k === "bb_total" || k === "ls_total" || k === "mt_total" || k === "pp_total");
  const rowTotalVal = totalKey ? Number(rowObj[totalKey]) : (
    formingItems.length > 1 ? rawSum : (
      Object.entries(rowObj).reduce((sum, [k, v]) => {
        if (k !== "p" && !k.startsWith("_") && !k.endsWith("_p") && !k.endsWith("_t") && typeof v === "number" && !isNaN(v)) {
          return sum + v;
        }
        return sum;
      }, 0)
    )
  );
  const totalVal = formingItems.length > 1 ? rawSum : (rowTotalVal > 0 ? rowTotalVal : rawSum);
  const isRightHalf = coordinate && viewBox && viewBox.width ? coordinate.x > viewBox.width * 0.5 : (coordinate?.x > 300);
  const isBottomHalf = coordinate && viewBox && viewBox.height ? coordinate.y > viewBox.height * 0.5 : (coordinate?.y > 150);
  const transformX = isRightHalf ? "-105%" : "35px";
  const transformY = isBottomHalf ? "-92%" : "-10px";

  return <div style={{
    background: "var(--dt-card, #ffffff)",
    border: "2px solid #2563EB",
    borderRadius: 14,
    color: "var(--dt-text-1)",
    padding: "10px 14px",
    boxShadow: "0 16px 32px -6px rgba(37, 99, 235, 0.22), 0 4px 12px -2px rgba(0, 0, 0, 0.08)",
    minWidth: 260,
    maxWidth: 320,
    width: "max-content",
    pointerEvents: "none",
    transform: `translate(${transformX}, ${transformY})`,
    transition: "transform 0.08s ease-out",
    whiteSpace: "nowrap"
  }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 6, marginBottom: 8, borderBottom: "1px solid var(--dt-row-border, #e2e8f0)", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>PERIOD</span>
          <span style={{ fontWeight: 800, fontSize: 13, color: "var(--dt-text-1)", fontFamily: "Inter, sans-serif" }}>
            {label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>TOTAL</span>
          <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 13, color: "#2563EB" }}>
            {formatTooltipNum(totalVal)}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {formingItems.map((item, i) => {
          const rawVal = getRawValue(item);
          const pctContrib = totalVal > 0 ? (rawVal / totalVal) * 100 : 100;
          const color = item.fill || item.color || item.stroke || "#3B82F6";
          const nameStr = String(item.name || "");
          return <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "4px 8px", borderRadius: 6, background: "rgba(37, 99, 235, 0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: "1 1 auto" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
              <span style={{ color: "var(--dt-text-1)", fontWeight: 600, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nameStr}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexShrink: 0, textAlign: "right" }}>
              <span style={{ color: "var(--dt-text-1)", fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 11.5 }}>
                {formatTooltipNum(rawVal)}
              </span>
              <span style={{ fontSize: 10, fontFamily: "DM Mono, monospace", fontWeight: 600, color: "#64748B" }}>
                ({pctContrib.toFixed(1)}%)
              </span>
            </div>
          </div>;
        })}
        {rowObj._tp != null && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 5, borderTop: "1px solid var(--dt-row-border, #e2e8f0)", marginTop: 3, gap: 12 }}>
            <span style={{ color: "#64748B", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Growth (MoM)</span>
            <span style={{ color: rowObj._tp >= 0 ? "#10B981" : "#EF4444", fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 12 }}>
              {rowObj._tp >= 0 ? "+" : ""}{rowObj._tp}%
            </span>
          </div>
        )}
      </div>
    </div>;
}

export let lastBarClickTime = 0;

export function openChartPopover(detail) {
  lastBarClickTime = Date.now();
  window.dispatchEvent(new CustomEvent("dt:open-chart-popover", { detail }));
}

export function handleChartClick(entry, e, title, activeSeries) {
  if (!entry) return;
  openChartPopover({
    data: entry,
    title: title || "Chart Detail",
    metric: entry.name || entry.dataKey || "Metric",
    color: entry.fill || entry.color || "#3B82F6",
    event: e || window.event,
    series: activeSeries || []
  });
}

export function ChartDetailPopover() {
  const [state, setState] = useState({ open: false });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleOpen = (e) => {
      const { data, title, metric, color, event, series } = e.detail || {};
      if (!data) return;
      
      const cardW = 340;
      const cardH = 380;
      let x = (event?.clientX || window.innerWidth / 2) + 16;
      let y = (event?.clientY || window.innerHeight / 2) - 80;

      if (x + cardW > window.innerWidth - 24) {
        x = (event?.clientX || window.innerWidth / 2) - cardW - 16;
      }
      if (x < 24) x = 24;
      if (y + cardH > window.innerHeight - 24) {
        y = window.innerHeight - cardH - 24;
      }
      if (y < 24) y = 24;

      setState({
        open: true,
        data,
        title: title || "Chart Detail",
        metric: metric || data.name || data.dataKey || "Metric",
        color: color || data.fill || "#3B82F6",
        series: series || [],
        x,
        y,
      });
      setCopied(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setState((s) => ({ ...s, open: false }));
    };

    window.addEventListener("dt:open-chart-popover", handleOpen);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("dt:open-chart-popover", handleOpen);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!state.open || !state.data) return null;

  const { data, title, metric, color, series, x, y } = state;
  const payload = data.payload || {};
  const label = payload.p || payload.label || payload.month || "Period";
  const rawVal = getRawValue(data);
  
  let totalVal = payload.rv_total || payload.bb_total || payload.ls_total || payload.mt_total || payload.pb_total || 0;
  if (!totalVal && series && series.length > 0) {
    totalVal = series.reduce((sum, s) => sum + (Number(payload[s.pkey || s.key]) || 0), 0);
  }
  if (!totalVal) totalVal = rawVal;
  
  const pct = totalVal > 0 ? ((rawVal / totalVal) * 100).toFixed(1) : "100.0";

  let items = [];
  if (series && series.length > 0) {
    items = series.map((s) => {
      const val = Number(payload[s.pkey || s.key]) || 0;
      const share = totalVal > 0 ? (val / totalVal) * 100 : 0;
      return {
        name: s.key,
        value: val,
        share,
        color: s.color || "#3B82F6",
        isClicked: metric === "Total" || metric === "All" || s.key === metric || s.pkey === data.dataKey,
      };
    });
  } else {
    items = [{
      name: metric,
      value: rawVal,
      share: 100,
      color: color,
      isClicked: true,
    }];
  }

  const handleCopy = () => {
    const text = `Chart: ${title}\nPeriod: ${label}\nMetric: ${metric}\nValue: ${formatTooltipNum(rawVal)} (${pct}% of Total ${formatTooltipNum(totalVal)})\n\nBreakdown:\n` +
      items.map(i => `- ${i.name}: ${formatTooltipNum(i.value)} (${i.share.toFixed(1)}%)`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[9998]"
        onClick={() => setState((s) => ({ ...s, open: false }))}
      />
      <div
        style={{
          position: "fixed",
          top: y,
          left: x,
          zIndex: 9999,
          width: 350,
          background: "var(--dt-card, #ffffff)",
          border: "3px solid #2563EB",
          borderRadius: 20,
          boxShadow: "0 25px 50px -12px rgba(37, 99, 235, 0.25), 0 10px 30px -5px rgba(0, 0, 0, 0.15)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          color: "var(--dt-text-1)",
          fontFamily: "Inter, sans-serif",
          overflow: "hidden",
        }}
        className="animate-in fade-in-0 zoom-in-95 duration-200"
      >
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--dt-row-border, #e2e8f0)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.8 }}>
                PERIOD
              </span>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--dt-text-1)", fontFamily: "Inter, sans-serif", marginTop: 2 }}>
                {label}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.8 }}>
                TOTAL
              </span>
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "DM Mono, monospace", color: "#2563EB", marginTop: 2 }}>
                {formatTooltipNum(totalVal)} Bn
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 20px", maxHeight: 220, overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item, i) => {
              let nameStr = String(item.name || "");
              if (!nameStr.toLowerCase().includes("revenue")) {
                nameStr = `${nameStr} Revenue`;
              }
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: item.color, flexShrink: 0, boxShadow: `0 0 6px ${item.color}80` }} />
                    <span style={{ fontSize: 13, fontWeight: item.isClicked ? 700 : 600, color: item.isClicked ? "var(--dt-text-1)" : "var(--dt-text-2)" }}>
                      {nameStr}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 13, fontFamily: "DM Mono, monospace", fontWeight: 800, color: "var(--dt-text-1)" }}>
                      {formatTooltipNum(item.value)} Bn
                    </span>
                    <span style={{ fontSize: 12, fontFamily: "DM Mono, monospace", fontWeight: 600, color: "#94A3B8" }}>
                      ({item.share.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
            {payload._tp != null && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--dt-row-border, #e2e8f0)", marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: "#10B981", flexShrink: 0 }} />
                  <span style={{ color: "var(--dt-text-1)", fontWeight: 700, fontSize: 12 }}>Period Growth</span>
                </div>
                <span style={{ color: payload._tp >= 0 ? "#10B981" : "#EF4444", fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 13 }}>
                  {payload._tp >= 0 ? "+" : ""}{payload._tp}%
                </span>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            padding: "12px 20px",
            background: "var(--dt-header-bg, #f8fafc)",
            borderTop: "1px solid var(--dt-row-border, #e2e8f0)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            onClick={handleCopy}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "var(--dt-text-1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            className="hover:bg-slate-100 transition-colors"
          >
            {copied ? "✓ Copied!" : "📋 Copy Data"}
          </button>
          <button
            onClick={() => setState((s) => ({ ...s, open: false }))}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "var(--dt-text-1)",
              cursor: "pointer",
            }}
            className="hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

export function StatusBadge({ value, target }) {
  const ok = value >= target;
  return <span
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium"
    style={{ background: ok ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: ok ? C.success : C.danger }}
  >
      {ok ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {fmt(value / target * 100, 1)}%
    </span>;
}

export function PctPill({ value }) {
  const pos = value >= 0;
  return <span
    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-mono text-xs font-medium"
    style={{ background: pos ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: pos ? C.success : C.danger }}
  >
      {pos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {pctSign(value)}
    </span>;
}

export function Dropdown({ value, options, onChange }) {
  return <div className="relative">
      <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="appearance-none pl-3 pr-8 py-1.5 rounded text-xs font-medium cursor-pointer outline-none"
    style={{ background: "var(--dt-dd-bg)", color: "var(--dt-dd-text)", border: "1px solid var(--dt-dd-border)" }}
  >
        {options.map((o) => <option key={o} value={o} style={{ background: "var(--dt-dd-opt)" }}>{o}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--dt-dd-text)" }} />
    </div>;
}

export function Card({ children, className = "" }) {
  return <div
    className={`rounded-xl p-5 ${className}`}
    style={{ background: "var(--dt-card)", border: "1px solid var(--dt-card-border)" }}
  >
      {children}
    </div>;
}

export function SectionTitle({ icon: Icon, label }) {
  return <div className="flex items-center gap-2 mb-4">
      <Icon size={15} style={{ color: "#3B82F6" }} />
      <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--dt-text-3)" }}>{label}</span>
    </div>;
}

export function ChartLegend({ items, onItemClick, hiddenItems = [], activeItem = null }) {
  return <div className="flex flex-wrap gap-x-1.5 gap-y-1.5 mb-3">
      {items.map(({ label, color, dashed }) => {
        const isActive = activeItem === label;
        const isDimmed = activeItem && activeItem !== "All" && !isActive;
        return (
          <div 
            key={label} 
            onClick={() => onItemClick?.(label)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all duration-200 ${onItemClick ? 'cursor-pointer' : ''}`}
            style={{
              background: isActive ? `${color}18` : "transparent",
              border: isActive ? `1.5px solid ${color}` : "1.5px solid transparent",
              opacity: isDimmed ? 0.35 : 1,
              filter: isDimmed ? "grayscale(0.8)" : "none",
            }}
          >
            {dashed ? <svg width={18} height={10}><line x1={0} y1={5} x2={18} y2={5} stroke={color} strokeWidth={2} strokeDasharray="4 2" /></svg> : <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />}
            <span className="text-xs font-semibold select-none" style={{ color: isActive ? color : "var(--dt-text-2)" }}>{label}</span>
          </div>
        );
      })}
    </div>;
}

export function PctDot(props) {
  const { cx, cy, stroke, payload, pctKey } = props;
  const pct = payload?.[pctKey] ?? null;
  const isFirst = pct === null;
  const color = isFirst ? stroke : pct >= 0 ? C.success : C.danger;
  const sign = pct !== null && pct >= 0 ? "+" : "";
  return <g>
      <circle cx={cx} cy={cy} r={4} fill={stroke} />
      {!isFirst && <text
    x={cx}
    y={cy - 9}
    textAnchor="middle"
    fontSize={8}
    fontWeight={700}
    fontFamily="DM Mono, monospace"
    fill={color}
  >
          {sign}{pct.toFixed(1)}%
        </text>}
    </g>;
}

export function SegmentPill(props) {
  const { x, y, width, height, value } = props;
  if (value == null || height < 12 || width < 16) return null;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return null;
  const bnVal = num / 1e9;
  let txt = bnVal.toFixed(2).replace(/\.?0+$/, "");
  if (txt === "" || txt === "0" || txt === "-0") txt = bnVal.toFixed(3).replace(/\.?0+$/, "");
  const fontSize = Math.min(11, Math.max(9, Math.round(height * 0.38)));
  return <text
    x={cx}
    y={cy}
    textAnchor="middle"
    dominantBaseline="central"
    fontSize={fontSize}
    fontWeight={700}
    fontFamily="DM Mono, monospace"
    fill="#ffffff"
    style={{ filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.65))", pointerEvents: "none" }}
  >
      {txt}
    </text>;
}

export function LabelToggle({ on, onToggle }) {
  return <button
    type="button"
    onClick={onToggle}
    title={on ? "Hide values" : "Show values"}
    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium cursor-pointer outline-none transition-colors"
    style={{ background: on ? "var(--dt-dd-bg)" : "rgba(128,128,128,0.1)", color: on ? "var(--dt-dd-text)" : "var(--dt-text-4)", border: "1px solid var(--dt-dd-border)" }}
  >
      {on ? <Eye size={12} /> : <EyeOff size={12} />}
      Values
    </button>;
}

export function makeTopLabel(totals, pcts, isBnOnly = false) {
  return function TopLabel(props) {
    const { x, y, width, index } = props;
    const total = totals[index];
    const pct = pcts[index];
    if (total == null) return null;
    const cx = x + width / 2;
    const valText = isBnOnly ? (total / 1e9).toFixed(2).replace(/\.00$/, "") + " Bn" : formatValue(total);
    return <g style={{ pointerEvents: "none" }}>
        <text
      x={cx}
      y={y - 18}
      textAnchor="middle"
      fontSize={11}
      fontWeight={700}
      fontFamily="DM Mono, monospace"
      fill="var(--dt-text-1)"
    >
          {valText}
        </text>
        {pct !== null && <text
      x={cx}
      y={y - 6}
      textAnchor="middle"
      fontSize={9}
      fontWeight={600}
      fontFamily="DM Mono, monospace"
      fill={pct >= 0 ? C.success : C.danger}
    >
            {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
          </text>}
      </g>;
  };
}

export function handleBarHover(barData, index, event, series, containerRef, setHoveredState) {
  if (!barData) return;
  let x = 200;
  if (containerRef && containerRef.current && event && event.currentTarget) {
    const rect = event.currentTarget.getBoundingClientRect();
    const cRect = containerRef.current.getBoundingClientRect();
    x = rect.left + rect.width / 2 - cRect.left;
  }

  const payload = (series && series.length) ? series.map(s => ({
    name: s.key,
    value: Number(barData[s.pkey]) || 0,
    fill: s.color,
    dataKey: s.pkey,
    payload: barData
  })) : [{
    name: "Value",
    value: Number(barData.dv_val || barData.v) || 0,
    fill: C.bau,
    payload: barData
  }];

  setHoveredState({
    activePayload: payload,
    activeCoordinate: { x: x, y: 50 },
    activeTooltipIndex: index
  });
}

export function ChartHoverPopoverCard({ hoveredState, dataLength }) {
  if (!hoveredState || !hoveredState.activePayload || !hoveredState.activePayload.length) return null;
  const payload = hoveredState.activePayload;
  const coord = hoveredState.activeCoordinate;
  const idx = hoveredState.activeTooltipIndex ?? 0;
  const item0 = payload[0]?.payload || {};
  const label = item0.p || item0.month || item0.label || "Period";

  let formingItems = payload.filter((p) => {
    if (!p || p.dataKey == null) return false;
    const strKey = String(p.dataKey).toLowerCase();
    const strName = String(p.name || "").toLowerCase();
    if (strKey === "total" || strName === "total" || strName.includes("total line") || strName === "trend") return false;
    return true;
  });
  if (!formingItems.length) formingItems = payload;

  const rawSum = formingItems.reduce((acc, item) => acc + getRawValue(item), 0);
  const totalVal = rawSum;

  const x = coord?.x ?? 200;
  const isRightHalf = idx >= Math.floor((dataLength || 12) / 2);
  const leftPos = isRightHalf ? x - 35 : x + 35;
  const transform = isRightHalf ? "translateX(-100%)" : "translateX(0)";

  return (
    <div
      style={{
        position: "absolute",
        top: 15,
        left: leftPos,
        transform: transform,
        zIndex: 99999,
        pointerEvents: "none",
        transition: "left 0.08s ease-out, transform 0.08s ease-out"
      }}
      className="animate-in fade-in-0 zoom-in-95 duration-100"
    >
      <div
        style={{
          background: "var(--dt-card, #ffffff)",
          border: "2px solid #2563EB",
          borderRadius: 14,
          color: "var(--dt-text-1)",
          fontSize: 12,
          padding: "10px 14px",
          boxShadow: "0 16px 32px -6px rgba(37, 99, 235, 0.22), 0 4px 12px -2px rgba(0, 0, 0, 0.08)",
          minWidth: 260,
          maxWidth: 320,
          width: "max-content",
          whiteSpace: "nowrap"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--dt-row-border, #e2e8f0)", paddingBottom: 6, marginBottom: 8, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>PERIOD</span>
            <span style={{ fontWeight: 800, fontSize: 13, color: "var(--dt-text-1)", fontFamily: "Inter, sans-serif" }}>{label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>TOTAL</span>
            <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 13, color: "#2563EB" }}>{formatTooltipNum(totalVal)}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {formingItems.map((item, i) => {
            const rawVal = getRawValue(item);
            const pct = totalVal > 0 ? ((rawVal / totalVal) * 100).toFixed(1) : "100.0";
            const color = item.fill || item.color || item.stroke || "#3B82F6";
            const nameStr = String(item.name || item.dataKey || "");
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "4px 8px", borderRadius: 6, background: "rgba(37, 99, 235, 0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: "1 1 auto" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                  <span style={{ color: "var(--dt-text-1)", fontWeight: 600, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nameStr}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexShrink: 0, textAlign: "right" }}>
                  <span style={{ fontFamily: "DM Mono, monospace", fontWeight: 700, fontSize: 11.5, color: "var(--dt-text-1)" }}>
                    {formatTooltipNum(rawVal)}
                  </span>
                  <span style={{ fontSize: 10, fontFamily: "DM Mono, monospace", fontWeight: 600, color: "#64748B" }}>
                    ({pct}%)
                  </span>
                </div>
              </div>
            );
          })}
          {item0._tp != null && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 5, borderTop: "1px solid var(--dt-row-border, #e2e8f0)", marginTop: 3, gap: 12 }}>
              <span style={{ color: "#64748B", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Growth (MoM)</span>
              <span style={{ color: item0._tp >= 0 ? "#10B981" : "#EF4444", fontFamily: "DM Mono, monospace", fontWeight: 800, fontSize: 12 }}>
                {item0._tp >= 0 ? "+" : ""}{item0._tp}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
