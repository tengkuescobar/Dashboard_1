import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { MapPin } from "lucide-react";
import { useDateFilter } from "../../Layout";
import { Card, SectionTitle } from "../../ui/ChartUIComponents";
import { ChartSkeleton } from "../../ui/skeleton";
import { formatValue } from "../../../utils/formatters";

const AREA_COLORS = {
  "Area 1 Sumatera": "#3B82F6",
  "Area 2 Jabotabek": "#F59E0B",
  "Area 3 Jawa Bali": "#10B981",
  "Area 4 Pamasuka": "#8B5CF6",
};

const AREA_COLORS_LIGHT = {
  "Area 1 Sumatera": "rgba(59,130,246,0.15)",
  "Area 2 Jabotabek": "rgba(245,158,11,0.15)",
  "Area 3 Jawa Bali": "rgba(16,185,129,0.15)",
  "Area 4 Pamasuka": "rgba(139,92,246,0.15)",
};

// Simplified SVG paths for Indonesia's 4 areas
const AREA_PATHS = {
  "Area 1 Sumatera": "M 30 55 L 45 30 L 70 25 L 85 40 L 95 60 L 90 85 L 75 105 L 55 115 L 35 100 L 25 80 Z",
  "Area 2 Jabotabek": "M 100 65 L 115 55 L 140 50 L 155 55 L 160 70 L 155 90 L 140 100 L 120 95 L 105 85 Z",
  "Area 3 Jawa Bali": "M 165 60 L 190 52 L 220 50 L 250 55 L 270 60 L 275 75 L 260 90 L 230 95 L 200 90 L 175 85 L 165 75 Z",
  "Area 4 Pamasuka": "M 280 35 L 310 20 L 350 15 L 380 25 L 395 40 L 390 60 L 375 80 L 350 95 L 320 100 L 295 90 L 280 70 L 275 50 Z",
};

// Label positions for each area
const AREA_LABELS = {
  "Area 1 Sumatera": { x: 60, y: 65 },
  "Area 2 Jabotabek": { x: 130, y: 72 },
  "Area 3 Jawa Bali": { x: 218, y: 70 },
  "Area 4 Pamasuka": { x: 338, y: 55 },
};

const SHORT_NAMES = {
  "Area 1 Sumatera": "Sumatera",
  "Area 2 Jabotabek": "Jabotabek",
  "Area 3 Jawa Bali": "Jawa Bali",
  "Area 4 Pamasuka": "Pamasuka",
};

export function IndonesiaGeoChart() {
  const { dateFilter } = useDateFilter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredArea, setHoveredArea] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const fetchData = useCallback(() => {
    setLoading(true);
    axios
      .get("/api/dashboard/revenue-by-area", { params: dateFilter })
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const grandTotal = data.reduce((sum, a) => sum + a.total, 0);

  if (loading) {
    return (
      <Card>
        <SectionTitle icon={MapPin} label="Revenue by Area" />
        <ChartSkeleton height={200} />
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle icon={MapPin} label="Revenue by Area" />

      <div className="relative">
        {/* SVG Map */}
        <svg
          viewBox="0 0 420 120"
          className="w-full"
          style={{ maxHeight: 180 }}
        >
          {/* Sea background */}
          <rect x="0" y="0" width="420" height="120" rx="8" fill="none" />

          {Object.entries(AREA_PATHS).map(([areaName, path]) => {
            const areaData = data.find((d) => d.area === areaName);
            const revenue = areaData?.total || 0;
            const pct = grandTotal > 0 ? ((revenue / grandTotal) * 100).toFixed(1) : 0;
            const color = AREA_COLORS[areaName];
            const isHovered = hoveredArea === areaName;

            return (
              <g key={areaName}>
                <path
                  d={path}
                  fill={isHovered ? color : AREA_COLORS_LIGHT[areaName]}
                  stroke={color}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  style={{
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    filter: isHovered ? `drop-shadow(0 0 8px ${color}60)` : "none",
                  }}
                  onMouseEnter={(e) => {
                    setHoveredArea(areaName);
                    const rect = e.currentTarget.closest("svg").getBoundingClientRect();
                    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10 });
                  }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.closest("svg").getBoundingClientRect();
                    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10 });
                  }}
                  onMouseLeave={() => setHoveredArea(null)}
                />
                {/* Area label */}
                <text
                  x={AREA_LABELS[areaName].x}
                  y={AREA_LABELS[areaName].y - 4}
                  textAnchor="middle"
                  fontSize="7"
                  fontWeight="700"
                  style={{ fill: color, pointerEvents: "none" }}
                >
                  {SHORT_NAMES[areaName]}
                </text>
                <text
                  x={AREA_LABELS[areaName].x}
                  y={AREA_LABELS[areaName].y + 7}
                  textAnchor="middle"
                  fontSize="6"
                  fontWeight="600"
                  style={{ fill: "var(--dt-text-2)", pointerEvents: "none" }}
                  fontFamily="DM Mono, monospace"
                >
                  {pct}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredArea && (() => {
          const areaData = data.find((d) => d.area === hoveredArea);
          if (!areaData) return null;
          const pct = grandTotal > 0 ? ((areaData.total / grandTotal) * 100).toFixed(1) : 0;

          return (
            <div
              className="absolute z-50 pointer-events-none"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div
                className="p-3 rounded-xl shadow-xl text-xs min-w-[180px]"
                style={{
                  background: "var(--dt-card)",
                  border: `2px solid ${AREA_COLORS[hoveredArea]}`,
                }}
              >
                <p className="font-bold mb-2" style={{ color: AREA_COLORS[hoveredArea] }}>
                  {hoveredArea}
                </p>
                <p className="mb-1" style={{ color: "var(--dt-text-2)" }}>
                  Total: <span className="font-bold" style={{ color: "var(--dt-text-1)" }}>Rp {formatValue(areaData.total)}</span>
                  <span className="ml-1 text-gray-500 font-mono">({pct}%)</span>
                </p>
                <div className="border-t mt-2 pt-2 space-y-1" style={{ borderColor: "var(--dt-card-border)" }}>
                  {areaData.regions.map((r) => (
                    <div key={r.name} className="flex justify-between gap-3" style={{ color: "var(--dt-text-3)" }}>
                      <span className="truncate">{r.name.replace("Region ", "")}</span>
                      <span className="font-mono font-medium whitespace-nowrap" style={{ color: "var(--dt-text-1)" }}>
                        Rp {formatValue(r.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Area Legend Bar */}
      <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
        {data.map((area) => {
          const pct = grandTotal > 0 ? ((area.total / grandTotal) * 100).toFixed(1) : 0;
          const color = AREA_COLORS[area.area];
          return (
            <div
              key={area.area}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{
                background: `${color}15`,
                border: `1px solid ${color}40`,
                color,
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span>{SHORT_NAMES[area.area]}</span>
              <span className="font-mono font-bold">{pct}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
