import { supabase } from "@/integrations/supabase/client";

/**
 * Storage buckets hold student evidence (photos of pupils' work) and course
 * material. They are private: files are reachable only through short-lived
 * signed URLs minted for an authenticated teacher.
 *
 * The `file_url` / `thematic_plan_file_url` columns store an object PATH, not a
 * URL. Rows written before the buckets were made private still hold a full
 * public URL, so every read goes through `toStoragePath` first.
 */
export type StorageBucket = "proof-files" | "course-files";

/** How long a minted signed URL stays valid. */
export const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** Short-lived URL handed to an edge function, which fetches it server-side. */
export const EDGE_FUNCTION_URL_TTL_SECONDS = 5 * 60;

/** A percent-escape proper: '%' followed by two hex digits. */
const PERCENT_ESCAPE = /%[0-9A-Fa-f]{2}/;

/**
 * Undo percent-encoding, but only where it is unambiguously present.
 *
 * A literal '%' in an object name (say "50%.jpg") is not an escape sequence
 * and must survive untouched, so the pattern is checked before decoding and a
 * malformed sequence falls back to the original value.
 */
function decodeObjectName(value: string): string {
  if (!PERCENT_ESCAPE.test(value)) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Normalise a stored value to a bucket-relative object path.
 *
 * Accepts a plain path (what we write now), a legacy public URL, or a signed
 * URL, so old rows keep working without a backfill.
 */
export function toStoragePath(
  stored: string | null | undefined,
  bucket: StorageBucket,
): string | null {
  if (!stored) return null;

  for (const marker of [
    `/storage/v1/object/public/${bucket}/`,
    `/storage/v1/object/sign/${bucket}/`,
  ]) {
    const at = stored.indexOf(marker);
    if (at !== -1) {
      // signed URLs carry a ?token=... query string — strip it
      const tail = stored.slice(at + marker.length).split("?")[0];
      return decodeObjectName(tail);
    }
  }

  // Not a URL. Rows rewritten by the private-buckets migration hold the raw
  // fragment sliced out of a public URL, so they can still carry escapes;
  // paths we generate ourselves are UUID-based and never do.
  return decodeObjectName(stored);
}

/**
 * Object path for a newly uploaded file.
 *
 * The leading `<teacher id>/` segment is what the bucket's delete policy
 * matches on, so a teacher can remove their own uploads and nobody else's.
 */
export function buildUploadPath(userId: string, fileName: string): string {
  const ext = fileName.split(".").pop();
  const suffix = ext && ext !== fileName ? `.${ext}` : "";
  return `${userId}/${crypto.randomUUID()}${suffix}`;
}

/** Mint a signed URL for a stored path (or legacy URL). Null if unavailable. */
export async function createSignedUrl(
  bucket: StorageBucket,
  stored: string | null | undefined,
  expiresIn: number = SIGNED_URL_TTL_SECONDS,
): Promise<string | null> {
  const path = toStoragePath(stored, bucket);
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error(`Nepodařilo se vytvořit odkaz na soubor (${bucket}/${path}):`, error);
    return null;
  }
  return data?.signedUrl ?? null;
}
