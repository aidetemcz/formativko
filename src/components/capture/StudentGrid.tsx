import { useMemo } from "react";
import { Check } from "lucide-react";
import { getStudentShortName } from "@/hooks/useStudents";
import { PROOF_TYPE_COLORS, type ProofTypeColor } from "@/constants/proofTypes";
import { LevelChip } from "@/components/shared/LevelChip";
import type { JctuCode } from "@/constants/jctu";

interface StudentGridProps {
  students: any[];
  selectedStudents: string[];
  proofDots: Record<string, string[]>;
  proofTypeMap: Map<string, any>;

  seatingData: {
    grid: (any | null)[][];
    rows: number;
    cols: number;
    unseated: any[];
    emptyRows: Set<number>;
    emptyCols: Set<number>;
  } | null;
  /** Criteria of the lesson being recorded; empty without a lesson. */
  levelCriteria: string[];
  /** Teacher's current level per `${studentId}:${criterionId}`. */
  currentLevels: Map<string, JctuCode>;
  onToggleStudent: (id: string) => void;
}

export function StudentGrid({
  students,
  selectedStudents,
  proofDots,
  proofTypeMap,
  seatingData,
  levelCriteria,
  currentLevels,
  onToggleStudent,
}: StudentGridProps) {
  // Responsive grid columns: fewer columns on small screens for larger touch targets
  const gridConfig = useMemo(() => {
    if (seatingData) return { cols: seatingData.cols, colsSm: seatingData.cols, colsMd: seatingData.cols };
    const count = students.length;
    // Mobile (< 640px): max 3 cols for fat-finger targets
    // Tablet (640-1024px): up to 4 cols
    // Desktop (1024+): up to 5 cols
    if (count <= 4) return { cols: 2, colsSm: 2, colsMd: 2 };
    if (count <= 6) return { cols: 2, colsSm: 3, colsMd: 3 };
    if (count <= 9) return { cols: 3, colsSm: 3, colsMd: 3 };
    if (count <= 16) return { cols: 3, colsSm: 4, colsMd: 4 };
    if (count <= 25) return { cols: 3, colsSm: 4, colsMd: 5 };
    return { cols: 3, colsSm: 5, colsMd: 5 };
  }, [students.length, seatingData]);

  const renderCell = (student: any) => {
    const isSelected = selectedStudents.includes(student.id);
    const dots = proofDots[student.id] || [];
    const levels = levelCriteria.map((c) => currentLevels.get(`${student.id}:${c}`) ?? null);
    const assessed = levels.filter(Boolean).length;
    // Who still lacks a level shows at a glance (zadání kap. 3, bod 2); the
    // fill uses the readiness tokens, never red or green.
    const coverageStyle = isSelected
      ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/30"
      : levelCriteria.length > 0 && assessed === levelCriteria.length
        ? "border-ready-foreground/20 bg-ready/60 hover:border-ready-foreground/40"
        : assessed > 0
          ? "border-partial-foreground/20 bg-partial/60 hover:border-partial-foreground/40"
          : "border-border bg-card hover:border-input";
    return (
      <button
        key={student.id}
        onClick={() => onToggleStudent(student.id)}
        className={`relative flex flex-col items-center justify-center rounded-xl border transition-all min-h-[3rem] sm:min-h-0 ${coverageStyle}`}
      >
        {isSelected && (
          <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        )}
        <span className="text-sm sm:text-base md:text-lg font-medium text-foreground text-center leading-tight px-1">
          {getStudentShortName(student)}
        </span>
        {levelCriteria.length > 0 && (
          <div className="mt-1.5 flex gap-1" aria-label="Úrovně u kritérií lekce">
            {levels.map((l, i) => (
              <LevelChip key={levelCriteria[i]} level={l} className="h-5 min-w-5 text-[0.6875rem]" />
            ))}
          </div>
        )}
        {dots.length > 0 && (
          <div className="flex gap-1.5 mt-1.5 lg:gap-2 lg:mt-2">
            {dots.slice(0, 5).map((ptId, i) => {
              const pt = proofTypeMap.get(ptId);
              const dotColor = pt
                ? (PROOF_TYPE_COLORS[pt.color as ProofTypeColor]?.dot || "bg-gray-400")
                : "bg-gray-400";
              return (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 rounded-full ${dotColor}`}
                />
              );
            })}
            {dots.length > 5 && (
              <span className="text-[10px] text-muted-foreground">+{dots.length - 5}</span>
            )}
          </div>
        )}
      </button>
    );
  };

  const gridCells = (() => {
    if (seatingData) {
      const cells: React.ReactNode[] = [];
      for (let r = 0; r < seatingData.rows; r++) {
        for (let c = 0; c < seatingData.cols; c++) {
          const student = seatingData.grid[r][c];
          if (student) {
            cells.push(renderCell(student));
          } else {
            cells.push(<div key={`empty-${r}-${c}`} className="rounded-xl" />);
          }
        }
      }
      seatingData.unseated.forEach((s: any) => cells.push(renderCell(s)));
      return cells;
    }
    return students.map((s: any) => renderCell(s));
  })();

  return (
    <div className="flex-1 p-2 sm:p-3 flex flex-col min-h-0 overflow-auto md:overflow-hidden">
      {/* Responsive grid columns via CSS custom properties */}
      {!seatingData && (
        <style>{`
          .capture-grid {
            --grid-cols: ${gridConfig.cols};
          }
          @media (min-width: 640px) {
            .capture-grid { --grid-cols: ${gridConfig.colsSm}; }
          }
          @media (min-width: 1024px) {
            .capture-grid { --grid-cols: ${gridConfig.colsMd}; }
          }
        `}</style>
      )}
      <div
        className={`flex-1 grid gap-1.5 sm:gap-2 ${!seatingData ? "capture-grid" : ""}`}
        style={{
          ...(seatingData
            ? {
                gridTemplateColumns: Array.from({ length: seatingData.cols }, (_, c) =>
                  seatingData.emptyCols.has(c) ? "0.15fr" : "1fr"
                ).join(" "),
                gridTemplateRows: Array.from({ length: seatingData.rows }, (_, r) =>
                  seatingData.emptyRows.has(r) ? "0.15fr" : "1fr"
                ).join(" ") + (seatingData.unseated.length > 0
                  ? " " + Array.from({ length: Math.ceil(seatingData.unseated.length / gridConfig.cols) }, () => "1fr").join(" ")
                  : ""),
              }
            : {
                gridTemplateColumns: `repeat(var(--grid-cols), 1fr)`,
                gridAutoRows: "1fr",
              }),
          alignContent: "stretch",
        }}
      >
        {gridCells}
      </div>
      {levelCriteria.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm border border-ready-foreground/30 bg-ready" />
            Úroveň u všech kritérií
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm border border-partial-foreground/30 bg-partial" />
            Část kritérií
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm border bg-card" />
            Zatím bez úrovně
          </span>
        </div>
      )}
    </div>
  );
}
