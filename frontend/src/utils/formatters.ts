/**
 * Utility functions for formatting currency and numeric inputs with Vietnamese locale (dots as thousand separators).
 */

/**
 * Formats a numeric string or number with thousand-separator dots (e.g., 2000000 -> "2.000.000").
 */
export const formatCurrencyInput = (value: string | number): string => {
  const str = typeof value === 'number' ? value.toString() : value;
  const clean = str.replace(/\D/g, '');
  if (!clean) return '';
  // Remove leading zeros unless it is just '0'
  const trimmed = clean.replace(/^0+(?=\d)/, '');
  return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Parses a formatted string (e.g., "2.000.000") into a plain number (e.g., 2000000).
 */
export const parseCurrencyInput = (value: string): number => {
  const clean = value.replace(/\D/g, '');
  if (!clean) return 0;
  return parseInt(clean, 10) || 0;
};
