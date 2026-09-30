import { KNOWLEDGE, type KnowledgeFile } from "./knowledge.generated.js";

/** A methodology file from metodologie/, as embedded at build time. */
export function knowledge(file: KnowledgeFile): string {
  return KNOWLEDGE[file];
}

/**
 * One chapter of a methodology file: from the heading that starts with
 * `heading` to the next heading of the same or a higher level.
 */
export function knowledgeSection(file: KnowledgeFile, heading: string): string {
  const lines = KNOWLEDGE[file].split("\n");
  const start = lines.findIndex((l) => /^#+\s/.test(l) && l.replace(/^#+\s*/, "").startsWith(heading));
  if (start < 0) throw new Error(`Section "${heading}" not found in ${file}`);
  const level = lines[start].match(/^#+/)![0].length;
  const end = lines.findIndex((l, i) => i > start && /^#+\s/.test(l) && l.match(/^#+/)![0].length <= level);
  return lines.slice(start, end < 0 ? undefined : end).join("\n").trim();
}

/** Knowledge attached to a system prompt, each file under its own heading. */
export function knowledgeBlock(parts: { title: string; text: string }[]): string {
  return [
    "# Podklady",
    "Následující texty jsou závazné podklady metodiky. Řiď se jimi.",
    ...parts.map((p) => `\n## Podklad: ${p.title}\n\n${p.text}`),
  ].join("\n");
}
