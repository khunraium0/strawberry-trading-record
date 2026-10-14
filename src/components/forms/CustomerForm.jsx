import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Tag, FileText, Save, Loader2 } from 'lucide-react';
import { validateCustomer } from '../../utils/validators';

export function CustomerForm({ initialData = null, onSubmit, onCancel, defaultCategory = 'supplier' }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    category: defaultCategory,
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        category: initialData.category || defaultCategory,
        notes: initialData.notes || '',
      });
    } else {
      setFormData((prev) => ({ ...prev, category: defaultCategory }));
    }
  }, [initialData, defaultCategory]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, errors: validationErrors } = validateCustomer(formData);
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
      {/* Customer Type selector */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Customer Type *
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'supplier', label: 'Supplier', desc: 'From whom we purchase products' },
            { id: 'buyer', label: 'Buyer', desc: 'To whom we sell products' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleChange('category', cat.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                formData.category === cat.id
                  ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-xs text-slate-800">{cat.label}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{cat.desc}</div>
            </button>
          ))}
        </div>
        {errors.category && <p className="text-xs text-rose-600 mt-1">{errors.category}</p>}
      </div>

      {/* Customer Name */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Full Name / Business Name *
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. U Thein Aung / May Farm"
            className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
              errors.name
                ? 'border-rose-400 focus:ring-rose-500/20'
                : 'border-slate-200 focus:border-rose-500 focus:ring-rose-500/20'
            }`}
          />
        </div>
        {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="e.g. 09-450012345"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Address / Location
        </label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="e.g. Ward 5, Pyin Oo Lwin"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Notes & Remarks
        </label>
        <div className="relative">
          <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <textarea
            rows="2"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="e.g. Morning delivery at 7 AM, prefers Grade A"
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
          className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm shadow-rose-200 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {initialData?.id ? 'Save Customer' : 'Add Customer'}
        </button>
      </div>
    </form>
  );
}
