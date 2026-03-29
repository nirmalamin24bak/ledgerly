import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function isOverdue(dueDateStr: string | null | undefined): boolean {
  if (!dueDateStr) return false
  return new Date(dueDateStr) < new Date()
}

export function getDaysOverdue(dueDateStr: string | null | undefined): number {
  if (!dueDateStr) return 0
  const diff = Date.now() - new Date(dueDateStr).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export function statusColor(status: string): string {
  switch (status) {
    case 'paid':    return 'bg-green-100 text-green-800'
    case 'partial': return 'bg-yellow-100 text-yellow-800'
    case 'pending': return 'bg-red-100 text-red-800'
    default:        return 'bg-gray-100 text-gray-800'
  }
}

export const SUPPLIER_CATEGORIES = [
  'steel', 'rmc', 'labour', 'cement', 'sand',
  'electrical', 'plumbing', 'tiles', 'glass',
  'hardware', 'paint', 'other',
] as const

export const PAYMENT_MODES = [
  { value: 'cash',   label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'neft',   label: 'NEFT' },
  { value: 'rtgs',   label: 'RTGS' },
  { value: 'upi',    label: 'UPI' },
  { value: 'other',  label: 'Other' },
] as const
