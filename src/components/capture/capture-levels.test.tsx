import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const mutate = vi.fn();
const toast = vi.fn();
vi.mock("@/hooks/useRecordLevels", () => ({ useRecordLevels: () => ({ mutate, isPending: false }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

const { CriterionLevelPanel } = await import("./CriterionLevelPanel");
const { StudentGrid } = await import("./StudentGrid");
const { AudioRecorder } = await import("@/components/shared/AudioRecorder");

const criteria = [
  { id: "k1", teacher_text: "Pojmenuje části rostliny.", description: "", pupil_text: null, scale: null, svp_variants: [], position: 1, sort_order: 0 },
  { id: "k2", teacher_text: "Vysvětlí funkci kořene.", description: "", pupil_text: null, scale: null, svp_variants: [], position: 2, sort_order: 1 },
];

beforeEach(() => {
  mutate.mockReset();
  toast.mockReset();
});

describe("recording levels in the lesson", () => {
  it("records one tap for every selected pupil, with the lesson", () => {
    render(<CriterionLevelPanel criteria={criteria} selectedStudents={["s1", "s2"]} lessonId="l1" current={new Map()} onRecorded={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Téměř osvojeno, kritérium 2"));
    expect(mutate).toHaveBeenCalledWith(
      { studentIds: ["s1", "s2"], criterionId: "k2", level: "T", lessonId: "l1" },
      expect.anything(),
    );
  });

  it("asks to pick pupils first", () => {
    render(<CriterionLevelPanel criteria={criteria} selectedStudents={[]} lessonId="l1" current={new Map()} onRecorded={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Úplně osvojeno, kritérium 1"));
    expect(mutate).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalled();
  });

  it("shows the level the selected pupils share", () => {
    const current = new Map([["s1:k1", "C"], ["s2:k1", "C"], ["s1:k2", "T"]] as [string, "C" | "T"][]);
    render(<CriterionLevelPanel criteria={criteria} selectedStudents={["s1", "s2"]} lessonId="l1" current={current} onRecorded={vi.fn()} />);
    expect(screen.getByLabelText("Částečně osvojeno, kritérium 1").getAttribute("aria-pressed")).toBe("true");
    // Pupils differ on criterion 2, so no button is pressed there.
    for (const label of ["Ještě neosvojeno", "Částečně osvojeno", "Téměř osvojeno", "Úplně osvojeno"]) {
      expect(screen.getByLabelText(`${label}, kritérium 2`).getAttribute("aria-pressed")).toBe("false");
    }
  });
});

describe("the pupil grid", () => {
  it("shows each pupil's level per criterion and who still has none", () => {
    render(
      <StudentGrid
        students={[{ id: "s1", first_name: "Adam", last_name: "Bílý" }]}
        selectedStudents={[]}
        proofDots={{}}
        proofTypeMap={new Map()}
        seatingData={null}
        levelCriteria={["k1", "k2"]}
        currentLevels={new Map([["s1:k1", "U"]])}
        onToggleStudent={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Úplně osvojeno")).toBeInTheDocument();
    expect(screen.getByLabelText("Bez úrovně")).toBeInTheDocument();
    expect(document.body.innerHTML).not.toMatch(/green|red-|amber/);
  });
});

describe("voice note", () => {
  it("says plainly when the browser cannot record", () => {
    render(<AudioRecorder onChange={vi.fn()} />);
    expect(screen.getByText("Tento prohlížeč neumí nahrávat zvuk.")).toBeInTheDocument();
  });
});
