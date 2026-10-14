import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  ShoppingCart,
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
import { purchaseService } from '../services/purchaseService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { reportService } from '../services/reportService';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { DateFilter } from '../components/common/DateFilter';
import { PurchaseForm } from '../components/forms/PurchaseForm';
import { CustomerForm } from '../components/forms/CustomerForm';
import { ProductForm } from '../components/forms/ProductForm';
import { formatMMK, formatQuantity, formatDate, getDateFilterRange, toInputDateFormat } from '../utils/formatters';

const ITEMS_PER_PAGE = 10;

export function PurchasesPage({ isModalOpen, setIsModalOpen }) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [viewingPurchase, setViewingPurchase] = useState(null);
  const [deletingPurchase, setDeletingPurchase] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Nested quick add modals
  const [isQuickSupplierOpen, setIsQuickSupplierOpen] = useState(false);
  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);

  // Sync external modal open if passed from props
  useEffect(() => {
    if (isModalOpen !== undefined && isModalOpen) {
      setEditingPurchase(null);
      setIsFormOpen(true);
      if (setIsModalOpen) setIsModalOpen(false);
    }
  }, [isModalOpen, setIsModalOpen]);

  // Load suppliers and products dropdown data
  const loadDependencies = useCallback(async () => {
    if (!user) return;
    try {
      const [suppList, prodList] = await Promise.all([
        customerService.getCustomers(user.id, { category: 'supplier' }),
        productService.getProducts(user.id),
      ]);
      setSuppliers(suppList);
      setProducts(prodList);
    } catch (err) {
      console.error('Failed to load dependencies:', err);
    }
  }, [user]);

  // Load purchases list
  const loadPurchases = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { startDate, endDate } = getDateFilterRange(dateFilter, customStart, customEnd);

      const data = await purchaseService.getPurchases(user.id, {
        startDate,
        endDate,
        supplierId: supplierFilter,
        productId: productFilter,
        search: searchQuery,
        sortOrder,
      });

      setPurchases(data);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load purchases:', err);
      showError('Could not load purchase records.');
    } finally {
      setLoading(false);
    }
  }, [user, dateFilter, customStart, customEnd, supplierFilter, productFilter, searchQuery, sortOrder, showError]);

  useEffect(() => {
    loadDependencies();
  }, [loadDependencies]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  // Handle Save Purchase
  const handleSavePurchase = async (formData) => {
    try {
      await purchaseService.savePurchase(formData, user.id);
      showSuccess(formData.id ? 'Purchase record updated!' : 'New purchase recorded!');
      setIsFormOpen(false);
      setEditingPurchase(null);
      await loadPurchases();
    } catch (err) {
      console.error('Failed to save purchase:', err);
      showError('Error saving purchase record: ' + (err.message || 'Unknown error'));
      throw err;
    }
  };

  // Handle Delete Purchase
  const handleDeleteConfirm = async () => {
    if (!deletingPurchase) return;
    try {
      setIsDeleting(true);
      await purchaseService.deletePurchase(deletingPurchase.id, user.id);
      showSuccess('Purchase record deleted.');
      setDeletingPurchase(null);
      await loadPurchases();
    } catch (err) {
      console.error('Failed to delete purchase:', err);
      showError('Failed to delete record: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle quick adding supplier from inside purchase form
  const handleSaveQuickSupplier = async (data) => {
    try {
      const created = await customerService.saveCustomer(data, user.id);
      showSuccess('Supplier added successfully!');
      setIsQuickSupplierOpen(false);
      await loadDependencies();
      return created;
    } catch (err) {
      showError('Failed to add supplier.');
    }
  };

  // Handle quick adding product from inside purchase form
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
  const totalPages = Math.ceil(purchases.length / ITEMS_PER_PAGE) || 1;
  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return purchases.slice(start, start + ITEMS_PER_PAGE);
  }, [purchases, currentPage]);

  const totalExpenseFiltered = useMemo(() => {
    return purchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
  }, [purchases]);

  const totalQuantityFiltered = useMemo(() => {
    return purchases.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  }, [purchases]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Purchase Records
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage strawberry harvest collections, grower procurements, and supplier expenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {purchases.length > 0 && (
            <button
              onClick={() => reportService.exportPurchasesToCSV(purchases)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors"
              title="Export filtered records to CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingPurchase(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase</span>
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-50/70 border border-emerald-100 p-3 rounded-2xl">
          <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Total Purchase Cost
          </p>
          <p className="text-lg sm:text-xl font-extrabold text-emerald-950 mt-0.5">
            {formatMMK(totalExpenseFiltered)}
          </p>
        </div>
        <div className="bg-slate-100/70 border border-slate-200 p-3 rounded-2xl">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Total Inflow Quantity
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
              {purchases.length} entries
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
            placeholder="Search by supplier name, product, or notes..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Supplier Filter */}
        <div className="w-full md:w-48">
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Product Filter */}
        <div className="w-full md:w-48">
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-emerald-500"
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
          <p className="text-sm text-slate-500">Loading purchase transactions...</p>
        </div>
      ) : purchases.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No purchase transactions found"
          description="Try clearing your filters or record a new strawberry harvest procurement."
          actionText="Add Purchase Record"
          onAction={() => {
            setEditingPurchase(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <>
          {/* Mobile Cards View (< md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {paginatedPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {purchase.supplier?.name || 'Unnamed Supplier'}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(purchase.transaction_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-sm text-emerald-700">
                      -{formatMMK(purchase.total_amount)}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {formatQuantity(purchase.quantity, purchase.unit || 'Kg')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs py-2 border-y border-slate-100">
                  <span className="font-medium text-slate-600">
                    Product: <strong className="text-slate-800">{purchase.product?.name || 'Strawberry'}</strong>
                  </span>
                  <span className="text-slate-500">
                    @{formatMMK(purchase.price_per_unit, true)}/{purchase.unit || 'Kg'}
                  </span>
                </div>

                {purchase.notes && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                    "{purchase.notes}"
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setViewingPurchase(purchase)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs flex items-center gap-1 font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button
                    onClick={() => {
                      setEditingPurchase(purchase);
                      setIsFormOpen(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg text-xs flex items-center gap-1 font-semibold"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setDeletingPurchase(purchase)}
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
                    <th className="py-3.5 px-4">Supplier</th>
                    <th className="py-3.5 px-4">Product Variety</th>
                    <th className="py-3.5 px-4 text-right">Quantity</th>
                    <th className="py-3.5 px-4 text-right">Unit Price</th>
                    <th className="py-3.5 px-4 text-right">Total Expense</th>
                    <th className="py-3.5 px-4">Notes</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPurchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium text-slate-700">
                        {formatDate(purchase.transaction_date)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {purchase.supplier?.name || 'Unnamed Supplier'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="font-medium text-slate-800">
                          {purchase.product?.name || 'Strawberry'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-800 whitespace-nowrap">
                        {formatQuantity(purchase.quantity, purchase.unit || 'Kg')}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 whitespace-nowrap">
                        {formatMMK(purchase.price_per_unit)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                        {formatMMK(purchase.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {purchase.notes || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingPurchase(purchase)}
                            title="View Details"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingPurchase(purchase);
                              setIsFormOpen(true);
                            }}
                            title="Edit"
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingPurchase(purchase)}
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
                <strong className="text-slate-800">{totalPages}</strong> ({purchases.length} total)
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

      {/* Add / Edit Purchase Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPurchase(null);
        }}
        title={editingPurchase ? 'Edit Purchase Record' : 'Record New Purchase Inflow'}
        maxWidth="max-w-xl"
      >
        <PurchaseForm
          initialData={editingPurchase}
          suppliers={suppliers}
          products={products}
          onSubmit={handleSavePurchase}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingPurchase(null);
          }}
          onQuickAddSupplier={() => setIsQuickSupplierOpen(true)}
          onQuickAddProduct={() => setIsQuickProductOpen(true)}
        />
      </Modal>

      {/* View Details Modal */}
      {viewingPurchase && (
        <Modal
          isOpen={Boolean(viewingPurchase)}
          onClose={() => setViewingPurchase(null)}
          title="Purchase Transaction Details"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Total Purchase Cost
                </span>
                <p className="text-2xl font-extrabold text-emerald-950 mt-1">
                  {formatMMK(viewingPurchase.total_amount)}
                </p>
              </div>
              <Badge variant="supplier" size="md">
                Purchase Inflow
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-medium">Transaction Date</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {formatDate(viewingPurchase.transaction_date)}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Supplier Partner</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {viewingPurchase.supplier?.name || '-'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Product Variety</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {viewingPurchase.product?.name || '-'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Quantity</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {formatQuantity(viewingPurchase.quantity, viewingPurchase.unit || 'Kg')}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Price Per Unit</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {formatMMK(viewingPurchase.price_per_unit)} / {viewingPurchase.unit || 'Kg'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Formula</span>
                <p className="font-medium text-slate-600 mt-0.5">
                  {viewingPurchase.quantity} × {formatMMK(viewingPurchase.price_per_unit, false)}
                </p>
              </div>
            </div>

            {viewingPurchase.notes && (
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Notes & Remarks
                </span>
                <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 mt-1">
                  {viewingPurchase.notes}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setViewingPurchase(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const toEdit = viewingPurchase;
                  setViewingPurchase(null);
                  setEditingPurchase(toEdit);
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
        isOpen={Boolean(deletingPurchase)}
        onClose={() => setDeletingPurchase(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Purchase Record"
        message="Are you sure you want to permanently delete this purchase record? Financial and inventory statistics will adjust accordingly."
        isLoading={isDeleting}
      />

      {/* Quick Add Supplier Modal */}
      <Modal
        isOpen={isQuickSupplierOpen}
        onClose={() => setIsQuickSupplierOpen(false)}
        title="Quick Add Supplier"
        maxWidth="max-w-md"
      >
        <CustomerForm
          defaultCategory="supplier"
          onSubmit={handleSaveQuickSupplier}
          onCancel={() => setIsQuickSupplierOpen(false)}
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
