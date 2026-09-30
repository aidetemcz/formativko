import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClassStudents } from "@/hooks/useClasses";
import { useCourse, useCourses, useCourseSeating, useSaveCourseSeating } from "@/hooks/useCourses";
import { useCriterionLevels, useLessonDetail, usePlanLessons } from "@/hooks/usePlanLessons";
import type { JctuCode } from "@/constants/jctu";
import { useStudentGroups } from "@/hooks/useStudentGroups";
import { useCustomProofTypes } from "@/hooks/useProofTypes";
import { PROOF_TYPE_COLORS, ICON_MAP, BUILTIN_PROOF_TYPES, type ProofTypeColor } from "@/constants/proofTypes";
import CapturePanel, { type CaptureLesson } from "@/components/capture/CapturePanel";
import ProofTypeManager from "@/components/capture/ProofTypeManager";
import SeatingChartEditor from "@/components/shared/SeatingChartEditor";
import { CaptureHeader } from "@/components/capture/CaptureHeader";
import { GroupPillBar } from "@/components/capture/GroupPillBar";
import { StudentGrid } from "@/components/capture/StudentGrid";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * Recording in the lesson (zadání kap. 3). Opened from a lesson
 * (/lekce/:lessonId/zaznam) it starts with that lesson and its criteria;
 * /capture/:courseId remains as the fallback way in, with the lesson chosen
 * in the header.
 */
