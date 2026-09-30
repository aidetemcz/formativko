/**
 * One structured call to OpenAI: a system prompt, a user message and a JSON
 * schema the answer must follow (zadání kap. 2.1: never free text to parse).
 */
export const AI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

export class AiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export interface JsonSchema {
  name: string;
  schema: Record<string, unknown>;
}

/** A part of a user message: text, an image, or a PDF (as a data URL). */
export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

export async function structuredCompletion<T>({
  system,
  user,
  schema,
  model = AI_MODEL,
  temperature = 0.4,
}: {
  system: string;
  user: string | ContentPart[];
  schema: JsonSchema;
  model?: string;
  temperature?: number;
}): Promise<T> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new AiError("OPENAI_API_KEY is not configured", 500);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_schema", json_schema: { ...schema, strict: true } },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new AiError("Příliš mnoho požadavků, zkuste to znovu za chvíli.", 429);
    if (response.status === 402) throw new AiError("Nedostatek kreditů pro AI generování.", 402);
    console.error("AI error:", response.status, await response.text());
    throw new AiError("AI gateway error", 502);
  }

  const result = await response.json();
  const message = result.choices?.[0]?.message;
  if (message?.refusal) throw new AiError("Model odpověď odmítl.", 502);
  try {
    return JSON.parse(message?.content ?? "") as T;
  } catch {
    throw new AiError("AI returned invalid JSON", 502);
  }
}

/** Shorthand for an object schema in strict mode: every property required. */
export function objectSchema(properties: Record<string, unknown>): Record<string, unknown> {
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}

export const stringSchema = { type: "string" } as const;
export const stringArraySchema = { type: "array", items: { type: "string" } } as const;

// ─── Chat with tools (TinyBuddy) ─────────────────────────────────────────────

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[] }
  | { role: "tool"; tool_call_id: string; content: string };

export interface ToolDefinition {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown>; strict?: boolean };
}

/**
 * One streamed round of a chat with tools. Text arrives through `onText` as it
 * is written; tool calls are collected and returned for the caller to run.
 */
export async function chatRound({
  messages,
  tools,
  onText,
  model = AI_MODEL,
  temperature = 0.5,
}: {
  messages: ChatMessage[];
  tools: ToolDefinition[];
  onText: (delta: string) => void;
  model?: string;
  temperature?: number;
}): Promise<{ text: string; toolCalls: ToolCall[] }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new AiError("OPENAI_API_KEY is not configured", 500);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, temperature, messages, tools, stream: true, parallel_tool_calls: true }),
  });
  if (!response.ok || !response.body) {
    if (response.status === 429) throw new AiError("Příliš mnoho požadavků, zkuste to znovu za chvíli.", 429);
    console.error("AI error:", response.status, await response.text().catch(() => ""));
    throw new AiError("AI gateway error", 502);
  }

  let text = "";
  const calls: ToolCall[] = [];
  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const data = line.trim().replace(/^data:\s*/, "");
      if (!data || data === "[DONE]" || !line.trim().startsWith("data:")) continue;
      let chunk;
      try {
        chunk = JSON.parse(data);
      } catch {
        continue;
      }
      const delta = chunk.choices?.[0]?.delta;
      if (!delta) continue;
      if (delta.content) {
        text += delta.content;
        onText(delta.content);
      }
      for (const tc of delta.tool_calls ?? []) {
        const call = (calls[tc.index] ??= { id: "", name: "", arguments: "" });
        if (tc.id) call.id = tc.id;
        if (tc.function?.name) call.name += tc.function.name;
        if (tc.function?.arguments) call.arguments += tc.function.arguments;
      }
    }
  }
  return { text, toolCalls: calls.filter(Boolean) };
}
