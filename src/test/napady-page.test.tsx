/**
 * Nápady: one tap on a step records the teacher's level and moves on;
 * "Nevím" skips without writing anything.
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { NapadyQuestion } from "@/lib/napady";

const question = (key: string, first: string, criterion: string): NapadyQuestion => ({
  key,
  pupil: { id: key.split("|")[0], first_name: first, last_name: "Bílý" },
  lesson: { id: "l1", title: "Části rostliny", className: "3.A", subject: "Prvouka", goal: "Cíl" },
  criterion: { id: key.split("|")[1], text: criterion },
  selfLevel: "T",
  lastProof: null,
});
const QUESTIONS = [question("s1|c1", "Adam", "Ukážu kořen."), question("s2|c1", "Eva", "Ukážu kořen.")];
const record = vi.fn();

vi.mock("@/components/layout/AppLayout", () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));
vi.mock("@/hooks/useClasses", () => ({ useClasses: () => ({ data: [] }) }));
vi.mock("@/hooks/useSubjects", () => ({ useSubjects: () => ({ data: [] }) }));
vi.mock("@/hooks/useRecordLevels", () => ({ useRecordLevels: () => ({ mutate: record }) }));
vi.mock("@/hooks/useNapady", () => ({
  useNapadyQuestions: () => ({ data: QUESTIONS, isLoading: false, isFetching: false, refetch: vi.fn() }),
}));

import Napady from "@/pages/Napady";

describe("Nápady", () => {
  it("records a tapped level and skips on Nevím", () => {
    render(
      <MemoryRouter>
        <Napady />
      </MemoryRouter>,
    );
    expect(screen.getByText("Adam B.")).toBeInTheDocument();
    expect(screen.getByText("Sebehodnocení z exitky:")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Téměř osvojeno/ }));
    expect(record).toHaveBeenCalledWith(
      { studentIds: ["s1"], criterionId: "c1", level: "T", lessonId: "l1" },
      expect.anything(),
    );
    expect(screen.getByText("Eva B.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nevím, zjistím v hodině" }));
    expect(record).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Dávku máte za sebou")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vrátit přeskočené (1)" })).toBeInTheDocument();
  });
});
