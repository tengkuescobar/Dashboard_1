export const C = {
  bau: "#3B82F6",
  newSales: "#F59E0B",
  existing: "#3B82F6",
  acquisition: "#8B5CF6",
  core: "#06B6D4",
  cvmBtl: "#F97316",
  physVoucher: "#EC4899",
  broadband: "#3B82F6",
  digital: "#A78BFA",
  ir: "#F59E0B",
  voice: "#06B6D4",
  sms: "#22C55E",
  others: "#6B7280",
  success: "#22C55E",
  danger: "#EF4444"
};

export const fmt = (n, dec = 1) => {
  if (n == null || isNaN(n)) return "0";
  return n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

export const pctSign = (n, dec = 1) => {
  if (n == null || isNaN(n)) return "0.0%";
  return (n > 0 ? "+" : "") + n.toFixed(dec) + "%";
};

export const formatValue = (value) => {
  if (value == null || value === "") return "0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || num === 0) return "0";
  const absVal = Math.abs(num);
  if (absVal >= 1e9) {
    return (num / 1e9).toFixed(2).replace(/\.00$/, "") + " Bn";
  } else if (absVal >= 1e6) {
    return (num / 1e6).toFixed(2).replace(/\.?0+$/, "") + " M";
  } else if (absVal >= 1e3) {
    return (num / 1e3).toFixed(2).replace(/\.00$/, "") + " k";
  }
  return num.toFixed(2).replace(/\.00$/, "");
};

export const axisProps = {
  tick: { fill: "var(--dt-text-3)", fontSize: 11, fontFamily: "DM Mono, monospace" },
  axisLine: false,
  tickLine: false
};

export function getNiceDomainMax(val) {
  if (!val || val <= 0) return 10;
  const target = val * 1.25;
  if (target <= 1) return Number(target.toFixed(1));
  if (target <= 5) return Math.ceil(target);
  if (target <= 10) return Math.ceil(target / 2) * 2;
  if (target <= 50) return Math.ceil(target / 5) * 5;
  if (target <= 100) return Math.ceil(target / 10) * 10;
  if (target <= 500) return Math.ceil(target / 50) * 50;
  if (target <= 1000) return Math.ceil(target / 100) * 100;
  return Math.ceil(target / 500) * 500;
}

export const formatYAxisTick = (v) => {
  if (v == null || isNaN(v)) return "0";
  if (v === 0) return "0";
  if (v >= 1000) return formatValue(v);
  return Number.isInteger(v) ? v : Number(v.toFixed(1));
};

export function polarXY(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function gaugeArc(cx, cy, r, startDeg, endDeg) {
  const s = polarXY(cx, cy, r, startDeg);
  const e = polarXY(cx, cy, r, endDeg);
  let sweep = endDeg - startDeg;
  if (sweep <= 0) sweep += 360;
  const large = sweep > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

export function to100Pct(data, keys) {
  return data.map((row) => {
    const total = keys.reduce((s, k) => s + (Number(row[k]) || 0), 0);
    const out = { p: row.p };
    keys.forEach((k) => {
      out[k] = total > 0 ? +(Number(row[k]) / total * 100).toFixed(1) : 0;
    });
    return out;
  });
}

export function getRawValue(item) {
  if (Array.isArray(item.value)) return item.value[1] - item.value[0];
  return Number(item.value) || 0;
}

export const formatTooltipNum = (value) => {
  if (value == null || value === "") return "0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  return Math.round(num).toLocaleString("en-US");
};

export function withPctFields(rows, keys, suffix = "_pct") {
  return rows.map((row, i) => {
    const prev = rows[i - 1];
    const extra = {};
    keys.forEach((k) => {
      extra[`${k}${suffix}`] = prev && prev[k] ? +((Number(row[k]) - Number(prev[k])) / Number(prev[k]) * 100).toFixed(1) : null;
    });
    return { ...row, ...extra };
  });
}
