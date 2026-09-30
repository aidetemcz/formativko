import { createClient } from "@supabase/supabase-js";
import { pseudonymize, type PseudonymPerson } from "../src/lib/pseudonym.js";
import {
  BUDDY_TOOLS,
  buddySystemPrompt,
  runTool,
  toolResultForModel,
  type BuddyContext,
  type Proposal,
  type SearchHit,
} from "./_lib/buddy.js";
import { webHandler } from "./_lib/handler.js";
import { BadRequest, corsHeaders, errorResponse, field, json, requireUser } from "./_lib/http.js";
import { chatRound, type ChatMessage } from "./_lib/openai.js";

/**
 * TinyBuddy's chat (zadání kap. 5.3): the answer streams back as NDJSON
 * events — `conversation`, `text` deltas, `tool` (what Buddy is doing),
 * `results` (search hits to click), `proposal` (a change to preview), then
 * `done` or `error`.
 *
 * The model sees pupils only by nickname. The browser pseudonymises the
 * teacher's message before sending it and puts the names back when it shows
 * the answer; this endpoint pseudonymises again as a safety net, and stores
 * the conversation pseudonymised.
 */
export const config = { maxDuration: 60 };

const MAX_ROUNDS = 5;
const HISTORY = 16;
const CONTEXT_KINDS = ["lesson", "plan", "class", "student"];

export default webHandler(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return json(null);
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: people } = await db.from("students").select("id, first_name, last_name, nickname").eq("teacher_id", user.id);
    const everyone = (people ?? []) as (PseudonymPerson & { id: string })[];
    const message = pseudonymize(field(body.message, 4000).trim(), everyone);
    if (!message) throw new BadRequest("Napište prosím dotaz.");

    // --- Conversation ---
    let conversationId = field(body.conversationId, 100) || null;
    let context: BuddyContext | null = null;
    if (conversationId) {
      const { data: conv } = await db
        .from("buddy_conversations")
        .select("id, context")
        .eq("id", conversationId)
        .eq("teacher_id", user.id)
        .maybeSingle();
      if (!conv) throw new BadRequest("Konverzace nenalezena.");
      context = (conv.context as BuddyContext)?.kind ? (conv.context as BuddyContext) : null;
    } else {
      const c = body.context;
      if (c && CONTEXT_KINDS.includes(c.kind) && typeof c.id === "string") {
        // A pupil's page goes to the model by nickname.
        const pupil = c.kind === "student" ? everyone.find((p) => p.id === c.id) : null;
        context = { kind: c.kind, id: c.id, label: pupil ? pupil.nickname : pseudonymize(field(c.label, 200), everyone) };
      }
      const { data: conv, error } = await db
        .from("buddy_conversations")
        .insert({ teacher_id: user.id, title: message.slice(0, 80), context: context ?? {} })
        .select("id")
        .single();
      if (error) throw error;
      conversationId = conv.id as string;
    }

    const { data: past } = await db
      .from("buddy_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: false })
      .limit(HISTORY);
    await db.from("buddy_messages").insert({ conversation_id: conversationId, role: "user", content: message });
    await db.from("buddy_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);

    const today = new Date();
    const messages: ChatMessage[] = [
      { role: "system", content: buddySystemPrompt(context, today) },
      ...((past ?? []).reverse().map((m) => ({ role: m.role, content: m.content })) as ChatMessage[]),
      { role: "user", content: message },
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: Record<string, unknown>) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        const results: SearchHit[] = [];
        const proposals: Proposal[] = [];
        let text = "";
        send({ type: "conversation", id: conversationId });
        try {
          for (let round = 0; round < MAX_ROUNDS; round++) {
            const answer = await chatRound({
              messages,
              tools: BUDDY_TOOLS,
              onText: (delta) => {
                text += delta;
                send({ type: "text", delta });
              },
            });
            if (answer.toolCalls.length === 0) break;
            messages.push({
              role: "assistant",
              content: answer.text || null,
              tool_calls: answer.toolCalls.map((c) => ({ id: c.id, type: "function", function: { name: c.name, arguments: c.arguments } })),
            });
            for (const call of answer.toolCalls) {
              send({ type: "tool", name: call.name });
              const result = await runTool(call.name, call.arguments, {
                db,
                teacherId: user.id,
                people: everyone,
                today,
                onResults: (hits) => {
                  const fresh = hits.filter((h) => !results.some((r) => r.kind === h.kind && r.id === h.id));
                  results.push(...fresh);
                  if (fresh.length) send({ type: "results", items: fresh });
                },
                onProposal: (p) => {
                  proposals.push(p);
                  send({ type: "proposal", proposal: p });
                },
              });
              messages.push({ role: "tool", tool_call_id: call.id, content: toolResultForModel(result, everyone) });
            }
          }
          const { data: saved } = await db
            .from("buddy_messages")
            .insert({
              conversation_id: conversationId,
              role: "assistant",
              content: text,
              data: { results, proposals },
            })
            .select("id")
            .single();
          send({ type: "done", messageId: saved?.id ?? null });
        } catch (e) {
          console.error("buddy-chat stream failed:", e);
          send({ type: "error", message: e instanceof Error && e.message ? e.message : "Buddy teď neodpovídá." });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache" } });
  } catch (e) {
    return errorResponse(e, "buddy-chat");
  }
});
