/**
 * Tailwind CSS Class Name Utility
 *
 * This utility function combines multiple class names using clsx and tailwind-merge
 * to ensure proper handling of Tailwind CSS classes and avoid conflicts.
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combine and merge Tailwind CSS classes
 * @param inputs - Class values to combine
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
