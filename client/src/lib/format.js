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
