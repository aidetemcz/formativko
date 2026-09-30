/**
 * An evaluation batch: drafts coming from the generator are written straight
 * away, a text is approved before it can be copied, and the Rádce's comments
 * show next to it.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { BatchEvaluation, EvaluationBatch } from "@/hooks/useEvaluations";

const evaluation = (id: string, first: string, patch: Partial<BatchEvaluation> = {}): BatchEvaluation => ({
  id,
  student_id: `s-${id}`,
  status: "draft",
  text: "",
  period: "1. pololetí 2026/27",
  sentences: [],
  review: null,
  recommendations_outside: [],
  approved_at: null,
  updated_at: "",
  students: { id: `s-${id}`, first_name: first, last_name: "Bílý" },
  ...patch,
});

let batch: EvaluationBatch;
const update = vi.fn().mockResolvedValue(undefined);
const invoke = vi.fn();

vi.mock("@/components/layout/AppLayout", () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));
vi.mock("@/lib/ai", () => ({ invokeAi: (...args: unknown[]) => invoke(...args) }));
vi.mock("@/hooks/useEvaluations", () => ({
  useEvaluationBatch: () => ({ data: batch, isLoading: false }),
  useUpdateEvaluation: () => ({ mutate: update, mutateAsync: update }),
  useDeleteEvaluationGroup: () => ({ mutateAsync: vi.fn() }),
  useEvaluationSources: () => ({ data: { proofs: [], levels: [] } }),
}));

import HodnoceniDetail from "@/pages/HodnoceniDetail";

function renderAt(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/hodnoceni/:id" element={<HodnoceniDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  update.mockClear();
  invoke.mockReset();
  batch = {
    id: "g1",
    name: "Hodnocení 3.A · 1. pololetí 2026/27",
    mode: "feedback",
    type: "prubezna",
    date_from: "2026-09-01",
    date_to: "2027-01-31",
    created_at: "2026-09-30T10:00:00Z",
    settings: { tone: "pratelsky", length: "kratka", preferences: "", includeSvp: false },
    class_id: "k1",
    subject_id: null,
    classes: { id: "k1", name: "3.A" },
    subjects: null,
    evaluations: [
      evaluation("e1", "Adam", {
        text: "Adame, kořen už najdeš sám.",
        review: { comments: ["Zkuste zmínit i květ."], went_well: [], offers: [] },
      }),
      evaluation("e2", "Eva"),
    ],
  };
});

describe("evaluation batch", () => {
  it("writes the empty drafts when it comes from the generator", async () => {
    invoke.mockResolvedValue({ data: { text: "Evo, list popíšeš přesně.", sentences: [], review: null }, error: null });
    renderAt("/hodnoceni/g1?generovat=1");
    await waitFor(() => expect(update).toHaveBeenCalledWith(expect.objectContaining({ id: "e2", text: "Evo, list popíšeš přesně." })));
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke.mock.calls[0][1].body).toMatchObject({ studentId: "s-e2", mode: "feedback", className: "3.A" });
  });

  it("shows the Rádce and approves a text; export waits for an approved one", () => {
    renderAt("/hodnoceni/g1");
    expect(screen.getByText("Zkuste zmínit i květ.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exportovat/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Schválit/ }));
    expect(update).toHaveBeenCalledWith({ id: "e1", status: "approved" }, expect.anything());
  });

  it("opens the pupil from the profile link", () => {
    renderAt("/hodnoceni/g1?zak=s-e2");
    expect(screen.getByText("Text zatím není napsaný.")).toBeInTheDocument();
  });
});
