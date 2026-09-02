import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Gauge, Settings } from "lucide-react";
import { useDateFilter } from "../components/Layout";
import {
  SummaryTable,
  GaugeChart,
  BreakdownList,
} from "../DashboardComponents";
import { TargetManagementModal } from "../components/charts/overview/TargetManagementModal";

export default function DashboardOverview() {
  const { dateFilter } = useDateFilter();
  const [gaugeData, setGaugeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  const fetchSummary = useCallback(() => {
    setLoading(true);
    axios.get("/api/dashboard/summary", { params: dateFilter })
      .then((res) => {
        setGaugeData(res.data.gaugeData || []);
        setLoading(false);
      });
  }, [dateFilter]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="space-y-5">
      <SummaryTable />

      {/* Gauges */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold tracking-widest uppercase flex items-center gap-2" style={{ color: "var(--dt-text-3)" }}>
            <Gauge size={13} style={{ color: "#3B82F6" }} />
            Target vs Actual
          </p>
          <button 
            onClick={() => setIsTargetModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors border"
            style={{ color: "var(--dt-text-2)", borderColor: "var(--dt-border)" }}
          >
            <Settings size={13} />
            Kelola Target
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            <>
              <div className="h-[212px] animate-pulse rounded" style={{ background: "var(--dt-card)" }} />
              <div className="h-[212px] animate-pulse rounded" style={{ background: "var(--dt-card)" }} />
              <div className="h-[212px] animate-pulse rounded" style={{ background: "var(--dt-card)" }} />
            </>
          ) : (
            gaugeData.map((g) => <GaugeChart key={g.title} {...g} />)
          )}
        </div>
      </div>

      <TargetManagementModal 
        isOpen={isTargetModalOpen} 
        onClose={() => setIsTargetModalOpen(false)} 
        onSaved={fetchSummary}
      />

      {/* Breakdown list */}
      <BreakdownList />
      
      <div className="h-4" />
    </div>
  );
}
