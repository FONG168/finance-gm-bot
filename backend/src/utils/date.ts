export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function startOfMonth(year: number, month: number): Date {
  const d = new Date(year, month - 1, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfMonth(year: number, month: number): Date {
  const d = new Date(year, month, 0); // Day 0 of next month = last day of this month
  d.setHours(23, 59, 59, 999);
  return d;
}

export function format(date: Date, pattern: string): string {
  const map: Record<string, string> = {
    YYYY: date.getFullYear().toString(),
    MM: String(date.getMonth() + 1).padStart(2, '0'),
    DD: String(date.getDate()).padStart(2, '0'),
    HH: String(date.getHours()).padStart(2, '0'),
    mm: String(date.getMinutes()).padStart(2, '0'),
  };
  return pattern.replace(/YYYY|MM|DD|HH|mm/g, (key) => map[key]);
}
