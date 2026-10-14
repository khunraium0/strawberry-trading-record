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

// Initialize clean storage without fake customers or fake transactions
function initSeedData() {
  const defaultUser = {
    id: 'demo-user-uuid-1234',
    email: 'farmer@strawberrytrade.com',
    user_metadata: {
      business_name: 'Strawberry Trading Record',
    },
  };

  if (!localStorage.getItem(STORAGE_KEYS.USER)) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultUser));
  }

  // Purge any legacy demo data from previous builds if found
  const DEMO_IDS = ['cust-sup-001', 'cust-sup-002', 'cust-buy-001', 'cust-buy-002', 'pur-001', 'pur-002', 'pur-003', 'sal-001', 'sal-002', 'sal-003'];
  const legacyCleanKey = 'strawberry_cleaned_demo_v3';
  if (!localStorage.getItem(legacyCleanKey)) {
    const custs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
    const filteredCusts = custs.filter((c) => !DEMO_IDS.includes(c.id));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(filteredCusts));

    const purs = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES) || '[]');
    const filteredPurs = purs.filter((p) => !DEMO_IDS.includes(p.id) && !DEMO_IDS.includes(p.supplier_id));
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(filteredPurs));

    const sales = JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]');
    const filteredSales = sales.filter((s) => !DEMO_IDS.includes(s.id) && !DEMO_IDS.includes(s.buyer_id));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(filteredSales));

    localStorage.setItem(legacyCleanKey, 'true');
  }

  // Initial product option: Strawberry (users can add more products anytime)
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    const defaultProducts = [
      {
        id: 'prod-strawberry',
        user_id: defaultUser.id,
        name: 'Strawberry',
        category: 'Fresh Fruit',
        unit: 'Box',
        description: 'Fresh Strawberries',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(defaultProducts));
  }

  // Empty initial customers
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
  }

  // Empty initial purchases
  if (!localStorage.getItem(STORAGE_KEYS.PURCHASES)) {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify([]));
  }

  // Empty initial sales
  if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
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
