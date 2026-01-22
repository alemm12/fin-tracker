export type TransactionCategory =
  | 'groceries'
  | 'utilities'
  | 'entertainment'
  | 'transportation'
  | 'healthcare'
  | 'dining'
  | 'shopping'
  | 'income'
  | 'other';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  category: TransactionCategory;
  description?: string;
  date: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  byCategory: Record<TransactionCategory, number>;
}
