/**
 * Plan how to bring a goal's stored criteria in line with an edited list.
 *
 * Criteria are matched by position. A criterion that keeps its place is
 * updated in place rather than deleted and re-created: pupils' levels in
 * `criterion_assessments` hang off the criterion's id and would otherwise be
 * deleted with it. Only criteria removed from the end of the list are deleted.
 */
export function planCriteriaUpdate<T>(
  existingIds: string[],
  incoming: T[],
): { updates: { id: string; value: T }[]; inserts: T[]; deleteIds: string[] } {
  const shared = Math.min(existingIds.length, incoming.length);
  return {
    updates: incoming.slice(0, shared).map((value, i) => ({ id: existingIds[i], value })),
    inserts: incoming.slice(shared),
    deleteIds: existingIds.slice(shared),
  };
}
