import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList } from "recharts";
import { BarChart2 } from "lucide-react";
import { useDateFilter } from "../../Layout";
import { C, axisProps, getNiceDomainMax, formatYAxisTick } from "../../../utils/formatters";
import { exportToCSV } from "../../../utils/csvExport";
import {
  Card,
  SectionTitle,
  Dropdown,
  LabelToggle,
  ChartDownloadButton,
  ChartLegend,
  SegmentPill,
  makeTopLabel,
  handleBarHover,
  ChartHoverPopoverCard
} from "../../ui/ChartUIComponents";
import { ChartSkeleton } from "../../ui/Skeleton";

export const REV_ALL_SERIES = [
  { key: "BAU", pkey: "rv_bau", tkey: "rv_bau_t", pct: "rv_bau_p", color: C.bau },
  { key: "New Sales", pkey: "rv_ns", tkey: "rv_ns_t", pct: "rv_ns_p", color: C.newSales }
];

export function RevenueStackedBar() {
  const { dateFilter } = useDateFilter();
  const [period, setPeriod] = useState("Monthly");
  const [category, setCategory] = useState("All");
  const [showLabels, setShowLabels] = useState(true);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredState, setHoveredState] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    axios.get("/api/dashboard/revenue-by-sales-type", {
      params: { ...dateFilter, grain: period }
    }).then((res) => {
      setRawData(res.data);
      setLoading(false);
    });
  }, [dateFilter, period]);

  const catOptions = ["All", ...REV_ALL_SERIES.map((s) => s.key)];
  const activeSeries = category === "All" ? REV_ALL_SERIES : REV_ALL_SERIES.filter((s) => s.key === category);
  const data = rawData.map((d) => {
    const out = { p: d.p };
    activeSeries.forEach((s) => {
      out[s.pkey] = d[s.key] || 0;
    });
    out.rv_total = activeSeries.reduce((sum, s) => sum + (d[s.key] || 0), 0);
    return out;
  });
  const totals = data.map((d) => d.rv_total);
  const pcts = totals.map((t, i) => i === 0 || totals[i - 1] === 0 ? null : +((t - totals[i - 1]) / totals[i - 1] * 100).toFixed(2));
  pcts.forEach((p, i) => {
    data[i]._tp = p;
  });
  const TopLabel = makeTopLabel(totals, pcts, true);
  const maxTotal = totals.length ? Math.max(...totals) : 0;
  const barSize = period === "Monthly" ? 54 : period === "Weekly" ? 38 : 28;

  return <Card>
      <div className="flex items-center justify-between mb-3">
        <SectionTitle icon={BarChart2} label="TOTAL REVENUE PERFORMANCE - STACKED ANALYSIS" />
        <div className="flex gap-2 items-center">
          {activeSeries.length > 1 && <LabelToggle on={showLabels} onToggle={() => setShowLabels((v) => !v)} />}
          <Dropdown value={category} options={catOptions} onChange={setCategory} />
          <Dropdown value={period} options={["Daily", "Weekly", "Monthly"]} onChange={setPeriod} />
          <ChartDownloadButton
            onClick={() => {
              const headers = ["Period", ...activeSeries.map(s => s.key), "Total Revenue"];
              const rows = data.map(d => [d.p, ...activeSeries.map(s => Number(d[s.pkey] || 0).toLocaleString("en-US", {maximumFractionDigits: 1})), Number(d.rv_total || 0).toLocaleString("en-US", {maximumFractionDigits: 1})]);
              const summaryRow = ["Total", ...activeSeries.map(s => data.reduce((acc, d) => acc + (Number(d[s.pkey]) || 0), 0).toLocaleString("en-US", {maximumFractionDigits: 1})), data.reduce((acc, d) => acc + (Number(d.rv_total) || 0), 0).toLocaleString("en-US", {maximumFractionDigits: 1})];
              exportToCSV({
                filename: `Revenue_Analysis_${period}_${category}`,
                title: "Revenue Analysis Report",
                subtitle: `Grain: ${period} | Category: ${category} | Year: ${dateFilter.year || 'All'}`,
                headers,
                rows,
                summaryRow
              });
            }}
          />
        </div>
      </div>
      {loading ? <ChartSkeleton height={300} /> : <>
          <ChartLegend items={[
            ...activeSeries.map((s) => ({ label: s.key, color: s.color })),
            { label: "Total", color: "#94a3b8" }
          ]} />
          <div ref={containerRef} className="relative" onMouseLeave={() => setHoveredState(null)}>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={data}
                barSize={barSize}
                margin={{ top: 40, right: 10, bottom: 0, left: 10 }}
                onMouseMove={(state) => {
                  if (state && state.activePayload && state.activePayload.length) {
                    setHoveredState(state);
                  }
                }}
                onMouseLeave={() => setHoveredState(null)}
              >
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--dt-grid)" vertical={false} />
                <XAxis key="xaxis" dataKey="p" {...axisProps} allowDuplicatedCategory={false} />
                <YAxis key="yaxis" {...axisProps} domain={[0, getNiceDomainMax(maxTotal)]} tickFormatter={formatYAxisTick} width={65} />
                {activeSeries.map((s, i) => <Bar
                  key={s.pkey}
                  dataKey={s.pkey}
                  name={s.key}
                  stackId="rv"
                  fill={s.color}
                  radius={i === activeSeries.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                  className="transition-all duration-200 hover:brightness-110 hover:opacity-90 cursor-pointer"
                  onMouseEnter={(bData, bIdx, e) => handleBarHover(bData, bIdx, e, activeSeries, containerRef, setHoveredState)}
                  onMouseMove={(bData, bIdx, e) => handleBarHover(bData, bIdx, e, activeSeries, containerRef, setHoveredState)}
                >
                    {activeSeries.length > 1 && showLabels && <LabelList dataKey={s.pkey} content={SegmentPill} />}
                    {i === activeSeries.length - 1 && <LabelList dataKey={s.pkey} content={TopLabel} />}
                  </Bar>)}
              </ComposedChart>
            </ResponsiveContainer>
            <ChartHoverPopoverCard hoveredState={hoveredState} dataLength={data.length} />
          </div>
        </>}
    </Card>;
}
