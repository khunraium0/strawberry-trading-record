import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Package,
  Hash,
  Coins,
  Calculator,
  FileText,
  Save,
  Loader2,
  Plus,
  ShoppingCart,
  TrendingUp,
  User,
} from 'lucide-react';
import { toInputDateFormat, formatMMK } from '../../utils/formatters';
import { calculateTotalAmount } from '../../utils/validators';

export function CustomerTransactionForm({
  customer,
  initialData = null,
  products = [],
  onSubmit,
  onCancel,
  onQuickAddProduct,
}) {
  // Determine default transaction type:
  // Supplier -> Purchase, Buyer -> Sale, otherwise Purchase
  const defaultType = useMemo(() => {
    if (initialData?.type) return initialData.type;
    if (customer?.category === 'buyer') return 'sale';
    return 'purchase';
  }, [customer, initialData]);

  const [transactionType, setTransactionType] = useState(defaultType);
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: 'Strawberry',
    transaction_date: toInputDateFormat(new Date()),
    quantity: '',
    unit: 'Box',
    price_per_unit: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTransactionType(initialData.type || defaultType);
      setFormData({
        product_id: initialData.product_id || '',
        product_name: initialData.product?.name || initialData.product_name || 'Strawberry',
        transaction_date: initialData.transaction_date || toInputDateFormat(new Date()),
        quantity: initialData.quantity !== undefined ? String(initialData.quantity) : '',
        unit: initialData.unit || 'Box',
        price_per_unit:
          initialData.price_per_unit !== undefined
            ? String(initialData.price_per_unit)
            : initialData.unit_price !== undefined
            ? String(initialData.unit_price)
            : '',
        notes: initialData.notes || '',
      });
    } else {
      setTransactionType(defaultType);
      // Select first product if available
      const defaultProd =
        products.find((p) => p.is_active && p.name.toLowerCase().includes('strawberry')) ||
        products[0];

      if (defaultProd) {
        setFormData((prev) => ({
          ...prev,
          product_id: defaultProd.id,
          product_name: defaultProd.name,
          unit: defaultProd.unit || 'Box',
        }));
      }
    }
  }, [initialData, defaultType, products]);

  const handleProductChange = (productId) => {
    const selectedProd = products.find((p) => p.id === productId);
    if (selectedProd) {
      setFormData((prev) => ({
        ...prev,
        product_id: selectedProd.id,
        product_name: selectedProd.name,
        unit: selectedProd.unit || prev.unit || 'Box',
      }));
    }
    if (errors.product_name) {
      setErrors((prev) => ({ ...prev, product_name: null }));
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Live computed total amount: Quantity * Price Per Unit
  const computedTotal = useMemo(() => {
    return calculateTotalAmount(formData.quantity, formData.price_per_unit);
  }, [formData.quantity, formData.price_per_unit]);

  const validate = () => {
    const newErrors = {};

    if (!transactionType) {
      newErrors.transactionType = 'Transaction type is required';
    }

    if (!formData.product_name && !formData.product_id) {
      newErrors.product_name = 'Product name is required';
    }

    if (!formData.transaction_date) {
      newErrors.transaction_date = 'Transaction date is required';
    }

    const qty = parseFloat(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    const price = parseFloat(formData.price_per_unit);
    if (isNaN(price) || price < 0) {
      newErrors.price_per_unit = 'Price per unit cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        ...(initialData?.id ? { id: initialData.id } : {}),
        originalType: initialData?.type, // In case user switched from purchase to sale or vice versa
        type: transactionType,
        customer_id: customer.id,
        product_id: formData.product_id || products[0]?.id || 'prod-strawberry',
        product_name: formData.product_name || 'Strawberry',
        transaction_date: formData.transaction_date,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit || 'Box',
        price_per_unit: parseFloat(formData.price_per_unit),
        total_amount: computedTotal,
        notes: formData.notes ? formData.notes.trim() : '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer summary pill */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{customer?.name}</p>
            <p className="text-[11px] text-slate-500 capitalize">
              {customer?.category === 'supplier'
                ? 'Supplier (Grower)'
                : customer?.category === 'buyer'
                ? 'Buyer (Customer)'
                : 'Customer Partner'}
            </p>
          </div>
        </div>

        <span
          className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
            transactionType === 'purchase'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {transactionType === 'purchase' ? 'Purchasing From' : 'Selling To'}
        </span>
      </div>

      {/* Transaction Type Selector: Purchase or Sale */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Transaction Type *
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTransactionType('purchase')}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-xs ${
              transactionType === 'purchase'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
            <span>Purchase (Expense)</span>
          </button>

          <button
            type="button"
            onClick={() => setTransactionType('sale')}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-bold text-xs ${
              transactionType === 'sale'
                ? 'bg-rose-50 text-rose-800 border-rose-500 ring-2 ring-rose-500/20'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-rose-600" />
            <span>Sale (Revenue)</span>
          </button>
        </div>
        {errors.transactionType && (
          <p className="text-xs text-rose-600 mt-1">{errors.transactionType}</p>
        )}
      </div>

      {/* Product Selection */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Product *
          </label>
          {onQuickAddProduct && (
            <button
              type="button"
              onClick={onQuickAddProduct}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" />
              <span>Add Other Product</span>
            </button>
          )}
        </div>
        <div className="relative">
          <Package className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <select
            value={formData.product_id}
            onChange={(e) => handleProductChange(e.target.value)}
            className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 ${
              errors.product_name
                ? 'border-rose-400 focus:ring-rose-500/20'
                : 'border-slate-200 focus:border-rose-500 focus:ring-rose-500/20'
            }`}
          >
            {products.length === 0 ? (
              <option value="prod-strawberry">Strawberry</option>
            ) : (
              products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit || 'Box'})
                </option>
              ))
            )}
          </select>
        </div>
        {errors.product_name && (
          <p className="text-xs text-rose-600 mt-1">{errors.product_name}</p>
        )}
      </div>

      {/* Transaction Date */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Transaction Date *
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

      {/* Quantity and Unit row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Quantity *
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
              placeholder="e.g. 20"
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
            Unit
          </label>
          <select
            value={formData.unit}
            onChange={(e) => handleChange('unit', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="Box">Box</option>
            <option value="Kg">Kg</option>
            <option value="Pack">Pack</option>
            <option value="Basket">Basket</option>
            <option value="Viss">Viss (ပိဿာ)</option>
            <option value="Crate">Crate</option>
            <option value="Gram">Gram</option>
          </select>
        </div>
      </div>

      {/* Price Per Unit */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Price per {formData.unit || 'Unit'} (Ks) *
        </label>
        <div className="relative">
          <Coins className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="number"
            step="any"
            min="0"
            required
            value={formData.price_per_unit}
            onChange={(e) => handleChange('price_per_unit', e.target.value)}
            placeholder="e.g. 15000"
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

      {/* Automatically Calculated Total Amount Card */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50/80 to-emerald-50/40 border border-rose-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calculator className="w-3.5 h-3.5 text-rose-600" />
            Automatically Calculated Total
          </span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
            {formatMMK(computedTotal)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            Formula: {formData.quantity || '0'} {formData.unit} × {formatMMK(formData.price_per_unit || 0, false)} Ks
          </p>
        </div>
      </div>

      {/* Optional Notes */}
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
            placeholder="e.g. Morning delivery, payment cash on delivery"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
      </div>

      {/* Action Buttons */}
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
          className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm shadow-rose-200 disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Record</span>
        </button>
      </div>
    </form>
  );
}
