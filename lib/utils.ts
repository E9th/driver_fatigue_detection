import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fallback cn function if clsx fails
export function cnSimple(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ")
}
