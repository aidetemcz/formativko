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

export async function structuredCompletion<T>({
  system,
  user,
  schema,
  model = AI_MODEL,
  temperature = 0.4,
}: {
  system: string;
  user: string;
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
