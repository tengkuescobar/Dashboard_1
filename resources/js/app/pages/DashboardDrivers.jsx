import React from "react";
import { DriverTrend } from "../DashboardComponents";

export default function DashboardDrivers() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4">
        <DriverTrend />
      </div>
      <div className="h-4" />
    </div>
  );
}
