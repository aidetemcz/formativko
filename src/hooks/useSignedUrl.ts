import { useQuery } from "@tanstack/react-query";
import {
  createSignedUrl,
  SIGNED_URL_TTL_SECONDS,
  type StorageBucket,
} from "@/lib/storage";

/**
 * Resolve a stored file reference into a signed URL usable in `src`/`href`.
 *
 * Signed URLs expire, so the query is refreshed a few minutes before the TTL
 * runs out — a tab left open on a proof detail keeps a working image.
 */
export function useSignedUrl(
  bucket: StorageBucket,
  stored: string | null | undefined,
) {
  return useQuery({
    queryKey: ["signed-url", bucket, stored],
    queryFn: () => createSignedUrl(bucket, stored),
    enabled: !!stored,
    staleTime: (SIGNED_URL_TTL_SECONDS - 5 * 60) * 1000,
    gcTime: SIGNED_URL_TTL_SECONDS * 1000,
    refetchInterval: (SIGNED_URL_TTL_SECONDS - 5 * 60) * 1000,
  });
}
