export function exportToCSV({ filename, title, subtitle, headers, rows, summaryRow }) {
  let csvContent = "\uFEFF";
  if (title) csvContent += `"${title}"\n`;
  if (subtitle) csvContent += `"${subtitle}"\n`;
  if (title || subtitle) csvContent += "\n";
  if (headers && headers.length) {
    csvContent += headers.map(h => `"${h}"`).join(",") + "\n";
  }
  if (rows && rows.length) {
    rows.forEach(row => {
      csvContent += row.map(val => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(",") + "\n";
    });
  }
  if (summaryRow && summaryRow.length) {
    csvContent += summaryRow.map(val => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(",") + "\n";
  }
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename || "chart_report"}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
