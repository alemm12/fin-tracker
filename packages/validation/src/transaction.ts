import { z } from 'zod';

export const TransactionCategorySchema = z.enum([
  'groceries',
  'utilities',
  'entertainment',
  'transportation',
  'healthcare',
  'dining',
  'shopping',
  'income',
  'other',
]);

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number(),
  currency: z.string().length(3),
  category: TransactionCategorySchema,
  description: z.string().optional(),
  date: z.string().datetime(),
  receiptUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateTransactionSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  category: TransactionCategorySchema,
  description: z.string().max(500).optional(),
  date: z.string().datetime(),
  receiptUrl: z.string().url().optional(),
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial();

export const TransactionQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  category: TransactionCategorySchema.optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});
