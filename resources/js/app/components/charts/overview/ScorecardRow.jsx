import React from "react";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { formatValue, fmt } from "../../../utils/formatters";

export function ScorecardRow({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[120px] rounded-xl animate-pulse" style={{ background: "var(--dt-card)", border: "1px solid var(--dt-card-border)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
      {data.map((item, idx) => {
        const isPositive = item.mom >= 0;
        return (
          <div 
            key={idx} 
            className="p-4 rounded-xl border flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg" 
            style={{ 
              background: "var(--dt-card)", 
              borderColor: "var(--dt-card-border)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--dt-text-4)" }}>
                {item.label} Revenue
              </span>
              <div className="p-1.5 rounded-lg flex items-center justify-center" 
                style={{ background: "var(--dt-pill-bg)", color: "var(--dt-text-2)" }}>
                {idx === 0 ? <DollarSign size={14} /> : <Activity size={14} />}
              </div>
            </div>
            
            <h3 className="text-2xl font-black font-mono tracking-tight" style={{ color: "var(--dt-text-1)" }}>
              Rp {formatValue(item.value)}
            </h3>
            
            <div className="flex items-center gap-2 mt-auto pt-3">
              <span 
                className="flex items-center text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ 
                  background: isPositive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", 
                  color: isPositive ? "#22C55E" : "#EF4444" 
                }}
              >
                {isPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                {fmt(Math.abs(item.mom), 1)}%
              </span>
              <span className="text-[10px] font-medium" style={{ color: "var(--dt-text-4)" }}>vs last month</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
