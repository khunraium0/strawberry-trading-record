/**
 * Formatting utilities for Strawberry Trading Record
 * Focused on Myanmar Kyat (MMK/Ks) and localized date/number formats.
 */

/**
 * Format a number as Myanmar Kyat (Ks)
 * @param {number|string} amount
 * @param {boolean} includeSymbol - whether to include 'Ks' suffix
 * @returns {string}
 */
export function formatMMK(amount, includeSymbol = true) {
  const numericAmount = Number(amount) || 0;
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(numericAmount);

  return includeSymbol ? `${formatted} Ks` : formatted;
}

/**
 * Format quantity with unit
 * @param {number|string} qty
 * @param {string} unit
 * @returns {string}
 */
export function formatQuantity(qty, unit = 'Kg') {
  const numericQty = Number(qty) || 0;
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(numericQty) ? 0 : 2,
  }).format(numericQty);

  return `${formatted} ${unit}`;
}

/**
 * Format ISO date string to readable format e.g., '14 Oct 2026'
 * @param {string|Date} dateString
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format ISO date string to input[type="date"] string YYYY-MM-DD
 * @param {Date|string} date
 * @returns {string}
 */
export function toInputDateFormat(date = new Date()) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get start and end dates for quick filter ranges
 * @param {'today' | 'this_month' | 'all' | 'custom'} filterType
 * @param {string} customStart
 * @param {string} customEnd
 * @returns {{ startDate: string | null, endDate: string | null }}
 */
export function getDateFilterRange(filterType, customStart = '', customEnd = '') {
  const now = new Date();
  const todayStr = toInputDateFormat(now);

  switch (filterType) {
    case 'today':
      return { startDate: todayStr, endDate: todayStr };
    case 'this_month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        startDate: toInputDateFormat(firstDay),
        endDate: toInputDateFormat(lastDay),
      };
    }
    case 'custom':
      return {
        startDate: customStart || null,
        endDate: customEnd || null,
      };
    case 'all':
    default:
      return { startDate: null, endDate: null };
  }
}

/**
 * Convert array of objects to CSV string and trigger download
 * @param {Array<Object>} rows
 * @param {string} filename
 */
export function exportToCSV(rows, filename = 'export.csv') {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
          // Escape quotes and wrap in quotes if comma or newline present
          cell = cell.replace(/"/g, '""');
          if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
            cell = `"${cell}"`;
          }
          return cell;
        })
        .join(',')
    ),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
