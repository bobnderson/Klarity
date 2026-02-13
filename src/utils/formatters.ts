/**
 * Formats a number with thousand separators and optional decimal places.
 * @param value The number to format
 * @param decimals Number of decimal places (default 0)
 * @returns Formatted string
 */
export const formatNumber = (
  value: number | undefined | null,
  decimals: number = 0,
): string => {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Formats a number as USD currency.
 * @param value The number to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};
