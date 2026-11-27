export const TZ = "Asia/Ho_Chi_Minh";

/** YYYY-MM-DD theo giờ VN */
export function todayVN(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Date tương ứng HH:00 giờ VN của ngày `date` */
export function atHourVN(date: string, hour: number): Date {
  return new Date(`${date}T${String(hour).padStart(2, "0")}:00:00+07:00`);
}

export function formatDateVN(iso: string | null | undefined, withWeekday = false): string {
  if (!iso) return "—";
  const d = iso.length === 10 ? new Date(iso + "T00:00:00+07:00") : new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withWeekday ? { weekday: "long" } : {}),
  });
}

export function formatTimeVN(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("vi-VN", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

export function isValidDate(s: string | undefined | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());
}
