import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "NPR"): string {
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: currency === "NPR" ? "NPR" : currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount).replace("NPR", "Rs.")
}

export function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}
