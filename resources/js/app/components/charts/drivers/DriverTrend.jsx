import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList } from "recharts";
import { Activity } from "lucide-react";
import { useDateFilter } from "../../Layout";
import { C, axisProps, getNiceDomainMax, formatYAxisTick, formatValue } from "../../../utils/formatters";
import { DRIVER_METRICS } from "../../../data/dashboardMockData";
import { exportToCSV } from "../../../utils/csvExport";
import {
  Card,
  SectionTitle,
  Dropdown,
  ChartDownloadButton,
  makeTopLabel,
  handleBarHover,
  ChartHoverPopoverCard
} from "../../ui/ChartUIComponents";
import { ChartSkeleton } from "../../ui/skeleton";

export function DriverTrend() {
  const { dateFilter } = useDateFilter();
  const [period, setPeriod] = useState("Monthly");
  const [metric, setMetric] = useState("Playing User");
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredState, setHoveredState] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    axios.get("/api/dashboard/driver-trend", {
      params: { ...dateFilter, grain: period, metric }
    }).then((res) => {
      setRawData(res.data);
      setLoading(false);
    });
  }, [dateFilter, period, metric]);

  const data = rawData.map((d, i) => {
    const prev = rawData[i - 1];
    return {
      p: d.p,
      dv_val: d.v,
      dv_val_t: d.v,
      dv_val_p: prev ? +((d.v - prev.v) / prev.v * 100).toFixed(2) : null
    };
  });
  const totals = data.map((d) => d.dv_val);
  const pcts = data.map((d) => d.dv_val_p);
  const TopLabel = makeTopLabel(totals, pcts);
  const maxVal = totals.length ? Math.max(...totals) : 0;

  return <Card>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle icon={Activity} label="Driver Trend" />
        <div className="flex gap-2 items-center">
          <Dropdown value={period} options={["Daily", "Weekly", "Monthly"]} onChange={setPeriod} />
          <Dropdown value={metric} options={DRIVER_METRICS} onChange={setMetric} />
          <ChartDownloadButton
            onClick={() => {
              const headers = ["Period", metric, "Period-over-Period Growth (%)"];
              const rows = data.map(d => [d.p, Number(d.dv_val || 0).toLocaleString("en-US", {maximumFractionDigits: 1}), d.dv_val_p != null ? `${d.dv_val_p > 0 ? '+' : ''}${d.dv_val_p}%` : '-']);
              const totalVal = data.reduce((acc, d) => acc + (Number(d.dv_val) || 0), 0);
              const avgVal = data.length ? totalVal / data.length : 0;
              const summaryRow = ["Average", Number(avgVal).toLocaleString("en-US", {maximumFractionDigits: 1}), ''];
              exportToCSV({
                filename: `Driver_Trend_${metric.replace(/\s+/g, '_')}_${period}`,
                title: `Driver Trend Report (${metric})`,
                subtitle: `Metric: ${metric} | Grain: ${period} | Year: ${dateFilter.year || 'All'}`,
                headers,
                rows,
                summaryRow
              });
            }}
          />
        </div>
      </div>
      {loading ? <ChartSkeleton height={260} /> : <>
          <div className="mb-3">
            <span className="font-mono text-2xl font-bold" style={{ color: "var(--dt-accent-text)" }}>
              {formatValue(data[data.length - 1]?.dv_val ?? 0)}
            </span>
            <span className="text-xs ml-2" style={{ color: "var(--dt-text-3)" }}>latest · {metric}</span>
          </div>
          <div ref={containerRef} className="relative" onMouseLeave={() => setHoveredState(null)}>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart
                data={data}
                barSize={period === "Monthly" ? 50 : period === "Weekly" ? 36 : 26}
                margin={{ top: 40, right: 8, bottom: 0, left: 10 }}
                onMouseMove={(state) => {
                  if (state && state.activePayload && state.activePayload.length) {
                    setHoveredState(state);
                  }
                }}
                onMouseLeave={() => setHoveredState(null)}
              >
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--dt-grid)" vertical={false} />
                <XAxis key="xaxis" dataKey="p" {...axisProps} allowDuplicatedCategory={false} />
                <YAxis key="yaxis" {...axisProps} domain={[0, getNiceDomainMax(maxVal)]} tickFormatter={formatYAxisTick} width={65} />
                <Bar
                  dataKey="dv_val"
                  name={metric}
                  fill={C.bau}
                  radius={[6, 6, 0, 0]}
                  className="transition-all duration-200 hover:brightness-110 hover:opacity-90 cursor-pointer"
                  onMouseEnter={(bData, bIdx, e) => handleBarHover(bData, bIdx, e, [], containerRef, setHoveredState)}
                  onMouseMove={(bData, bIdx, e) => handleBarHover(bData, bIdx, e, [], containerRef, setHoveredState)}
                >
                  <LabelList dataKey="dv_val" content={TopLabel} />
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
            <ChartHoverPopoverCard hoveredState={hoveredState} dataLength={data.length} />
          </div>
        </>}
    </Card>;
}
