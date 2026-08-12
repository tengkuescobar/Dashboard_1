import React, { useState, useEffect } from "react";
import axios from "axios";
import { Gauge } from "lucide-react";
import { useDateFilter } from "../components/Layout";
import {
  SummaryTable,
  GaugeChart,
  BreakdownList,
} from "../DashboardComponents";

export default function DashboardOverview() {
  const { dateFilter } = useDateFilter();
  const [gaugeData, setGaugeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get("/api/dashboard/summary", { params: dateFilter })
      .then((res) => {
        setGaugeData(res.data.gaugeData || []);
        setLoading(false);
      });
  }, [dateFilter]);

  return (
    <div className="space-y-5">
      <SummaryTable />

      {/* Gauges */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase mb-3 flex items-center gap-2" style={{ color: "var(--dt-text-3)" }}>
          <Gauge size={13} style={{ color: "#3B82F6" }} />
          Target vs Actual
        </p>
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

      {/* Breakdown list */}
      <BreakdownList />
      
      <div className="h-4" />
    </div>
  );
}
