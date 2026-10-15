// Расчёт рассрочки. Без процентов — остаток делится поровну на месяцы,
// с процентами — аннуитетный платёж (одинаковый каждый месяц).

export type InstallmentPlan = { down: number; monthly: number; months: number; total: number; overpay: number };

export function installmentPlan(price: number, downPercent: number, months: number, ratePercent?: number | null): InstallmentPlan | null {
  if (!(price > 0) || !(months >= 1) || !(downPercent >= 0 && downPercent <= 100)) return null;
  const down = (price * downPercent) / 100;
  const rest = price - down;
  const r = ratePercent && ratePercent > 0 ? ratePercent / 100 / 12 : 0;
  const monthly = r ? (rest * r) / (1 - Math.pow(1 + r, -months)) : rest / months;
  const total = down + monthly * months;
  return { down, monthly, months, total, overpay: total - price };
}

/** «24 месяца», «1 месяц», «5 месяцев» / «24 months». */
export function monthsLabel(n: number, locale: "ru" | "en" = "ru") {
  if (locale === "en") return `${n} ${n === 1 ? "month" : "months"}`;
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} месяц`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} месяца`;
  return `${n} месяцев`;
}
