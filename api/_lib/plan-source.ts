import type { ContentPart } from "./openai.js";
import { BadRequest } from "./http.js";
import { isOwnSignedStorageUrl } from "./storage-url.js";

export function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK) {
    parts.push(String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK))));
  }
  return btoa(parts.join(""));
}

/** Largest plan file the endpoint will pass on to the model. */
export const MAX_PLAN_BYTES = 15 * 1024 * 1024;

/**
 * The plan as message parts for the model: pasted text as text, an uploaded
 * PDF as a file and a photo as an image. Files are read only from a signed URL
 * of the teacher's own course-files folder.
 */
export async function planSourceParts(text: string, fileUrl: string): Promise<ContentPart[]> {
  if (text) return [{ type: "text", text: `Tematický plán:\n${text.slice(0, 50_000)}` }];
  if (!fileUrl) throw new BadRequest("Vložte text plánu, nebo nahrajte soubor.");
  if (!isOwnSignedStorageUrl(fileUrl, process.env.SUPABASE_URL)) {
    throw new BadRequest("Neplatný odkaz na soubor s plánem.");
  }

  const response = await fetch(fileUrl, { redirect: "error" });
  if (!response.ok) throw new Error("Failed to fetch thematic plan file");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > MAX_PLAN_BYTES) throw new BadRequest("Soubor je příliš velký (nejvýš 15 MB).");
  const mime = (response.headers.get("content-type") || "").split(";")[0].trim();

  if (mime === "application/pdf") {
    return [{ type: "file", file: { filename: "tematicky-plan.pdf", file_data: `data:application/pdf;base64,${bytesToBase64(bytes)}` } }];
  }
  if (mime.startsWith("image/")) {
    return [{ type: "image_url", image_url: { url: `data:${mime};base64,${bytesToBase64(bytes)}` } }];
  }
  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  return [{ type: "text", text: `Tematický plán:\n${decoded.slice(0, 50_000)}` }];
}
