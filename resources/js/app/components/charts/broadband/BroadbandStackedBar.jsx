import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList } from "recharts";
import { Wifi } from "lucide-react";
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
import { ChartSkeleton } from "../../ui/skeleton";

export const BB_SERIES = [
  { key: "Acquisition", pkey: "bb_acq", color: C.acquisition },
  { key: "Core", pkey: "bb_core", color: C.core },
  { key: "CVM(BTL)", pkey: "bb_cvm", color: C.cvmBtl },
  { key: "Physical Voucher", pkey: "bb_pv", color: C.physVoucher },
  { key: "Others", pkey: "bb_oth", color: C.others }
];

export function BroadbandStackedBar() {
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
    axios.get("/api/dashboard/broadband-pack", {
      params: { ...dateFilter, grain: period }
    }).then((res) => {
      setRawData(res.data);
      setLoading(false);
    });
  }, [dateFilter, period]);

  const catOptions = ["All", ...BB_SERIES.map((s) => s.key)];
  const activeSeries = category === "All" ? BB_SERIES : BB_SERIES.filter((s) => s.key === category);
  const data = rawData.map((row) => {
    const out = { p: row.p };
    activeSeries.forEach((s) => {
      out[s.pkey] = row[s.key] || 0;
    });
    out.bb_total = activeSeries.reduce((sum, s) => sum + (row[s.key] || 0), 0);
    return out;
  });
  const totals = data.map((d) => d.bb_total);
  const pcts = totals.map((t, i) => i === 0 || totals[i - 1] === 0 ? null : +((t - totals[i - 1]) / totals[i - 1] * 100).toFixed(2));
  pcts.forEach((p, i) => {
    data[i]._tp = p;
  });
  const TopLabel = makeTopLabel(totals, pcts, true);
  const maxTotal = totals.length ? Math.max(...totals) : 0;

  return <Card>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle icon={Wifi} label="Broadband Revenue Pack" />
        <div className="flex gap-2 items-center">
          {activeSeries.length > 1 && <LabelToggle on={showLabels} onToggle={() => setShowLabels((v) => !v)} />}
          <Dropdown value={category} options={catOptions} onChange={setCategory} />
          <Dropdown value={period} options={["Daily", "Weekly", "Monthly", "Quarterly"]} onChange={setPeriod} />
          <ChartDownloadButton
            onClick={() => {
              const headers = ["Period", ...activeSeries.map(s => s.key), "Total"];
              const rows = data.map(d => [d.p, ...activeSeries.map(s => Number(d[s.pkey] || 0).toLocaleString("en-US", {maximumFractionDigits: 1})), Number(activeSeries.reduce((sum, s) => sum + (Number(d[s.pkey]) || 0), 0)).toLocaleString("en-US", {maximumFractionDigits: 1})]);
              const summaryRow = ["Total", ...activeSeries.map(s => data.reduce((acc, d) => acc + (Number(d[s.pkey]) || 0), 0).toLocaleString("en-US", {maximumFractionDigits: 1})), data.reduce((acc, d) => acc + activeSeries.reduce((sum, s) => sum + (Number(d[s.pkey]) || 0), 0), 0).toLocaleString("en-US", {maximumFractionDigits: 1})];
              exportToCSV({
                filename: `Broadband_Revenue_Pack_${period}_${category}`,
                title: "Broadband Revenue Pack Report",
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
          <ChartLegend 
            items={BB_SERIES.map((s) => ({ label: s.key, color: s.color }))} 
            activeItem={category}
            onItemClick={(label) => setCategory(prev => prev === label ? "All" : label)}
          />
          <div ref={containerRef} className="relative" onMouseLeave={() => setHoveredState(null)}>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={data}
                barSize={period === "Monthly" ? 54 : period === "Weekly" ? 38 : 28}
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
                <YAxis key="yaxis" {...axisProps} domain={[0, getNiceDomainMax(maxTotal)]} tickFormatter={formatYAxisTick} width={65} />
                {activeSeries.map((s, i) => <Bar
                  key={s.pkey}
                  dataKey={s.pkey}
                  name={s.key}
                  stackId="bb"
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
