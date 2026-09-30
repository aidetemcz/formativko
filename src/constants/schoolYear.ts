/** Months of the Czech school year, in order. `lessons.month` holds one of these. */
export const SCHOOL_MONTHS = [
  "září", "říjen", "listopad", "prosinec", "leden", "únor", "březen", "duben", "květen", "červen",
] as const;

export type SchoolMonth = (typeof SCHOOL_MONTHS)[number];

/** Position in the school year; unknown or empty months sort last. */
export function monthOrder(month: string | null | undefined): number {
  const i = SCHOOL_MONTHS.indexOf((month ?? "").trim().toLowerCase() as SchoolMonth);
  return i < 0 ? SCHOOL_MONTHS.length : i;
}

/** The school month of a date; July and August count as September. */
export function schoolMonthOf(date: Date): SchoolMonth {
  const m = date.getMonth(); // 0 = January
  const map: Record<number, SchoolMonth> = {
    0: "leden", 1: "únor", 2: "březen", 3: "duben", 4: "květen", 5: "červen",
    6: "září", 7: "září", 8: "září", 9: "říjen", 10: "listopad", 11: "prosinec",
  };
  return map[m];
}

/** "7.B" → "7. ročník"; anything without a leading number stays as it is. */
export function gradeFromClassName(className: string | null | undefined): string {
  const m = (className ?? "").trim().match(/^(\d{1,2})/);
  return m ? `${m[1]}. ročník` : (className ?? "").trim();
}

/** The pupil's first name and the initial of the last name: "Adam B." */
export function shortPupilName(s: { first_name: string; last_name: string }): string {
  return s.last_name ? `${s.first_name} ${s.last_name.charAt(0)}.` : s.first_name;
}

export interface SchoolPeriod {
  id: string;
  label: string;
  /** ISO dates, inclusive. */
  from: string;
  to: string;
}

/** The school year a date belongs to: from September; July and August lead into the next one. */
export function schoolYearStart(today: Date): number {
  return today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
}

/** 1st term, 2nd term and the whole year of the school year `today` falls in. */
export function schoolPeriods(today: Date): SchoolPeriod[] {
  const y = schoolYearStart(today);
  const year = `${y}/${String(y + 1).slice(2)}`;
  return [
    { id: "1", label: `1. pololetí ${year}`, from: `${y}-09-01`, to: `${y + 1}-01-31` },
    { id: "2", label: `2. pololetí ${year}`, from: `${y + 1}-02-01`, to: `${y + 1}-06-30` },
    { id: "rok", label: `Celý školní rok ${year}`, from: `${y}-09-01`, to: `${y + 1}-06-30` },
  ];
}

/** The period `today` is in: the 1st term until January, the 2nd from February. */
export function currentPeriod(today: Date): SchoolPeriod {
  const [first, second] = schoolPeriods(today);
  const iso = today.toISOString().slice(0, 10);
  return iso >= second.from && iso <= second.to ? second : first;
}

/** School months a period covers ("září"…"leden" for the 1st term). */
export function monthsInPeriod(period: Pick<SchoolPeriod, "from" | "to">): SchoolMonth[] {
  const months: SchoolMonth[] = [];
  const d = new Date(`${period.from}T12:00:00`);
  const end = new Date(`${period.to}T12:00:00`);
  while (d <= end) {
    const m = schoolMonthOf(d);
    if (d.getMonth() !== 6 && d.getMonth() !== 7 && !months.includes(m)) months.push(m);
    d.setMonth(d.getMonth() + 1, 1);
  }
  return months;
}
