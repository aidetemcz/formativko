/** The pupils' address for an online exit ticket; the token is the only key to it. */
export function selfAssessmentUrl(token: string, origin = window.location.origin): string {
  return `${origin}/s/${token}`;
}
