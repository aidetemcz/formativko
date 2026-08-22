import { describe, expect, it } from "vitest";
import { buildUploadPath, toStoragePath } from "./storage";

const UID = "11111111-2222-3333-4444-555555555555";

describe("toStoragePath", () => {
  it("passes a plain path through unchanged", () => {
    expect(toStoragePath(`${UID}/photo.jpg`, "proof-files")).toBe(`${UID}/photo.jpg`);
  });

  it("reduces a legacy public URL to its object path", () => {
    const url =
      "https://btqkjdyvwiojfcsjlifh.supabase.co/storage/v1/object/public/proof-files/abc.jpg";
    expect(toStoragePath(url, "proof-files")).toBe("abc.jpg");
  });

  it("keeps the folder segment of a legacy public URL", () => {
    const url = `https://x.supabase.co/storage/v1/object/public/proof-files/${UID}/abc.jpg`;
    expect(toStoragePath(url, "proof-files")).toBe(`${UID}/abc.jpg`);
  });

  it("strips the token from a signed URL", () => {
    const url =
      "https://x.supabase.co/storage/v1/object/sign/course-files/plan.pdf?token=eyJhbGci";
    expect(toStoragePath(url, "course-files")).toBe("plan.pdf");
  });

  it("decodes percent-encoded names", () => {
    const url =
      "https://x.supabase.co/storage/v1/object/public/course-files/pl%C3%A1n%20v2.pdf";
    expect(toStoragePath(url, "course-files")).toBe("plán v2.pdf");
  });

  it("does not match the other bucket's prefix", () => {
    const url = "https://x.supabase.co/storage/v1/object/public/course-files/plan.pdf";
    expect(toStoragePath(url, "proof-files")).toBe(url);
  });

  it("decodes a path left encoded by the private-buckets migration", () => {
    // The SQL rewrite slices the fragment straight out of the public URL, so
    // migrated rows arrive here still percent-encoded.
    expect(toStoragePath("uuid.Dikt%C3%A1t", "proof-files")).toBe("uuid.Diktát");
    expect(toStoragePath("uuid/pl%C3%A1n%20v2.pdf", "course-files")).toBe(
      "uuid/plán v2.pdf",
    );
  });

  it("leaves a literal percent sign alone", () => {
    expect(toStoragePath("sleva-50%.jpg", "proof-files")).toBe("sleva-50%.jpg");
  });

  it("survives a malformed escape without throwing", () => {
    expect(toStoragePath("odd-%zz-%E0%A4.jpg", "proof-files")).toBe(
      "odd-%zz-%E0%A4.jpg",
    );
  });

  it("returns null for empty values", () => {
    expect(toStoragePath(null, "proof-files")).toBeNull();
    expect(toStoragePath(undefined, "proof-files")).toBeNull();
    expect(toStoragePath("", "proof-files")).toBeNull();
  });
});

describe("buildUploadPath", () => {
  it("nests the file under the teacher's id so the delete policy matches", () => {
    expect(buildUploadPath(UID, "photo.jpg")).toMatch(
      new RegExp(`^${UID}/[0-9a-f-]{36}\\.jpg$`),
    );
  });

  it("keeps the original extension", () => {
    expect(buildUploadPath(UID, "plan.pdf").endsWith(".pdf")).toBe(true);
  });

  it("handles a name with no extension", () => {
    expect(buildUploadPath(UID, "scan")).toMatch(new RegExp(`^${UID}/[0-9a-f-]{36}$`));
  });

  it("does not leak the original filename into the path", () => {
    expect(buildUploadPath(UID, "Jan Novák - diktát.jpg")).not.toContain("Novák");
  });
});
