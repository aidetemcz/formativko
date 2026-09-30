import { structuredCompletion } from "./openai.js";
import { REVIEW_SCHEMA, reviewPrompt, type ReviewInput, type ReviewOutput } from "./prompts.js";
import { findStyleIssues, type StyleIssue } from "./style-guide.js";

export interface Review extends ReviewOutput {
  /** Mechanical hits of the language rules, beside the Rádce's own reading. */
  style_issues: StyleIssue[];
}

/** The Rádce's comments, capped at the four the prompt allows. */
export async function runReview(input: ReviewInput): Promise<Review> {
  const { system, user } = reviewPrompt(input);
  const result = await structuredCompletion<ReviewOutput>({ system, user, schema: REVIEW_SCHEMA, temperature: 0.2 });
  return {
    comments: (result.comments ?? []).filter(Boolean).slice(0, 4),
    went_well: (result.went_well ?? []).filter(Boolean),
    offers: (result.offers ?? []).filter(Boolean).slice(0, 5),
    style_issues: findStyleIssues(input.text),
  };
}
