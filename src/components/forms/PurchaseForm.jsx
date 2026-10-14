import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, User, Package, Hash, DollarSign, Calculator, FileText, Save, Loader2, Plus } from 'lucide-react';
import { toInputDateFormat, formatMMK } from '../../utils/formatters';
import { validateTransaction, calculateTotalAmount } from '../../utils/validators';

export function PurchaseForm({
  initialData = null,
  suppliers = [],
  products = [],
  onSubmit,
  onCancel,
  onQuickAddSupplier,
  onQuickAddProduct,
}) {
  const [formData, setFormData] = useState({
    supplier_id: '',
    product_id: '',
    transaction_date: toInputDateFormat(new Date()),
    quantity: '',
    unit: 'Kg',
    price_per_unit: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        supplier_id: initialData.supplier_id || '',
        product_id: initialData.product_id || '',
        transaction_date: initialData.transaction_date || toInputDateFormat(new Date()),
        quantity: initialData.quantity !== undefined ? String(initialData.quantity) : '',
        unit: initialData.unit || 'Kg',
        price_per_unit: initialData.price_per_unit !== undefined ? String(initialData.price_per_unit) : '',
        notes: initialData.notes || '',
      });
    } else {
      // Default to first supplier and first product if available
      if (suppliers.length > 0 && !formData.supplier_id) {
        setFormData((prev) => ({ ...prev, supplier_id: suppliers[0].id }));
      }
      if (products.length > 0 && !formData.product_id) {
        const prod = products.find((p) => p.is_active) || products[0];
        setFormData((prev) => ({ ...prev, product_id: prod.id, unit: prod.unit || 'Kg' }));
      }
    }
  }, [initialData, suppliers, products]);

  // When product changes, update default unit
  const handleProductChange = (productId) => {
    const selectedProd = products.find((p) => p.id === productId);
    setFormData((prev) => ({
      ...prev,
      product_id: productId,
      unit: selectedProd?.unit || prev.unit || 'Kg',
    }));
    if (errors.product_id) {
      setErrors((prev) => ({ ...prev, product_id: null }));
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Live calculated total
  const computedTotal = useMemo(() => {
    return calculateTotalAmount(formData.quantity, formData.price_per_unit);
  }, [formData.quantity, formData.price_per_unit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, errors: validationErrors } = validateTransaction(formData, 'purchase');
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        ...(initialData?.id ? { id: initialData.id } : {}),
        ...formData,
        total_amount: computedTotal,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Supplier Selection */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Supplier *
          </label>
          {onQuickAddSupplier && (
            <button
              type="button"
              onClick={onQuickAddSupplier}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> New Supplier
            </button>
          )}
        </div>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <select
            required
            value={formData.supplier_id}
            onChange={(e) => handleChange('supplier_id', e.target.value)}
            className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 ${
              errors.supplier_id
                ? 'border-rose-400 focus:ring-rose-500/20'
                : 'border-slate-200 focus:border-rose-500 focus:ring-rose-500/20'
            }`}
          >
            <option value="">-- Select Supplier --</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.phone ? `(${s.phone})` : ''}
              </option>
            ))}
          </select>
        </div>
        {errors.supplier_id && <p className="text-xs text-rose-600 mt-1">{errors.supplier_id}</p>}
      </div>

      {/* Product Selection */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Product Variety *
          </label>
          {onQuickAddProduct && (
            <button
              type="button"
              onClick={onQuickAddProduct}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> New Product
            </button>
          )}
        </div>
        <div className="relative">
          <Package className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <select
            required
            value={formData.product_id}
            onChange={(e) => handleProductChange(e.target.value)}
            className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 ${
              errors.product_id
                ? 'border-rose-400 focus:ring-rose-500/20'
                : 'border-slate-200 focus:border-rose-500 focus:ring-rose-500/20'
            }`}
          >
            <option value="">-- Select Product --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.unit}) {!p.is_active ? '[Inactive]' : ''}
              </option>
            ))}
          </select>
        </div>
        {errors.product_id && <p className="text-xs text-rose-600 mt-1">{errors.product_id}</p>}
      </div>

      {/* Date & Unit row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Purchase Date *
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="date"
              required
              value={formData.transaction_date}
              onChange={(e) => handleChange('transaction_date', e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
            />
          </div>
          {errors.transaction_date && (
            <p className="text-xs text-rose-600 mt-1">{errors.transaction_date}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Unit of Measurement
          </label>
          <input
            type="text"
            value={formData.unit}
            onChange={(e) => handleChange('unit', e.target.value)}
            placeholder="e.g. Kg, Box"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
      </div>

      {/* Quantity & Unit Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Quantity ({formData.unit || 'Kg'}) *
          </label>
          <div className="relative">
            <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="number"
              step="any"
              min="0.01"
              required
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              placeholder="e.g. 50"
              className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                errors.quantity
                  ? 'border-rose-400 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-rose-500 focus:ring-rose-500/20'
              }`}
            />
          </div>
          {errors.quantity && <p className="text-xs text-rose-600 mt-1">{errors.quantity}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Price Per Unit (MMK / Ks) *
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="number"
              step="any"
              min="0"
              required
              value={formData.price_per_unit}
              onChange={(e) => handleChange('price_per_unit', e.target.value)}
              placeholder="e.g. 14000"
              className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                errors.price_per_unit
                  ? 'border-rose-400 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:border-rose-500 focus:ring-rose-500/20'
              }`}
            />
          </div>
          {errors.price_per_unit && (
            <p className="text-xs text-rose-600 mt-1">{errors.price_per_unit}</p>
          )}
        </div>
      </div>

      {/* Automatically Calculated Total Display */}
      <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-600 text-white rounded-xl">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-900 block">Total Expense</span>
            <span className="text-[11px] text-emerald-700">
              {formData.quantity || 0} {formData.unit} × {formatMMK(formData.price_per_unit || 0)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-black text-emerald-900">{formatMMK(computedTotal)}</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Notes (Optional)
        </label>
        <div className="relative">
          <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <textarea
            rows="2"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="e.g. Morning harvest batch from Plot 3"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {initialData?.id ? 'Update Purchase' : 'Save Purchase Record'}
        </button>
      </div>
    </form>
  );
}
