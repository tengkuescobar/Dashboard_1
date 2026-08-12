import React from "react";
import {
  RevenueStackedBar,
  LosChart,
  MonthlyTotalChart,
  VarianceComparisonChart
} from "../DashboardComponents";

export default function DashboardRevenue() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5">
        <RevenueStackedBar />
        <MonthlyTotalChart />
        <LosChart />
        <VarianceComparisonChart />
      </div>
      <div className="h-4" />
    </div>
  );
}
