export function toDateStr(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayStr() {
  return toDateStr(new Date());
}

export function monthStartStr() {
  const d = new Date();
  d.setDate(1);
  return toDateStr(d);
}

export function yearStartStr() {
  const d = new Date();
  d.setMonth(0, 1);
  return toDateStr(d);
}

export function monthRange(offset: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offset);
  const from = toDateStr(d);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const to = toDateStr(end);
  const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return { from, to, label };
}

export function yearRange(offset: number) {
  const year = new Date().getFullYear() - offset;
  return { from: `${year}-01-01`, to: `${year}-12-31`, label: String(year) };
}
