import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { MapPin, Maximize2, Minimize2 } from "lucide-react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { useDateFilter } from "../../Layout";
import { Card, SectionTitle } from "../../ui/ChartUIComponents";
import { ChartSkeleton } from "../../ui/skeleton";
import { formatValue } from "../../../utils/formatters";

// Use a simplified GeoJSON for Indonesia provinces
const GEO_URL = "https://raw.githubusercontent.com/superpikar/indonesia-geojson/master/indonesia-province-simple.json";

const AREA_COLORS = {
  "Area 1 Sumatera": "#3B82F6",
  "Area 2 Jabotabek": "#E11D48", // Changed to pink/reddish as requested
  "Area 3 Jawa Bali": "#0F766E", // Changed to teal/dark green as requested
  "Area 4 Pamasuka": "#F97316", // Orange as requested
};

const AREA_COLORS_LIGHT = {
  "Area 1 Sumatera": "rgba(59,130,246,0.3)",
  "Area 2 Jabotabek": "rgba(225,29,72,0.3)",
  "Area 3 Jawa Bali": "rgba(15,118,110,0.3)",
  "Area 4 Pamasuka": "rgba(249,115,22,0.3)",
};

const SHORT_NAMES = {
  "Area 1 Sumatera": "Sumatera",
  "Area 2 Jabotabek": "Jabotabek",
  "Area 3 Jawa Bali": "Jawa Bali",
  "Area 4 Pamasuka": "Pamasuka",
};

// Map provinces to 4 Telkomsel Areas
const PROVINCE_TO_AREA = {
  // Sumatera
  "ACEH": "Area 1 Sumatera",
  "SUMATERA UTARA": "Area 1 Sumatera",
  "SUMATERA BARAT": "Area 1 Sumatera",
  "RIAU": "Area 1 Sumatera",
  "JAMBI": "Area 1 Sumatera",
  "SUMATERA SELATAN": "Area 1 Sumatera",
  "BENGKULU": "Area 1 Sumatera",
  "LAMPUNG": "Area 1 Sumatera",
  "KEPULAUAN BANGKA BELITUNG": "Area 1 Sumatera",
  "KEPULAUAN RIAU": "Area 1 Sumatera",
  "NANGGROE ACEH DARUSSALAM": "Area 1 Sumatera",
  "BANGKA BELITUNG": "Area 1 Sumatera",
  
  // Jabotabek
  "DKI JAKARTA": "Area 2 Jabotabek",
  "JAKARTA RAYA": "Area 2 Jabotabek",
  "JAWA BARAT": "Area 2 Jabotabek",
  "BANTEN": "Area 2 Jabotabek",
  
  // Jawa Bali
  "JAWA TENGAH": "Area 3 Jawa Bali",
  "DI YOGYAKARTA": "Area 3 Jawa Bali",
  "YOGYAKARTA": "Area 3 Jawa Bali",
  "JAWA TIMUR": "Area 3 Jawa Bali",
  "BALI": "Area 3 Jawa Bali",
  "NUSA TENGGARA BARAT": "Area 3 Jawa Bali",
  "NUSA TENGGARA TIMUR": "Area 3 Jawa Bali",
  
  // Pamasuka (Kalimantan, Sulawesi, Maluku, Papua)
  "KALIMANTAN BARAT": "Area 4 Pamasuka",
  "KALIMANTAN TENGAH": "Area 4 Pamasuka",
  "KALIMANTAN SELATAN": "Area 4 Pamasuka",
  "KALIMANTAN TIMUR": "Area 4 Pamasuka",
  "KALIMANTAN UTARA": "Area 4 Pamasuka",
  "SULAWESI UTARA": "Area 4 Pamasuka",
  "SULAWESI TENGAH": "Area 4 Pamasuka",
  "SULAWESI SELATAN": "Area 4 Pamasuka",
  "SULAWESI TENGGARA": "Area 4 Pamasuka",
  "GORONTALO": "Area 4 Pamasuka",
  "SULAWESI BARAT": "Area 4 Pamasuka",
  "MALUKU": "Area 4 Pamasuka",
  "MALUKU UTARA": "Area 4 Pamasuka",
  "PAPUA BARAT": "Area 4 Pamasuka",
  "PAPUA": "Area 4 Pamasuka",
  "PAPUA SELATAN": "Area 4 Pamasuka",
  "PAPUA TENGAH": "Area 4 Pamasuka",
  "PAPUA PEGUNUNGAN": "Area 4 Pamasuka",
  "PAPUA BARAT DAYA": "Area 4 Pamasuka",
  "IRIAN JAYA TIMUR": "Area 4 Pamasuka",
  "IRIAN JAYA TENGAH": "Area 4 Pamasuka",
  "IRIAN JAYA BARAT": "Area 4 Pamasuka"
};

// Helper to resolve province name to Area
const getAreaForProvince = (propName) => {
  if (!propName) return null;
  const name = propName.toUpperCase();
  for (const [key, area] of Object.entries(PROVINCE_TO_AREA)) {
    if (name.includes(key)) return area;
  }
  return null;
};

