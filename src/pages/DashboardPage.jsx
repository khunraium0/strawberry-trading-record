import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles,
  RefreshCw,
  Eye,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { purchaseService } from '../services/purchaseService';
import { salesService } from '../services/salesService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { StatCard } from '../components/common/StatCard';
import { DateFilter } from '../components/common/DateFilter';
import { Badge } from '../components/common/Badge';
import { formatMMK, formatQuantity, formatDate, getDateFilterRange, toInputDateFormat } from '../utils/formatters';

export function DashboardPage({
  setActivePage,
  onOpenAddPurchase,
  onOpenAddSale,
  onOpenAddCustomer,
}) {
  const { user } = useAuth();
  const { showError } = useToast();

  const [dateFilter, setDateFilter] = useState('this_month');
  const [customStart, setCustomStart] = useState(
    toInputDateFormat(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  );
  const [customEnd, setCustomEnd] = useState(toInputDateFormat(new Date()));

  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { startDate, endDate } = getDateFilterRange(dateFilter, customStart, customEnd);

      const [pData, sData, cData, prodData] = await Promise.all([
        purchaseService.getPurchases(user.id, { startDate, endDate }),
        salesService.getSales(user.id, { startDate, endDate }),
        customerService.getCustomers(user.id),
        productService.getProducts(user.id),
      ]);

      setPurchases(pData);
      setSales(sData);
      setCustomers(cData);
      setProducts(prodData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      showError('Unable to load dashboard metrics. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [user, dateFilter, customStart, customEnd, showError]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculations for KPI Cards
  const totalPurchaseAmount = purchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
  const totalSalesAmount = sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
  const totalPurchaseQty = purchases.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  const totalSalesQty = sales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

  const supplierCount = customers.filter((c) => c.category === 'supplier' || c.category === 'both').length;
  const buyerCount = customers.filter((c) => c.category === 'buyer' || c.category === 'both').length;

  // Recent transactions (Top 5 each)
  const recentPurchases = [...purchases]
    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
    .slice(0, 5);

  const recentSales = [...sales]
    .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍓</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Trading Overview
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track daily strawberry harvest intake, wholesale purchases, and market sales.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={onOpenAddPurchase}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Purchase</span>
          </button>

          <button
            onClick={onOpenAddSale}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-rose-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Sale</span>
          </button>

          <button
            onClick={onOpenAddCustomer}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold shadow-2xs transition-colors"
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Add Partner</span>
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Sales Amount */}
        <StatCard
          title="Total Sales Revenue"
          value={formatMMK(totalSalesAmount)}
          subtitle={`${sales.length} transactions recorded`}
          icon={TrendingUp}
          variant="sales"
        />

        {/* Total Purchase Amount */}
        <StatCard
          title="Total Purchase Cost"
          value={formatMMK(totalPurchaseAmount)}
          subtitle={`${purchases.length} transactions recorded`}
          icon={ShoppingCart}
          variant="purchase"
        />

        {/* Total Sold Quantity */}
        <StatCard
          title="Sold Quantity"
          value={formatQuantity(totalSalesQty, 'Kg')}
          subtitle="Delivered to buyers"
          icon={ArrowUpRight}
          variant="sales"
        />

        {/* Total Purchased Quantity */}
        <StatCard
          title="Purchased Quantity"
          value={formatQuantity(totalPurchaseQty, 'Kg')}
          subtitle="Collected from farms"
          icon={ArrowDownLeft}
          variant="purchase"
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trading Turnover</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">
              {formatMMK(totalSalesAmount + totalPurchaseAmount)}
            </p>
          </div>
          <span className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
            <Layers className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Customers</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">
              {customers.length} partners
            </p>
            <p className="text-[11px] text-slate-400">
              {supplierCount} suppliers • {buyerCount} buyers
            </p>
          </div>
          <button
            onClick={() => setActivePage('customers')}
            className="p-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Catalog</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">
              {products.length} registered
            </p>
            <p className="text-[11px] text-slate-400">Fresh harvest & fruit items</p>
          </div>
          <button
            onClick={() => setActivePage('products')}
            className="p-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <Package className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h2 className="font-bold text-base text-slate-800">Recent Sales Orders</h2>
            </div>
            <button
              onClick={() => setActivePage('sales')}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
                Loading sales records...
              </div>
            ) : recentSales.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-slate-400 font-medium">No sales recorded for this period.</p>
                <button
                  onClick={onOpenAddSale}
                  className="mt-2 text-xs font-bold text-rose-600 hover:underline"
                >
                  + Add First Sale
                </button>
              </div>
            ) : (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                        {sale.buyer?.name || 'Unnamed Buyer'}
                      </span>
                      <Badge variant="buyer" size="xs">
                        Sale
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{sale.product?.name || 'Fresh Strawberry'}</span>
                      <span>•</span>
                      <span>{formatDate(sale.transaction_date)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-xs sm:text-sm text-rose-600">
                      +{formatMMK(sale.total_amount)}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {formatQuantity(sale.quantity, sale.unit || 'Kg')} @ {formatMMK(sale.unit_price, false)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="font-bold text-base text-slate-800">Recent Purchase Inflow</h2>
            </div>
            <button
              onClick={() => setActivePage('purchases')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
                Loading purchase records...
              </div>
            ) : recentPurchases.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-slate-400 font-medium">No purchases recorded for this period.</p>
                <button
                  onClick={onOpenAddPurchase}
                  className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
                >
                  + Add First Purchase
                </button>
              </div>
            ) : (
              recentPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                        {purchase.supplier?.name || 'Unnamed Supplier'}
                      </span>
                      <Badge variant="supplier" size="xs">
                        Purchase
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{purchase.product?.name || 'Fresh Strawberry'}</span>
                      <span>•</span>
                      <span>{formatDate(purchase.transaction_date)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-xs sm:text-sm text-emerald-700">
                      -{formatMMK(purchase.total_amount)}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {formatQuantity(purchase.quantity, purchase.unit || 'Kg')} @ {formatMMK(purchase.price_per_unit, false)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