export default function E02CaptureToolAddProofs() {
  usePageTitle("Záznam v hodině");
  const { courseId: courseParam, lessonId: lessonParam } = useParams<{ courseId?: string; lessonId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: entryLesson } = useLessonDetail(lessonParam);
  const courseId = courseParam ?? entryLesson?.course_id ?? undefined;
  const { data: course } = useCourse(courseId);
  const { data: allCourses = [] } = useCourses();
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const classId = course?.class_id;
  const { data: students = [] } = useClassStudents(classId);
  const { data: planLessons = [] } = usePlanLessons(courseId);
  const { data: customProofTypes = [] } = useCustomProofTypes();
  const proofTypes = useMemo(
    () => [...BUILTIN_PROOF_TYPES, ...customProofTypes],
    [customProofTypes]
  );
  const { toast } = useToast();

  // Persist capture session state to sessionStorage so accidental navigation doesn't lose work
  const sessionKey = `capture_session_${courseId}`;
  const savedSession = useMemo(() => {
    try {
      const stored = sessionStorage.getItem(sessionKey);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }, [sessionKey]);

  const [selectedStudents, setSelectedStudents] = useState<string[]>(savedSession?.selectedStudents || []);
  const [activeProofTypeId, setActiveProofTypeId] = useState<string | null>(null);
  const [proofDots, setProofDots] = useState<Record<string, string[]>>(savedSession?.proofDots || {});
  const [lessonOpen, setLessonOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(
    lessonParam ?? searchParams.get("lesson") ?? savedSession?.selectedLesson ?? null
  );

  // Persist key state on change
  const persistSession = useCallback(() => {
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify({
        proofDots,
        selectedStudents,
        selectedLesson,
      }));
    } catch { /* quota exceeded — non-critical */ }
  }, [sessionKey, proofDots, selectedStudents, selectedLesson]);

  useEffect(() => {
    persistSession();
  }, [persistSession]);
  const [manageMode, setManageMode] = useState(false);

  // Quick Groups
  const { data: groups = [] } = useStudentGroups(classId);

  // Seating chart (per-course)
  const { data: courseSeating = [] } = useCourseSeating(courseId);
  const saveSeating = useSaveCourseSeating();
  const [showSeatingEditor, setShowSeatingEditor] = useState(false);

  // The lesson being recorded, its criteria and the teacher's current levels.
  const { data: lessonDetail } = useLessonDetail(selectedLesson ?? undefined);
  const captureLesson: CaptureLesson | null = useMemo(
    () =>
      lessonDetail && selectedLesson
        ? { id: lessonDetail.id, goalId: lessonDetail.goal?.id ?? null, criteria: lessonDetail.criteria }
        : null,
    [lessonDetail, selectedLesson],
  );
  const criterionIds = useMemo(() => captureLesson?.criteria.map((c) => c.id) ?? [], [captureLesson]);
  const { data: levelRows = [] } = useCriterionLevels(criterionIds);
  const currentLevels = useMemo(() => {
    const map = new Map<string, JctuCode>();
    for (const l of levelRows) if (l.source === "teacher") map.set(`${l.student_id}:${l.criterion_id}`, l.level);
    return map;
  }, [levelRows]);

  // Proof type helpers
  const proofTypeMap = useMemo(
    () => new Map(proofTypes.map((pt) => [pt.id, pt])),
    [proofTypes]
  );
  const activeProofType = activeProofTypeId ? proofTypeMap.get(activeProofTypeId) : undefined;

  const sessionTotal = useMemo(
    () => Object.values(proofDots).reduce((sum, dots) => sum + dots.length, 0),
    [proofDots]
  );

  // Lessons still to be taught first; taught ones stay reachable.
  const classLessons = useMemo(
    () => [...planLessons].sort((a, b) => Number(a.status === "past") - Number(b.status === "past")),
    [planLessons],
  );

  // Keyboard shortcuts: 1-9 to select proof types, Escape to deselect
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Escape") {
        setActiveProofTypeId(null);
        return;
      }
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= proofTypes.length) {
        const pt = proofTypes[num - 1];
        setActiveProofTypeId(activeProofTypeId === pt.id ? null : pt.id);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [proofTypes, activeProofTypeId]);

  // Seating layout: merge course seating with students
  const seatingData = useMemo(() => {
    if (courseSeating.length === 0) return null;
    const seatMap = new Map(courseSeating.map((s) => [s.student_id, s]));
    let maxRow = 0, maxCol = 0;
    for (const s of courseSeating) {
      if (s.seat_row > maxRow) maxRow = s.seat_row;
      if (s.seat_col > maxCol) maxCol = s.seat_col;
    }
    const grid: (any | null)[][] = [];
    for (let r = 0; r <= maxRow; r++) {
      grid[r] = [];
      for (let c = 0; c <= maxCol; c++) {
        grid[r][c] = null;
      }
    }
    for (const student of students as any[]) {
      const seat = seatMap.get(student.id);
      if (seat) grid[seat.seat_row][seat.seat_col] = student;
    }
    const emptyRows = new Set<number>();
    for (let r = 0; r <= maxRow; r++) {
      if (grid[r].every((cell) => cell === null)) emptyRows.add(r);
    }
    const emptyCols = new Set<number>();
    for (let c = 0; c <= maxCol; c++) {
      let allEmpty = true;
      for (let r = 0; r <= maxRow; r++) {
        if (grid[r][c] !== null) { allEmpty = false; break; }
      }
      if (allEmpty) emptyCols.add(c);
    }
    const seatedIds = new Set(courseSeating.map((s) => s.student_id));
    const unseated = students.filter((s: any) => !seatedIds.has(s.id));
    return { grid, rows: maxRow + 1, cols: maxCol + 1, unseated, emptyRows, emptyCols };
  }, [students, courseSeating]);

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleCapture = (proofTypeId: string) => {
    setActiveProofTypeId(activeProofTypeId === proofTypeId ? null : proofTypeId);
  };

  const handleCaptured = (studentIds: string[], proofTypeId: string) => {
    setProofDots((prev) => {
      const updated = { ...prev };
      studentIds.forEach((id) => {
        updated[id] = [...(updated[id] || []), proofTypeId];
      });
      return updated;
    });
    setSelectedStudents([]);
  };

  const selectedLessonObj = classLessons.find((l) => l.id === selectedLesson) ?? (lessonDetail?.id === selectedLesson ? lessonDetail : undefined);

  // Action buttons for proof types
  const actionButtons = (
    <div className="flex items-center gap-3 overflow-x-auto lg:flex-wrap lg:justify-center lg:overflow-visible pb-1 lg:pb-0">
      {proofTypes.map((pt, idx) => {
        const Icon = ICON_MAP[pt.icon] || ICON_MAP["pencil"];
        const colors = PROOF_TYPE_COLORS[pt.color as ProofTypeColor] || PROOF_TYPE_COLORS.slate;
        const isActive = activeProofTypeId === pt.id;
        const shortcutKey = idx < 9 ? idx + 1 : null;
        return (
          <button
            key={pt.id}
            onClick={() => handleCapture(pt.id)}
            title={shortcutKey ? `${pt.name} (${shortcutKey})` : pt.name}
            className={`relative flex flex-col items-center gap-1 p-2.5 sm:p-2 rounded-lg transition-colors shrink-0 min-w-[60px] lg:aspect-square lg:justify-center lg:gap-2 lg:border lg:w-[100px] ${
              isActive
                ? `ring-2 ${colors.ring}`
                : "lg:border-border hover:bg-accent lg:hover:border-primary/40 lg:hover:bg-primary/5"
            }`}
          >
            {shortcutKey && (
              <span className="hidden lg:block absolute top-1 right-1.5 text-[10px] text-muted-foreground/50 font-mono">
                {shortcutKey}
              </span>
            )}
            <Icon className={`h-6 w-6 ${colors.text}`} />
            <span className="text-[11px] sm:text-xs text-muted-foreground whitespace-nowrap">{pt.name}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <CaptureHeader
        courseName={course?.name || "Kurz"}
        courseDropdownOpen={courseDropdownOpen}
        onCourseDropdownToggle={() => { setCourseDropdownOpen(!courseDropdownOpen); setLessonOpen(false); }}
        allCourses={allCourses}
        currentCourseId={courseId}
        onCourseSelect={(id) => { setCourseDropdownOpen(false); setSelectedLesson(null); navigate(`/capture/${id}`); }}
        backHref={selectedLesson ? `/lekce/${selectedLesson}` : "/"}
        lessonOpen={lessonOpen}
        onLessonToggle={() => { setLessonOpen(!lessonOpen); setCourseDropdownOpen(false); }}
        selectedLesson={selectedLesson}
        selectedLessonTitle={selectedLessonObj?.title || null}
        classLessons={classLessons}
        onLessonSelect={(id) => { setSelectedLesson(id); setLessonOpen(false); }}
        sessionTotal={sessionTotal}
        allSelected={selectedStudents.length === students.length}
        onToggleAll={() => {
          if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
          } else {
            setSelectedStudents(students.map((s: any) => s.id));
          }
        }}
        manageMode={manageMode}
        onToggleManage={() => { setManageMode(!manageMode); setActiveProofTypeId(null); }}
        onOpenSeating={() => setShowSeatingEditor(true)}
      />

      <GroupPillBar
        groups={groups}
        classId={classId!}
        selectedStudents={selectedStudents}
        onSetSelectedStudents={setSelectedStudents}
      />

      {/* Seating chart editor overlay */}
      {showSeatingEditor && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-lg w-full sm:max-w-lg max-h-[85vh] overflow-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Uspořádat žáky</h2>
              <button onClick={() => setShowSeatingEditor(false)} className="p-1 hover:bg-accent rounded">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <SeatingChartEditor
              students={students as any}
              initialPositions={courseSeating}
              onSave={(positions) => {
                saveSeating.mutate(
                  { courseId: courseId!, positions },
                  {
                    onSuccess: () => {
                      toast({ title: "Rozmístění uloženo" });
                      setShowSeatingEditor(false);
                    },
                    onError: (e: any) => toast({ title: "Chyba při ukládání", description: e?.message, variant: "destructive" }),
                  }
                );
              }}
              saving={saveSeating.isPending}
            />
          </div>
        </div>
      )}

      {/* Main area */}
      {/* Side panel from 768px, so a phone held landscape (zadání kap. 3,
          bod 6) keeps the pupils and the level buttons side by side. */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        <StudentGrid
          students={students}
          selectedStudents={selectedStudents}
          proofDots={proofDots}
          proofTypeMap={proofTypeMap}
          seatingData={seatingData}
          levelCriteria={criterionIds}
          currentLevels={currentLevels}
          onToggleStudent={toggleStudent}
        />

        {/* Desktop right panel */}
        <div className="hidden md:flex md:flex-col w-[300px] lg:w-[380px] shrink-0 border-l border-border bg-card min-h-0">
          {manageMode ? (
            <div className="flex-1 p-4 overflow-auto min-h-0">
              <ProofTypeManager proofTypes={customProofTypes} onClose={() => setManageMode(false)} />
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border shrink-0">
                {actionButtons}
              </div>
              {activeProofType && (
                <div className="flex-1 p-4 overflow-auto min-h-0">
                  <CapturePanel
                    key={activeProofTypeId}
                    proofType={activeProofType}
                    selectedStudents={selectedStudents}
                    lesson={captureLesson}
                    currentLevels={currentLevels}
                    onCaptured={handleCaptured}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile: bottom bar */}
      <div className="md:hidden">
        {manageMode ? (
          <div className="border-t border-border bg-card p-3 max-h-[70vh] overflow-auto">
            <ProofTypeManager proofTypes={proofTypes} onClose={() => setManageMode(false)} />
          </div>
        ) : (
          <>
            <div className="border-t border-border bg-card p-3">
              {actionButtons}
            </div>
            {activeProofType && (
              <div className="border-t border-border bg-card p-3 max-h-[45vh] overflow-auto">
                <CapturePanel
                  key={activeProofTypeId}
                  proofType={activeProofType}
                  selectedStudents={selectedStudents}
                  lesson={captureLesson}
                  currentLevels={currentLevels}
                  onCaptured={handleCaptured}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
