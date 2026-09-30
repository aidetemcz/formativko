import { supabase } from "@/integrations/supabase/client";

/** The AI endpoints, served as Vercel functions from /api. */
export type AiFunction =
  | "extract-names"
  | "formulate-goal"
  | "check-evaluation"
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

/**
 * Explain a failure the handler never got to report itself.
 *
 * When a function crashes before its own error handling runs — a module that
 * fails to load, a timeout, an exhausted plan limit — the response is the
 * platform's HTML error page and carries no JSON body. Vercel names the cause
 * in the `x-vercel-error` header, which is far more use than a bare status
 * code both to a teacher and to whoever reads the report.
 */
export function describeTransportError(status: number, vercelError: string | null): string {
  switch (vercelError) {
    case "FUNCTION_INVOCATION_FAILED":
      return "Funkce se nepodařilo spustit. Podrobnosti jsou v logu na Vercelu.";
    case "FUNCTION_INVOCATION_TIMEOUT":
    case "EDGE_FUNCTION_INVOCATION_TIMEOUT":
      return "Odpověď trvala příliš dlouho a byla přerušena. Zkuste to prosím znovu.";
    case "FUNCTION_PAYLOAD_TOO_LARGE":
      return "Odesílaná data jsou příliš velká.";
    case "FUNCTION_THROTTLED":
    case "TOO_MANY_REQUESTS":
      return "Příliš mnoho požadavků najednou. Zkuste to prosím za chvíli.";
    case "NOT_FOUND":
    case "DEPLOYMENT_NOT_FOUND":
      return "Funkce nebyla nalezena. Zřejmě ještě neproběhlo nasazení.";
  }

  if (status === 504) return "Odpověď trvala příliš dlouho. Zkuste to prosím znovu.";
  if (status === 401 || status === 403) return "Přihlášení vypršelo. Přihlaste se prosím znovu.";
  // Surface the raw code when there is one — an unknown label still names the
  // problem better than the status alone.
  return vercelError
    ? `Chyba serveru (${status}, ${vercelError}).`
    : `Chyba serveru (${status}).`;
}

async function send<T>(name: AiFunction, init: RequestInit): Promise<AiResult<T>> {
  try {
    const response = await fetch(`/api/${name}`, {
      ...init,
      method: "POST",
      headers: { ...init.headers, Authorization: await authorization() },
    });

    // Read as text first: a handler reports failures as JSON, but a function
    // that never ran returns an HTML page that would break response.json().
    const raw = await response.text();
    let payload: (T & { error?: string }) | null = null;
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message =
        payload?.error ||
        describeTransportError(response.status, response.headers.get("x-vercel-error"));
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
