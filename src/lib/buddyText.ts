/**
 * Buddy's answers use a little Markdown: paragraphs, "-" and "1." lists,
 * **bold** and ### headings. This turns it into blocks the chat renders
 * without an HTML parser (and without dangerouslySetInnerHTML).
 */
export type TextBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ul" | "ol"; items: string[] };

export function textBlocks(source: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ type: "p", text: paragraph.join(" ") });
    paragraph = [];
  };
  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (heading) {
      flush();
      blocks.push({ type: "h", text: heading[1] });
    } else if (bullet || numbered) {
      flush();
      const type = bullet ? "ul" : "ol";
      const item = (bullet ?? numbered)![1];
      const last = blocks[blocks.length - 1];
      if (last && last.type === type) last.items.push(item);
      else blocks.push({ type, items: [item] });
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

/** Split a line on **bold** marks: odd parts are bold. */
export function boldParts(text: string): string[] {
  return text.split(/\*\*(.+?)\*\*/g);
}
