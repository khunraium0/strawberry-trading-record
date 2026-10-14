import { supabase, isSupabaseConfigured } from './supabaseClient';
import { localStore } from './localStore';

export const productService = {
  /**
   * Fetch all products for current user
   * @param {string} userId
   * @param {Object} options
   * @param {boolean} options.activeOnly
   */
  async getProducts(userId, { activeOnly = false } = {}) {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      let list = localStore.getProducts(userId);
      if (activeOnly) {
        list = list.filter((p) => p.is_active);
      }
      return list;
    }
  },

  /**
   * Save (Create or Update) a product
   */
  async saveProduct(productData, userId) {
    if (isSupabaseConfigured() && supabase) {
      const payload = {
        name: productData.name.trim(),
        category: productData.category ? productData.category.trim() : 'Fresh Fruit',
        unit: productData.unit.trim(),
        description: productData.description ? productData.description.trim() : null,
        is_active: productData.is_active !== undefined ? productData.is_active : true,
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      if (productData.id) {
        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', productData.id)
          .eq('user_id', userId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    } else {
      return localStore.saveProduct(productData, userId);
    }
  },

  /**
   * Delete a product
   */
  async deleteProduct(id, userId) {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      localStore.deleteProduct(id);
    }
  },
};
