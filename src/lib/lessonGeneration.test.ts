import { describe, expect, it, vi } from "vitest";
import { generateLessonContent, runQueue, type GenerationDeps } from "./lessonGeneration";

const lesson = { id: "l1", title: "Části rostliny", description: "Pozorujeme rostlinu.", rvp_outcome: "Popisuje rostliny." };
const ctx = { subject: "Prvouka", grade: "3. ročník" };

function deps(over: Partial<GenerationDeps> = {}): GenerationDeps {
  return {
    invoke: vi.fn(async (name) =>
      name === "formulate-goal"
        ? { data: { goals: [{ teacher: "Cíl", pupil: "Dnes se učím" }] }, error: null }
        : { data: { criteria: [{ teacher: "K1", pupil: "P1", scale: { J: "j", C: "c", T: "t", U: "u" }, svp_variants: [] }] }, error: null },
    ),
    saveGoal: vi.fn(async () => "g1"),
    saveCriteria: vi.fn(async () => {}),
    ...over,
  };
}

describe("generateLessonContent", () => {
  it("asks for the goal from the lesson, then criteria from the goal, and saves both", async () => {
    const d = deps();
    await generateLessonContent(lesson, ctx, d);
    expect(d.invoke).toHaveBeenNthCalledWith(1, "formulate-goal", {
      body: { context: "Části rostliny — Pozorujeme rostlinu.", rvpOutcome: "Popisuje rostliny.", subject: "Prvouka", grade: "3. ročník" },
    });
    expect(d.saveGoal).toHaveBeenCalledWith("l1", { teacher: "Cíl", pupil: "Dnes se učím" });
    expect(d.invoke).toHaveBeenNthCalledWith(2, "generate-criteria", { body: { goal: "Cíl", subject: "Prvouka", grade: "3. ročník" } });
    expect(d.saveCriteria).toHaveBeenCalledWith("g1", [
      { teacher: "K1", pupil: "P1", scale: { J: "j", C: "c", T: "t", U: "u" }, svp_variants: [] },
    ]);
  });

  it("stops and reports when the model fails", async () => {
    const d = deps({ invoke: vi.fn(async () => ({ data: null, error: new Error("Přetíženo") })) });
    await expect(generateLessonContent(lesson, ctx, d)).rejects.toThrow("Přetíženo");
    expect(d.saveGoal).not.toHaveBeenCalled();
  });
});

describe("runQueue", () => {
  it("reports each item and carries on past a failure", async () => {
    const log: string[] = [];
    await runQueue(
      [{ id: "a" }, { id: "b" }, { id: "c" }],
      async (i) => {
        if (i.id === "b") throw new Error("x");
      },
      (id, status) => log.push(`${id}:${status}`),
      1,
    );
    expect(log).toEqual(["a:waiting", "b:waiting", "c:waiting", "a:running", "a:done", "b:running", "b:error", "c:running", "c:done"]);
  });
});
