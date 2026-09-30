import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SETTINGS,
  batchAsDocument,
  batchAsText,
  evaluationStatus,
  generateEvaluation,
  needsGenerating,
} from "./evaluations";

const input = {
  studentId: "s1",
  mode: "certificate" as const,
  dateFrom: "2026-09-01",
  dateTo: "2027-01-31",
  className: "3.A",
  subjectId: "sub1",
  subjectName: "Prvouka",
  settings: DEFAULT_SETTINGS.certificate,
};

describe("generateEvaluation", () => {
  it("sends the batch settings and keeps sentences, review and outside recommendations", async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        text: " Adam popíše kořen. ",
        sentences: [{ text: "Adam popíše kořen.", proofIds: ["p1"], assessmentIds: [] }],
        review: { comments: ["a"], went_well: [], offers: [], style_issues: [] },
        recommendationsOutside: ["Číst nahlas."],
      },
      error: null,
    });
    const result = await generateEvaluation(invoke, input);
    expect(invoke.mock.calls[0][1].body).toMatchObject({ mode: "certificate", subjectId: "sub1", tone: "vyvazeny", length: "stredni" });
    expect(result).toEqual({
      text: "Adam popíše kořen.",
      status: "draft",
      sentences: [{ text: "Adam popíše kořen.", proofIds: ["p1"], assessmentIds: [] }],
      review: { comments: ["a"], went_well: [], offers: [] },
      recommendations_outside: ["Číst nahlas."],
    });
  });

  it("marks a pupil with nothing to write from as insufficient", async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { noProofs: true, text: "" }, error: null });
    expect((await generateEvaluation(invoke, input)).status).toBe("insufficient");
  });

  it("fails on an error or an empty text", async () => {
    await expect(generateEvaluation(vi.fn().mockResolvedValue({ data: null, error: new Error("x") }), input)).rejects.toThrow("x");
    await expect(generateEvaluation(vi.fn().mockResolvedValue({ data: { text: "" }, error: null }), input)).rejects.toThrow();
  });
});

describe("statuses", () => {
  it("treats old waiting rows as drafts and knows which drafts are unwritten", () => {
    expect(evaluationStatus("waiting")).toBe("draft");
    expect(evaluationStatus("approved")).toBe("approved");
    expect(needsGenerating({ status: "draft", text: "" })).toBe(true);
    expect(needsGenerating({ status: "insufficient", text: "" })).toBe(false);
    expect(needsGenerating({ status: "draft", text: "Hotovo." })).toBe(false);
  });
});

describe("export", () => {
  it("leaves out empty texts and escapes HTML", () => {
    const items = [
      { name: "Adam Bílý", text: "Umí <b>vše</b> & víc." },
      { name: "Eva Malá", text: " " },
    ];
    expect(batchAsText(items)).toBe("Adam Bílý\nUmí <b>vše</b> & víc.");
    const doc = batchAsDocument("Hodnocení 3.A", items);
    expect(doc).toContain("Umí &lt;b&gt;vše&lt;/b&gt; &amp; víc.");
    expect(doc).not.toContain("Eva Malá");
  });
});
