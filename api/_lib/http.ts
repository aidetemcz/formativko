import { createClient, type User } from "@supabase/supabase-js";
import { AiError } from "./openai.js";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export class BadRequest extends Error {}

/** The signed-in teacher, or a thrown 401. */
export async function requireUser(req: Request): Promise<User> {
  const header = req.headers.get("authorization");
  if (!header) throw new AiError("Unauthorized", 401);
  const anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const { data, error } = await anon.auth.getUser(header.replace("Bearer ", ""));
  if (error || !data.user) throw new AiError("Unauthorized", 401);
  return data.user;
}

/** Turn anything thrown in a handler into the JSON error the client reads. */
export function errorResponse(e: unknown, endpoint: string): Response {
  console.error(`${endpoint} error:`, e);
  if (e instanceof BadRequest) return json({ error: e.message }, 400);
  if (e instanceof AiError) return json({ error: e.message }, e.status);
  return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
}

/** A trimmed, length-limited string field, or "" when absent. */
export function field(value: unknown, max = 2000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
