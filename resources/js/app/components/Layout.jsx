import React, { useState, useEffect, createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import { Sun, Moon, Calendar, ChevronDown, Download } from "lucide-react";
import axios from "axios";
import Sidebar from "./Sidebar";
import { ChartDetailPopover } from "../DashboardComponents";

// ── Global Date Filter Context ─────────────────────────────────────────────
const DateFilterContext = createContext({
  dateFilter: { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
  setDateFilter: () => { },
});

export function useDateFilter() {
  return useContext(DateFilterContext);
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const YEARS = [2024, 2025];

function DateFilterDropdown({ dateFilter, setDateFilter }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-end relative">
      <span className="text-[10px] uppercase font-bold tracking-widest mb-1" style={{ color: "var(--dt-text-4)" }}>Filter Year</span>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{
          background: "var(--dt-dd-bg)",
          border: "1px solid var(--dt-dd-border)",
          color: "var(--dt-dd-text)",
        }}
      >
        <Calendar size={13} />
        {dateFilter.year}
        <ChevronDown size={12} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown panel */}
          <div
            className="absolute right-0 top-full mt-2 z-50 rounded-xl p-2 shadow-xl"
            style={{
              background: "var(--dt-card)",
              border: "1px solid var(--dt-card-border)",
              minWidth: 140,
            }}
          >
            <div className="flex flex-col gap-1">
              {YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => {
                    setDateFilter((prev) => ({ ...prev, year: y }));
                    setIsOpen(false);
                  }}
                  className="px-3 py-2 rounded-md text-xs font-medium transition-colors text-left"
                  style={{
                    background: dateFilter.year === y ? "var(--dt-dd-bg)" : "transparent",
                    color: dateFilter.year === y ? "var(--dt-dd-text)" : "var(--dt-text-2)",
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DownloadReportButton({ dateFilter }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await axios.get("/api/dashboard/summary", { params: dateFilter });
      const data = res.data || {};
      
      let csvContent = `BUSINESS INTELLIGENCE REPORT - ${dateFilter.year}\n`;
      csvContent += `Generated at: ${new Date().toLocaleString()}\n\n`;

      if (data.revenueTable && data.revenueTable.length) {
        csvContent += "REVENUE SUMMARY (Bn)\n";
        csvContent += "Metric,MTD (Bn),MoM %,YoY %,YTD (Bn)\n";
        data.revenueTable.forEach(row => {
          csvContent += `"${row.label}",${row.mtd},${row.mom}%,${row.yoy}%,${row.ytd}\n`;
        });
        csvContent += "\n";
      }

      if (data.bbPackTable && data.bbPackTable.length) {
        csvContent += "REVENUE BROADBAND PACK (Bn)\n";
        csvContent += "Metric,MTD (Bn),MoM %,YoY %,YTD (Bn)\n";
        data.bbPackTable.forEach(row => {
          csvContent += `"${row.label}",${row.mtd},${row.mom}%,${row.yoy}%,${row.ytd}\n`;
        });
        csvContent += "\n";
      }

      if (data.driverTable && data.driverTable.length) {
        csvContent += "REVENUE DRIVER (M)\n";
        csvContent += "Metric,MTD (M),MoM %,YoY %,YTD (M)\n";
        data.driverTable.forEach(row => {
          csvContent += `"${row.label}",${row.mtd},${row.mom}%,${row.yoy}%,${row.ytd}\n`;
        });
        csvContent += "\n";
      }

      if (data.breakdown && data.breakdown.length) {
        csvContent += "REVENUE BREAKDOWN\n";
        csvContent += "Segment,MoM %,YoY %,YTD %\n";
        data.breakdown.forEach(row => {
          csvContent += `"${row.name}",${row.mom}%,${row.yoy}%,${row.ytd}%\n`;
        });
        csvContent += "\n";
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `BI_Report_${dateFilter.year}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading report:", err);
      alert("Failed to download CSV report.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-50"
      style={{
        background: "#3B82F6",
        color: "#FFFFFF",
      }}
      title="Download Comprehensive Report (CSV)"
    >
      <Download size={13} />
      <span>{downloading ? "Exporting..." : "Download CSV"}</span>
    </button>
  );
}

// ── Main Layout ────────────────────────────────────────────────────────────
export default function Layout() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [dateFilter, setDateFilter] = useState({
    month: 12,  // Default to December (last month with full data)
    year: 2025,
  });

  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <DateFilterContext.Provider value={{ dateFilter, setDateFilter }}>
      <div
        className={`min-h-screen w-full flex ${isDark ? "dark" : ""}`}
        style={{
          background: "var(--dt-bg)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4"
            style={{ background: "var(--dt-header-bg)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--dt-card-border)" }}>
            <div>
              <h2 className="text-sm font-bold tracking-tight" style={{ color: "var(--dt-text-1)" }}>Business Intelligence</h2>
              <p className="text-xs" style={{ color: "var(--dt-text-4)" }}>
                Viewing: {dateFilter.year}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <DownloadReportButton dateFilter={dateFilter} />
              <DateFilterDropdown dateFilter={dateFilter} setDateFilter={setDateFilter} />
              <button onClick={() => setIsDark((d) => !d)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: "var(--dt-pill-bg)", border: "1px solid var(--dt-pill-border)", color: "var(--dt-text-2)" }}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-x-hidden p-6 max-w-[1600px]">
            <Outlet />
          </main>
        </div>
      </div>
      <ChartDetailPopover />
    </DateFilterContext.Provider>
  );
}
