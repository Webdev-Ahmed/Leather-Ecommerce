import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Merges Tailwind classes safely, resolving conflicts
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// Formats a number as Pakistani Rupees: RS. 1,990
export function formatPrice(amount: number): string {
  return `RS. ${amount.toLocaleString('en-PK')}`
}

// Formats an ISO date string as: 12 Jun 2025
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Truncates a string to maxLength, appending ellipsis if needed
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength).trimEnd()}…`
}

// Returns initials from a full name (up to 2 chars)
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
