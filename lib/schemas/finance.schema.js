// lib/schemas/finance.schema.js

/**
 * Finance Module Schema Definitions
 * Defines data structure for transactions, budgets, and stats
 */

export const TransactionSchema = {
  // Core fields
  id: 'string',              // Auto-generated
  userId: 'string',          // Owner
  
  // Transaction data
  amount: {
    type: 'number',
    min: 0.01,
    max: 999999999,
    required: true
  },
  
  type: {
    type: 'enum',
    values: ['income', 'expense'],
    required: true
  },
  
  category: {
    type: 'string',
    minLength: 1,
    maxLength: 50,
    required: true
  },
  
  note: {
    type: 'string',
    maxLength: 500,
    required: true
  },
  
  // Optional: Recurring transactions
  isRecurring: {
    type: 'boolean',
    default: false
  },
  
  recurringConfig: {
    type: 'object',
    nullable: true,
    fields: {
      frequency: {
        type: 'enum',
        values: ['daily', 'weekly', 'monthly', 'yearly']
      },
      nextDate: 'timestamp',
      endDate: 'timestamp'
    }
  },
  
  // Metadata
  date: {
    type: 'timestamp',
    required: true
  },
  
  createdAt: {
    type: 'timestamp',
    required: true
  },
  
  updatedAt: 'timestamp',
  deletedAt: 'timestamp'
};

export const BudgetSchema = {
  id: 'string',
  userId: 'string',
  
  category: {
    type: 'string',
    required: true
  },
  
  limit: {
    type: 'number',
    min: 1,
    required: true
  },
  
  period: {
    type: 'enum',
    values: ['daily', 'weekly', 'monthly'],
    required: true
  },
  
  spent: {
    type: 'number',
    default: 0
  },
  
  alerts: {
    type: 'object',
    nullable: true,
    fields: {
      enabled: 'boolean',
      threshold: 'number'  // 0-100 percentage
    }
  },
  
  createdAt: 'timestamp'
};

export const StatsSchema = {
  balance: {
    type: 'number',
    default: 0
  },
  income: {
    type: 'number',
    default: 0
  },
  expense: {
    type: 'number',
    default: 0
  },
  monthlyIncome: {
    type: 'number',
    default: 0
  },
  monthlyExpense: {
    type: 'number',
    default: 0
  },
  lastUpdated: 'timestamp'
};
