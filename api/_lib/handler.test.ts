import { describe, expect, it, vi } from "vitest";
import { webHandler } from "./handler";

/** Minimal stand-in for the VercelResponse surface the adapter touches. */
function fakeRes() {
  const res = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: undefined as string | undefined,
    ended: false,
    setHeader(k: string, v: string) {
      res.headers[k.toLowerCase()] = v;
      return res;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    send(text: string) {
      res.body = text;
      res.ended = true;
      return res;
    },
    json(value: unknown) {
      res.body = JSON.stringify(value);
      res.ended = true;
      return res;
    },
    end() {
      res.ended = true;
      return res;
    },
  };
  return res;
}

function fakeReq(over: Record<string, unknown> = {}) {
  return {
    method: "POST",
    url: "/api/thing",
    headers: { host: "example.test", "content-type": "application/json" },
    body: { hello: "world" },
    ...over,
  };
}

describe("webHandler", () => {
  it("hands the handler a JSON body it can read back", async () => {
    const seen: unknown[] = [];
    const handler = webHandler(async (req) => {
      seen.push(await req.json());
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    const res = fakeRes();
    await handler(fakeReq() as never, res as never);

    expect(seen).toEqual([{ hello: "world" }]);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body!)).toEqual({ ok: true });
  });

  it("passes a binary body through untouched so multipart still parses", async () => {
    const raw = Buffer.from("--b\r\nContent-Disposition: form-data; name=\"a\"\r\n\r\n1\r\n--b--\r\n");
    let received: ArrayBuffer | undefined;
    const handler = webHandler(async (req) => {
      received = await req.arrayBuffer();
      return new Response(null, { status: 204 });
    });

    await handler(
      fakeReq({ body: raw, headers: { host: "h", "content-type": "multipart/form-data; boundary=b" } }) as never,
      fakeRes() as never,
    );

    expect(Buffer.from(received!).equals(raw)).toBe(true);
  });

  it("reads the raw stream when the body was not pre-parsed", async () => {
    async function* chunks() {
      yield Buffer.from('{"from":');
      yield Buffer.from('"stream"}');
    }
    let parsed: unknown;
    const handler = webHandler(async (req) => {
      parsed = await req.json();
      return new Response("{}", { status: 200 });
    });

    const req = { ...fakeReq({ body: undefined }), [Symbol.asyncIterator]: chunks };
    await handler(req as never, fakeRes() as never);

    expect(parsed).toEqual({ from: "stream" });
  });

  it("forwards status and headers, including CORS", async () => {
    const handler = webHandler(async () =>
      new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      }),
    );

    const res = fakeRes();
    await handler(fakeReq() as never, res as never);

    expect(res.statusCode).toBe(401);
    expect(res.headers["access-control-allow-origin"]).toBe("*");
    expect(JSON.parse(res.body!)).toEqual({ error: "Unauthorized" });
  });

  it("sends no body for a preflight response", async () => {
    const handler = webHandler(async () => new Response(null, { status: 200 }));
    const res = fakeRes();
    await handler(fakeReq({ method: "OPTIONS", body: undefined }) as never, res as never);

    expect(res.ended).toBe(true);
    expect(res.body).toBeUndefined();
  });

  it("turns an unexpected throw into JSON rather than an empty 500", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = webHandler(async () => {
      throw new Error("boom");
    });

    const res = fakeRes();
    await handler(fakeReq() as never, res as never);

    expect(res.statusCode).toBe(500);
    // The client always reads data.error, so a body must be present.
    expect(JSON.parse(res.body!)).toHaveProperty("error");
    spy.mockRestore();
  });
});
