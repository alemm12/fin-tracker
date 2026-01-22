import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const UserProfileSchema = UserSchema.extend({
  defaultCurrency: z.string().length(3), // ISO 4217
  timezone: z.string(),
});

export const UpdateUserProfileSchema = z.object({
  name: z.string().min(1).optional(),
  defaultCurrency: z.string().length(3).optional(),
  timezone: z.string().optional(),
});
