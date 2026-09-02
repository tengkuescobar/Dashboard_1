import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import { Sun, Moon, Calendar, ChevronDown } from "lucide-react";
import axios from "axios";
import Sidebar from "./Sidebar";
import { ChartDetailPopover } from "../DashboardComponents";

// ── Global Date Filter Context ─────────────────────────────────────────────
const DateFilterContext = createContext({
  dateFilter: { month: "All", quarter: "All", year: new Date().getFullYear() },
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

const QUARTERS = ["All", "Q1", "Q2", "Q3", "Q4"];
const MONTHS_LIST = ["All", ...MONTHS];

function FilterDropdown({ label, value, options, onChange, width = 140 }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-start relative">
      <span className="text-[10px] uppercase font-bold tracking-widest mb-1" style={{ color: "var(--dt-text-4)" }}>{label}</span>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-w-[80px]"
        style={{
          background: "var(--dt-dd-bg)",
          border: "1px solid var(--dt-dd-border)",
          color: "var(--dt-dd-text)",
        }}
      >
        <span className="flex items-center gap-2">
          {label === 'Filter Year' && <Calendar size={13} />}
          {value}
        </span>
        <ChevronDown size={12} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute left-0 top-full mt-2 z-50 rounded-xl p-2 shadow-xl max-h-64 overflow-y-auto"
            style={{
              background: "var(--dt-card)",
              border: "1px solid var(--dt-card-border)",
              minWidth: width,
            }}
          >
            <div className="flex flex-col gap-1">
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className="px-3 py-2 rounded-md text-xs font-medium transition-colors text-left"
                  style={{
                    background: value === opt ? "var(--dt-dd-bg)" : "transparent",
                    color: value === opt ? "var(--dt-dd-text)" : "var(--dt-text-2)",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DateFilters({ dateFilter, setDateFilter }) {
  return (
    <div className="flex items-center gap-3">
      <FilterDropdown
        label="Filter Month"
        value={dateFilter.month === "All" ? "All" : MONTHS[dateFilter.month - 1]}
        options={MONTHS_LIST}
        onChange={(m) => {
          if (m === "All") setDateFilter(p => ({ ...p, month: "All" }));
          else setDateFilter(p => ({ ...p, month: MONTHS.indexOf(m) + 1 }));
        }}
        width={140}
      />
      <FilterDropdown
        label="Filter Quarter"
        value={dateFilter.quarter}
        options={QUARTERS}
        onChange={(q) => setDateFilter(p => ({ ...p, quarter: q }))}
        width={100}
      />
      <FilterDropdown
        label="Filter Year"
        value={dateFilter.year}
        options={YEARS}
        onChange={(y) => setDateFilter(p => ({ ...p, year: y }))}
        width={100}
      />
    </div>
  );
}

// ── Main Layout ────────────────────────────────────────────────────────────
export default function Layout() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Read initial filter from URL query params (persist across refresh)
  const [dateFilter, setDateFilterState] = useState(() => {
    const urlYear = searchParams.get("year");
    const urlMonth = searchParams.get("month");
    const urlQuarter = searchParams.get("quarter");

    return {
      month: urlMonth ? (urlMonth === "All" ? "All" : parseInt(urlMonth, 10)) : "All",
      quarter: urlQuarter || "All",
      year: urlYear ? parseInt(urlYear, 10) : 2025,
    };
  });

  // Whenever dateFilter changes, sync it to URL search params
  const setDateFilter = useCallback((updater) => {
    setDateFilterState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;

      // Update URL params without full page reload
      setSearchParams({
        year: String(next.year),
        month: String(next.month),
        quarter: String(next.quarter),
      }, { replace: true });

      return next;
    });
  }, [setSearchParams]);

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
              <DateFilters dateFilter={dateFilter} setDateFilter={setDateFilter} />
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

