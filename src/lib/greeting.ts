/** "Dobré ráno" before 10, "Dobrý den" until 18, "Dobrý večer" after. */
export function greeting(hour: number): string {
  if (hour >= 4 && hour < 10) return "Dobré ráno";
  if (hour >= 18 || hour < 4) return "Dobrý večer";
  return "Dobrý den";
}

/**
 * Czech vocative for the greeting, for the common case only: names ending in
 * -a take -o (Jana → Jano, Nikola → Nikolo). Anything else stays as written,
 * which reads fine ("Dobrý den, Tomáš") where a wrong ending would not.
 */
export function vocative(name: string): string {
  const n = name.trim();
  return n.length > 1 && /a$/.test(n) ? `${n.slice(0, -1)}o` : n;
}
