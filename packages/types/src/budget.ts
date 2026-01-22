import { TransactionCategory } from './transaction';

export interface Budget {
  id: string;
  userId: string;
  category: TransactionCategory;
  limit: number;
  currency: string;
  period: 'monthly' | 'weekly' | 'yearly';
  month?: string; // Format: YYYY-MM
  createdAt: string;
  updatedAt: string;
}

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
}
