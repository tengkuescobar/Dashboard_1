import React from "react";
import {
  BroadbandStackedBar,
  PrepaidBroadbandChart,
} from "../DashboardComponents";

export default function DashboardBroadband() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4">
        <BroadbandStackedBar />
      </div>
      <div className="grid grid-cols-1 gap-4">
        <PrepaidBroadbandChart />
      </div>
      <div className="h-4" />
    </div>
  );
}
