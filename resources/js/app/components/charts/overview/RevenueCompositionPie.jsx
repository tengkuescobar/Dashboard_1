import React from "react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart } from "lucide-react";
import { C } from "../../../utils/formatters";
import { Card, SectionTitle } from "../../ui/ChartUIComponents";
import { ChartSkeleton } from "../../ui/skeleton";
import { formatValue } from "../../../utils/formatters";

export function RevenueCompositionPie({ breakdown = [], loading = false }) {
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

  // Filter out items with 0 or negative actual revenue for the pie chart
  const data = breakdown
    .filter((b) => b.actual > 0)
    .map((b) => ({
      name: b.name,
      value: b.actual,
      color: getColor(b.name),
    }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold mb-1" style={{ color: data.color }}>{data.name}</p>
          <p className="text-gray-600 dark:text-gray-300">
            Revenue: <span className="font-semibold text-gray-900 dark:text-white">Rp {formatValue(data.value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <SectionTitle icon={PieChart} label="Revenue Composition" />
      <div className="w-full h-[250px] mt-2">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: "11px", color: "var(--dt-text-2)" }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "var(--dt-text-3)" }}>
            No data available
          </div>
        )}
      </div>
    </Card>
  );
}
