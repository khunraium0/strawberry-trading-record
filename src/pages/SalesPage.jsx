import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  TrendingUp,
  Calendar,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { salesService } from '../services/salesService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { reportService } from '../services/reportService';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { DateFilter } from '../components/common/DateFilter';
import { SalesForm } from '../components/forms/SalesForm';
import { CustomerForm } from '../components/forms/CustomerForm';
import { ProductForm } from '../components/forms/ProductForm';
import { formatMMK, formatQuantity, formatDate, getDateFilterRange, toInputDateFormat } from '../utils/formatters';

const ITEMS_PER_PAGE = 10;

export function SalesPage({ isModalOpen, setIsModalOpen }) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [sales, setSales] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [buyerFilter, setBuyerFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [viewingSale, setViewingSale] = useState(null);
  const [deletingSale, setDeletingSale] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Nested quick add modals
  const [isQuickBuyerOpen, setIsQuickBuyerOpen] = useState(false);
  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);

  // Sync external trigger from props
  useEffect(() => {
    if (isModalOpen !== undefined && isModalOpen) {
      setEditingSale(null);
      setIsFormOpen(true);
      if (setIsModalOpen) setIsModalOpen(false);
    }
  }, [isModalOpen, setIsModalOpen]);

  // Load buyers and products dropdown data
  const loadDependencies = useCallback(async () => {
    if (!user) return;
    try {
      const [buyerList, prodList] = await Promise.all([
        customerService.getCustomers(user.id, { category: 'buyer' }),
        productService.getProducts(user.id),
      ]);
      setBuyers(buyerList);
      setProducts(prodList);
    } catch (err) {
      console.error('Failed to load dependencies:', err);
    }
  }, [user]);

  // Load sales list
  const loadSales = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { startDate, endDate } = getDateFilterRange(dateFilter, customStart, customEnd);

      const data = await salesService.getSales(user.id, {
        startDate,
        endDate,
        buyerId: buyerFilter,
        productId: productFilter,
        search: searchQuery,
        sortOrder,
      });

      setSales(data);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load sales:', err);
      showError('Could not load sales records.');
    } finally {
      setLoading(false);
    }
  }, [user, dateFilter, customStart, customEnd, buyerFilter, productFilter, searchQuery, sortOrder, showError]);

  useEffect(() => {
    loadDependencies();
  }, [loadDependencies]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Handle Save Sale
  const handleSaveSale = async (formData) => {
    try {
      await salesService.saveSales(formData, user.id);
      showSuccess(formData.id ? 'Sales record updated!' : 'New sale recorded!');
      setIsFormOpen(false);
      setEditingSale(null);
      await loadSales();
    } catch (err) {
      console.error('Failed to save sale:', err);
      showError('Error saving sales record: ' + (err.message || 'Unknown error'));
      throw err;
    }
  };

  // Handle Delete Sale
  const handleDeleteConfirm = async () => {
    if (!deletingSale) return;
    try {
      setIsDeleting(true);
      await salesService.deleteSales(deletingSale.id, user.id);
      showSuccess('Sales record deleted.');
      setDeletingSale(null);
      await loadSales();
    } catch (err) {
      console.error('Failed to delete sale:', err);
      showError('Failed to delete record: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle quick adding buyer from inside sales form
  const handleSaveQuickBuyer = async (data) => {
    try {
      const created = await customerService.saveCustomer(data, user.id);
      showSuccess('Buyer added successfully!');
      setIsQuickBuyerOpen(false);
      await loadDependencies();
      return created;
    } catch (err) {
      showError('Failed to add buyer.');
    }
  };

  // Handle quick adding product from inside sales form
  const handleSaveQuickProduct = async (data) => {
    try {
      const created = await productService.saveProduct(data, user.id);
      showSuccess('Product added successfully!');
      setIsQuickProductOpen(false);
      await loadDependencies();
      return created;
    } catch (err) {
      showError('Failed to add product.');
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(sales.length / ITEMS_PER_PAGE) || 1;
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sales.slice(start, start + ITEMS_PER_PAGE);
  }, [sales, currentPage]);

  const totalRevenueFiltered = useMemo(() => {
    return sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
  }, [sales]);

  const totalQuantityFiltered = useMemo(() => {
    return sales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  }, [sales]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sales Records
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track strawberry sales orders, wholesale shipments, and revenue from buyers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {sales.length > 0 && (
            <button
              onClick={() => reportService.exportSalesToCSV(sales)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors"
              title="Export filtered sales to CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingSale(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-rose-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Sale</span>
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-rose-50/70 border border-rose-100 p-3 rounded-2xl">
          <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
            Total Sales Revenue
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-rose-950 mt-0.5">
            {formatMMK(totalRevenueFiltered)}
          </p>
        </div>
        <div className="bg-slate-100/70 border border-slate-200 p-3 rounded-2xl">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Total Sold Quantity
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-slate-800 mt-0.5">
            {formatQuantity(totalQuantityFiltered, 'Kg')}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Filtered Records
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-800 mt-0.5">
              {sales.length} entries
            </p>
          </div>
          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            title="Sort date order"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
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

      {/* Search and Dropdown Filter Row */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by buyer name, product, or notes..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        {/* Buyer Filter */}
        <div className="w-full md:w-48">
          <select
            value={buyerFilter}
            onChange={(e) => setBuyerFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Buyers</option>
            {buyers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Product Filter */}
        <div className="w-full md:w-48">
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content: Mobile Cards / Desktop Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center animate-pulse">
          <p className="text-sm text-slate-500">Loading sales transactions...</p>
        </div>
      ) : sales.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No sales transactions found"
          description="Try adjusting your filters or record a new strawberry sales delivery."
          actionText="Add Sales Record"
          onAction={() => {
            setEditingSale(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <>
          {/* Mobile Cards View (< md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {paginatedSales.map((sale) => (
              <div
                key={sale.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {sale.buyer?.name || 'Unnamed Buyer'}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(sale.transaction_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-sm text-rose-600">
                      +{formatMMK(sale.total_amount)}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {formatQuantity(sale.quantity, sale.unit || 'Kg')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-2 border-y border-slate-100">
                  <span className="font-medium text-slate-600">
                    Product: <strong className="text-slate-800">{sale.product?.name || 'Strawberry'}</strong>
                  </span>
                  <span className="text-slate-500">
                    @{formatMMK(sale.unit_price, true)}/{sale.unit || 'Kg'}
                  </span>
                </div>

                {sale.notes && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                    "{sale.notes}"
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setViewingSale(sale)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs flex items-center gap-1 font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button
                    onClick={() => {
                      setEditingSale(sale);
                      setIsFormOpen(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg text-xs flex items-center gap-1 font-semibold"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setDeletingSale(sale)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Buyer Customer</th>
                    <th className="py-3.5 px-4">Product Variety</th>
                    <th className="py-3.5 px-4 text-right">Quantity</th>
                    <th className="py-3.5 px-4 text-right">Selling Price</th>
                    <th className="py-3.5 px-4 text-right">Total Revenue</th>
                    <th className="py-3.5 px-4">Notes</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium text-slate-700">
                        {formatDate(sale.transaction_date)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {sale.buyer?.name || 'Unnamed Buyer'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="font-medium text-slate-800">
                          {sale.product?.name || 'Strawberry'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-800 whitespace-nowrap">
                        {formatQuantity(sale.quantity, sale.unit || 'Kg')}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 whitespace-nowrap">
                        {formatMMK(sale.unit_price)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-rose-600 whitespace-nowrap">
                        {formatMMK(sale.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {sale.notes || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingSale(sale)}
                            title="View Details"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingSale(sale);
                              setIsFormOpen(true);
                            }}
                            title="Edit"
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingSale(sale)}
                            title="Delete"
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200">
              <span className="text-xs text-slate-500">
                Page <strong className="text-slate-800">{currentPage}</strong> of{' '}
                <strong className="text-slate-800">{totalPages}</strong> ({sales.length} total)
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Sale Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSale(null);
        }}
        title={editingSale ? 'Edit Sales Record' : 'Record New Sales Order'}
        maxWidth="max-w-xl"
      >
        <SalesForm
          initialData={editingSale}
          buyers={buyers}
          products={products}
          onSubmit={handleSaveSale}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingSale(null);
          }}
          onQuickAddBuyer={() => setIsQuickBuyerOpen(true)}
          onQuickAddProduct={() => setIsQuickProductOpen(true)}
        />
      </Modal>

      {/* View Details Modal */}
      {viewingSale && (
        <Modal
          isOpen={Boolean(viewingSale)}
          onClose={() => setViewingSale(null)}
          title="Sales Transaction Details"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                  Total Sales Revenue
                </span>
                <p className="text-2xl font-extrabold text-rose-950 mt-1">
                  +{formatMMK(viewingSale.total_amount)}
                </p>
              </div>
              <Badge variant="buyer" size="md">
                Sales Outflow
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-medium">Transaction Date</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {formatDate(viewingSale.transaction_date)}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Buyer Customer</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {viewingSale.buyer?.name || '-'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Product Variety</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {viewingSale.product?.name || '-'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Quantity Sold</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {formatQuantity(viewingSale.quantity, viewingSale.unit || 'Kg')}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Selling Price</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {formatMMK(viewingSale.unit_price)} / {viewingSale.unit || 'Kg'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Calculation</span>
                <p className="font-medium text-slate-600 mt-0.5">
                  {viewingSale.quantity} × {formatMMK(viewingSale.unit_price, false)}
                </p>
              </div>
            </div>

            {viewingSale.notes && (
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Notes & Remarks
                </span>
                <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 mt-1">
                  {viewingSale.notes}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewingSale(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const toEdit = viewingSale;
                  setViewingSale(null);
                  setEditingSale(toEdit);
                  setIsFormOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
              >
                Edit Record
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingSale)}
        onClose={() => setDeletingSale(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Sales Record"
        message="Are you sure you want to permanently delete this sales transaction? Revenue statistics will adjust accordingly."
        isLoading={isDeleting}
      />

      {/* Quick Add Buyer Modal */}
      <Modal
        isOpen={isQuickBuyerOpen}
        onClose={() => setIsQuickBuyerOpen(false)}
        title="Quick Add Buyer"
        maxWidth="max-w-md"
      >
        <CustomerForm
          defaultCategory="buyer"
          onSubmit={handleSaveQuickBuyer}
          onCancel={() => setIsQuickBuyerOpen(false)}
        />
      </Modal>

      {/* Quick Add Product Modal */}
      <Modal
        isOpen={isQuickProductOpen}
        onClose={() => setIsQuickProductOpen(false)}
        title="Quick Add Product Variety"
        maxWidth="max-w-md"
      >
        <ProductForm
          onSubmit={handleSaveQuickProduct}
          onCancel={() => setIsQuickProductOpen(false)}
        />
      </Modal>
    </div>
  );
}
