export function truncateId(id: string | null | undefined, head = 8, tail = 4): string {
  if (!id) return "";
  if (id.length <= head + tail + 3) return id;
  return `${id.slice(0, head)}...${id.slice(-tail)}`;
}

export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return "n/a";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "n/a";
  return d.toLocaleString();
}

export function fmtNumber(value: number | null | undefined, digits = 2): string {
  if (typeof value !== "number") return "n/a";
  return value.toFixed(digits);
}

