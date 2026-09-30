/**
 * Pseudonymisation of pupils for everything that leaves the app for an AI
 * model. The one place in the app that decides how a name becomes a nickname
 * and back — the browser and the /api functions both import it, so it must
 * stay free of imports (no `@/` alias, no Supabase).
 *
 * A pupil's real name never reaches the model. Before a prompt is sent, every
 * known pupil's name is replaced by their nickname; after the answer comes
 * back, the nickname of the pupil the text is about is turned back into their
 * first name.
 */

export interface PseudonymPerson {
  first_name: string;
  last_name: string;
  nickname: string;
}

/**
 * Czech case endings a name can take in running text: "Adam" → "Adama",
 * "Adamovi", "Adamem"; "Jana" → "Jany", "Janě", "Janu", "Janou".
 * Matching the stem plus one of these catches the declined forms a teacher
 * writes in a note without matching a different, longer name ("Jan" must not
 * swallow "Janek").
 */
const CASE_ENDINGS = [
  "ovi", "ové", "ům", "ech", "em", "ou", "a", "á", "e", "é", "ě", "i", "í", "y", "u", "o",
];

/** Name endings dropped before a case ending is added ("Jana" → "Jan"). */
const STEM_VOWELS = /[aáeěoy]$/i;

/** Letters, including Czech diacritics; JavaScript's \b is ASCII-only. */
const NOT_LETTER_BEFORE = "(?<!\\p{L})";
const NOT_LETTER_AFTER = "(?!\\p{L})";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Pattern matching one name in any of its declined forms. */
function namePattern(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return null;
  const stem = trimmed.length >= 3 ? trimmed.replace(STEM_VOWELS, "") : trimmed;
  const forms = [escapeRegExp(trimmed)];
  if (stem !== trimmed) forms.push(escapeRegExp(stem));
  const endings = CASE_ENDINGS.join("|");
  return `(?:${forms.join("|")})(?:${endings})?`;
}

/**
 * Replace the names of the given pupils in `text` with their nicknames.
 *
 * Full names are replaced first, so "Adam Novák" becomes one nickname rather
 * than the nickname twice; a first or last name on its own is replaced after.
 */
export function pseudonymize(text: string | null | undefined, people: PseudonymPerson[]): string {
  if (!text) return "";
  let result = text;

  // Longer names first, so "Jan" never eats part of "Janek" before "Janek"
  // had its turn.
  const sorted = [...people]
    .filter((p) => p.nickname)
    .sort(
      (a, b) =>
        (b.first_name + b.last_name).length - (a.first_name + a.last_name).length,
    );

  for (const person of sorted) {
    const first = namePattern(person.first_name);
    const last = namePattern(person.last_name);
    const full: string[] = [];
    if (first && last) {
      full.push(`${first}\\s+${last}`, `${last}\\s+${first}`);
    }
    for (const pattern of [...full, last, first]) {
      if (!pattern) continue;
      const regex = new RegExp(`${NOT_LETTER_BEFORE}${pattern}${NOT_LETTER_AFTER}`, "giu");
      result = result.replace(regex, person.nickname);
    }
  }
  return result;
}

/**
 * Turn a nickname in AI output back into the pupil's first name. Only the
 * exact nickname is restored — the model is told not to decline it.
 */
export function depseudonymize(text: string | null | undefined, person: PseudonymPerson): string {
  if (!text) return "";
  if (!person.nickname) return text;
  const regex = new RegExp(
    `${NOT_LETTER_BEFORE}${escapeRegExp(person.nickname)}${NOT_LETTER_AFTER}`,
    "giu",
  );
  return text.replace(regex, person.first_name);
}

/**
 * A short instruction for every system prompt that handles pupil data, so the
 * model keeps the nickname intact and never tries to invent a real name.
 */
export const PSEUDONYM_PROMPT_RULE =
  "Žáci jsou v podkladech označeni přezdívkou (např. „Modrá vydra“). Přezdívku nikdy neskloňuj ani neupravuj, a pokud to jde, žáka jménem ani přezdívkou vůbec neoznačuj. Nevymýšlej žádná skutečná jména.";
