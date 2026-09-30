/**
 * The plan endpoints download a thematic plan from a URL the browser sends.
 * Letting a caller name any URL would make the server fetch arbitrary
 * addresses (internal services included), so only a signed URL for this
 * project's own `course-files` bucket is accepted — the one the browser mints
 * with `createSignedUrl`. The signature is what authorises the read; this
 * check only pins down where the request may go.
 */
export function isOwnSignedStorageUrl(value: unknown, supabaseUrl: string | undefined): boolean {
  if (typeof value !== "string" || !supabaseUrl) return false;
  let url: URL;
  let base: URL;
  try {
    url = new URL(value);
    base = new URL(supabaseUrl);
  } catch {
    return false;
  }
  return (
    url.protocol === "https:" &&
    url.origin === base.origin &&
    url.pathname.startsWith("/storage/v1/object/sign/course-files/") &&
    url.searchParams.has("token")
  );
}
