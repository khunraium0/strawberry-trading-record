import { supabase, isSupabaseConfigured } from './supabaseClient';
import { localStore } from './localStore';
import { calculateTotalAmount } from '../utils/validators';

export const purchaseService = {
  /**
   * Fetch purchases with supplier and product details
   * @param {string} userId
   * @param {Object} filters
   */
  async getPurchases(
    userId,
    {
      startDate = null,
      endDate = null,
      supplierId = 'all',
      productId = 'all',
      search = '',
      sortOrder = 'desc', // 'desc' | 'asc'
    } = {}
  ) {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase
        .from('purchases')
        .select(`
          *,
          supplier:customers(id, name, phone, category),
          product:products(id, name, unit)
        `)
        .eq('user_id', userId)
        .order('transaction_date', { ascending: sortOrder === 'asc' })
        .order('created_at', { ascending: sortOrder === 'asc' });

      if (startDate) {
        query = query.gte('transaction_date', startDate);
      }
      if (endDate) {
        query = query.lte('transaction_date', endDate);
      }
      if (supplierId && supplierId !== 'all') {
        query = query.eq('supplier_id', supplierId);
      }
      if (productId && productId !== 'all') {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = data || [];
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        results = results.filter(
          (p) =>
            (p.supplier?.name && p.supplier.name.toLowerCase().includes(q)) ||
            (p.product?.name && p.product.name.toLowerCase().includes(q)) ||
            (p.notes && p.notes.toLowerCase().includes(q))
        );
      }
      return results;
    } else {
      let list = localStore.getPurchases(userId);

      if (startDate) {
        list = list.filter((p) => p.transaction_date >= startDate);
      }
      if (endDate) {
        list = list.filter((p) => p.transaction_date <= endDate);
      }
      if (supplierId && supplierId !== 'all') {
        list = list.filter((p) => p.supplier_id === supplierId);
      }
      if (productId && productId !== 'all') {
        list = list.filter((p) => p.product_id === productId);
      }
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        list = list.filter(
          (p) =>
            (p.supplier?.name && p.supplier.name.toLowerCase().includes(q)) ||
            (p.product?.name && p.product.name.toLowerCase().includes(q)) ||
            (p.notes && p.notes.toLowerCase().includes(q))
        );
      }

      list.sort((a, b) => {
        const diff = new Date(a.transaction_date) - new Date(b.transaction_date);
        return sortOrder === 'asc' ? diff : -diff;
      });

      return list;
    }
  },

  /**
   * Save (Create or Update) a purchase record
   */
  async savePurchase(purchaseData, userId) {
    const qty = parseFloat(purchaseData.quantity);
    const price = parseFloat(purchaseData.price_per_unit);
    const total = calculateTotalAmount(qty, price);

    if (isSupabaseConfigured() && supabase) {
      const payload = {
        supplier_id: purchaseData.supplier_id,
        product_id: purchaseData.product_id,
        transaction_date: purchaseData.transaction_date,
        quantity: qty,
        unit: purchaseData.unit || 'Kg',
        price_per_unit: price,
        total_amount: total,
        notes: purchaseData.notes ? purchaseData.notes.trim() : null,
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      if (purchaseData.id) {
        const { data, error } = await supabase
          .from('purchases')
          .update(payload)
          .eq('id', purchaseData.id)
          .eq('user_id', userId)
          .select(`
            *,
            supplier:customers(id, name, phone, category),
            product:products(id, name, unit)
          `)
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('purchases')
          .insert([payload])
          .select(`
            *,
            supplier:customers(id, name, phone, category),
            product:products(id, name, unit)
          `)
          .single();
        if (error) throw error;
        return data;
      }
    } else {
      return localStore.savePurchase(
        {
          ...purchaseData,
          quantity: qty,
          price_per_unit: price,
          total_amount: total,
        },
        userId
      );
    }
  },

  /**
   * Delete purchase record
   */
  async deletePurchase(id, userId) {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      localStore.deletePurchase(id);
    }
  },
};
