export function formatReceiptNo(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `RCPT-${y}${m}${day}-${random}`;
}

export function formatCurrency(
  value: number,
  maximumFractionDigits = 0,
): string {
  return value.toLocaleString("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits,
  });
}

export function parseFormDate(value: string): string {
  if (!value) return "";
  return value;
}
