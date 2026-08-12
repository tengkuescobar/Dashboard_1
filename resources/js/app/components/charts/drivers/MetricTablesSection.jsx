import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table2, TrendingUp, TrendingDown } from "lucide-react";
import { useDateFilter } from "../../Layout";
import { C } from "../../../utils/formatters";
import { Card } from "../../ui/ChartUIComponents";

function MetricTable({ title, cornerLabel, rows, mtdUnit = "Bn", ytdUnit = "Bn" }) {
  const cols = [
    { key: "mtd", label: "MTD", isPct: false },
    { key: "mom", label: "MoM", isPct: true },
    { key: "yoy", label: "YoY", isPct: true },
    { key: "ytd", label: "YTD", isPct: false }
  ];
  return <Card className="flex flex-col">
      <p className="text-xs font-semibold mb-3" style={{ color: "var(--dt-text-2)" }}>{title}</p>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--dt-section-border)" }}>
              <th className="text-left py-2 pr-3 font-bold text-xs whitespace-nowrap" style={{ color: "#3B82F6", minWidth: 110 }}>{cornerLabel}</th>
              {cols.map((c) => <th key={c.key} className="text-right py-2 px-2 font-semibold" style={{ color: "var(--dt-text-3)" }}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => <tr
              key={ri}
              className="transition-colors"
              style={{ borderBottom: "1px solid var(--dt-row-border)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--dt-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
                <td className="py-2.5 pr-3 font-medium whitespace-nowrap" style={{ color: "var(--dt-text-2)" }}>{row.label}</td>
                {cols.map((c) => {
                  const val = row[c.key];
                  if (c.isPct) {
                    const pos = val >= 0;
                    return <td key={c.key} className="text-right py-2.5 px-2">
                        <span className="inline-flex items-center justify-end gap-0.5 font-mono font-semibold" style={{ color: pos ? C.success : C.danger }}>
                          {pos ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                          {pos ? "+" : ""}{val.toFixed(1)}%
                        </span>
                      </td>;
                  }
                  const unit = c.key === "mtd" ? mtdUnit : ytdUnit;
                  return <td key={c.key} className="text-right py-2.5 px-2 font-mono" style={{ color: "var(--dt-text-1)" }}>
                      {val.toFixed(1)}<span className="text-xs ml-0.5" style={{ color: "var(--dt-text-4)" }}>{unit}</span>
                    </td>;
                })}
              </tr>)}
          </tbody>
        </table>
      </div>
    </Card>;
}

export function MetricTablesSection() {
  const { dateFilter } = useDateFilter();
  const [data, setData] = useState({
    revenueTable: [],
    bbPackTable: [],
    driverTable: []
  });
  useEffect(() => {
    axios.get("/api/dashboard/summary", { params: dateFilter }).then((res) => {
      setData({
        revenueTable: res.data.revenueTable || [],
        bbPackTable: res.data.bbPackTable || [],
        driverTable: res.data.driverTable || []
      });
    });
  }, [dateFilter]);
  return <div className="space-y-3">
      <p className="text-xs font-semibold tracking-widest uppercase flex items-center gap-2" style={{ color: "var(--dt-text-3)" }}>
        <Table2 size={13} style={{ color: "#3B82F6" }} />
        Revenue &amp; Driver Metrics
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MetricTable title="Revenue" cornerLabel="Revenue" rows={data.revenueTable} />
        <MetricTable title="Revenue Broadband Pack" cornerLabel="Revenue" rows={data.bbPackTable} />
        <MetricTable title="Revenue Driver" cornerLabel="Driver" rows={data.driverTable} mtdUnit="M" ytdUnit="M" />
      </div>
    </div>;
}
