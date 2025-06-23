// lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts JSON data to a CSV string and initiates a download.
 * @param data The array of objects to convert.
 * @param headers An array of objects with `label` and `key` properties for the CSV header.
 * @param fileName The desired name for the downloaded CSV file.
 */
export function downloadCSV(data: any[], headers: { label: string, key: string }[], fileName: string) {
  const csvRows = [];
  
  // Add headers row
  const headerValues = headers.map(h => h.label);
  csvRows.push(headerValues.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      // Escape double quotes by replacing them with two double quotes
      const escaped = ('' + row[header.key]).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for BOM to support UTF-8 in Excel
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
