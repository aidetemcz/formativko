/**
 * The methodology prompts against the real model, on the samples from
 * metodologie/. Skipped unless both are set:
 *   OPENAI_API_KEY=… RUN_LIVE_AI=1 npx vitest run api/_lib/methodology.live.test.ts
 * It costs a few cents; run it after changing a prompt.
 */
import { describe, expect, it } from "vitest";
import { structuredCompletion } from "./openai.js";
import {
  CRITERIA_SCHEMA,
  GOAL_SCHEMA,
  criteriaPrompt,
  goalPrompt,
  type CriteriaOutput,
  type GoalOutput,
} from "./prompts.js";
import { runReview } from "./review.js";
import { findStyleIssues } from "./style-guide.js";
import { SAMPLE_CRITERIA_INPUT, SAMPLE_FLAWED_EVALUATION, SAMPLE_GOAL_INPUT, SAMPLE_GOOD_EVALUATION } from "./methodology-samples.js";

const live = process.env.RUN_LIVE_AI === "1" && !!process.env.OPENAI_API_KEY;

describe.skipIf(!live)("methodology prompts on the live model", () => {
  it("01 · formulates three goals, each with a pupil version", async () => {
    const out = await structuredCompletion<GoalOutput>({ ...goalPrompt(SAMPLE_GOAL_INPUT), schema: GOAL_SCHEMA });
    expect(out.goals.length).toBeGreaterThanOrEqual(3);
    for (const g of out.goals) {
      expect(g.pupil).toMatch(/^Dnes se učím/);
      expect(findStyleIssues(g.teacher + " " + g.pupil)).toEqual([]);
    }
  }, 60_000);

  it("02 + 03 · writes three criteria with a four-step scale, without 'umím'", async () => {
    const out = await structuredCompletion<CriteriaOutput>({ ...criteriaPrompt(SAMPLE_CRITERIA_INPUT), schema: CRITERIA_SCHEMA });
    expect(out.criteria).toHaveLength(3);
    for (const c of out.criteria) {
      expect(Object.keys(c.scale).sort()).toEqual(["C", "J", "T", "U"]);
      const pupilText = [c.pupil, ...Object.values(c.scale)].join(" ");
      expect(findStyleIssues(pupilText)).toEqual([]);
    }
  }, 60_000);

  it("05 · has little to say about the methodology's own sample", async () => {
    const review = await runReview({ text: SAMPLE_GOOD_EVALUATION, grade: "2. ročník", mode: "feedback" });
    expect(review.comments.length).toBeLessThanOrEqual(2);
  }, 60_000);

  it("05 · comments on a text that breaks the rules, without rewriting it", async () => {
    const review = await runReview({ text: SAMPLE_FLAWED_EVALUATION, grade: "3. ročník", mode: "certificate" });
    expect(review.comments.length).toBeGreaterThan(0);
    expect(review.comments.length).toBeLessThanOrEqual(4);
    expect(review.style_issues.length).toBeGreaterThan(0);
  }, 60_000);
});
