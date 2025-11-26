// worker/src/businessRules.ts
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

// Bu dosyada ihtiyacımız olan minimal tip:
export type Customer = {
  plate: string;
  name: string;
  phone: string;
  dateRaw: string;
  status?: string;
};

/**
 * Tarih string'ini (ör. "2025-11-30", "30.11.2025", "30/11/2025") parse eder.
 * Geçersizse null döner.
 */
export function parseDateFlexible(input: string): Date | null {
  const patterns = [
    "YYYY-MM-DD",
    "DD.MM.YYYY",
    "DD/MM/YYYY",
    "D.M.YYYY",
    "D/M/YYYY",
    "YYYY.MM.DD",
    "YYYY/MM/DD",
  ];

  for (const fmt of patterns) {
    const d = dayjs(input, fmt, true);
    if (d.isValid()) return d.toDate();
  }

  // Date.parse fallback (çok esnek; en sona bırakalım)
  const fallback = new Date(input);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Bir müşterinin randevu/son tarihi bugün ya da geçmiş mi?
 */
export function isDueOrOverdue(cus: Customer, today = new Date()): boolean {
  const d = parseDateFlexible(cus.dateRaw);
  if (!d) return false;
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  return d.getTime() <= endOfToday.getTime();
}

/**
 * Son X gün içinde yaklaşanlar (opsiyonel: bugünü dahil etme)
 */
export function isDueWithinDays(
  cus: Customer,
  days: number,
  today = new Date(),
  includeToday = true
): boolean {
  const d = parseDateFlexible(cus.dateRaw);
  if (!d) return false;

  const start = new Date(today);
  if (!includeToday) {
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);
  }

  const end = new Date(today);
  end.setDate(end.getDate() + days);
  end.setHours(23, 59, 59, 999);

  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
}

/**
 * Liste filtreleri — iş kuralları burada
 */
export function filterDueCustomers(
  list: Customer[],
  opts: { withinDays?: number; includeToday?: boolean } = {}
): Customer[] {
  const { withinDays = 0, includeToday = true } = opts;

  if (withinDays > 0) {
    return list.filter((c) => isDueWithinDays(c, withinDays, new Date(), includeToday));
  }

  return list.filter((c) => isDueOrOverdue(c, new Date()));
}

/**
 * Basit sıralama: en yakın tarihten en uzağa
 */
export function sortByDateAsc(list: Customer[]): Customer[] {
  return [...list].sort((a, b) => {
    const da = parseDateFlexible(a.dateRaw)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const db = parseDateFlexible(b.dateRaw)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return da - db;
  });
}
