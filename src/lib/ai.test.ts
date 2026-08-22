import { describe, expect, it } from "vitest";
import { describeTransportError } from "./ai";

describe("describeTransportError", () => {
  it("names a function that failed to start", () => {
    // The case that actually happened: a module-load failure returns Vercel's
    // HTML page, so the handler's own JSON error never reaches the client.
    expect(describeTransportError(500, "FUNCTION_INVOCATION_FAILED")).toContain("logu na Vercelu");
  });

  it.each(["FUNCTION_INVOCATION_TIMEOUT", "EDGE_FUNCTION_INVOCATION_TIMEOUT"])(
    "explains %s as a timeout worth retrying",
    (code) => expect(describeTransportError(500, code)).toContain("znovu"),
  );

  it("treats a 504 without a header as a timeout", () => {
    expect(describeTransportError(504, null)).toContain("příliš dlouho");
  });

  it("tells a teacher to sign in again on 401", () => {
    expect(describeTransportError(401, null)).toContain("Přihlášení vypršelo");
  });

  it("keeps an unrecognised code in the message rather than dropping it", () => {
    const message = describeTransportError(500, "SOME_NEW_CODE");
    expect(message).toContain("SOME_NEW_CODE");
    expect(message).toContain("500");
  });

  it("falls back to the status alone when there is no code", () => {
    expect(describeTransportError(502, null)).toBe("Chyba serveru (502).");
  });
});
