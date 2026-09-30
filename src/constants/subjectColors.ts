/**
 * Colour of a subject chip, from the design tokens in src/index.css.
 *
 * Subjects are free text the teacher types ("Matematika", "M", "Čeština a
 * literatura"), so the match looks at the start of the name without
 * diacritics. The class strings are spelled out in full so Tailwind finds them.
 */
const SUBJECT_CLASSES = {
  cestina: "bg-subject-cestina text-subject-cestina-foreground",
  matematika: "bg-subject-matematika text-subject-matematika-foreground",
  prvouka: "bg-subject-prvouka text-subject-prvouka-foreground",
  anglictina: "bg-subject-anglictina text-subject-anglictina-foreground",
  hudebni: "bg-subject-hudebni text-subject-hudebni-foreground",
  vytvarna: "bg-subject-vytvarna text-subject-vytvarna-foreground",
  telesna: "bg-subject-telesna text-subject-telesna-foreground",
  informatika: "bg-subject-informatika text-subject-informatika-foreground",
  other: "bg-subject-other text-subject-other-foreground",
} as const;

export type SubjectColorKey = keyof typeof SUBJECT_CLASSES;

const PREFIXES: [string, SubjectColorKey][] = [
  ["ces", "cestina"],
  ["cj", "cestina"],
  ["mat", "matematika"],
  ["prv", "prvouka"],
  ["prir", "prvouka"],
  ["angl", "anglictina"],
  ["aj", "anglictina"],
  ["hud", "hudebni"],
  ["hv", "hudebni"],
  ["vyt", "vytvarna"],
  ["vv", "vytvarna"],
  ["tel", "telesna"],
  ["tv", "telesna"],
  ["inf", "informatika"],
];

function normalize(name: string): string {
  return name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export function subjectColorKey(name: string | null | undefined): SubjectColorKey {
  const n = normalize(name ?? "");
  if (!n) return "other";
  if (n === "m") return "matematika";
  return PREFIXES.find(([prefix]) => n.startsWith(prefix))?.[1] ?? "other";
}

export function subjectChipClasses(name: string | null | undefined): string {
  return SUBJECT_CLASSES[subjectColorKey(name)];
}
