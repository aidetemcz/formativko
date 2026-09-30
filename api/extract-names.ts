import { webHandler } from "./_lib/handler.js";
import { BadRequest, errorResponse, json, requireUser } from "./_lib/http.js";
import { objectSchema, stringSchema, structuredCompletion, type ContentPart } from "./_lib/openai.js";
import { bytesToBase64, MAX_PLAN_BYTES } from "./_lib/plan-source.js";

/**
 * Names of pupils from a class list the teacher uploads (photo, PDF or text),
 * for importing a class (zadání kap. 4.4).
 *
 * The list itself is names, so this is the one call that sends real names to
 * the model: it is the teacher's own upload, read once and not stored.
 *
 * A PDF used to be sent as an image, which the model rejects, and a larger
 * file overflowed the base64 conversion. PDFs now go as files, the conversion
 * is chunked, and the answer follows a schema instead of being fished out of
 * free text.
 */
export const config = { maxDuration: 60 };

const NAMES_SCHEMA = {
  name: "jmena_zaku",
  schema: objectSchema({
    names: { type: "array", items: objectSchema({ first: stringSchema, last: stringSchema }) },
  }),
};

const PROMPT = `Najdi v přiloženém seznamu třídy jména žáků.
- first je křestní jméno, last příjmení. Pokud je uvedeno příjmení první („Novák Jan“), prohoď je.
- Jméno bez příjmení dej do first a last nech prázdné.
- Vynech nadpisy, jména učitelů, čísla, data a další údaje.
- Pokud žádná jména nenajdeš, vrať prázdný seznam.`;

export async function fileParts(file: File): Promise<ContentPart[]> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length > MAX_PLAN_BYTES) throw new BadRequest("Soubor je příliš velký (nejvýš 15 MB).");
  const type = file.type || "application/octet-stream";
  if (type === "application/pdf") {
    return [{ type: "file", file: { filename: file.name || "seznam.pdf", file_data: `data:application/pdf;base64,${bytesToBase64(bytes)}` } }];
  }
  if (type.startsWith("image/")) {
    return [{ type: "image_url", image_url: { url: `data:${type};base64,${bytesToBase64(bytes)}` } }];
  }
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  return [{ type: "text", text: text.slice(0, 50_000) }];
}

export default webHandler(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return json(null);
  try {
    await requireUser(req);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new BadRequest("Chybí soubor se seznamem žáků.");

    const result = await structuredCompletion<{ names: { first: string; last: string }[] }>({
      system: PROMPT,
      user: [{ type: "text", text: "Seznam třídy:" }, ...(await fileParts(file))],
      schema: NAMES_SCHEMA,
      temperature: 0,
    });
    const names = (result.names ?? [])
      .map((n) => ({ first: (n.first ?? "").trim(), last: (n.last ?? "").trim() }))
      .filter((n) => n.first || n.last)
      .slice(0, 200);
    return json({ names });
  } catch (e) {
    return errorResponse(e, "extract-names");
  }
});
