import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Adapts a Web-standard `(Request) => Response` handler to Vercel's Node
 * signature.
 *
 * These handlers were written for Supabase Edge Functions, which run on Deno
 * and speak the Web platform's Request/Response directly. Keeping that shape
 * means the migration to Vercel touched only the entry point — every prompt,
 * OpenAI call and parsing rule inside a handler is byte-identical to the
 * version that was already running in production.
 *
 * Node 18+ provides Request/Response/Headers globally, so no polyfill is
 * needed.
 */
/**
 * Recover the request body in a form `new Request()` accepts.
 *
 * Vercel parses the body according to Content-Type before a handler runs: JSON
 * arrives as an object, text as a string, and anything else — multipart uploads
 * included — as a Buffer. A Buffer must be passed through untouched, since
 * re-encoding it would destroy the multipart boundaries that
 * `request.formData()` relies on. When the parser produced nothing, the raw
 * stream is read instead.
 */
async function readBody(req: VercelRequest): Promise<Uint8Array | string | undefined> {
  if (Buffer.isBuffer(req.body)) return new Uint8Array(req.body);
  if (typeof req.body === "string") return req.body;
  if (req.body !== undefined && req.body !== null) return JSON.stringify(req.body);

  // The parser produced nothing. Fall back to the raw stream, tolerating a
  // request object that cannot be iterated at all.
  if (typeof (req as AsyncIterable<unknown>)[Symbol.asyncIterator] !== "function") {
    return undefined;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return chunks.length > 0 ? new Uint8Array(Buffer.concat(chunks)) : undefined;
}

export function webHandler(fn: (req: Request) => Promise<Response>) {
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    // OPTIONS is a CORS preflight and HEAD/GET carry no body; reading one would
    // only stall on a stream that never produces data.
    const hasBody =
      req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS";
    const body = hasBody ? await readBody(req) : undefined;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      // Node collapses repeated headers into an array.
      for (const one of Array.isArray(value) ? value : [value]) {
        headers.append(key, one);
      }
    }

    const host = req.headers.host ?? "localhost";
    const request = new Request(`https://${host}${req.url ?? "/"}`, {
      method: req.method ?? "GET",
      headers,
      // A Uint8Array is a valid body at runtime; the cast only bridges the DOM
      // and Node typings, which disagree on ArrayBuffer variance.
      body: body as BodyInit | undefined,
    });

    let response: Response;
    try {
      response = await fn(request);
    } catch (error) {
      // A handler that throws outside its own try/catch must still produce a
      // JSON body — the client always reads `data.error`.
      console.error("Unhandled error in API handler:", error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.status(response.status);

    // A streamed answer (TinyBuddy) is passed on chunk by chunk.
    if (response.body && (response.headers.get("content-type") ?? "").startsWith("application/x-ndjson")) {
      const reader = response.body.getReader();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
      return;
    }

    const text = await response.text();
    if (text) res.send(text);
    else res.end();
  };
}
