import { purchaseService } from './purchaseService';
import { salesService } from './salesService';
import { customerService } from './customerService';
import { exportToCSV, formatDate, formatMMK, formatQuantity } from '../utils/formatters';

export const reportService = {
  /**
   * Aggregate metrics for given period
   */
  async getReportsData(userId, { startDate = null, endDate = null } = {}) {
    const [purchases, sales, customers] = await Promise.all([
      purchaseService.getPurchases(userId, { startDate, endDate }),
      salesService.getSales(userId, { startDate, endDate }),
      customerService.getCustomers(userId),
    ]);

    // Financial summaries
    const totalPurchaseExpense = purchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
    const totalSalesRevenue = sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
    const tradingMargin = totalSalesRevenue - totalPurchaseExpense;

    // Total Quantities
    const totalPurchaseQuantity = purchases.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
    const totalSalesQuantity = sales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

    // Breakdown by Product
    const productStats = {};
    purchases.forEach((p) => {
      const pName = p.product?.name || 'Unknown Product';
      const unit = p.unit || p.product?.unit || 'Kg';
      if (!productStats[pName]) {
        productStats[pName] = { name: pName, unit, purchasedQty: 0, soldQty: 0, purchaseAmount: 0, salesAmount: 0 };
      }
      productStats[pName].purchasedQty += Number(p.quantity) || 0;
      productStats[pName].purchaseAmount += Number(p.total_amount) || 0;
    });

    sales.forEach((s) => {
      const pName = s.product?.name || 'Unknown Product';
      const unit = s.unit || s.product?.unit || 'Kg';
      if (!productStats[pName]) {
        productStats[pName] = { name: pName, unit, purchasedQty: 0, soldQty: 0, purchaseAmount: 0, salesAmount: 0 };
      }
      productStats[pName].soldQty += Number(s.quantity) || 0;
      productStats[pName].salesAmount += Number(s.total_amount) || 0;
    });

    // Breakdown by Customer
    const customerStats = {};
    customers.forEach((c) => {
      customerStats[c.id] = {
        id: c.id,
        name: c.name,
        category: c.category,
        totalPurchasedFrom: 0,
        purchaseTxCount: 0,
        totalSoldTo: 0,
        salesTxCount: 0,
      };
    });

    purchases.forEach((p) => {
      const sId = p.supplier_id;
      if (!customerStats[sId]) {
        customerStats[sId] = {
          id: sId,
          name: p.supplier?.name || 'Unknown Supplier',
          category: 'supplier',
          totalPurchasedFrom: 0,
          purchaseTxCount: 0,
          totalSoldTo: 0,
          salesTxCount: 0,
        };
      }
      customerStats[sId].totalPurchasedFrom += Number(p.total_amount) || 0;
      customerStats[sId].purchaseTxCount += 1;
    });

    sales.forEach((s) => {
      const bId = s.buyer_id;
      if (!customerStats[bId]) {
        customerStats[bId] = {
          id: bId,
          name: s.buyer?.name || 'Unknown Buyer',
          category: 'buyer',
          totalPurchasedFrom: 0,
          purchaseTxCount: 0,
          totalSoldTo: 0,
          salesTxCount: 0,
        };
      }
      customerStats[bId].totalSoldTo += Number(s.total_amount) || 0;
      customerStats[bId].salesTxCount += 1;
    });

    return {
      purchases,
      sales,
      totalPurchaseExpense,
      totalSalesRevenue,
      tradingMargin,
      totalPurchaseQuantity,
      totalSalesQuantity,
      productSummaries: Object.values(productStats),
      customerSummaries: Object.values(customerStats).filter(
        (c) => c.purchaseTxCount > 0 || c.salesTxCount > 0
      ),
    };
  },

  /**
   * Export combined or specific transactions to CSV
   */
  exportPurchasesToCSV(purchases) {
    const rows = purchases.map((p) => ({
      'Transaction ID': p.id,
      Date: p.transaction_date,
      Type: 'PURCHASE (EXPENSE)',
      Supplier: p.supplier?.name || '-',
      Product: p.product?.name || '-',
      Quantity: p.quantity,
      Unit: p.unit,
      'Price Per Unit (Ks)': p.price_per_unit,
      'Total Expense (Ks)': p.total_amount,
      Notes: p.notes || '',
    }));
    exportToCSV(rows, `Strawberry_Purchases_${new Date().toISOString().split('T')[0]}.csv`);
  },

  exportSalesToCSV(sales) {
    const rows = sales.map((s) => ({
      'Transaction ID': s.id,
      Date: s.transaction_date,
      Type: 'SALES (REVENUE)',
      Buyer: s.buyer?.name || '-',
      Product: s.product?.name || '-',
      Quantity: s.quantity,
      Unit: s.unit,
      'Unit Price (Ks)': s.unit_price,
      'Total Revenue (Ks)': s.total_amount,
      Notes: s.notes || '',
    }));
    exportToCSV(rows, `Strawberry_Sales_${new Date().toISOString().split('T')[0]}.csv`);
  },

  exportCombinedReportToCSV(purchases, sales) {
    const rows = [
      ...purchases.map((p) => ({
        Date: p.transaction_date,
        Category: 'Purchase (Expense)',
        'Customer/Partner': p.supplier?.name || '-',
        Product: p.product?.name || '-',
        Quantity: p.quantity,
        Unit: p.unit,
        'Unit Rate (Ks)': p.price_per_unit,
        'Amount (Ks)': p.total_amount,
        Notes: p.notes || '',
      })),
      ...sales.map((s) => ({
        Date: s.transaction_date,
        Category: 'Sale (Revenue)',
        'Customer/Partner': s.buyer?.name || '-',
        Product: s.product?.name || '-',
        Quantity: s.quantity,
        Unit: s.unit,
        'Unit Rate (Ks)': s.unit_price,
        'Amount (Ks)': s.total_amount,
        Notes: s.notes || '',
      })),
    ].sort((a, b) => new Date(b.Date) - new Date(a.Date));

    exportToCSV(rows, `Strawberry_Trading_Report_${new Date().toISOString().split('T')[0]}.csv`);
  },
};
