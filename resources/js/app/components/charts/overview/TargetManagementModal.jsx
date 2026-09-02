import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Save, Copy, RefreshCw, CheckCircle, AlertTriangle, Target } from "lucide-react";

export function TargetManagementModal({ isOpen, onClose, onSaved }) {
  const [year, setYear] = useState(2025);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchTargets();
    }
  }, [isOpen, year]);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/targets?year=${year}`);
      setTargets(res.data.data || []);
    } catch (err) {
      showToast("Gagal mengambil data target", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (monthIdx, field, value) => {
    const newTargets = [...targets];
    newTargets[monthIdx][field] = parseFloat(value) || 0;
    
    if (field === "existing_target_bn" || field === "new_sales_target_bn") {
      newTargets[monthIdx].total_target_bn = 
        (newTargets[monthIdx].existing_target_bn || 0) + 
        (newTargets[monthIdx].new_sales_target_bn || 0);
    }
    
    setTargets(newTargets);
  };

  const handleApplyAll = (monthIdx) => {
    const baseTarget = targets[monthIdx];
    const newTargets = targets.map((t) => ({
      ...t,
      existing_target_bn: baseTarget.existing_target_bn,
      new_sales_target_bn: baseTarget.new_sales_target_bn,
      total_target_bn: baseTarget.total_target_bn,
    }));
    setTargets(newTargets);
    showToast("Target disalin ke semua bulan", "success");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        year,
        months: targets.map((t) => ({
          month: t.month,
          existing_target: (t.existing_target_bn || 0) * 1000000000,
          new_sales_target: (t.new_sales_target_bn || 0) * 1000000000,
        })),
      };

      await axios.post("/api/targets/bulk", payload);
      showToast("Target berhasil disimpan!", "success");
      if (onSaved) onSaved();
      
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      showToast("Gagal menyimpan target", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div 
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header (Gradient) */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
              <Target size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Kelola Target Bulanan</h2>
              <p className="text-blue-100 text-sm font-medium mt-0.5">Sesuaikan target Revenue (Existing & New Sales) per bulan</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="px-6 py-4 flex flex-col sm:flex-row gap-4 items-center bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tahun Target:</label>
            <div className="relative">
              <select 
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="appearance-none pl-4 pr-10 py-2 rounded-lg text-sm font-medium border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
          
          {toast && (
            <div className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold animate-in slide-in-from-right-2 shadow-sm ${
              toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400'
            }`}>
              {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
              {toast.message}
            </div>
          )}
        </div>

        {/* Main Content (Table) */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-blue-600 dark:text-blue-400">
              <RefreshCw className="animate-spin" size={32} />
              <p className="text-sm font-medium text-slate-500">Memuat data target...</p>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="py-4 px-5 font-semibold">Bulan</th>
                      <th className="py-4 px-5 font-semibold">Existing Target (Bn)</th>
                      <th className="py-4 px-5 font-semibold">New Sales Target (Bn)</th>
                      <th className="py-4 px-5 font-semibold">Total Target (Bn)</th>
                      <th className="py-4 px-5 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {targets.map((t, idx) => (
                      <tr key={t.month} className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                        <td className="py-3 px-5 font-semibold text-slate-800 dark:text-slate-200 w-32">
                          {t.month_name}
                        </td>
                        <td className="py-3 px-5">
                          <div className="relative w-32">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-medium">Rp</span>
                            <input 
                              type="number"
                              min="0"
                              step="0.1"
                              value={t.existing_target_bn === 0 ? '' : t.existing_target_bn}
                              onChange={(e) => handleChange(idx, 'existing_target_bn', e.target.value)}
                              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium placeholder-slate-300 dark:placeholder-slate-600"
                              placeholder="0"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-5">
                          <div className="relative w-32">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-medium">Rp</span>
                            <input 
                              type="number"
                              min="0"
                              step="0.1"
                              value={t.new_sales_target_bn === 0 ? '' : t.new_sales_target_bn}
                              onChange={(e) => handleChange(idx, 'new_sales_target_bn', e.target.value)}
                              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium placeholder-slate-300 dark:placeholder-slate-600"
                              placeholder="0"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-5">
                          <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700">
                            {t.total_target_bn.toFixed(1)} <span className="text-slate-500 dark:text-slate-400 ml-1 font-medium">Bn</span>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-right">
                          <button 
                            onClick={() => handleApplyAll(idx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Terapkan konfigurasi target bulan ini ke seluruh bulan dalam setahun"
                          >
                            <Copy size={14} /> Terapkan ke Semua
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col-reverse sm:flex-row justify-end gap-3 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all active:scale-95"
          >
            Batal
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={18} />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
