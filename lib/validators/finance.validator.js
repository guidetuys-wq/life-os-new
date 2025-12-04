// lib/validators/finance.validator.js

/**
 * Finance Data Validator
 * Validates transaction and budget data before Firestore operations
 */

export class FinanceValidator {
  
  /**
   * Validate transaction data
   * @param {Object} data - Transaction data
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validateTransaction(data) {
    const errors = [];
    
    // Amount validation
    if (!data.amount) {
      errors.push('Jumlah wajib diisi');
    } else if (isNaN(data.amount)) {
      errors.push('Jumlah harus berupa angka');
    } else {
      const amount = Number(data.amount);
      if (amount <= 0) {
        errors.push('Jumlah harus lebih dari 0');
      } else if (amount > 999999999) {
        errors.push('Jumlah terlalu besar (max 999 juta)');
      }
    }
    
    // Type validation
    if (!data.type) {
      errors.push('Tipe transaksi wajib diisi');
    } else if (!['income', 'expense'].includes(data.type)) {
      errors.push('Tipe transaksi tidak valid (income/expense)');
    }
    
    // Category validation
    if (!data.category || typeof data.category !== 'string') {
      errors.push('Kategori wajib diisi');
    } else {
      const category = data.category.trim();
      if (category.length === 0) {
        errors.push('Kategori tidak boleh kosong');
      } else if (category.length > 50) {
        errors.push('Kategori terlalu panjang (max 50 karakter)');
      }
    }
    
    // Note validation
    if (!data.desc && !data.note) {
      errors.push('Catatan wajib diisi');
    } else {
      const note = (data.desc || data.note || '').trim();
      if (note.length === 0) {
        errors.push('Catatan tidak boleh kosong');
      } else if (note.length > 500) {
        errors.push('Catatan terlalu panjang (max 500 karakter)');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate budget data
   * @param {Object} data - Budget data
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validateBudget(data) {
    const errors = [];
    
    if (!data.category || data.category.trim().length === 0) {
      errors.push('Kategori budget wajib diisi');
    }
    
    if (!data.limit || isNaN(data.limit) || Number(data.limit) <= 0) {
      errors.push('Limit budget harus lebih dari 0');
    }
    
    if (!['daily', 'weekly', 'monthly'].includes(data.period)) {
      errors.push('Period tidak valid (daily/weekly/monthly)');
    }
    
    if (data.alerts) {
      if (typeof data.alerts.enabled !== 'boolean') {
        errors.push('Alert enabled harus boolean');
      }
      if (data.alerts.threshold && (data.alerts.threshold < 0 || data.alerts.threshold > 100)) {
        errors.push('Alert threshold harus 0-100');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Sanitize transaction input
   * @param {Object} data - Raw transaction data
   * @returns {Object} Sanitized transaction data
   */
  static sanitizeTransaction(data) {
    return {
      amount: Math.abs(Number(data.amount)),
      type: data.type,
      category: (data.category || '').trim(),
      note: (data.desc || data.note || '').trim(),
      isRecurring: Boolean(data.isRecurring),
      recurringConfig: data.recurringConfig || null,
      date: data.date || new Date()
    };
  }
  
  /**
   * Validate category name
   * @param {string} name - Category name
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validateCategory(name) {
    const errors = [];
    
    if (!name || typeof name !== 'string') {
      errors.push('Nama kategori wajib diisi');
    } else {
      const trimmed = name.trim();
      if (trimmed.length === 0) {
        errors.push('Nama kategori tidak boleh kosong');
      } else if (trimmed.length > 50) {
        errors.push('Nama kategori terlalu panjang (max 50 karakter)');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
