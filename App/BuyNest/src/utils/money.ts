/** Formats integer paise as rupees, e.g. 14900 -> "₹149", 10050 -> "₹100.50". */
export function formatCurrency(paise: number): string {
  const rupees = paise / 100;
  const formatted = rupees.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `₹${formatted}`;
}

/** Whole-number discount percentage of sellingPrice against mrp; 0 when there is no discount. */
export function getDiscountPercent(mrp: number, sellingPrice: number): number {
  if (mrp <= 0 || sellingPrice >= mrp) {
    return 0;
  }
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
}
