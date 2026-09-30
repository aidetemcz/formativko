import type { JctuScale } from "@/constants/jctu";
import type { LessonDetail } from "@/hooks/usePlanLessons";

/**
 * TinyBuddy on the client (zadání kap. 5): what the chat stream carries, where
 * a search hit leads, which page a conversation starts from, and lesson
 * snapshots for previews, saving and undo. The shapes mirror
 * `api/_lib/buddy.ts`.
 */

export interface BuddyContext {
  kind: "lesson" | "plan" | "class" | "student";
  id: string;
  label: string;
}

export interface SearchHit {
  kind: string;
  id: string;
  title: string;
  subtitle: string | null;
  link_id: string | null;
}

export interface LessonSnapshot {
  title: string;
  description: string;
  month: string | null;
  hours: number | null;
  planned_activities: string;
  goal: { teacher: string; pupil: string } | null;
  criteria: { id: string | null; teacher: string; pupil: string; scale: Partial<JctuScale> | null }[];
}

export type ProposalStatus = "pending" | "saved" | "discarded";

export type Proposal =
  | {
      id: string;
      type: "lesson_update";
      status: ProposalStatus;
      summary: string;
      lesson_id: string;
      lesson_title: string;
      before: LessonSnapshot;
      after: LessonSnapshot;
    }
  | { id: string; type: "lesson_create"; status: ProposalStatus; summary: string; plan_id: string; plan_name: string; after: LessonSnapshot }
  | {
      id: string;
      type: "plan_update";
      status: ProposalStatus;
      summary: string;
      plan_id: string;
      plan_name: string;
      items: { lesson_id: string; before: { title: string; month: string | null }; after: { title: string; month: string | null } }[];
    };

export interface BuddyMessageData {
  results?: SearchHit[];
  proposals?: Proposal[];
  /** Set on the client while an answer is still coming. */
  tools?: string[];
}

export interface BuddyMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  data: BuddyMessageData;
  created_at: string;
}

export const HIT_LABELS: Record<string, string> = {
  lesson: "Lekce",
  plan: "Plán",
  student: "Žák",
  class: "Třída",
  proof: "Důkaz",
  evaluation: "Hodnocení",
};

/** Where a search hit opens. */
export function hrefForHit(hit: SearchHit): string {
  switch (hit.kind) {
    case "lesson":
      return `/lekce/${hit.id}`;
    case "plan":
      return `/plany/${hit.id}`;
    case "student":
      return `/zaci/${hit.id}`;
    case "class":
      return `/tridy/${hit.id}`;
    case "proof":
      return hit.link_id ? `/student-profiles/${hit.link_id}/proof/${hit.id}` : "/dukazy";
    case "evaluation":
      return hit.link_id ? `/hodnoceni/${hit.link_id}` : "/hodnoceni";
    default:
      return "/";
  }
}

const CONTEXT_ROUTES: [RegExp, BuddyContext["kind"]][] = [
  [/^\/lekce\/([0-9a-f-]{36})(?:\/|$)/i, "lesson"],
  [/^\/plany\/([0-9a-f-]{36})(?:\/|$)/i, "plan"],
  [/^\/tridy\/([0-9a-f-]{36})(?:\/|$)/i, "class"],
  [/^\/zaci\/([0-9a-f-]{36})(?:\/|$)/i, "student"],
];

/**
 * The page the teacher opens Buddy from, as a context chip (zadání kap. 5.1).
 * The label is the page's title, which every page sets through usePageTitle.
 */
export function contextFromPage(pathname: string, documentTitle: string): BuddyContext | null {
  for (const [pattern, kind] of CONTEXT_ROUTES) {
    const match = pathname.match(pattern);
    if (match) {
      const label = documentTitle.split(" | ")[0].trim();
      return { kind, id: match[1], label: label || kind };
    }
  }
  return null;
}

export const CONTEXT_LABELS: Record<BuddyContext["kind"], string> = {
  lesson: "Lekce",
  plan: "Plán",
  class: "Třída",
  student: "Žák",
};

export function snapshotOf(lesson: LessonDetail): LessonSnapshot {
  return {
    title: lesson.title,
    description: lesson.description ?? "",
    month: lesson.month ?? null,
    hours: lesson.hours ?? null,
    planned_activities: lesson.planned_activities ?? "",
    goal: lesson.goal ? { teacher: lesson.goal.title, pupil: lesson.goal.pupil_text ?? "" } : null,
    criteria: lesson.criteria.map((c) => ({
      id: c.id,
      teacher: c.teacher_text || c.description,
      pupil: c.pupil_text ?? "",
      scale: c.scale ?? null,
    })),
  };
}

function sameCriteria(a: LessonSnapshot["criteria"], b: LessonSnapshot["criteria"]): boolean {
  return (
    a.length === b.length &&
    a.every((c, i) => c.teacher === b[i].teacher && c.pupil === b[i].pupil && JSON.stringify(c.scale ?? null) === JSON.stringify(b[i].scale ?? null))
  );
}

export interface SnapshotChanges {
  info: Partial<Pick<LessonSnapshot, "title" | "description" | "month" | "hours" | "planned_activities">>;
  goal: LessonSnapshot["goal"] | undefined;
  criteria: LessonSnapshot["criteria"] | undefined;
}

/** What has to be written to turn `from` into `to`; `undefined` means unchanged. */
export function snapshotChanges(from: LessonSnapshot, to: LessonSnapshot): SnapshotChanges {
  const info: SnapshotChanges["info"] = {};
  for (const key of ["title", "description", "month", "hours", "planned_activities"] as const) {
    if ((from[key] ?? null) !== (to[key] ?? null)) (info as Record<string, unknown>)[key] = to[key];
  }
  const goalChanged =
    !!to.goal && (!from.goal || from.goal.teacher !== to.goal.teacher || from.goal.pupil !== to.goal.pupil);
  return {
    info,
    goal: goalChanged ? to.goal : undefined,
    criteria: sameCriteria(from.criteria, to.criteria) ? undefined : to.criteria,
  };
}

/** A lesson snapshot changed only in title and month (a plan update). */
export function withTitleAndMonth(s: LessonSnapshot, change: { title: string; month: string | null }): LessonSnapshot {
  return { ...s, title: change.title, month: change.month };
}
