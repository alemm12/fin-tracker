import { z } from 'zod';
import { TransactionCategorySchema } from './transaction';

export const BudgetPeriodSchema = z.enum(['monthly', 'weekly', 'yearly']);

export const BudgetSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  category: TransactionCategorySchema,
  limit: z.number().positive(),
  currency: z.string().length(3),
  period: BudgetPeriodSchema,
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateBudgetSchema = z.object({
  category: TransactionCategorySchema,
  limit: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  period: BudgetPeriodSchema.default('monthly'),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export const UpdateBudgetSchema = CreateBudgetSchema.partial();
