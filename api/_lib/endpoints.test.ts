import { describe, expect, it } from "vitest";

const NAMES = [
  "check-evaluation", "extract-names", "formulate-goal", "generate-criteria", "generate-evaluation",
  "generate-goals", "generate-goals-from-plan", "generate-lessons-from-plan",
];

describe("every AI endpoint is a loadable Vercel function", () => {
  it.each(NAMES)("%s", async (name) => {
    const mod = await import(`../${name}.ts`);
    expect(typeof mod.default).toBe("function");
    // Vercel reads maxDuration from the exported config; these call OpenAI and
    // routinely need far more than the 10s default.
    expect(mod.config?.maxDuration).toBe(60);
  });

  it("matches the function names the client can call", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("src/lib/ai.ts", "utf8");
    for (const n of NAMES) expect(src).toContain(`"${n}"`);
  });
});
