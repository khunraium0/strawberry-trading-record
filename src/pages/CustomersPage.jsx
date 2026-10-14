import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  ShoppingCart,
  TrendingUp,
  FileText,
  ChevronLeft,
  ArrowRight,
  Calculator,
  Coins,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { customerService } from '../services/customerService';
import { purchaseService } from '../services/purchaseService';
import { salesService } from '../services/salesService';
import { productService } from '../services/productService';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { CustomerForm } from '../components/forms/CustomerForm';
import { CustomerTransactionForm } from '../components/forms/CustomerTransactionForm';
import { ProductForm } from '../components/forms/ProductForm';
import { formatMMK, formatQuantity, formatDate } from '../utils/formatters';

export function CustomersPage({ isModalOpen, setIsModalOpen }) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active view: null means list view, otherwise customer object for detail page
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState({ customer: null, purchases: [], sales: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Filters for customer list
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'supplier' | 'buyer'

  // Modals state
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  // Transaction form modal state (for New Record from customer detail page)
  const [isTxFormOpen, setIsTxFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [isDeletingTx, setIsDeletingTx] = useState(false);

  // Quick add product modal
  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);

  // External open trigger sync
  useEffect(() => {
    if (isModalOpen !== undefined && isModalOpen) {
      setEditingCustomer(null);
      setIsCustomerFormOpen(true);
      if (setIsModalOpen) setIsModalOpen(false);
    }
  }, [isModalOpen, setIsModalOpen]);

  // Load customer list
  const loadCustomers = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [custList, prodList] = await Promise.all([
        customerService.getCustomers(user.id, {
          category: categoryFilter,
          search: searchQuery,
        }),
        productService.getProducts(user.id),
      ]);
      setCustomers(custList);
      setProducts(prodList);
    } catch (err) {
      console.error('Failed to load customers:', err);
      showError('Unable to load customer directory.');
    } finally {
      setLoading(false);
    }
  }, [user, categoryFilter, searchQuery, showError]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Load customer history when a customer is selected
  const loadCustomerHistory = useCallback(async (customerId) => {
    if (!user || !customerId) return;
    try {
      setLoadingHistory(true);
      const history = await customerService.getCustomerWithHistory(customerId, user.id);
      setCustomerHistory(history);
      if (history.customer) {
        setSelectedCustomer(history.customer);
      }
    } catch (err) {
      console.error('Failed to load customer history:', err);
      showError('Unable to load customer transaction history.');
    } finally {
      setLoadingHistory(false);
    }
  }, [user, showError]);

  useEffect(() => {
    if (selectedCustomer?.id) {
      loadCustomerHistory(selectedCustomer.id);
    }
  }, [selectedCustomer?.id, loadCustomerHistory]);

  // Save Customer (Add / Edit)
  const handleSaveCustomer = async (formData) => {
    try {
      const saved = await customerService.saveCustomer(formData, user.id);
      showSuccess(formData.id ? 'Customer saved successfully!' : 'Customer added successfully!');
      setIsCustomerFormOpen(false);
      setEditingCustomer(null);
      await loadCustomers();
      if (selectedCustomer && selectedCustomer.id === saved.id) {
        setSelectedCustomer(saved);
      }
    } catch (err) {
      console.error('Failed to save customer:', err);
      showError('Failed to save customer: ' + (err.message || 'Unknown error'));
      throw err;
    }
  };

  // Delete Customer
  const handleDeleteCustomerConfirm = async () => {
    if (!deletingCustomer) return;
    try {
      setIsDeletingCustomer(true);
      await customerService.deleteCustomer(deletingCustomer.id, user.id);
      showSuccess('Customer deleted.');
      setDeletingCustomer(null);
      if (selectedCustomer?.id === deletingCustomer.id) {
        setSelectedCustomer(null);
      }
      await loadCustomers();
    } catch (err) {
      console.error('Failed to delete customer:', err);
      showError('Cannot delete customer with linked transactions.');
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  // Save Transaction from Customer Detail Page
  const handleSaveCustomerTransaction = async (txData) => {
    try {
      const isPurchase = txData.type === 'purchase';

      // Check if editing an existing record and whether the type was changed
      if (txData.id && txData.originalType && txData.originalType !== txData.type) {
        // Delete from the previous service
        if (txData.originalType === 'purchase') {
          await purchaseService.deletePurchase(txData.id, user.id);
        } else {
          await salesService.deleteSales(txData.id, user.id);
        }
        // Save as new record under new type
        delete txData.id;
      }

      if (isPurchase) {
        await purchaseService.savePurchase(
          {
            id: txData.id,
            supplier_id: selectedCustomer.id,
            product_id: txData.product_id,
            product_name: txData.product_name,
            transaction_date: txData.transaction_date,
            quantity: txData.quantity,
            unit: txData.unit,
            price_per_unit: txData.price_per_unit,
            total_amount: txData.total_amount,
            notes: txData.notes,
          },
          user.id
        );
      } else {
        await salesService.saveSales(
          {
            id: txData.id,
            buyer_id: selectedCustomer.id,
            product_id: txData.product_id,
            product_name: txData.product_name,
            transaction_date: txData.transaction_date,
            quantity: txData.quantity,
            unit: txData.unit,
            unit_price: txData.price_per_unit,
            total_amount: txData.total_amount,
            notes: txData.notes,
          },
          user.id
        );
      }

      showSuccess(txData.id ? 'Record updated!' : 'New record saved!');
      setIsTxFormOpen(false);
      setEditingTransaction(null);
      // Reload customer history immediately
      await loadCustomerHistory(selectedCustomer.id);
    } catch (err) {
      console.error('Failed to save transaction:', err);
      showError('Failed to save record: ' + (err.message || 'Unknown error'));
      throw err;
    }
  };

  // Delete Transaction
  const handleDeleteTxConfirm = async () => {
    if (!deletingTransaction) return;
    try {
      setIsDeletingTx(true);
      if (deletingTransaction.type === 'purchase') {
        await purchaseService.deletePurchase(deletingTransaction.id, user.id);
      } else {
        await salesService.deleteSales(deletingTransaction.id, user.id);
      }
      showSuccess('Transaction record removed.');
      setDeletingTransaction(null);
      await loadCustomerHistory(selectedCustomer.id);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      showError('Failed to delete transaction: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeletingTx(false);
    }
  };

  // Quick add product variety from inside customer transaction form
  const handleSaveQuickProduct = async (prodData) => {
    try {
      const created = await productService.saveProduct(prodData, user.id);
      showSuccess('Product added successfully!');
      setIsQuickProductOpen(false);
      const updatedProds = await productService.getProducts(user.id);
      setProducts(updatedProds);
      return created;
    } catch (err) {
      showError('Failed to add product variety.');
    }
  };

  // Unified chronological transactions for the selected customer
  const customerTransactions = useMemo(() => {
    const purs = (customerHistory.purchases || []).map((p) => ({
      ...p,
      type: 'purchase',
      price_per_unit: p.price_per_unit,
      product_name: p.product?.name || p.product_name || 'Strawberry',
    }));
    const sals = (customerHistory.sales || []).map((s) => ({
      ...s,
      type: 'sale',
      price_per_unit: s.unit_price,
      product_name: s.product?.name || s.product_name || 'Strawberry',
    }));
    return [...purs, ...sals].sort(
      (a, b) => new Date(b.transaction_date) - new Date(a.transaction_date)
    );
  }, [customerHistory]);

  const totalPurchaseAmount = useMemo(() => {
    return (customerHistory.purchases || []).reduce(
      (sum, p) => sum + (Number(p.total_amount) || 0),
      0
    );
  }, [customerHistory.purchases]);

  const totalSalesAmount = useMemo(() => {
    return (customerHistory.sales || []).reduce(
      (sum, s) => sum + (Number(s.total_amount) || 0),
      0
    );
  }, [customerHistory.sales]);

  // =========================================================================
  // VIEW: CUSTOMER DETAIL PAGE
  // =========================================================================
  if (selectedCustomer) {
    const isSupplier = selectedCustomer.category === 'supplier';
    const isBuyer = selectedCustomer.category === 'buyer';

    return (
      <div className="space-y-6">
        {/* Top Navigation: Back to Customers */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedCustomer(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Customers</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingCustomer(selectedCustomer);
                setIsCustomerFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setDeletingCustomer(selectedCustomer)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Customer Information Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {selectedCustomer.name}
                </h1>
                <Badge variant={selectedCustomer.category} size="sm">
                  {isSupplier ? 'Supplier' : isBuyer ? 'Buyer' : selectedCustomer.category}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Customer Record ID: #{selectedCustomer.id?.slice(0, 8)}
              </p>
            </div>

            {/* Prominent + New Record Button */}
            <button
              onClick={() => {
                setEditingTransaction(null);
                setIsTxFormOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Record</span>
            </button>
          </div>

          {/* Customer Meta Row: Phone, Address, Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Phone Number
              </span>
              {selectedCustomer.phone ? (
                <a
                  href={`tel:${selectedCustomer.phone}`}
                  className="font-semibold text-rose-600 hover:underline flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{selectedCustomer.phone}</span>
                </a>
              ) : (
                <span className="text-slate-400 italic">No phone recorded</span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Address
              </span>
              {selectedCustomer.address ? (
                <div className="flex items-start gap-1.5 font-medium text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{selectedCustomer.address}</span>
                </div>
              ) : (
                <span className="text-slate-400 italic">No address recorded</span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Customer Notes
              </span>
              {selectedCustomer.notes ? (
                <div className="flex items-start gap-1.5 text-slate-700 italic">
                  <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">"{selectedCustomer.notes}"</span>
                </div>
              ) : (
                <span className="text-slate-400 italic">No notes</span>
              )}
            </div>
          </div>

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Records
                </span>
                <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {customerTransactions.length} {customerTransactions.length === 1 ? 'record' : 'records'}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white shadow-2xs text-slate-600">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Total Purchase Amount
                </span>
                <p className="text-xl font-extrabold text-emerald-950 mt-0.5">
                  {formatMMK(totalPurchaseAmount)}
                </p>
                <p className="text-[10px] text-emerald-700 font-medium">
                  {(customerHistory.purchases || []).length} purchases recorded
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white shadow-2xs text-emerald-600">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                  Total Sales Amount
                </span>
                <p className="text-xl font-extrabold text-rose-950 mt-0.5">
                  {formatMMK(totalSalesAmount)}
                </p>
                <p className="text-[10px] text-rose-700 font-medium">
                  {(customerHistory.sales || []).length} sales recorded
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white shadow-2xs text-rose-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Transaction History
              </h2>
              <p className="text-xs text-slate-500">
                Chronological list of all purchases and sales associated with {selectedCustomer.name}.
              </p>
            </div>

            {customerTransactions.length > 0 && (
              <button
                onClick={() => {
                  setEditingTransaction(null);
                  setIsTxFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Record</span>
              </button>
            )}
          </div>

          {loadingHistory ? (
            <div className="p-10 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-400 animate-pulse">
              Loading customer records...
            </div>
          ) : customerTransactions.length === 0 ? (
            <div className="p-10 bg-white rounded-3xl border border-slate-200 text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                No records yet. Click New Record to add the first transaction.
              </p>
              <button
                onClick={() => {
                  setEditingTransaction(null);
                  setIsTxFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-200 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Record</span>
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Cards View (< md) */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {customerTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={tx.type === 'purchase' ? 'supplier' : 'buyer'}
                          size="xs"
                        >
                          {tx.type === 'purchase' ? 'Purchase' : 'Sale'}
                        </Badge>
                        <span className="font-bold text-slate-900 text-sm">
                          {tx.product_name || 'Strawberry'}
                        </span>
                      </div>
                      <span
                        className={`font-black text-sm ${
                          tx.type === 'purchase' ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {tx.type === 'purchase' ? '-' : '+'}
                        {formatMMK(tx.total_amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 py-1.5 border-y border-slate-100">
                      <span>{formatDate(tx.transaction_date)}</span>
                      <span>
                        {formatQuantity(tx.quantity, tx.unit || 'Box')} @ {formatMMK(tx.price_per_unit, false)} Ks
                      </span>
                    </div>

                    {tx.notes && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                        "{tx.notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => {
                          setEditingTransaction(tx);
                          setIsTxFormOpen(true);
                        }}
                        className="p-1.5 px-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeletingTransaction(tx)}
                        className="p-1.5 px-3 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Transaction Type</th>
                      <th className="py-3.5 px-4">Product</th>
                      <th className="py-3.5 px-4 text-right">Quantity & Unit</th>
                      <th className="py-3.5 px-4 text-right">Unit Price</th>
                      <th className="py-3.5 px-4 text-right">Total Amount</th>
                      <th className="py-3.5 px-4">Notes</th>
                      <th className="py-3.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium text-slate-700">
                          {formatDate(tx.transaction_date)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge
                            variant={tx.type === 'purchase' ? 'supplier' : 'buyer'}
                            size="xs"
                          >
                            {tx.type === 'purchase' ? 'Purchase' : 'Sale'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {tx.product_name || 'Strawberry'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-800 whitespace-nowrap">
                          {formatQuantity(tx.quantity, tx.unit || 'Box')}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-600 whitespace-nowrap">
                          {formatMMK(tx.price_per_unit)}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-black whitespace-nowrap ${
                            tx.type === 'purchase' ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {tx.type === 'purchase' ? '-' : '+'}
                          {formatMMK(tx.total_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                          {tx.notes || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingTransaction(tx);
                                setIsTxFormOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setDeletingTransaction(tx)}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Modal: Add / Edit Transaction for Customer */}
        <Modal
          isOpen={isTxFormOpen}
          onClose={() => {
            setIsTxFormOpen(false);
            setEditingTransaction(null);
          }}
          title={
            editingTransaction
              ? `Edit Record for ${selectedCustomer.name}`
              : `New Record for ${selectedCustomer.name}`
          }
          maxWidth="max-w-md"
        >
          <CustomerTransactionForm
            customer={selectedCustomer}
            initialData={editingTransaction}
            products={products}
            onSubmit={handleSaveCustomerTransaction}
            onCancel={() => {
              setIsTxFormOpen(false);
              setEditingTransaction(null);
            }}
            onQuickAddProduct={() => setIsQuickProductOpen(true)}
          />
        </Modal>

        {/* Modal: Edit Customer Profile */}
        <Modal
          isOpen={isCustomerFormOpen}
          onClose={() => {
            setIsCustomerFormOpen(false);
            setEditingCustomer(null);
          }}
          title="Edit Customer"
          maxWidth="max-w-md"
        >
          <CustomerForm
            initialData={editingCustomer}
            onSubmit={handleSaveCustomer}
            onCancel={() => {
              setIsCustomerFormOpen(false);
              setEditingCustomer(null);
            }}
          />
        </Modal>

        {/* Modal: Delete Transaction Confirmation */}
        <ConfirmDialog
          isOpen={Boolean(deletingTransaction)}
          onClose={() => setDeletingTransaction(null)}
          onConfirm={handleDeleteTxConfirm}
          title="Delete Transaction Record"
          message="Are you sure you want to permanently delete this transaction? The customer's totals will automatically update."
          isLoading={isDeletingTx}
        />

        {/* Modal: Delete Customer Confirmation */}
        <ConfirmDialog
          isOpen={Boolean(deletingCustomer)}
          onClose={() => setDeletingCustomer(null)}
          onConfirm={handleDeleteCustomerConfirm}
          title="Delete Customer"
          message={`Are you sure you want to delete ${deletingCustomer?.name}?`}
          isLoading={isDeletingCustomer}
        />

        {/* Modal: Quick Add Product */}
        <Modal
          isOpen={isQuickProductOpen}
          onClose={() => setIsQuickProductOpen(false)}
          title="Add Product Variety"
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

  // =========================================================================
  // VIEW: CUSTOMER DIRECTORY LIST VIEW
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Customer Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your strawberry suppliers (growers) and buyers (clients). Click any customer to view details and record transactions.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsCustomerFormOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-rose-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Customers' },
            { id: 'supplier', label: 'Suppliers (Growers)' },
            { id: 'buyer', label: 'Buyers (Clients)' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name or phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
      </div>

      {/* Customer List Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center animate-pulse">
          <p className="text-sm text-slate-500">Loading customer directory...</p>
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Create your first supplier (grower) or buyer (client) to start recording transactions."
          actionText="Add Customer"
          onAction={() => {
            setEditingCustomer(null);
            setIsCustomerFormOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((cust) => {
            const isSupplier = cust.category === 'supplier';
            const isBuyer = cust.category === 'buyer';

            return (
              <div
                key={cust.id}
                onClick={() => setSelectedCustomer(cust)}
                className="bg-white rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-rose-200 transition-all flex flex-col justify-between overflow-hidden cursor-pointer group"
              >
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-base text-slate-900 group-hover:text-rose-600 transition-colors truncate">
                        {cust.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Created {formatDate(cust.created_at)}
                      </p>
                    </div>
                    <Badge variant={cust.category} size="sm">
                      {isSupplier ? 'Supplier' : isBuyer ? 'Buyer' : cust.category}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    {cust.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-medium text-slate-700 truncate">
                          {cust.phone}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 italic">
                        <Phone className="w-3.5 h-3.5 text-slate-300" />
                        <span>No phone</span>
                      </div>
                    )}

                    {cust.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="truncate">{cust.address}</span>
                      </div>
                    )}

                    {cust.notes && (
                      <div className="flex items-start gap-2 pt-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-500 italic line-clamp-2">
                          "{cust.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div
                  className="bg-slate-50/80 px-4 py-3 border-t border-slate-100 flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setSelectedCustomer(cust)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 py-1"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingCustomer(cust);
                        setIsCustomerFormOpen(true);
                      }}
                      className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingCustomer(cust)}
                      className="px-2.5 py-1 text-rose-600 hover:text-rose-800 bg-rose-50 border border-rose-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add / Edit Customer */}
      <Modal
        isOpen={isCustomerFormOpen}
        onClose={() => {
          setIsCustomerFormOpen(false);
          setEditingCustomer(null);
        }}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        maxWidth="max-w-md"
      >
        <CustomerForm
          initialData={editingCustomer}
          onSubmit={handleSaveCustomer}
          onCancel={() => {
            setIsCustomerFormOpen(false);
            setEditingCustomer(null);
          }}
        />
      </Modal>

      {/* Modal: Delete Customer Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingCustomer)}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={handleDeleteCustomerConfirm}
        title="Delete Customer"
        message={`Are you sure you want to delete ${deletingCustomer?.name}?`}
        isLoading={isDeletingCustomer}
      />
    </div>
  );
}
