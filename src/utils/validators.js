/**
 * Validation and business calculation utilities
 */

/**
 * Calculate transaction total amount
 * Formula: Quantity × Price Per Unit
 * @param {number|string} quantity
 * @param {number|string} unitPrice
 * @returns {number}
 */
export function calculateTotalAmount(quantity, unitPrice) {
  const q = parseFloat(quantity);
  const p = parseFloat(unitPrice);
  if (isNaN(q) || isNaN(p) || q < 0 || p < 0) {
    return 0;
  }
  return Math.round(q * p * 100) / 100;
}

/**
 * Validate customer form input
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateCustomer(data) {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Customer name is required';
  }

  if (!data.category || !['supplier', 'buyer', 'both'].includes(data.category)) {
    errors.category = 'Valid customer category is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate product form input
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateProduct(data) {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Product name is required';
  }

  if (!data.unit || !data.unit.trim()) {
    errors.unit = 'Unit of measurement is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate transaction (purchase / sales)
 * @param {Object} data
 * @param {'purchase'|'sales'} type
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateTransaction(data, type = 'purchase') {
  const errors = {};
  const partnerField = type === 'purchase' ? 'supplier_id' : 'buyer_id';
  const partnerLabel = type === 'purchase' ? 'Supplier' : 'Buyer';

  if (!data[partnerField]) {
    errors[partnerField] = `${partnerLabel} selection is required`;
  }

  if (!data.product_id) {
    errors.product_id = 'Product selection is required';
  }

  if (!data.transaction_date) {
    errors.transaction_date = 'Transaction date is required';
  }

  const qty = parseFloat(data.quantity);
  if (isNaN(qty) || qty <= 0) {
    errors.quantity = 'Quantity must be greater than 0';
  }

  const price = parseFloat(type === 'purchase' ? data.price_per_unit : data.unit_price);
  if (isNaN(price) || price < 0) {
    const priceField = type === 'purchase' ? 'price_per_unit' : 'unit_price';
    errors[priceField] = 'Price must be 0 or greater (positive number)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
