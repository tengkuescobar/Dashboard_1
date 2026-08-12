import React from "react";
import { C, fmt, formatValue, polarXY, gaugeArc } from "../../../utils/formatters";
import { Card } from "../../ui/ChartUIComponents";

export function GaugeChart({ title, actual, target }) {
  const safeTarget = target > 0 ? target : actual > 0 ? actual * 1.1 : 100;
  const achieved = actual >= safeTarget;
  const achPct = actual / safeTarget * 100;
  const rangeMax = safeTarget * 2;
  const actualRatio = Math.min(Math.max(actual / rangeMax, 0), 1);
  const color = achieved ? C.success : C.danger;
  const cx = 90, cy = 84, r = 62;
  const startDeg = 225, totalSweep = 270;
  const targetDeg = startDeg + totalSweep * 0.5;
  const actualDeg = startDeg + actualRatio * totalSweep;
  const id = title.replace(/\s/g, "");
  const needleTip = polarXY(cx, cy, r - 6, actualDeg);
  const needleL = polarXY(cx, cy, 9, actualDeg + 90);
  const needleR = polarXY(cx, cy, 9, actualDeg - 90);
  const tgtOuter = polarXY(cx, cy, r + 13, targetDeg);
  const tgtInner = polarXY(cx, cy, r - 8, targetDeg);
  const tgtLabel = polarXY(cx, cy, r + 24, targetDeg);
  const label0 = polarXY(cx, cy, r + 22, startDeg);
  const labelMax = polarXY(cx, cy, r + 22, startDeg + totalSweep);

  return <Card className="flex flex-col items-center text-center">
    <p className="text-xs font-semibold mb-1" style={{ color: "var(--dt-text-2)" }}>{title}</p>

    <svg width={188} height={140} viewBox="0 0 188 140">
      <defs>
        <linearGradient
          id={`zone-lo-${id}`}
          gradientUnits="userSpaceOnUse"
          x1={polarXY(cx, cy, r, startDeg).x}
          y1={polarXY(cx, cy, r, startDeg).y}
          x2={polarXY(cx, cy, r, targetDeg).x}
          y2={polarXY(cx, cy, r, targetDeg).y}
        >
          <stop offset="0%" stopColor="#EF4444" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#EF4444" stopOpacity={0.08} />
        </linearGradient>
        <linearGradient
          id={`zone-hi-${id}`}
          gradientUnits="userSpaceOnUse"
          x1={polarXY(cx, cy, r, targetDeg).x}
          y1={polarXY(cx, cy, r, targetDeg).y}
          x2={polarXY(cx, cy, r, startDeg + totalSweep).x}
          y2={polarXY(cx, cy, r, startDeg + totalSweep).y}
        >
          <stop offset="0%" stopColor="#22C55E" stopOpacity={0.08} />
          <stop offset="100%" stopColor="#22C55E" stopOpacity={0.22} />
        </linearGradient>
        <linearGradient
          id={`fill-${id}`}
          gradientUnits="userSpaceOnUse"
          x1={polarXY(cx, cy, r, startDeg).x}
          y1={polarXY(cx, cy, r, startDeg).y}
          x2={polarXY(cx, cy, r, actualDeg).x}
          y2={polarXY(cx, cy, r, actualDeg).y}
        >
          <stop offset="0%" stopColor={achieved ? "#16A34A" : "#B91C1C"} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>

      <path
        d={gaugeArc(cx, cy, r, startDeg, startDeg + totalSweep)}
        fill="none"
        stroke="rgba(128,128,128,0.12)"
        strokeWidth={14}
        strokeLinecap="butt"
      />

      <path
        d={gaugeArc(cx, cy, r, startDeg, targetDeg)}
        fill="none"
        stroke={`url(#zone-lo-${id})`}
        strokeWidth={14}
        strokeLinecap="butt"
      />
      <path
        d={gaugeArc(cx, cy, r, targetDeg, startDeg + totalSweep)}
        fill="none"
        stroke={`url(#zone-hi-${id})`}
        strokeWidth={14}
        strokeLinecap="butt"
      />

      {actualRatio > 5e-3 && <path
        d={gaugeArc(cx, cy, r, startDeg, actualDeg)}
        fill="none"
        stroke={`url(#fill-${id})`}
        strokeWidth={14}
        strokeLinecap="butt"
      />}

      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const deg = startDeg + t * totalSweep;
        const o = polarXY(cx, cy, r + 8, deg);
        const i = polarXY(cx, cy, r - 4, deg);
        const isTarget = t === 0.5;
        return <line
          key={t}
          x1={i.x}
          y1={i.y}
          x2={o.x}
          y2={o.y}
          stroke={isTarget ? "rgba(255,255,255,0.0)" : "rgba(128,128,128,0.28)"}
          strokeWidth={isTarget ? 0 : 1.5}
          strokeLinecap="round"
        />;
      })}

      <line
        x1={tgtInner.x}
        y1={tgtInner.y}
        x2={tgtOuter.x}
        y2={tgtOuter.y}
        stroke="white"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.9}
      />

      <text
        x={tgtLabel.x}
        y={tgtLabel.y - 2}
        textAnchor="middle"
        fontSize={7}
        fontWeight={700}
        fill="white"
        opacity={0.7}
        fontFamily="Inter, sans-serif"
      >TARGET</text>
      <text
        x={tgtLabel.x}
        y={tgtLabel.y + 8}
        textAnchor="middle"
        fontSize={8}
        fontWeight={700}
        fill="white"
        opacity={0.85}
        fontFamily="DM Mono, monospace"
      >{formatValue(safeTarget)}</text>

      <text
        x={label0.x - 2}
        y={label0.y + 4}
        textAnchor="middle"
        fontSize={8}
        fill="#64748B"
        fontFamily="DM Mono, monospace"
      >0</text>
      <text
        x={labelMax.x + 2}
        y={labelMax.y + 4}
        textAnchor="middle"
        fontSize={8}
        fill="#64748B"
        fontFamily="DM Mono, monospace"
      >{formatValue(rangeMax)}</text>

      <polygon
        points={`${needleTip.x.toFixed(1)},${needleTip.y.toFixed(1)} ${needleL.x.toFixed(1)},${needleL.y.toFixed(1)} ${needleR.x.toFixed(1)},${needleR.y.toFixed(1)}`}
        fill={color}
        opacity={0.95}
      />
      <circle cx={cx} cy={cy} r={9} fill="var(--dt-card)" stroke={color} strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={4} fill={color} />
    </svg>

    <div className="flex flex-col items-center gap-0.5 mt-1">
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-3xl font-bold leading-none" style={{ color }}>{formatValue(actual)}</span>
        <span className="text-xs font-medium" style={{ color: "var(--dt-text-3)" }}></span>
      </div>
      <span className="text-xs" style={{ color: "var(--dt-text-4)" }}>Target {formatValue(safeTarget)}</span>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="font-mono text-xl font-bold leading-none" style={{ color }}>{fmt(achPct, 1)}%</span>
        <span className="text-xs" style={{ color: "var(--dt-text-3)" }}>achievement</span>
      </div>
      <span
        className="text-xs px-3 py-0.5 rounded-full font-semibold mt-2"
        style={{ background: achieved ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color }}
      >
        {achieved ? "\u2713 On Target" : "\u2717 Below Target"}
      </span>
    </div>
  </Card>;
}
