/**
 * Local Storage Persistence Layer
 * Provides persistent offline/demo database mirroring the Supabase PostgreSQL tables.
 * Data persists across page reloads in localStorage.
 */

const STORAGE_KEYS = {
  USER: 'strawberry_demo_user',
  CUSTOMERS: 'strawberry_demo_customers',
  PRODUCTS: 'strawberry_demo_products',
  PURCHASES: 'strawberry_demo_purchases',
  SALES: 'strawberry_demo_sales',
};

// Seed initial data if first time
function initSeedData() {
  const defaultUser = {
    id: 'demo-user-uuid-1234',
    email: 'farmer@strawberrytrade.com',
    user_metadata: {
      business_name: 'Maymyo Strawberry Orchard & Trading',
    },
  };

  if (!localStorage.getItem(STORAGE_KEYS.USER)) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultUser));
  }

  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    const defaultProducts = [
      {
        id: 'prod-001',
        user_id: defaultUser.id,
        name: 'Fresh Strawberry (Grade A / Export)',
        category: 'Fresh Fruit',
        unit: 'Kg',
        description: 'Large, bright red, sweet strawberries picked daily',
        is_active: true,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prod-002',
        user_id: defaultUser.id,
        name: 'Strawberry (Grade B / Processing)',
        category: 'Fresh Fruit',
        unit: 'Kg',
        description: 'Medium size, high sweetness, great for jam and syrup',
        is_active: true,
        created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'prod-003',
        user_id: defaultUser.id,
        name: 'Strawberry Gift Box (500g)',
        category: 'Packaged',
        unit: 'Box',
        description: 'Premium gift packaging with cushioned trays',
        is_active: true,
        created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(defaultProducts));
  }

  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    const defaultCustomers = [
      {
        id: 'cust-sup-001',
        user_id: defaultUser.id,
        name: 'U Thein Aung (Pyin Oo Lwin Farm)',
        phone: '09-450012345',
        address: 'Ward 5, Pyin Oo Lwin, Mandalay Region',
        category: 'supplier',
        notes: 'Reliable supplier, morning delivery at 7 AM',
        created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'cust-sup-002',
        user_id: defaultUser.id,
        name: 'Daw Khin Than (Highland Strawberry Garden)',
        phone: '09-798112233',
        address: 'Anisakan, Pyin Oo Lwin',
        category: 'supplier',
        notes: 'Specializes in Japanese Sweet Charlie variety',
        created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'cust-buy-001',
        user_id: defaultUser.id,
        name: 'Shwe Bagan Bakery & Cafe',
        phone: '09-975443322',
        address: '78th Street, Mandalay',
        category: 'buyer',
        notes: 'Orders Grade A weekly on Mondays and Thursdays',
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'cust-buy-002',
        user_id: defaultUser.id,
        name: 'Yangon Fresh Market (City Mart Vendor)',
        phone: '09-250889900',
        address: 'Thiri Mingalar Market, Yangon',
        category: 'buyer',
        notes: 'Bulk purchaser for retail distribution',
        created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(defaultCustomers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.PURCHASES)) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
    const fiveDaysAgo = new Date(now.getTime() - 5 * 86400000).toISOString().split('T')[0];

    const defaultPurchases = [
      {
        id: 'pur-001',
        user_id: defaultUser.id,
        supplier_id: 'cust-sup-001',
        product_id: 'prod-001',
        transaction_date: todayStr,
        quantity: 120,
        unit: 'Kg',
        price_per_unit: 14000,
        total_amount: 1680000,
        notes: 'Fresh morning harvest, Grade A batch',
        created_at: new Date().toISOString(),
      },
      {
        id: 'pur-002',
        user_id: defaultUser.id,
        supplier_id: 'cust-sup-002',
        product_id: 'prod-002',
        transaction_date: yesterday,
        quantity: 80,
        unit: 'Kg',
        price_per_unit: 9500,
        total_amount: 760000,
        notes: 'Batch for jam manufacturing',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'pur-003',
        user_id: defaultUser.id,
        supplier_id: 'cust-sup-001',
        product_id: 'prod-001',
        transaction_date: fiveDaysAgo,
        quantity: 150,
        unit: 'Kg',
        price_per_unit: 13500,
        total_amount: 2025000,
        notes: 'Peak quality strawberry harvest',
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(defaultPurchases));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
    const fourDaysAgo = new Date(now.getTime() - 4 * 86400000).toISOString().split('T')[0];

    const defaultSales = [
      {
        id: 'sal-001',
        user_id: defaultUser.id,
        buyer_id: 'cust-buy-001',
        product_id: 'prod-001',
        transaction_date: todayStr,
        quantity: 40,
        unit: 'Kg',
        unit_price: 18500,
        total_amount: 740000,
        notes: 'Delivered to cafe kitchen by 10 AM',
        created_at: new Date().toISOString(),
      },
      {
        id: 'sal-002',
        user_id: defaultUser.id,
        buyer_id: 'cust-buy-002',
        product_id: 'prod-001',
        transaction_date: yesterday,
        quantity: 70,
        unit: 'Kg',
        unit_price: 18000,
        total_amount: 1260000,
        notes: 'Highway express bus cargo dispatch to Yangon',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'sal-003',
        user_id: defaultUser.id,
        buyer_id: 'cust-buy-001',
        product_id: 'prod-003',
        transaction_date: fourDaysAgo,
        quantity: 25,
        unit: 'Box',
        unit_price: 12000,
        total_amount: 300000,
        notes: 'Gift boxes for weekend festival promotion',
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(defaultSales));
  }
}

// Ensure seed data initialized
if (typeof window !== 'undefined') {
  initSeedData();
}

export const localStore = {
  getUser() {
    const u = localStorage.getItem(STORAGE_KEYS.USER);
    return u ? JSON.parse(u) : null;
  },
  setUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  // Customers
  getCustomers(userId) {
    initSeedData();
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
    return data.filter((c) => !userId || c.user_id === userId);
  },
  saveCustomer(customer, userId) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
    let saved = null;
    if (customer.id) {
      const idx = data.findIndex((c) => c.id === customer.id);
      if (idx !== -1) {
        data[idx] = { ...data[idx], ...customer, updated_at: new Date().toISOString() };
        saved = data[idx];
      } else {
        saved = { ...customer, updated_at: new Date().toISOString() };
        data.push(saved);
      }
    } else {
      saved = {
        ...customer,
        id: 'cust-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        user_id: userId || 'demo-user-uuid-1234',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      data.unshift(saved);
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data));
    return saved;
  },
  deleteCustomer(id) {
    let data = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
    data = data.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data));
  },

  // Products
  getProducts(userId) {
    initSeedData();
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    return data.filter((p) => !userId || p.user_id === userId);
  },
  saveProduct(product, userId) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    let saved = null;
    if (product.id) {
      const idx = data.findIndex((p) => p.id === product.id);
      if (idx !== -1) {
        data[idx] = { ...data[idx], ...product, updated_at: new Date().toISOString() };
        saved = data[idx];
      } else {
        saved = { ...product, updated_at: new Date().toISOString() };
        data.push(saved);
      }
    } else {
      saved = {
        ...product,
        id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        user_id: userId || 'demo-user-uuid-1234',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      data.unshift(saved);
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data));
    return saved;
  },
  deleteProduct(id) {
    let data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    data = data.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data));
  },

  // Purchases
  getPurchases(userId) {
    initSeedData();
    const purchases = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES) || '[]');
    const customers = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
    const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');

    return purchases
      .filter((p) => !userId || p.user_id === userId)
      .map((p) => ({
        ...p,
        supplier: customers.find((c) => c.id === p.supplier_id) || { name: 'Unknown Supplier' },
        product: products.find((pr) => pr.id === p.product_id) || { name: 'Unknown Product' },
      }))
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
  },
  savePurchase(purchase, userId) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES) || '[]');
    const sanitized = {
      ...purchase,
      quantity: Number(purchase.quantity),
      price_per_unit: Number(purchase.price_per_unit),
      total_amount: Number(purchase.quantity) * Number(purchase.price_per_unit),
    };
    // remove relation objects before saving to db
    delete sanitized.supplier;
    delete sanitized.product;

    let saved = null;
    if (purchase.id) {
      const idx = data.findIndex((p) => p.id === purchase.id);
      if (idx !== -1) {
        data[idx] = { ...data[idx], ...sanitized, updated_at: new Date().toISOString() };
        saved = data[idx];
      } else {
        saved = { ...sanitized, updated_at: new Date().toISOString() };
        data.push(saved);
      }
    } else {
      saved = {
        ...sanitized,
        id: 'pur-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        user_id: userId || 'demo-user-uuid-1234',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      data.unshift(saved);
    }
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(data));
    return saved;
  },
  deletePurchase(id) {
    let data = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES) || '[]');
    data = data.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(data));
  },

  // Sales
  getSales(userId) {
    initSeedData();
    const sales = JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]');
    const customers = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
    const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');

    return sales
      .filter((s) => !userId || s.user_id === userId)
      .map((s) => ({
        ...s,
        buyer: customers.find((c) => c.id === s.buyer_id) || { name: 'Unknown Buyer' },
        product: products.find((pr) => pr.id === s.product_id) || { name: 'Unknown Product' },
      }))
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
  },
  saveSales(sale, userId) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]');
    const sanitized = {
      ...sale,
      quantity: Number(sale.quantity),
      unit_price: Number(sale.unit_price),
      total_amount: Number(sale.quantity) * Number(sale.unit_price),
    };
    delete sanitized.buyer;
    delete sanitized.product;

    let saved = null;
    if (sale.id) {
      const idx = data.findIndex((s) => s.id === sale.id);
      if (idx !== -1) {
        data[idx] = { ...data[idx], ...sanitized, updated_at: new Date().toISOString() };
        saved = data[idx];
      } else {
        saved = { ...sanitized, updated_at: new Date().toISOString() };
        data.push(saved);
      }
    } else {
      saved = {
        ...sanitized,
        id: 'sal-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        user_id: userId || 'demo-user-uuid-1234',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      data.unshift(saved);
    }
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(data));
    return saved;
  },
  deleteSales(id) {
    let data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]');
    data = data.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(data));
  },
};
