/**
 * Registration is closed: a database trigger refuses any e-mail that is not on
 * the `allowed_emails` list. Supabase Auth reports that only as a generic
 * database error, so it is translated here.
 */
export function describeAuthError(message: string | undefined, isSignUp: boolean): string {
  if (isSignUp && message && /database error saving new user|signup_not_allowed/i.test(message)) {
    return "Registrace je zatím jen pro pozvané učitele. Pokud se chcete zapojit do pilotu, napište nám.";
  }
  return message || "Neznámá chyba";
}
