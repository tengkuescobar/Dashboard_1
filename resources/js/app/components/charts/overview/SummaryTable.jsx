import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table2 } from "lucide-react";
import { useDateFilter } from "../../Layout";
import { C, fmt, formatValue } from "../../../utils/formatters";
import { Card, SectionTitle } from "../../ui/ChartUIComponents";
import { ChartSkeleton } from "../../ui/skeleton";

export function SummaryTable() {
  const { dateFilter } = useDateFilter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    axios.get("/api/dashboard/summary", { params: dateFilter }).then((res) => {
      setData(res.data.revenueTable || []);
      setLoading(false);
    });
  }, [dateFilter]);
  if (loading) {
    return <Card>
        <SectionTitle icon={Table2} label="Revenue Summary" />
        <ChartSkeleton height={200} />
      </Card>;
  }
  return <Card>
      <SectionTitle icon={Table2} label="Revenue Summary" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--dt-card-border)" }}>
              {["Metric", "MTD (Bn)", "MoM %", "YoY %", "YTD (Bn)"].map((h, i) => <th key={i} className={`py-2 pb-3 text-xs font-semibold${i > 0 ? " text-right" : " text-left"}`} style={{ color: "var(--dt-text-3)" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => <tr
              key={i}
              className="transition-colors"
              style={{ borderBottom: "1px solid var(--dt-row-border)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--dt-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
                <td className="py-3 font-medium text-sm" style={{ color: "var(--dt-text-1)" }}>{row.label}</td>
                <td className="text-right py-3 font-mono text-sm font-medium" style={{ color: "var(--dt-text-1)" }}>{formatValue(row.mtd)}</td>
                <td className="text-right py-3">
                  <span
                    className="font-mono text-xs font-semibold px-2 py-1 rounded"
                    style={{ background: row.mom >= 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: row.mom >= 0 ? C.success : C.danger }}
                  >
                    {row.mom > 0 ? "+" : ""}{fmt(row.mom, 1)}%
                  </span>
                </td>
                <td className="text-right py-3">
                  <span
                    className="font-mono text-xs font-semibold px-2 py-1 rounded"
                    style={{ background: row.yoy >= 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: row.yoy >= 0 ? C.success : C.danger }}
                  >
                    {row.yoy > 0 ? "+" : ""}{fmt(row.yoy, 1)}%
                  </span>
                </td>
                <td className="text-right py-3 font-mono text-sm font-medium" style={{ color: "var(--dt-text-1)" }}>{formatValue(row.ytd)}</td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </Card>;
}
