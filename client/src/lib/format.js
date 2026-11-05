const formatter = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: import.meta.env.VITE_CURRENCY,
});

// Prices are integers in the smallest unit (piastres): 8500 -> "EGP 85.00".
export const formatPrice = (amount) => formatter.format(amount / 100);

// Option price changes: 1500 -> "+EGP 15.00", -100 -> "-EGP 1.00", 0 -> "".
export function formatPriceDelta(delta) {
  if (delta === 0) return "";
  const sign = delta > 0 ? "+" : "-";
  return `${sign}${formatPrice(Math.abs(delta))}`;
}

const amountFormatter = new Intl.NumberFormat("en-EG", {
  maximumFractionDigits: 2,
});

// Chart axes: 8500 -> "85". The tooltip still uses formatPrice.
export const formatAmount = (amount) => amountFormatter.format(amount / 100);

// Form fields: 8500 -> "85.00", -150 -> "-1.50".
export function formatPriceInput(amount) {
  const negative = amount < 0;
  const abs = Math.abs(amount);
  const text = `${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
  return negative ? `-${text}` : text;
}

// "85" -> 8500, "1.5" -> 150, "-1.50" -> -150. Empty or extra decimals -> null.
export function parsePriceInput(value) {
  const trimmed = String(value).trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const negative = trimmed.startsWith("-");
  const [whole, frac = ""] = trimmed.slice(negative ? 1 : 0).split(".");
  const piastres = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(piastres)) return null;
  return negative ? -piastres : piastres;
}
