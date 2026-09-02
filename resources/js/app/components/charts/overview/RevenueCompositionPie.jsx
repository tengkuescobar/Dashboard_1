import React, { useState } from "react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart } from "lucide-react";
import { C, formatValue } from "../../../utils/formatters";
import { Card, SectionTitle, ChartLegend } from "../../ui/ChartUIComponents";
import { ChartSkeleton } from "../../ui/skeleton";

export function RevenueCompositionPie({ breakdown = [], loading = false }) {
  const [activeCategory, setActiveCategory] = useState("All");

  const getColor = (name) => {
    switch (name) {
      case "Broadband": return C.broadband;
      case "Digital": return C.digital;
      case "IR": return C.ir;
      case "Voice": return C.voice;
      case "SMS": return C.sms;
      default: return C.others;
    }
  };

  if (loading) {
    return (
      <Card>
        <SectionTitle icon={PieChart} label="Revenue Composition" />
        <ChartSkeleton height={200} />
      </Card>
    );
  }

  // Original data
  const originalData = breakdown
    .filter((b) => b.actual > 0)
    .map((b) => ({
      name: b.name,
      value: b.actual,
      color: getColor(b.name),
    }))
    .sort((a, b) => b.value - a.value);

  // Filtered data for the Pie Chart
  const activeData = activeCategory === "All" 
    ? originalData 
    : originalData.filter(d => d.name === activeCategory);

  const totalValue = activeData.reduce((sum, d) => sum + d.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold mb-1" style={{ color: data.color }}>{data.name}</p>
          <p className="text-gray-600 dark:text-gray-300">
            Revenue: <span className="font-semibold text-gray-900 dark:text-white">Rp {formatValue(data.value)}</span>
            <span className="ml-1 text-gray-500 font-mono font-medium">({pct}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <SectionTitle icon={PieChart} label="Revenue Composition" />
      </div>
      <ChartLegend 
        items={originalData.map(d => ({ label: d.name, color: d.color }))}
        activeItem={activeCategory}
        onItemClick={(label) => {
          setActiveCategory(prev => prev === label ? "All" : label);
        }}
      />
      <div className="w-full h-[210px] mt-2 flex flex-col">
        {originalData.length > 0 ? (
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={activeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  animationDuration={500}
                >
                  {activeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "var(--dt-text-3)" }}>
            No data available
          </div>
        )}
      </div>
    </Card>
  );
}
