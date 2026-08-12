import React, { useState, useEffect } from "react";
import axios from "axios";
import { List } from "lucide-react";
import { useDateFilter } from "../../Layout";
import { C } from "../../../utils/formatters";
import { Card, SectionTitle, PctPill } from "../../ui/ChartUIComponents";
import { ChartSkeleton } from "../../ui/skeleton";

export function BreakdownList() {
  const { dateFilter } = useDateFilter();
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    axios.get("/api/dashboard/summary", { params: dateFilter }).then((res) => {
      setBreakdown(res.data.breakdown || []);
      setLoading(false);
    });
  }, [dateFilter]);
  const getColor = (name) => {
    switch (name) {
      case "Broadband":
        return C.broadband;
      case "Digital":
        return C.digital;
      case "IR":
        return C.ir;
      case "Voice":
        return C.voice;
      case "SMS":
        return C.sms;
      default:
        return C.others;
    }
  };
  if (loading) {
    return <Card>
        <SectionTitle icon={List} label="Revenue Breakdown — MoM / YoY / YTD" />
        <ChartSkeleton height={200} />
      </Card>;
  }
  return <Card>
      <SectionTitle icon={List} label="Revenue Breakdown — MoM / YoY / YTD" />
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--dt-card-border)" }}>
              {["Segment", "MoM %", "YoY %", "YTD %"].map((h, i) => <th key={i} className={`py-2 pb-3 text-xs font-semibold${i > 0 ? " text-right" : " text-left"}`} style={{ color: "var(--dt-text-3)" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {breakdown.map((row, i) => <tr
              key={i}
              className="transition-colors"
              style={{ borderBottom: "1px solid var(--dt-row-border)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--dt-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-6 rounded-full flex-shrink-0" style={{ background: getColor(row.name) }} />
                    <span className="text-sm font-medium" style={{ color: "var(--dt-text-1)" }}>{row.name}</span>
                  </div>
                </td>
                <td className="text-right py-3"><PctPill value={row.mom} /></td>
                <td className="text-right py-3"><PctPill value={row.yoy} /></td>
                <td className="text-right py-3"><PctPill value={row.ytd} /></td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </Card>;
}
