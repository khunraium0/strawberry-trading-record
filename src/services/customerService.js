import { supabase, isSupabaseConfigured } from './supabaseClient';
import { localStore } from './localStore';

export const customerService = {
  /**
   * Fetch all customers for current user
   * @param {string} userId
   * @param {Object} options
   * @param {string} options.category - 'all' | 'supplier' | 'buyer'
   * @param {string} options.search - search query for name or phone
   */
  async getCustomers(userId, { category = 'all', search = '' } = {}) {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        if (category === 'supplier') {
          query = query.in('category', ['supplier', 'both']);
        } else if (category === 'buyer') {
          query = query.in('category', ['buyer', 'both']);
        }
      }

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(`name.ilike.${term},phone.ilike.${term}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      // Local persistent fallback
      let list = localStore.getCustomers(userId);
      if (category && category !== 'all') {
        if (category === 'supplier') {
          list = list.filter((c) => c.category === 'supplier' || c.category === 'both');
        } else if (category === 'buyer') {
          list = list.filter((c) => c.category === 'buyer' || c.category === 'both');
        }
      }
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        list = list.filter(
          (c) =>
            (c.name && c.name.toLowerCase().includes(q)) ||
            (c.phone && c.phone.toLowerCase().includes(q))
        );
      }
      return list;
    }
  },

  /**
   * Fetch single customer by ID with their complete transaction history
   */
  async getCustomerWithHistory(id, userId) {
    let customer = null;
    let purchases = [];
    let sales = [];

    if (isSupabaseConfigured() && supabase) {
      const { data: cust, error: custErr } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (custErr) throw custErr;
      customer = cust;

      // Fetch related purchases
      const { data: purData } = await supabase
        .from('purchases')
        .select('*, product:products(*)')
        .eq('supplier_id', id)
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false });
      purchases = purData || [];

      // Fetch related sales
      const { data: salData } = await supabase
        .from('sales')
        .select('*, product:products(*)')
        .eq('buyer_id', id)
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false });
      sales = salData || [];
    } else {
      const allCust = localStore.getCustomers(userId);
      customer = allCust.find((c) => c.id === id);
      const allPurchases = localStore.getPurchases(userId);
      purchases = allPurchases.filter((p) => p.supplier_id === id);
      const allSales = localStore.getSales(userId);
      sales = allSales.filter((s) => s.buyer_id === id);
    }

    return { customer, purchases, sales };
  },

  /**
   * Save (Create or Update) a customer
   */
  async saveCustomer(customerData, userId) {
    if (isSupabaseConfigured() && supabase) {
      const payload = {
        name: customerData.name.trim(),
        phone: customerData.phone ? customerData.phone.trim() : null,
        address: customerData.address ? customerData.address.trim() : null,
        category: customerData.category,
        notes: customerData.notes ? customerData.notes.trim() : null,
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      if (customerData.id) {
        const { data, error } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', customerData.id)
          .eq('user_id', userId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('customers')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } else {
      return localStore.saveCustomer(customerData, userId);
    }
  },

  /**
   * Delete a customer with verification
   */
  async deleteCustomer(id, userId) {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      localStore.deleteCustomer(id);
    }
  },
};
