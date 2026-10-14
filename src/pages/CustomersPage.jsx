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
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { customerService } from '../services/customerService';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { CustomerForm } from '../components/forms/CustomerForm';
import { formatMMK, formatQuantity, formatDate } from '../utils/formatters';

export function CustomersPage({ isModalOpen, setIsModalOpen }) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'supplier' | 'buyer' | 'both'

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomerId, setViewingCustomerId] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync external open trigger
  useEffect(() => {
    if (isModalOpen !== undefined && isModalOpen) {
      setEditingCustomer(null);
      setIsFormOpen(true);
      if (setIsModalOpen) setIsModalOpen(false);
    }
  }, [isModalOpen, setIsModalOpen]);

  // Load customer list
  const loadCustomers = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await customerService.getCustomers(user.id, {
        category: categoryFilter,
        search: searchQuery,
      });
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
      showError('Unable to load customer partners.');
    } finally {
      setLoading(false);
    }
  }, [user, categoryFilter, searchQuery, showError]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Load single customer with transaction history for viewing modal
  useEffect(() => {
    if (!viewingCustomerId || !user) return;

    let mounted = true;
    async function fetchCustomerHistory() {
      try {
        setLoadingDetails(true);
        const data = await customerService.getCustomerWithHistory(viewingCustomerId, user.id);
        if (mounted) {
          setCustomerDetails(data);
        }
      } catch (err) {
        console.error('Failed to load customer details:', err);
        showError('Could not load customer transaction history.');
      } finally {
        if (mounted) setLoadingDetails(false);
      }
    }

    fetchCustomerHistory();
    return () => {
      mounted = false;
    };
  }, [viewingCustomerId, user, showError]);

  // Save Customer
  const handleSaveCustomer = async (formData) => {
    try {
      await customerService.saveCustomer(formData, user.id);
      showSuccess(formData.id ? 'Customer updated!' : 'Customer added successfully!');
      setIsFormOpen(false);
      setEditingCustomer(null);
      await loadCustomers();
    } catch (err) {
      console.error('Failed to save customer:', err);
      showError('Failed to save customer: ' + (err.message || 'Unknown error'));
      throw err;
    }
  };

  // Delete Customer
  const handleDeleteConfirm = async () => {
    if (!deletingCustomer) return;
    try {
      setIsDeleting(true);
      await customerService.deleteCustomer(deletingCustomer.id, user.id);
      showSuccess('Customer deleted.');
      setDeletingCustomer(null);
      if (viewingCustomerId === deletingCustomer.id) {
        setViewingCustomerId(null);
      }
      await loadCustomers();
    } catch (err) {
      console.error('Failed to delete customer:', err);
      showError('Cannot delete customer with linked transactions.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Counts for pills
  const counts = useMemo(() => {
    const suppliers = customers.filter((c) => c.category === 'supplier' || c.category === 'both').length;
    const buyers = customers.filter((c) => c.category === 'buyer' || c.category === 'both').length;
    return { all: customers.length, suppliers, buyers };
  }, [customers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Customer & Partner Directory
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your growers, suppliers, wholesale buyers, supermarkets, and bakery clients.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer / Partner</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Partners' },
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
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Customer List Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center animate-pulse">
          <p className="text-sm text-slate-500">Loading partner directory...</p>
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customer partners found"
          description="Add strawberry farmers, wholesale markets, bakeries, or retail clients to begin tracking transactions."
          actionText="Add First Partner"
          onAction={() => {
            setEditingCustomer(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((cust) => {
            const isSupplier = cust.category === 'supplier' || cust.category === 'both';
            const isBuyer = cust.category === 'buyer' || cust.category === 'both';

            return (
              <div
                key={cust.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {cust.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Added {formatDate(cust.created_at)}
                      </p>
                    </div>
                    <Badge variant={cust.category} size="sm">
                      {cust.category === 'both'
                        ? 'Supplier & Buyer'
                        : cust.category === 'supplier'
                        ? 'Supplier'
                        : 'Buyer'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    {cust.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <a
                          href={`tel:${cust.phone}`}
                          className="hover:text-blue-600 font-medium text-slate-700 hover:underline truncate"
                        >
                          {cust.phone}
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 italic">
                        <Phone className="w-3.5 h-3.5 text-slate-300" />
                        <span>No phone number</span>
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
                <div className="bg-slate-50/80 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setViewingCustomerId(cust.id)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 py-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View History</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCustomer(cust);
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
                      title="Edit customer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingCustomer(cust)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCustomer(null);
        }}
        title={editingCustomer ? 'Edit Customer Details' : 'Register New Partner'}
        maxWidth="max-w-md"
      >
        <CustomerForm
          initialData={editingCustomer}
          onSubmit={handleSaveCustomer}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingCustomer(null);
          }}
        />
      </Modal>

      {/* Customer Details & Complete Transaction History Modal */}
      {viewingCustomerId && (
        <Modal
          isOpen={Boolean(viewingCustomerId)}
          onClose={() => {
            setViewingCustomerId(null);
            setCustomerDetails(null);
          }}
          title={customerDetails?.customer ? customerDetails.customer.name : 'Customer Details'}
          maxWidth="max-w-2xl"
        >
          {loadingDetails || !customerDetails ? (
            <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
              Loading partner profile and transaction ledger...
            </div>
          ) : (
            <div className="space-y-5">
              {/* Profile summary header */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">
                      {customerDetails.customer.name}
                    </h3>
                    <Badge variant={customerDetails.customer.category} size="xs">
                      {customerDetails.customer.category === 'both'
                        ? 'Supplier & Buyer'
                        : customerDetails.customer.category}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    {customerDetails.customer.phone && (
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {customerDetails.customer.phone}
                      </span>
                    )}
                    {customerDetails.customer.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {customerDetails.customer.address}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const toEdit = customerDetails.customer;
                      setViewingCustomerId(null);
                      setEditingCustomer(toEdit);
                      setIsFormOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      const toDelete = customerDetails.customer;
                      setDeletingCustomer(toDelete);
                    }}
                    className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    title="Delete partner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Quick Financial Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Total Inflow Purchased
                  </span>
                  <p className="text-base font-extrabold text-emerald-950 mt-0.5">
                    {formatMMK(
                      customerDetails.purchases.reduce((s, p) => s + (Number(p.total_amount) || 0), 0)
                    )}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    {customerDetails.purchases.length} purchase orders
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                    Total Outflow Sold
                  </span>
                  <p className="text-base font-extrabold text-rose-950 mt-0.5">
                    {formatMMK(
                      customerDetails.sales.reduce((s, p) => s + (Number(p.total_amount) || 0), 0)
                    )}
                  </p>
                  <p className="text-[11px] text-rose-700 font-medium">
                    {customerDetails.sales.length} sales deliveries
                  </p>
                </div>
              </div>

              {/* Transactions Ledger Tabs/Section */}
              <div className="space-y-4">
                {/* Purchases from this customer */}
                {(customerDetails.customer.category === 'supplier' ||
                  customerDetails.customer.category === 'both') && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Purchases From Supplier ({customerDetails.purchases.length})
                      </h4>
                    </div>

                    {customerDetails.purchases.length === 0 ? (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                        No purchase records recorded with this supplier yet.
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                        {customerDetails.purchases.map((p) => (
                          <div
                            key={p.id}
                            className="p-2.5 hover:bg-slate-50 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-800">
                                {p.product?.name || 'Fresh Strawberry'}
                              </span>
                              <p className="text-[11px] text-slate-400">
                                {formatDate(p.transaction_date)} • {formatQuantity(p.quantity, p.unit || 'Kg')}
                              </p>
                            </div>
                            <span className="font-bold text-emerald-700">
                              -{formatMMK(p.total_amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sales to this customer */}
                {(customerDetails.customer.category === 'buyer' ||
                  customerDetails.customer.category === 'both') && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Sales To Buyer ({customerDetails.sales.length})
                      </h4>
                    </div>

                    {customerDetails.sales.length === 0 ? (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                        No sales deliveries recorded with this buyer yet.
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                        {customerDetails.sales.map((s) => (
                          <div
                            key={s.id}
                            className="p-2.5 hover:bg-slate-50 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-800">
                                {s.product?.name || 'Fresh Strawberry'}
                              </span>
                              <p className="text-[11px] text-slate-400">
                                {formatDate(s.transaction_date)} • {formatQuantity(s.quantity, s.unit || 'Kg')}
                              </p>
                            </div>
                            <span className="font-bold text-rose-600">
                              +{formatMMK(s.total_amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => {
                    setViewingCustomerId(null);
                    setCustomerDetails(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                >
                  Close Ledger
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingCustomer)}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Partner Record"
        message={`Are you sure you want to delete ${deletingCustomer?.name}?`}
        isLoading={isDeleting}
      />
    </div>
  );
}
