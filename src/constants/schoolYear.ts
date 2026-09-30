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
