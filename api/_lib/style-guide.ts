import { PSEUDONYM_PROMPT_RULE } from "../../src/lib/pseudonym.js";

/**
 * Language rules shared by every AI prompt in the app (zadání kap. 2.1).
 * Drawn from prompts 02, 04 and 05 in metodologie/prompty and from
 * "Vysvědčení JINAK" (Jana Kratochvílová, PdF MU).
 */
export const STYLE_GUIDE = `# Jazykové zásady (platí vždy a mají přednost před ostatními pokyny)

1. Piš popisně. Popisuj, co žák dělá a jaký je výsledek jeho práce. Nehodnoť osobnost („jsi snaživý“, „je nepozorná“) a nevynášej obecné soudy bez opory v konkrétní činnosti.
2. Nepoužívej slova „umíš“, „umím“, „dokážeš“, „dokáže“, „zvládáš“, „nezvládáš“. Nahraď je popisem konkrétní činnosti („vyřešíš správně“, „popíšeš“, „píšeš bez chyb“).
3. Neuzavírej cestu k pokroku. Místo „nezvládl“, „neumí“ piš „ještě se ti nedaří“, „zatím potřebuješ více času“, „s pomocí už…“.
4. Nepiš emoce učitele („mám radost“, „líbí se mi“, „potěšilo mě“, „mrzí mě“). Oceň konkrétní přístup nebo postup žáka.
5. Nedomýšlej vnitřní rozpoložení žáka („snaží se“, „nemá zájem“). Popiš vnější projevy, které lze pozorovat.
6. Text určený žákovi piš ve 2. osobě a jazykem přiměřeným jeho věku. Nesrovnávej žáka se spolužáky, nepoužívej ironii.
7. Piš česky, spisovně a bez formátování Markdown.
8. ${PSEUDONYM_PROMPT_RULE}`;

/** What `findStyleIssues` reports. */
export interface StyleIssue {
  rule: "umis" | "uzavira" | "emoce";
  match: string;
}

const PATTERNS: { rule: StyleIssue["rule"]; regex: RegExp }[] = [
  { rule: "umis", regex: /(?<!\p{L})(umíš|umím|dokážeš|dokáže|nezvládáš|nezvládá)(?!\p{L})/giu },
  { rule: "uzavira", regex: /(?<!\p{L})(nezvládl[a]?|neumí|neumíš|nedokáže|nedokážeš)(?!\p{L})/giu },
  { rule: "emoce", regex: /(mám radost|líbí se mi|potěšilo mě|mrzí mě|udělal[a]? jsi mi radost)/giu },
];

/**
 * A mechanical check for the most common breaches of the rules above. The
 * model is told the rules; this catches what slips through, for tests and for
 * the Rádce to see alongside its own reading.
 */
export function findStyleIssues(text: string): StyleIssue[] {
  const issues: StyleIssue[] = [];
  for (const { rule, regex } of PATTERNS) {
    for (const m of text.matchAll(regex)) issues.push({ rule, match: m[0] });
  }
  return issues;
}
