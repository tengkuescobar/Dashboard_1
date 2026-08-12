import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Activity, 
  LayoutDashboard, 
  Wifi, 
  TrendingUp, 
  LogOut,
  Menu,
  ChevronLeft
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const navItems = [
    { name: "Overview", path: "/", icon: LayoutDashboard },
    { name: "Revenue", path: "/revenue", icon: TrendingUp },
    { name: "Broadband", path: "/broadband", icon: Wifi },
    { name: "Driver Trends", path: "/drivers", icon: Activity },
  ];

  const handleLogout = async () => {
    // Submit a POST request to logout
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    try {
      const response = await fetch('/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken || '',
        },
      });
      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <aside className={`flex-shrink-0 flex flex-col h-screen sticky top-0 border-r transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}
      style={{ 
        background: "var(--dt-card)", 
        borderColor: "var(--dt-card-border)" 
      }}>
      
      {/* Brand & Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b overflow-hidden" style={{ borderColor: "var(--dt-card-border)" }}>
        <div className="flex items-center gap-3" style={{ minWidth: isOpen ? 'auto' : '100%', justifyContent: isOpen ? 'flex-start' : 'center' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--dt-icon-box-bg)", border: "1px solid var(--dt-icon-box-border)" }}>
            <Activity size={16} style={{ color: "#3B82F6" }} />
          </div>
          {isOpen && <span className="font-bold text-sm tracking-tight whitespace-nowrap" style={{ color: "var(--dt-text-1)" }}>Analytics</span>}
        </div>
        {isOpen && (
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-200">
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {!isOpen && (
        <div className="flex justify-center mt-4">
          <button onClick={() => setIsOpen(true)} className="text-gray-400 hover:text-gray-200">
            <Menu size={20} />
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden">
        {isOpen && (
          <div className="text-xs font-semibold uppercase tracking-widest mb-4 px-2" style={{ color: "var(--dt-text-4)" }}>
            Dashboards
          </div>
        )}
        
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={!isOpen ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? "font-medium" : "hover:bg-opacity-50"
              } ${isOpen ? '' : 'justify-center'}`}
              style={{ 
                background: isActive ? "var(--dt-dd-bg)" : "transparent",
                color: isActive ? "var(--dt-dd-text)" : "var(--dt-text-3)",
                border: isActive ? "1px solid var(--dt-dd-border)" : "1px solid transparent",
              }}
            >
              <item.icon size={16} className="flex-shrink-0" />
              {isOpen && <span className="whitespace-nowrap">{item.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* Footer (Logout) */}
      <div className="p-3 border-t overflow-hidden" style={{ borderColor: "var(--dt-card-border)" }}>
        <button 
          onClick={handleLogout}
          title={!isOpen ? "Logout" : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:bg-opacity-50 ${isOpen ? '' : 'justify-center'}`}
          style={{ color: "var(--dt-text-3)", background: "transparent" }}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {isOpen && <span className="whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
