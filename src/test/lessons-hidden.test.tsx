/**
 * Lesson planning is switched off in the prototype (`LESSONS_ENABLED`), and the
 * point of switching it off is that nothing else waits for a lesson to be
 * planned. These tests pin that down: the teacher has classes, a course and a
 * goal but no lesson, which is the state every one of these screens has to
 * work in.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LESSONS_ENABLED } from "@/config/features";

const CLASSES = [{ id: "c1", name: "5.A" }];
const COURSES = [{ id: "k1", name: "Matematika 5.A", class_id: "c1" }];
const GOALS = [{ id: "g1", title: "Žák rozliší sudá a lichá čísla" }];

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "t1" }, signOut: vi.fn() }),
}));
vi.mock("@/hooks/usePageTitle", () => ({ usePageTitle: () => {} }));
vi.mock("@/hooks/useClasses", () => ({ useClasses: () => ({ data: CLASSES }) }));
vi.mock("@/hooks/useCourses", () => ({ useCourses: () => ({ data: COURSES }) }));
vi.mock("@/hooks/useGoals", () => ({ useGoals: () => ({ data: GOALS }) }));
/**
 * What the lessons query returns, per test.
 *
 * A teacher who used the app before lessons were switched off still has rows
 * in the table, so "no lesson entry in the menu" has to hold even when the
 * query finds some — set this to a lesson to prove the flag is doing the
 * hiding, and leave it empty for the state a new teacher starts in.
 */
let lessons: { id: string; title: string }[] = [];
vi.mock("@/hooks/useLessons", () => ({ useLessons: () => ({ data: lessons }) }));
vi.mock("@/hooks/useProfile", () => ({ useProfile: () => ({ displayName: "Veronika" }) }));
vi.mock("@/hooks/useStudents", () => ({ useStudents: () => ({ data: [] }) }));
vi.mock("@/hooks/useDashboard", () => ({
  useTodaysLessons: () => ({ data: [] }),
  useNextLesson: () => ({ data: null }),
  useLessonGoalCounts: () => ({ data: {} }),
  useCourseStudentHeatmap: () => ({ data: [] }),
  useHasProofs: () => ({ data: false }),
}));
vi.mock("@/components/layout/AppLayout", () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const { AppSidebar } = await import("@/components/layout/AppSidebar");
const { SidebarProvider } = await import("@/components/ui/sidebar");
const { default: A01Dashboard } = await import("@/pages/A01Dashboard");

function renderSidebar() {
  return render(
    <MemoryRouter>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>,
  );
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <A01Dashboard />
    </MemoryRouter>,
  );
}

describe("the prototype hides lesson planning", () => {
  it("keeps the flag off, which is what every other test here assumes", () => {
    expect(LESSONS_ENABLED).toBe(false);
  });

  it("leaves no lesson entry in the menu, even with lessons on record", () => {
    lessons = [{ id: "l1", title: "Sudá a lichá čísla" }];
    renderSidebar();
    expect(screen.queryByText("Lekce")).toBeNull();
  });

  it("offers no lesson section on a course", async () => {
    // The course detail's lesson block is the only place that could still
    // reach lesson creation from inside a course.
    const source = await import("node:fs").then((fs) =>
      fs.readFileSync("src/pages/K03CourseDetail.tsx", "utf8"),
    );
    const lessonSection = source.indexOf("Lekce ({lessons.length})");
    const guard = source.lastIndexOf("{LESSONS_ENABLED && (", lessonSection);
    expect(guard).toBeGreaterThan(-1);
  });
});

describe("nothing waits for a lesson to be planned", () => {
  it("offers evaluations without any lesson", () => {
    lessons = [];
    renderSidebar();
    // "Hodnocení" is also the heading of the menu section; the entry is the link.
    expect(screen.getByRole("link", { name: "Hodnocení" })).toBeInTheDocument();
  });

  it("leads the onboarding from the goal straight to the first proof", () => {
    lessons = [];
    renderDashboard();
    expect(screen.getByText("Přidat důkaz")).toBeInTheDocument();
    expect(screen.queryByText("Vytvořit lekci")).toBeNull();
  });
});
