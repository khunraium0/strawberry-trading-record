import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  Scale,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { productService } from '../services/productService';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { ProductForm } from '../components/forms/ProductForm';

export function ProductsPage({ isModalOpen, setIsModalOpen }) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // 'all' | 'active' | 'inactive'

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync external open trigger
  useEffect(() => {
    if (isModalOpen !== undefined && isModalOpen) {
      setEditingProduct(null);
      setIsFormOpen(true);
      if (setIsModalOpen) setIsModalOpen(false);
    }
  }, [isModalOpen, setIsModalOpen]);

  const loadProducts = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await productService.getProducts(user.id);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
      showError('Unable to load product list.');
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Save product
  const handleSaveProduct = async (formData) => {
    try {
      await productService.saveProduct(formData, user.id);
      showSuccess(formData.id ? 'Product updated!' : 'New product variety added!');
      setIsFormOpen(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (err) {
      console.error('Failed to save product:', err);
      showError('Failed to save product: ' + (err.message || 'Unknown error'));
      throw err;
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (product) => {
    try {
      await productService.saveProduct(
        {
          ...product,
          is_active: !product.is_active,
        },
        user.id
      );
      showSuccess(`${product.name} is now ${!product.is_active ? 'active' : 'inactive'}.`);
      await loadProducts();
    } catch (err) {
      showError('Failed to update product status.');
    }
  };

  // Delete product
  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    try {
      setIsDeleting(true);
      await productService.deleteProduct(deletingProduct.id, user.id);
      showSuccess('Product removed.');
      setDeletingProduct(null);
      await loadProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
      showError('Cannot delete product referenced in existing transactions.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesQuery =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.unit && p.unit.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesQuery) return false;

    if (filterActive === 'active') return p.is_active;
    if (filterActive === 'inactive') return !p.is_active;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Products & Varieties
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your strawberries, fresh berries, fruit grades, packaging units, and value-added items.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-rose-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New Product Variety</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
        {/* Active status pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Products' },
            { id: 'active', label: 'Active Only' },
            { id: 'inactive', label: 'Inactive' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterActive(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterActive === pill.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
              }`}
            >
              {pill.label}
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
            placeholder="Search by variety name, unit, or category..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center animate-pulse">
          <p className="text-sm text-slate-500">Loading catalog items...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Create your strawberry varieties or fruit trading items to begin purchasing and selling."
          actionText="Create Product"
          onAction={() => {
            setEditingProduct(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md ${
                prod.is_active ? 'border-slate-200' : 'border-slate-200/60 opacity-75'
              }`}
            >
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                      {prod.category || 'Fresh Fruit'}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 mt-1 truncate">
                      {prod.name}
                    </h3>
                  </div>
                  <Badge variant={prod.is_active ? 'active' : 'inactive'} size="xs">
                    {prod.is_active ? 'Active' : 'Archived'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <Scale className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Unit of Trade:</span>
                  <strong className="text-slate-800">{prod.unit || 'Kg'}</strong>
                </div>

                {prod.description ? (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">No description provided</p>
                )}
              </div>

              {/* Card Footer */}
              <div className="bg-slate-50/80 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleToggleActive(prod)}
                  className={`text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                    prod.is_active
                      ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {prod.is_active ? (
                    <>
                      <XCircle className="w-3.5 h-3.5" /> Deactivate
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Set Active
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingProduct(prod);
                      setIsFormOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
                    title="Edit product"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingProduct(prod)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? 'Edit Product Variety' : 'Add New Product Variety'}
        maxWidth="max-w-md"
      >
        <ProductForm
          initialData={editingProduct}
          onSubmit={handleSaveProduct}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingProduct(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product Variety"
        message={`Are you sure you want to delete ${deletingProduct?.name}? Make sure no historical purchases or sales depend on it.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
