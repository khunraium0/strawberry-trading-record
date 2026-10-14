import { supabase, isSupabaseConfigured } from './supabaseClient';
import { localStore } from './localStore';
import { calculateTotalAmount } from '../utils/validators';

export const salesService = {
  /**
   * Fetch sales with buyer and product details
   * @param {string} userId
   * @param {Object} filters
   */
  async getSales(
    userId,
    {
      startDate = null,
      endDate = null,
      buyerId = 'all',
      productId = 'all',
      search = '',
      sortOrder = 'desc', // 'desc' | 'asc'
    } = {}
  ) {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase
        .from('sales')
        .select(`
          *,
          buyer:customers(id, name, phone, category),
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
      if (buyerId && buyerId !== 'all') {
        query = query.eq('buyer_id', buyerId);
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
          (s) =>
            (s.buyer?.name && s.buyer.name.toLowerCase().includes(q)) ||
            (s.product?.name && s.product.name.toLowerCase().includes(q)) ||
            (s.notes && s.notes.toLowerCase().includes(q))
        );
      }
      return results;
    } else {
      let list = localStore.getSales(userId);

      if (startDate) {
        list = list.filter((s) => s.transaction_date >= startDate);
      }
      if (endDate) {
        list = list.filter((s) => s.transaction_date <= endDate);
      }
      if (buyerId && buyerId !== 'all') {
        list = list.filter((s) => s.buyer_id === buyerId);
      }
      if (productId && productId !== 'all') {
        list = list.filter((s) => s.product_id === productId);
      }
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        list = list.filter(
          (s) =>
            (s.buyer?.name && s.buyer.name.toLowerCase().includes(q)) ||
            (s.product?.name && s.product.name.toLowerCase().includes(q)) ||
            (s.notes && s.notes.toLowerCase().includes(q))
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
   * Save (Create or Update) a sales record
   */
  async saveSales(salesData, userId) {
    const qty = parseFloat(salesData.quantity);
    const price = parseFloat(salesData.unit_price);
    const total = calculateTotalAmount(qty, price);

    if (isSupabaseConfigured() && supabase) {
      const payload = {
        buyer_id: salesData.buyer_id,
        product_id: salesData.product_id,
        transaction_date: salesData.transaction_date,
        quantity: qty,
        unit: salesData.unit || 'Kg',
        unit_price: price,
        total_amount: total,
        notes: salesData.notes ? salesData.notes.trim() : null,
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      if (salesData.id) {
        const { data, error } = await supabase
          .from('sales')
          .update(payload)
          .eq('id', salesData.id)
          .eq('user_id', userId)
          .select(`
            *,
            buyer:customers(id, name, phone, category),
            product:products(id, name, unit)
          `)
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('sales')
          .insert([payload])
          .select(`
            *,
            buyer:customers(id, name, phone, category),
            product:products(id, name, unit)
          `)
          .single();
        if (error) throw error;
        return data;
      }
    } else {
      return localStore.saveSales(
        {
          ...salesData,
          quantity: qty,
          unit_price: price,
          total_amount: total,
        },
        userId
      );
    }
  },

  /**
   * Delete sales record
   */
  async deleteSales(id, userId) {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      localStore.deleteSales(id);
    }
  },
};
