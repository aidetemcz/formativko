import { describe, expect, it } from "vitest";
import { isOwnSignedStorageUrl } from "./storage-url.js";

const BASE = "https://abc.supabase.co";

describe("isOwnSignedStorageUrl", () => {
  it("accepts a signed URL for the course-files bucket", () => {
    expect(
      isOwnSignedStorageUrl(`${BASE}/storage/v1/object/sign/course-files/u1/plan.pdf?token=x`, BASE),
    ).toBe(true);
  });

  it.each([
    "https://evil.example/storage/v1/object/sign/course-files/a.pdf?token=x",
    `${BASE}/storage/v1/object/sign/proof-files/a.jpg?token=x`,
    `${BASE}/storage/v1/object/public/course-files/a.pdf`,
    `${BASE}/storage/v1/object/sign/course-files/a.pdf`,
    "http://abc.supabase.co/storage/v1/object/sign/course-files/a.pdf?token=x",
    "http://169.254.169.254/latest/meta-data",
    "not a url",
    42,
  ])("rejects %s", (value) => {
    expect(isOwnSignedStorageUrl(value, BASE)).toBe(false);
  });
});
