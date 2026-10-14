import React, { useState, useEffect, useCallback } from 'react';
import {
  FileBarChart2,
  Download,
  Calendar,
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  Info,
  Scale,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { reportService } from '../services/reportService';
import { DateFilter } from '../components/common/DateFilter';
import { Badge } from '../components/common/Badge';
import { formatMMK, formatQuantity, getDateFilterRange, toInputDateFormat } from '../utils/formatters';

export function ReportsPage() {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  const [dateFilter, setDateFilter] = useState('this_month');
  const [customStart, setCustomStart] = useState(
    toInputDateFormat(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  );
  const [customEnd, setCustomEnd] = useState(toInputDateFormat(new Date()));

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  const loadReport = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { startDate, endDate } = getDateFilterRange(dateFilter, customStart, customEnd);
      const data = await reportService.getReportsData(user.id, { startDate, endDate });
      setReportData(data);
    } catch (err) {
      console.error('Failed to load report:', err);
      showError('Unable to generate business report.');
    } finally {
      setLoading(false);
    }
  }, [user, dateFilter, customStart, customEnd, showError]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportPurchases = () => {
    if (!reportData?.purchases?.length) {
      showError('No purchase records to export.');
      return;
    }
    reportService.exportPurchasesToCSV(reportData.purchases);
    showSuccess('Purchases CSV downloaded.');
  };

  const handleExportSales = () => {
    if (!reportData?.sales?.length) {
      showError('No sales records to export.');
      return;
    }
    reportService.exportSalesToCSV(reportData.sales);
    showSuccess('Sales CSV downloaded.');
  };

  const handleExportCombined = () => {
    if (!reportData?.purchases?.length && !reportData?.sales?.length) {
      showError('No records to export in the selected period.');
      return;
    }
    reportService.exportCombinedReportToCSV(reportData.purchases, reportData.sales);
    showSuccess('Complete Trading Report CSV downloaded.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
              <FileBarChart2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Reports & Analytics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aggregate procurement expenses, sales revenue, product movement, and customer volume.
          </p>
        </div>

        {/* CSV Export Dropdown / Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleExportPurchases}
            disabled={loading || !reportData?.purchases?.length}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Purchases</span>
          </button>

          <button
            onClick={handleExportSales}
            disabled={loading || !reportData?.sales?.length}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-rose-600" />
            <span>Export Sales</span>
          </button>

          <button
            onClick={handleExportCombined}
            disabled={loading || (!reportData?.purchases?.length && !reportData?.sales?.length)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export All Ledger</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <DateFilter
        selectedFilter={dateFilter}
        onSelectFilter={setDateFilter}
        customStart={customStart}
        customEnd={customEnd}
        onChangeCustomStart={setCustomStart}
        onChangeCustomEnd={setCustomEnd}
      />

      {loading || !reportData ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center animate-pulse">
          <p className="text-sm text-slate-500">Compiling financial and quantity reports...</p>
        </div>
      ) : (
        <>
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Sales Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Total Sales Revenue
                </span>
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-rose-950">
                {formatMMK(reportData.totalSalesRevenue)}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                <span className="font-semibold text-slate-700">
                  {formatQuantity(reportData.totalSalesQuantity, 'Kg')}
                </span>
                <span>across {reportData.sales.length} sales</span>
              </div>
            </div>

            {/* Purchase Expenses */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Total Purchase Expense
                </span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <ShoppingCart className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-emerald-950">
                {formatMMK(reportData.totalPurchaseExpense)}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                <span className="font-semibold text-slate-700">
                  {formatQuantity(reportData.totalPurchaseQuantity, 'Kg')}
                </span>
                <span>across {reportData.purchases.length} purchases</span>
              </div>
            </div>

            {/* Trading Cash Difference */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Sales vs Purchase Cashflow
                </span>
                <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <p
                className={`text-2xl font-black ${
                  reportData.tradingMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {reportData.tradingMargin >= 0 ? '+' : ''}
                {formatMMK(reportData.tradingMargin)}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Revenue from buyers minus procurement expenses
              </p>
            </div>
          </div>

          {/* Accounting Disclosure Notice */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
            <Info className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">
                Business & Accounting Integrity Note
              </p>
              <p className="mt-0.5 text-amber-800">
                The cash difference shown above reflects <strong>Sales Revenue minus Direct Purchase Costs</strong> for the selected date window. This does not represent final net profit because unsold cold-storage inventory, spoilage, packaging materials, transport, labor, and overheads must be factored in separately for complete accounting.
              </p>
            </div>
          </div>

          {/* Product Movement Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-base text-slate-800">
                  Product Movement & Quantities
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                {reportData.productSummaries.length} products with activity
              </span>
            </div>

            {reportData.productSummaries.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No product movements recorded during this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Product Variety</th>
                      <th className="py-3 px-4 text-right">Purchased Qty</th>
                      <th className="py-3 px-4 text-right">Purchased Cost</th>
                      <th className="py-3 px-4 text-right">Sold Qty</th>
                      <th className="py-3 px-4 text-right">Sales Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.productSummaries.map((prod, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {prod.name}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-800 whitespace-nowrap">
                          {formatQuantity(prod.purchasedQty, prod.unit)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 whitespace-nowrap">
                          {formatMMK(prod.purchaseAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-rose-800 whitespace-nowrap">
                          {formatQuantity(prod.soldQty, prod.unit)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatMMK(prod.salesAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Customer & Partner Summaries Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-base text-slate-800">
                  Customer & Partner Ledger Summaries
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                {reportData.customerSummaries.length} active partners
              </span>
            </div>

            {reportData.customerSummaries.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No customer transactions recorded during this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Partner Name</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-right">Purchases From (Cost)</th>
                      <th className="py-3 px-4 text-right">Sales To (Revenue)</th>
                      <th className="py-3 px-4 text-center">Tx Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.customerSummaries.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {cust.name}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={cust.category} size="xs">
                            {cust.category === 'both'
                              ? 'Supplier & Buyer'
                              : cust.category}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-800 whitespace-nowrap">
                          {cust.totalPurchasedFrom > 0 ? formatMMK(cust.totalPurchasedFrom) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-800 whitespace-nowrap">
                          {cust.totalSoldTo > 0 ? formatMMK(cust.totalSoldTo) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center text-xs text-slate-500">
                          {cust.purchaseTxCount + cust.salesTxCount} tx
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