// Main Component
export function IndonesiaGeoChart() {
  const { dateFilter } = useDateFilter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredArea, setHoveredArea] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

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
        <ChartSkeleton height={300} />
      </Card>
    );
  }

  // The inner content extracted so we can render it normally or in fullscreen
  const renderMapContent = () => (
    <div className="flex-1 flex flex-col w-full h-full p-4 relative">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle icon={MapPin} label="Revenue by Area" />
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          style={{ color: "var(--dt-text-2)" }}
          title={isFullscreen ? "Exit Fullscreen" : "View Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      <div className={`relative flex-1 bg-[#f8fcfd] dark:bg-black/20 rounded-xl border border-blue-500/10 overflow-hidden flex flex-col items-center justify-center p-2 ${isFullscreen ? 'min-h-[60vh]' : 'min-h-[300px]'}`}>
        {/* SVG Map via react-simple-maps */}
        <div className="w-full h-full max-w-5xl flex items-center justify-center">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: isFullscreen ? 1400 : 1150,
              center: [118, -2.5]
            }}
            width={800}
            height={400}
            style={{ width: "100%", height: "100%", maxHeight: isFullscreen ? '70vh' : '450px' }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const provinceName = geo.properties.Propinsi || geo.properties.name || geo.properties.NAME_1 || "";
                  const areaName = getAreaForProvince(provinceName);
                  
                  // If no area is selected globally ("All"), show FULL vibrant color for all areas.
                  // If an area is selected, show FULL vibrant color for the selected area, and dim the rest.
                  // On hover, we can slightly brighten or add an outline.
                  const isGlobalAll = dateFilter.area === "All";
                  const isFiltered = !isGlobalAll && dateFilter.area === areaName;
                  const isDimmed = !isGlobalAll && dateFilter.area !== areaName;
                  const isHovered = hoveredArea === areaName;

                  const fullColor = areaName ? AREA_COLORS[areaName] : "#cbd5e1";
                  const lightColor = areaName ? AREA_COLORS_LIGHT[areaName] : "#e2e8f0";

                  let fill = fullColor; // default to full color
                  if (isDimmed) fill = lightColor; // dim if another area is selected
                  if (isHovered && isDimmed) fill = fullColor; // full color if hovered even when dimmed

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke="#ffffff"
                      strokeWidth={isHovered ? 1.5 : 0.8}
                      style={{
                        default: { outline: "none", transition: "all 0.3s" },
                        hover: { outline: "none", fill: activeColor, transition: "all 0.3s", cursor: "pointer" },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={(e) => {
                        if (areaName) {
                          setHoveredArea(areaName);
                          const rect = e.currentTarget.closest("svg").getBoundingClientRect();
                          setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10 });
                        }
                      }}
                      onMouseMove={(e) => {
                        if (areaName) {
                          const rect = e.currentTarget.closest("svg").getBoundingClientRect();
                          setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10 });
                        }
                      }}
                      onMouseLeave={() => setHoveredArea(null)}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        </div>

        {/* Custom Tooltip */}
        {hoveredArea && (() => {
          const areaData = data.find((d) => d.area === hoveredArea);
          if (!areaData) return null;
          const pct = grandTotal > 0 ? ((areaData.total / grandTotal) * 100).toFixed(1) : 0;
          const color = AREA_COLORS[hoveredArea];

          return (
            <div
              className="absolute z-50 pointer-events-none transition-transform"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div
                className="p-3.5 rounded-xl shadow-2xl text-xs min-w-[200px] backdrop-blur-md"
                style={{
                  background: "var(--dt-card)",
                  border: `2px solid ${color}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                  <p className="font-bold text-sm" style={{ color }}>{hoveredArea}</p>
                </div>
                
                <p className="mb-3 flex justify-between items-center" style={{ color: "var(--dt-text-2)" }}>
                  <span>Total Revenue:</span>
                  <span className="font-bold text-sm" style={{ color: "var(--dt-text-1)" }}>Rp {formatValue(areaData.total)}</span>
                </p>

                <div className="border-t border-dashed mt-2 pt-2 space-y-1.5" style={{ borderColor: "var(--dt-border)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--dt-text-4)" }}>Region Breakdown</p>
                  {areaData.regions.map((r) => (
                    <div key={r.name} className="flex justify-between gap-4 items-center" style={{ color: "var(--dt-text-2)" }}>
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
      <div className="flex items-center gap-3 mt-2 mb-2 flex-wrap justify-center p-2 rounded-lg" style={{ background: "var(--dt-bg)" }}>
        {data.map((area) => {
          const pct = grandTotal > 0 ? ((area.total / grandTotal) * 100).toFixed(1) : 0;
          const color = AREA_COLORS[area.area];
          const isSelected = dateFilter.area === area.area;
          const isDimmed = dateFilter.area !== "All" && dateFilter.area !== area.area;

          return (
            <div
              key={area.area}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-transform cursor-pointer ${isSelected ? 'scale-110 shadow-md ring-2 ring-offset-1' : (isDimmed ? 'opacity-50' : 'hover:scale-105')}`}
              style={{
                background: isSelected ? `${color}15` : "var(--dt-card)",
                border: `1.5px solid ${color}`,
                color: "var(--dt-text-1)",
                ringColor: color,
              }}
              onMouseEnter={() => setHoveredArea(area.area)}
              onMouseLeave={() => setHoveredArea(null)}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span>{SHORT_NAMES[area.area]}</span>
              <span className="font-mono" style={{ color }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <>
        <Card className="h-full flex flex-col opacity-0">{/* Placeholder to keep layout spacing */}</Card>
        <div className="fixed inset-0 z-[100] flex flex-col p-6 backdrop-blur-md bg-white/90 dark:bg-[#0f172a]/95">
          <div className="flex-1 w-full max-w-[1400px] mx-auto bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
            {renderMapContent()}
          </div>
        </div>
      </>
    );
  }

  return (
    <Card className="h-full flex flex-col p-0">
      {renderMapContent()}
    </Card>
  );
}
