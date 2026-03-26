import { z } from "zod";

const supportedLanguages = ["en", "ar", "hi", "ur", "bn", "tl", "fa", "ne", "si"] as const;
const paymentMethods = ["cod", "gcash", "card"] as const;
const supportTopics = ["wash-services", "scheduling", "payments", "account", "other"] as const;
const supportTicketStatuses = ["open", "in_progress", "resolved", "closed"] as const;

const optionalPhoneSchema = z
  .string()
  .trim()
  .regex(/^(|09\d{9}|\+639\d{9})$/, "Use 09XXXXXXXXX or +639XXXXXXXXX")
  .transform((value) => value.trim());

export const updateCustomerProfileSchema = z.object({
  firstName: z.string().trim().max(80).optional(),
  surname: z.string().trim().max(80).optional(),
  phone: optionalPhoneSchema.optional(),
  address: z.string().trim().max(220).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Please confirm your new password."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New password and confirmation do not match.",
    path: ["confirmPassword"],
  });

export const supportedLanguageSchema = z.enum(supportedLanguages);

export const customerPaymentPreferenceSchema = z.object({
  method: z.enum(paymentMethods),
  displayLabel: z
    .string()
    .trim()
    .max(80, "Display label must be at most 80 characters.")
    .optional()
    .transform((value) => value || ""),
  maskedReference: z
    .string()
    .trim()
    .max(40, "Masked reference must be at most 40 characters.")
    .optional()
    .transform((value) => value || ""),
  isDefault: z.boolean().default(false),
});

export const updatePaymentPreferenceSchema = customerPaymentPreferenceSchema.extend({
  preferenceId: z.uuid(),
});

export const deletePaymentPreferenceSchema = z.object({
  preferenceId: z.uuid(),
});

export const setDefaultPaymentPreferenceSchema = z.object({
  preferenceId: z.uuid(),
});

export const supportTicketCreateSchema = z.object({
  topic: z.enum(supportTopics),
  subject: z.string().trim().min(4).max(120),
  message: z.string().trim().min(8).max(4000),
});

export const supportTicketStatusUpdateSchema = z.object({
  ticketId: z.uuid(),
  status: z.enum(supportTicketStatuses),
  adminNote: z.string().trim().max(600).optional(),
});

export type UpdateCustomerProfileInput = z.infer<typeof updateCustomerProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CustomerPaymentPreferenceInput = z.infer<typeof customerPaymentPreferenceSchema>;
export type UpdatePaymentPreferenceInput = z.infer<typeof updatePaymentPreferenceSchema>;
export type DeletePaymentPreferenceInput = z.infer<typeof deletePaymentPreferenceSchema>;
export type SetDefaultPaymentPreferenceInput = z.infer<typeof setDefaultPaymentPreferenceSchema>;
export type SupportedLanguageInput = z.infer<typeof supportedLanguageSchema>;
export type SupportTicketCreateInput = z.infer<typeof supportTicketCreateSchema>;
export type SupportTicketStatusUpdateInput = z.infer<typeof supportTicketStatusUpdateSchema>;
