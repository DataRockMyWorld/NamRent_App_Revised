/** "PENDING_APPROVAL" → "Pending Approval" */
export function labelify(s: string): string {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Format NAD currency */
export function namibian(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "N$ 0.00";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return "N$ 0.00";
  return `N$ ${n.toLocaleString("en-NA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
