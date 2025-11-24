export function normalizeDate(value: any): Date | null {
  if (!value) return null;

  // 1) Eğer zaten Date objesi ise
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  // 2) Sheets serial number (örneğin 45798 gibi)
  if (typeof value === "number") {
    // Google Sheets serial number → JS Date dönüşümü
    const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // Google Sheets referansı
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);

    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  // 3) String formatlar
  if (typeof value === "string") {
    let cleaned = value.trim();

    // a) ISO Format → "2025-11-13"
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      const d = new Date(cleaned + "T00:00:00");
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    // b) Türkçe tarih formatı: "13.11.2025"
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(cleaned)) {
      const [g, a, y] = cleaned.split(".").map(Number);
      return new Date(y, a - 1, g);
    }

    // c) "Thu Nov 13 2025 00:00:00 GMT+0300" gibi uzun Date string’i
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }
  }

  return null;
}

export function normalizePhoneTR(phone: string): string {
  const digits = phone.replace(/\D+/g, "");
  if (digits.startsWith("90")) return "+" + digits;
  if (digits.startsWith("0")) return "+9" + digits;
  if (digits.length === 10) return "+90" + digits;
  if (phone.startsWith("+")) return phone;
  return "+" + digits;
}

export function isToday(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth() === now.getMonth() &&
         d.getDate() === now.getDate();
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function parseDateFlexible(s: string): Date | null {
  if (!s) return null;
  const t = s.trim();

  // ISO: 2025-11-22 / 2025-11-22T...
  const iso = Date.parse(t);
  if (!Number.isNaN(iso)) return new Date(iso);

  // 22.11.2025 veya 22/11/2025
  const m1 = t.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/);
  if (m1) {
    const d = parseInt(m1[1], 10);
    const M = parseInt(m1[2], 10) - 1;
    const y = parseInt(m1[3].length === 2 ? ("20" + m1[3]) : m1[3], 10);
    const dt = new Date(y, M, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  // 22-11-2025
  const m2 = t.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (m2) {
    const d = parseInt(m2[1], 10);
    const M = parseInt(m2[2], 10) - 1;
    const y = parseInt(m2[3].length === 2 ? ("20" + m2[3]) : m2[3], 10);
    const dt = new Date(y, M, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  return null;
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

export function isTodayDate(d: Date) {
  return isSameDay(d, new Date());
}

export function isTomorrowDate(d: Date) {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return isSameDay(d, t);
}
