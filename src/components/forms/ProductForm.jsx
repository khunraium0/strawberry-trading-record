import React, { useState, useEffect } from 'react';
import { Package, Tag, Scale, FileText, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { validateProduct } from '../../utils/validators';

export function ProductForm({ initialData = null, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Fresh Fruit',
    unit: 'Kg',
    description: '',
    is_active: true,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || 'Fresh Fruit',
        unit: initialData.unit || 'Kg',
        description: initialData.description || '',
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const commonUnits = ['Kg', 'Box', 'Pack', 'Basket', 'Viss', 'Crate', 'Gram'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, errors: validationErrors } = validateProduct(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        ...(initialData?.id ? { id: initialData.id } : {}),
        ...formData,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product Name */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Product Variety / Name *
        </label>
        <div className="relative">
          <Package className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Fresh Strawberry (Grade A) or Strawberry Jam"
            className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
              errors.name
                ? 'border-rose-400 focus:ring-rose-500/20'
                : 'border-slate-200 focus:border-rose-500 focus:ring-rose-500/20'
            }`}
          />
        </div>
        {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Category
        </label>
        <div className="relative">
          <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            placeholder="e.g. Fresh Fruit, Value Added, Packaging"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
      </div>

      {/* Unit of Measurement */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Unit of Measurement *
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {commonUnits.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => handleChange('unit', u)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                formData.unit === u
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
        <div className="relative">
          <Scale className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            required
            value={formData.unit}
            onChange={(e) => handleChange('unit', e.target.value)}
            placeholder="Or type custom unit"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
        {errors.unit && <p className="text-xs text-rose-600 mt-1">{errors.unit}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Description / Specifications (Optional)
        </label>
        <div className="relative">
          <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <textarea
            rows="2"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="e.g. Harvested from high elevation orchard, brix level > 12"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
      </div>

      {/* Active Status Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div>
          <span className="text-xs font-bold text-slate-800 block">Product Status</span>
          <span className="text-[11px] text-slate-500">
            {formData.is_active ? 'Active (available for transactions)' : 'Inactive (archived)'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleChange('is_active', !formData.is_active)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            formData.is_active ? 'bg-emerald-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              formData.is_active ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
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
          className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm shadow-rose-200 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {initialData?.id ? 'Update Product' : 'Save Product'}
        </button>
      </div>
    </form>
  );
}
