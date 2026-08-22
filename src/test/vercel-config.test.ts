import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import Ajv from "ajv";
import { headersSchema, rewritesSchema, sourceToRegex } from "@vercel/routing-utils";

/**
 * vercel.json is validated against Vercel's own schema, exported by the same
 * package its build uses.
 *
 * An invalid file is not caught by any other check here — the build passes
 * locally and the deployment fails afterwards, which is how documentation
 * comments added to the rewrite and header entries once broke production.
 * The schema sets additionalProperties: false, so JSON that carries anything
 * beyond the documented keys is rejected outright.
 */
const config = JSON.parse(readFileSync("vercel.json", "utf8"));

describe("vercel.json", () => {
  const ajv = new Ajv({ allErrors: true });

  it.each([
    ["rewrites", rewritesSchema],
    ["headers", headersSchema],
  ])("has a valid %s section", (key, schema) => {
    const validate = ajv.compile(schema as object);
    const valid = validate(config[key as string]);
    expect(validate.errors ?? [], JSON.stringify(validate.errors)).toEqual([]);
    expect(valid).toBe(true);
  });

  it("builds the app the repository actually produces", () => {
    expect(config.buildCommand).toBe("npm run build");
    expect(config.outputDirectory).toBe("dist");
  });
});

describe("the single-page rewrite", () => {
  const pattern = new RegExp(sourceToRegex(config.rewrites[0].source).src);

  it.each(["/", "/lessons", "/courses", "/student-profiles", "/goals/abc/edit"])(
    "sends %s to index.html so React Router can route it",
    (path) => expect(pattern.test(path)).toBe(true),
  );

  it.each([
    "/api/formulate-goal",
    "/api/generate-evaluation",
    "/api/extract-names",
  ])("leaves %s alone so it reaches the function", (path) =>
    expect(pattern.test(path)).toBe(false),
  );
});
