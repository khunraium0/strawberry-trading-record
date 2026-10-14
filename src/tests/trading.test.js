import { describe, it, expect, beforeEach } from 'vitest';

// Polyfill localStorage for node environment if not present
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage?.getItem) {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear(),
  };
}

import { calculateTotalAmount, validateCustomer, validateProduct, validateTransaction } from '../utils/validators';
import { formatMMK, formatQuantity, formatDate, getDateFilterRange } from '../utils/formatters';
import { localStore } from '../services/localStore';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { purchaseService } from '../services/purchaseService';
import { salesService } from '../services/salesService';
import { reportService } from '../services/reportService';
import { authService } from '../services/authService';

describe('Trading Calculations & Validation Logic', () => {
  it('calculates total amount correctly: Quantity * Price', () => {
    // 50 Kg at 12,000 Ks/Kg = 600,000 Ks
    expect(calculateTotalAmount(50, 12000)).toBe(600000);
    // Decimal quantity: 12.5 Kg at 15,000 Ks/Kg = 187,500 Ks
    expect(calculateTotalAmount(12.5, 15000)).toBe(187500);
    // Invalid or negative inputs return 0
    expect(calculateTotalAmount(-5, 10000)).toBe(0);
    expect(calculateTotalAmount(5, -10000)).toBe(0);
    expect(calculateTotalAmount('invalid', 10000)).toBe(0);
  });

  it('validates customer form input', () => {
    // Valid customer
    const valid = validateCustomer({ name: 'U Thein Aung', category: 'supplier' });
    expect(valid.isValid).toBe(true);

    // Missing name
    const missingName = validateCustomer({ name: '   ', category: 'supplier' });
    expect(missingName.isValid).toBe(false);
    expect(missingName.errors.name).toBeDefined();

    // Invalid category
    const invalidCat = validateCustomer({ name: 'Daw Mya', category: 'unknown_role' });
    expect(invalidCat.isValid).toBe(false);
    expect(invalidCat.errors.category).toBeDefined();
  });

  it('validates product form input', () => {
    const valid = validateProduct({ name: 'Fresh Strawberry (Grade A)', unit: 'Kg' });
    expect(valid.isValid).toBe(true);

    const invalid = validateProduct({ name: '', unit: '' });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.name).toBeDefined();
    expect(invalid.errors.unit).toBeDefined();
  });

  it('validates purchase and sales transactions', () => {
    // Valid purchase
    const validPurchase = validateTransaction(
      {
        supplier_id: 'cust-1',
        product_id: 'prod-1',
        transaction_date: '2026-10-14',
        quantity: 25,
        price_per_unit: 10000,
      },
      'purchase'
    );
    expect(validPurchase.isValid).toBe(true);

    // Invalid quantity (0 or negative)
    const zeroQty = validateTransaction(
      {
        supplier_id: 'cust-1',
        product_id: 'prod-1',
        transaction_date: '2026-10-14',
        quantity: 0,
        price_per_unit: 10000,
      },
      'purchase'
    );
    expect(zeroQty.isValid).toBe(false);
    expect(zeroQty.errors.quantity).toBeDefined();

    // Valid sale
    const validSale = validateTransaction(
      {
        buyer_id: 'cust-2',
        product_id: 'prod-1',
        transaction_date: '2026-10-14',
        quantity: 10,
        unit_price: 15000,
      },
      'sales'
    );
    expect(validSale.isValid).toBe(true);
  });
});

describe('Myanmar Kyat & Date Formatters', () => {
  it('formats Myanmar Kyat with Ks suffix', () => {
    expect(formatMMK(600000)).toBe('600,000 Ks');
    expect(formatMMK(1500000)).toBe('1,500,000 Ks');
    expect(formatMMK(0)).toBe('0 Ks');
  });

  it('formats quantity with units', () => {
    expect(formatQuantity(50, 'Kg')).toBe('50 Kg');
    expect(formatQuantity(12.5, 'Kg')).toBe('12.50 Kg');
    expect(formatQuantity(100, 'Box')).toBe('100 Box');
  });

  it('returns appropriate date filter ranges', () => {
    const todayRange = getDateFilterRange('today');
    expect(todayRange.startDate).toBeDefined();
    expect(todayRange.startDate).toBe(todayRange.endDate);

    const allRange = getDateFilterRange('all');
    expect(allRange.startDate).toBeNull();
    expect(allRange.endDate).toBeNull();

    const customRange = getDateFilterRange('custom', '2026-10-01', '2026-10-10');
    expect(customRange.startDate).toBe('2026-10-01');
    expect(customRange.endDate).toBe('2026-10-10');
  });
});

