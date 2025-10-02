import { z } from 'zod';

/**
 * Comprehensive input validation schemas for security
 */

// Email validation
export const emailSchema = z
  .string()
  .trim()
  .email({ message: 'Invalid email address' })
  .max(255, { message: 'Email must be less than 255 characters' });

// Text input validation with length limits
export const safeTextSchema = (maxLength: number = 1000) =>
  z
    .string()
    .trim()
    .min(1, { message: 'Field cannot be empty' })
    .max(maxLength, { message: `Must be less than ${maxLength} characters` });

// Name validation (no special characters)
export const nameSchema = z
  .string()
  .trim()
  .min(1, { message: 'Name cannot be empty' })
  .max(100, { message: 'Name must be less than 100 characters' })
  .regex(/^[a-zA-Z\s'-]+$/, { message: 'Name contains invalid characters' });

// URL validation
export const urlSchema = z
  .string()
  .trim()
  .url({ message: 'Invalid URL format' })
  .max(2048, { message: 'URL too long' });

// Phone number validation (international format)
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' });

// Stakeholder contact info schema
export const stakeholderContactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: safeTextSchema(100),
  phone: phoneSchema.optional(),
});

// Email content schema
export const emailContentSchema = z.object({
  subject: safeTextSchema(200),
  body: safeTextSchema(50000),
  fromEmail: emailSchema,
  toEmail: emailSchema,
});

// Financial data schema
export const financialDataSchema = z.object({
  amount: z.number().finite().safe(),
  currency: z.string().length(3, { message: 'Invalid currency code' }),
  description: safeTextSchema(500).optional(),
});

// Project creation schema
export const projectCreationSchema = z.object({
  name: safeTextSchema(200),
  description: safeTextSchema(2000).optional(),
  transactionType: safeTextSchema(50),
});

/**
 * Validates and sanitizes user input
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data or throws validation error
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safe validation that returns success status and errors
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success flag and data or error
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
