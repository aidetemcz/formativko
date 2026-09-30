/**
 * The JČTÚ scale: four steps of progress on one criterion, J < Č < T < Ú.
 *
 * It describes progress, not performance. Its colours come from the design
 * tokens and are never the traffic-light red and green of a grade.
 *
 * The database stores ASCII codes (`J`, `C`, `T`, `U`); `label` is what the
 * teacher and pupil see.
 */
export type JctuCode = "J" | "C" | "T" | "U";

export interface JctuLevel {
  code: JctuCode;
  /** Letter shown in the UI. */
  letter: "J" | "Č" | "T" | "Ú";
  /** For the teacher. */
  label: string;
  /** General sentence for the pupil; each criterion also gets its own (prompt 03). */
  pupil: string;
}

/** Lowest to highest. */
export const JCTU_LEVELS: readonly JctuLevel[] = [
  { code: "J", letter: "J", label: "Ještě neosvojeno", pupil: "Ještě mi to nejde a stále se učím." },
  { code: "C", letter: "Č", label: "Částečně osvojeno", pupil: "Trochu mi to jde, ale dělám chyby." },
  { code: "T", letter: "T", label: "Téměř osvojeno", pupil: "Skoro už to zvládnu sám/sama s drobnou pomocí." },
  { code: "U", letter: "Ú", label: "Úplně osvojeno", pupil: "Úplně to umím sám/sama." },
];

export const JCTU_CODES: readonly JctuCode[] = JCTU_LEVELS.map((l) => l.code);

/** Pupil-facing sentences for one criterion, as stored in `evaluation_criteria.scale`. */
export type JctuScale = Record<JctuCode, string>;

export function isJctuCode(value: unknown): value is JctuCode {
  return typeof value === "string" && (JCTU_CODES as readonly string[]).includes(value);
}

export function getJctuLevel(code: JctuCode): JctuLevel {
  return JCTU_LEVELS.find((l) => l.code === code)!;
}

/** Negative when `a` is a lower step than `b`. */
export function compareJctu(a: JctuCode, b: JctuCode): number {
  return JCTU_CODES.indexOf(a) - JCTU_CODES.indexOf(b);
}

/** The sentence a pupil reads for one step of one criterion, falling back to the general one. */
export function pupilSentence(code: JctuCode, scale: Partial<JctuScale> | null | undefined): string {
  const specific = scale?.[code]?.trim();
  return specific || getJctuLevel(code).pupil;
}

/** Where a level came from. */
export type AssessmentSource = "teacher" | "self_qr" | "self_paper";

export const ASSESSMENT_SOURCE_LABELS: Record<AssessmentSource, string> = {
  teacher: "Učitel",
  self_qr: "Sebehodnocení (online exitka)",
  self_paper: "Sebehodnocení (papírová exitka)",
};