describe('CRUD Services (Persistent Offline & Fallback Layer)', () => {
  const testUserId = 'test-user-vitest';

  beforeEach(() => {
    localStorage.clear();
  });

  it('manages authentication and user session', async () => {
    const res = await authService.signIn({ email: 'test@trade.com', password: 'password123' });
    expect(res.user).toBeDefined();
    expect(res.user.email).toBe('test@trade.com');

    const session = await authService.getSession();
    expect(session.user).toBeDefined();

    await authService.signOut();
    const clearedSession = await authService.getSession();
    expect(clearedSession).toBeNull();
  });

  it('creates, reads, updates, and deletes customers', async () => {
    // 1. Create
    const newCust = await customerService.saveCustomer(
      {
        name: 'Pyin Oo Lwin Highland Grower',
        phone: '09-11223344',
        address: 'Anisakan',
        category: 'supplier',
        notes: 'Sweet Charlie variety',
      },
      testUserId
    );
    expect(newCust.id).toBeDefined();
    expect(newCust.name).toBe('Pyin Oo Lwin Highland Grower');

    // 2. Read
    const list = await customerService.getCustomers(testUserId);
    expect(list.some((c) => c.id === newCust.id)).toBe(true);

    // 3. Update
    const updated = await customerService.saveCustomer(
      {
        id: newCust.id,
        name: 'Pyin Oo Lwin Highland Grower (Updated)',
        category: 'both',
      },
      testUserId
    );
    expect(updated.name).toBe('Pyin Oo Lwin Highland Grower (Updated)');
    expect(updated.category).toBe('both');

    // 4. Delete
    await customerService.deleteCustomer(newCust.id, testUserId);
    const afterDelete = await customerService.getCustomers(testUserId);
    expect(afterDelete.some((c) => c.id === newCust.id)).toBe(false);
  });

  it('creates, edits, and filters products', async () => {
    const product = await productService.saveProduct(
      {
        name: 'Fresh Strawberry (Export Grade)',
        category: 'Fresh Fruit',
        unit: 'Kg',
        description: 'Large size sweet berries',
        is_active: true,
      },
      testUserId
    );
    expect(product.id).toBeDefined();
    expect(product.name).toBe('Fresh Strawberry (Export Grade)');

    const products = await productService.getProducts(testUserId);
    expect(products.some((p) => p.id === product.id)).toBe(true);
  });

  it('creates purchase and sales transactions and aggregates reports', async () => {
    // Setup customer & product
    const supplier = await customerService.saveCustomer(
      { name: 'Farmer Ko Zaw', category: 'supplier' },
      testUserId
    );
    const buyer = await customerService.saveCustomer(
      { name: 'City Mart Supermarket', category: 'buyer' },
      testUserId
    );
    const product = await productService.saveProduct(
      { name: 'Strawberry Grade A', unit: 'Kg' },
      testUserId
    );

    // Record Purchase: 100 Kg @ 8,000 Ks = 800,000 Ks
    const purchase = await purchaseService.savePurchase(
      {
        supplier_id: supplier.id,
        product_id: product.id,
        transaction_date: '2026-10-14',
        quantity: 100,
        unit: 'Kg',
        price_per_unit: 8000,
      },
      testUserId
    );
    expect(purchase.total_amount).toBe(800000);

    // Record Sale: 80 Kg @ 13,000 Ks = 1,040,000 Ks
    const sale = await salesService.saveSales(
      {
        buyer_id: buyer.id,
        product_id: product.id,
        transaction_date: '2026-10-14',
        quantity: 80,
        unit: 'Kg',
        unit_price: 13000,
      },
      testUserId
    );
    expect(sale.total_amount).toBe(1040000);

    // Aggregate report
    const report = await reportService.getReportsData(testUserId);
    expect(report.totalPurchaseExpense).toBe(800000);
    expect(report.totalSalesRevenue).toBe(1040000);
    expect(report.tradingMargin).toBe(240000); // 1,040,000 - 800,000
    expect(report.totalPurchaseQuantity).toBe(100);
    expect(report.totalSalesQuantity).toBe(80);

    // Check Customer History ledger
    const history = await customerService.getCustomerWithHistory(supplier.id, testUserId);
    expect(history.purchases.length).toBe(1);
    expect(history.purchases[0].id).toBe(purchase.id);
  });

  it('executes complete Customer Workflow (A through O)', async () => {
    // A. Open application with no demo data
    const initialCusts = await customerService.getCustomers(testUserId);
    expect(initialCusts).toEqual([]);

    // B. Add a Supplier
    const supplier = await customerService.saveCustomer(
      {
        name: 'Pyin Oo Lwin Organic Farm',
        phone: '09-45001122',
        address: 'Pyin Oo Lwin',
        category: 'supplier',
        notes: 'Delivers daily morning harvest',
      },
      testUserId
    );
    expect(supplier.id).toBeDefined();
    expect(supplier.name).toBe('Pyin Oo Lwin Organic Farm');
    expect(supplier.category).toBe('supplier');

    // C. Open that Supplier's detail page (verify initial history is empty)
    let supplierDetails = await customerService.getCustomerWithHistory(supplier.id, testUserId);
    expect(supplierDetails.customer.name).toBe('Pyin Oo Lwin Organic Farm');
    expect(supplierDetails.purchases).toHaveLength(0);

    // D & E. Click New Record -> Add Strawberry purchase of 20 boxes at 15,000 Ks per box
    const qty = 20;
    const pricePerBox = 15000;
    // F. Confirm that total is 300,000 Ks
    const totalAmount = calculateTotalAmount(qty, pricePerBox);
    expect(totalAmount).toBe(300000);
    expect(formatMMK(totalAmount)).toBe('300,000 Ks');

    // G. Save the record
    const record1 = await purchaseService.savePurchase(
      {
        supplier_id: supplier.id,
        product_name: 'Strawberry',
        transaction_date: '2026-10-14',
        quantity: qty,
        unit: 'Box',
        price_per_unit: pricePerBox,
        total_amount: totalAmount,
        notes: 'Morning delivery',
      },
      testUserId
    );
    expect(record1.id).toBeDefined();

    // H. Confirm that the record appears under the correct Supplier
    supplierDetails = await customerService.getCustomerWithHistory(supplier.id, testUserId);
    expect(supplierDetails.purchases).toHaveLength(1);
    expect(supplierDetails.purchases[0].id).toBe(record1.id);
    expect(supplierDetails.purchases[0].quantity).toBe(20);
    expect(supplierDetails.purchases[0].total_amount).toBe(300000);

    // I. Refresh simulation (read directly from store) and confirm record remains
    const refreshedPurchases = localStore.getPurchases(testUserId);
    expect(refreshedPurchases.some((p) => p.id === record1.id)).toBe(true);

    // J. Edit the quantity (e.g. 25 boxes) and confirm total updates correctly (25 * 15,000 = 375,000 Ks)
    const updatedQty = 25;
    const updatedTotal = calculateTotalAmount(updatedQty, pricePerBox);
    expect(updatedTotal).toBe(375000);

    const editedRecord = await purchaseService.savePurchase(
      {
        id: record1.id,
        supplier_id: supplier.id,
        product_name: 'Strawberry',
        transaction_date: '2026-10-14',
        quantity: updatedQty,
        unit: 'Box',
        price_per_unit: pricePerBox,
        total_amount: updatedTotal,
        notes: 'Morning delivery (updated count)',
      },
      testUserId
    );
    expect(editedRecord.quantity).toBe(25);
    expect(editedRecord.total_amount).toBe(375000);

    // Verify it updated the existing record rather than creating a duplicate
    supplierDetails = await customerService.getCustomerWithHistory(supplier.id, testUserId);
    expect(supplierDetails.purchases).toHaveLength(1);
    expect(supplierDetails.purchases[0].quantity).toBe(25);

    // K. Add a Buyer
    const buyer = await customerService.saveCustomer(
      {
        name: 'Mandalay Bakery & Cafe',
        phone: '09-79001122',
        address: '78th St, Mandalay',
        category: 'buyer',
        notes: 'Weekly fresh fruit delivery',
      },
      testUserId
    );
    expect(buyer.id).toBeDefined();
    expect(buyer.category).toBe('buyer');

    // L. Open the Buyer and add a Strawberry sales record: 10 boxes @ 20,000 Ks = 200,000 Ks
    const buyerSale = await salesService.saveSales(
      {
        buyer_id: buyer.id,
        product_name: 'Strawberry',
        transaction_date: '2026-10-14',
        quantity: 10,
        unit: 'Box',
        unit_price: 20000,
        notes: 'Delivered to pastry chef',
      },
      testUserId
    );
    expect(buyerSale.total_amount).toBe(200000);

    // M. Confirm Buyer records remain separate from Supplier records
    const buyerDetails = await customerService.getCustomerWithHistory(buyer.id, testUserId);
    expect(buyerDetails.sales).toHaveLength(1);
    expect(buyerDetails.purchases).toHaveLength(0);
    expect(buyerDetails.sales[0].id).toBe(buyerSale.id);

    supplierDetails = await customerService.getCustomerWithHistory(supplier.id, testUserId);
    expect(supplierDetails.purchases).toHaveLength(1);
    expect(supplierDetails.sales).toHaveLength(0);

    // O. Confirm that adding a new record does NOT overwrite older records
    const record2 = await purchaseService.savePurchase(
      {
        supplier_id: supplier.id,
        product_name: 'Strawberry',
        transaction_date: '2026-10-15',
        quantity: 15,
        unit: 'Box',
        price_per_unit: 14000,
        notes: 'Second harvest batch',
      },
      testUserId
    );
    supplierDetails = await customerService.getCustomerWithHistory(supplier.id, testUserId);
    expect(supplierDetails.purchases).toHaveLength(2);
    expect(supplierDetails.purchases.some((p) => p.id === record1.id)).toBe(true);
    expect(supplierDetails.purchases.some((p) => p.id === record2.id)).toBe(true);

    // N. Test deletion with confirmation (removes record2)
    await purchaseService.deletePurchase(record2.id, testUserId);
    supplierDetails = await customerService.getCustomerWithHistory(supplier.id, testUserId);
    expect(supplierDetails.purchases).toHaveLength(1);
    expect(supplierDetails.purchases[0].id).toBe(record1.id);
  });
});
