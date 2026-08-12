import React from "react";

export function Skeleton({ className = "", style }) {
  return <div className={`animate-pulse rounded ${className}`} style={{ background: "var(--dt-row-border)", ...style }} />;
}

export function ChartSkeleton({ height = 280 }) {
  return <div className="flex flex-col gap-4 w-full" style={{ height }}>
      <Skeleton className="h-5 w-1/3 mb-2" />
      <div className="flex-1 w-full flex items-end gap-3 pb-4">
        {[40, 70, 45, 90, 60, 80, 50, 100, 30].map((h, i) => <Skeleton key={i} className="w-full flex-1" style={{ height: `${h}%` }} />)}
      </div>
    </div>;
}
