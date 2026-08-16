import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
})

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().trim().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().trim().optional(),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
  confirmPassword: z.string().min(6, { message: 'Confirm password is required.' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address.' }),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(6, { message: 'New password must be at least 6 characters.' }),
  confirmPassword: z.string().min(6, { message: 'Confirm new password is required.' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
})

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, { message: 'Full name must be at least 2 characters.' }),
  phone: z.string().trim().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
