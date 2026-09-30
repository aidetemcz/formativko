/**
 * Match a name read from a photo ("Adam Bílý", "BILY ADAM", "Adam B.") to a
 * pupil of the class. Done here, not by the model, so the model never gets
 * the class list. Returns null unless one pupil is clearly the best fit.
 */
export interface NamedPupil {
  id: string;
  first_name: string;
  last_name: string;
}

function norm(s: string): string[] {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function score(read: string[], pupil: NamedPupil): number {
  const first = norm(pupil.first_name);
  const last = norm(pupil.last_name);
  const has = (tokens: string[]) => tokens.length > 0 && tokens.every((t) => read.includes(t));
  if (has(first) && has(last)) return 1;
  // "Adam B." — first name and the initial of the surname.
  if (has(first) && last.length > 0 && read.some((t) => t.length === 1 && t === last[0][0])) return 0.7;
  if (has(last) && !has(first)) return 0.4;
  if (has(first) && !has(last)) return 0.4;
  return 0;
}

export function matchPupil(readName: string, pupils: NamedPupil[]): string | null {
  const read = norm(readName);
  if (read.length === 0) return null;
  const scored = pupils.map((p) => ({ id: p.id, s: score(read, p) })).sort((a, b) => b.s - a.s);
  const [best, second] = scored;
  if (!best || best.s < 0.7) return null;
  if (second && second.s === best.s) return null;
  return best.id;
}
