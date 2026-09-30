import type { AiResult } from "@/lib/ai";

/** Running feedback keeps next steps in the text; a school report returns them apart (zadání kap. 2.1). */
export type EvaluationMode = "feedback" | "certificate";

export const MODE_LABELS: Record<EvaluationMode, string> = {
  feedback: "Průběžná zpětná vazba",
  certificate: "Text na vysvědčení",
};

export interface EvaluationSentence {
  text: string;
  proofIds: string[];
  assessmentIds: string[];
}

export interface EvaluationReview {
  comments: string[];
  went_well: string[];
  offers: string[];
}

/** Tone and length sliders (Veroničin generátor); prompt 04 still has the last word. */
export const TONE_STEPS = ["formalni", "vyvazeny", "pratelsky"] as const;
export const LENGTH_STEPS = ["kratka", "stredni", "dlouha"] as const;

export interface EvaluationSettings {
  tone: (typeof TONE_STEPS)[number];
  length: (typeof LENGTH_STEPS)[number];
  preferences: string;
  includeSvp: boolean;
}

export const DEFAULT_SETTINGS: Record<EvaluationMode, EvaluationSettings> = {
  feedback: { tone: "pratelsky", length: "kratka", preferences: "", includeSvp: false },
  certificate: { tone: "vyvazeny", length: "stredni", preferences: "", includeSvp: false },
};

export type EvaluationStatus = "draft" | "approved" | "insufficient";

/** Old rows used "waiting" for a draft. */
export function evaluationStatus(status: string): EvaluationStatus {
  if (status === "approved" || status === "insufficient") return status;
  return "draft";
}

export const STATUS_LABELS: Record<EvaluationStatus, string> = {
  draft: "Koncept",
  approved: "Schváleno",
  insufficient: "Málo podkladů",
};

/** A draft the generator has not written yet (or failed to). */
export function needsGenerating(e: { status: string; text: string | null }): boolean {
  return evaluationStatus(e.status) === "draft" && !(e.text ?? "").trim();
}

export interface GeneratedEvaluation {
  text: string;
  status: EvaluationStatus;
  sentences: EvaluationSentence[];
  review: EvaluationReview | null;
  recommendations_outside: string[];
}

/**
 * One pupil's evaluation from the methodology endpoint. "Too little to write
 * from" is an answer, not an error: the evaluation is marked insufficient.
 */
export async function generateEvaluation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoke: (name: "generate-evaluation", options: { body: Record<string, unknown> }) => Promise<AiResult<any>>,
  input: {
    studentId: string;
    mode: EvaluationMode;
    dateFrom: string | null;
    dateTo: string | null;
    className: string;
    subjectId: string | null;
    subjectName: string;
    settings: EvaluationSettings;
  },
): Promise<GeneratedEvaluation> {
  const { data, error } = await invoke("generate-evaluation", {
    body: {
      studentId: input.studentId,
      mode: input.mode,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      className: input.className,
      subjectId: input.subjectId,
      subject: input.subjectName,
      tone: input.settings.tone,
      length: input.settings.length,
      preferences: input.settings.preferences,
      includeSvp: input.settings.includeSvp,
    },
  });
  if (error) throw error;
  if (data?.noProofs) {
    return { text: "", status: "insufficient", sentences: [], review: null, recommendations_outside: [] };
  }
  const text = (data?.text ?? "").trim();
  if (!text) throw new Error("AI nevrátila žádný text.");
  return {
    text,
    status: "draft",
    sentences: data?.sentences ?? [],
    review: data?.review
      ? { comments: data.review.comments ?? [], went_well: data.review.went_well ?? [], offers: data.review.offers ?? [] }
      : null,
    recommendations_outside: data?.recommendationsOutside ?? [],
  };
}

/** Everything the text of a batch says, for the clipboard: name, then text. */
export function batchAsText(items: { name: string; text: string }[]): string {
  return items
    .filter((i) => i.text.trim())
    .map((i) => `${i.name}\n${i.text.trim()}`)
    .join("\n\n");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** A small HTML document Word opens as-is: the batch title, then name and text per pupil. */
export function batchAsDocument(title: string, items: { name: string; text: string }[]): string {
  const body = items
    .filter((i) => i.text.trim())
    .map((i) => `<h2>${escapeHtml(i.name)}</h2>\n<p>${escapeHtml(i.text.trim())}</p>`)
    .join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body><h1>${escapeHtml(title)}</h1>\n${body}</body></html>`;
}
