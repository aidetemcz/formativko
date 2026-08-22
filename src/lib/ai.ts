import { supabase } from "@/integrations/supabase/client";

/** The AI endpoints, served as Vercel functions from /api. */
export type AiFunction =
  | "extract-names"
  | "formulate-goal"
  | "generate-criteria"
  | "generate-evaluation"
  | "generate-goals"
  | "generate-goals-from-plan"
  | "generate-lessons-from-plan";

/**
 * Result shape of `supabase.functions.invoke`, kept deliberately: the AI
 * endpoints moved from Supabase Edge Functions to Vercel, and mirroring the
 * old shape means every call site keeps its `const { data, error } = ...`
 * followed by a `data?.error` check.
 */
export interface AiResult<T> {
  data: T | null;
  error: Error | null;
}

async function authorization(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Nejste přihlášeni.");
  return `Bearer ${token}`;
}

async function send<T>(name: AiFunction, init: RequestInit): Promise<AiResult<T>> {
  try {
    const response = await fetch(`/api/${name}`, {
      ...init,
      method: "POST",
      headers: { ...init.headers, Authorization: await authorization() },
    });

    // Handlers report failures as a JSON body, but a function that times out or
    // crashes hard returns the platform's own HTML error page.
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        payload?.error ||
        (response.status === 504
          ? "Odpověď trvala příliš dlouho. Zkuste to prosím znovu."
          : `Chyba serveru (${response.status}).`);
      return { data: null, error: new Error(message) };
    }

    return { data: payload as T, error: null };
  } catch (cause) {
    return {
      data: null,
      error: cause instanceof Error ? cause : new Error("Neznámá chyba"),
    };
  }
}

/**
 * Call an AI endpoint with a JSON body.
 *
 * Takes `{ body }` rather than the body directly so that call sites read
 * exactly as they did under `supabase.functions.invoke`.
 */
// Defaults to `any` to match what supabase.functions.invoke returned, so the
// call sites did not have to change when these endpoints moved to Vercel.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function invokeAi<T = any>(
  name: AiFunction,
  options: { body: Record<string, unknown> },
): Promise<AiResult<T>> {
  return send<T>(name, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options.body),
  });
}

/**
 * Call an AI endpoint with multipart form data. Content-Type is left unset so
 * the browser adds it together with the multipart boundary.
 */
// Defaults to `any` for the same reason as invokeAi.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function invokeAiWithForm<T = any>(
  name: AiFunction,
  form: FormData,
): Promise<AiResult<T>> {
  return send<T>(name, { body: form });
}
