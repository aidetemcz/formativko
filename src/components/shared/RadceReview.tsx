import { useState } from "react";
import { Loader2, MessageSquareText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { invokeAi } from "@/lib/ai";

export interface Review {
  comments: string[];
  went_well: string[];
  offers: string[];
}

interface RadceReviewProps {
  /** The text as it stands now, which the teacher may have edited. */
  text: string;
  mode: "feedback" | "certificate";
  className?: string | null;
  studentId?: string | null;
  /** What the Rádce said about the generated draft. */
  initialReview?: Review | null;
  /** Report mode: next steps the model kept out of the text. */
  recommendationsOutside?: string[];
}

/**
 * The Rádce's comments on an evaluation (metodologie/prompty/05). It never
 * rewrites the text; the teacher edits it and can ask for another look.
 */
export function RadceReview({
  text,
  mode,
  className,
  studentId,
  initialReview,
  recommendationsOutside = [],
}: RadceReviewProps) {
  const [review, setReview] = useState<Review | null>(initialReview ?? null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    setChecking(true);
    setError(null);
    const { data, error: err } = await invokeAi<Review>("check-evaluation", {
      body: { text, mode, className, studentId },
    });
    setChecking(false);
    if (err) setError(err.message);
    else setReview(data);
  };

  if (!text.trim()) return null;

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-lg border border-brand/30 bg-brand-soft/60 p-3 text-sm">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 font-medium text-brand-strong">
            <MessageSquareText className="h-4 w-4" />
            Rádce
          </p>
          <Button variant="ghost" size="sm" onClick={check} disabled={checking}>
            {checking ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Zkontrolovat znovu
          </Button>
        </div>
        {error && <p className="text-destructive">{error}</p>}
        {!review && !error && (
          <p className="text-muted-foreground">Rádce text ještě neviděl.</p>
        )}
        {review && review.comments.length === 0 && (
          <p className="text-muted-foreground">Rádce nemá k textu připomínky.</p>
        )}
        {review && review.comments.length > 0 && (
          <ul className="list-disc space-y-1 pl-5">
            {review.comments.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}
        {review && review.went_well.length > 0 && (
          <p className="mt-2 text-muted-foreground">Co se povedlo: {review.went_well.join(" ")}</p>
        )}
      </div>

      {mode === "certificate" && recommendationsOutside.length > 0 && (
        <div className="rounded-lg border p-3 text-sm">
          <p className="mb-1 font-medium">Doporučení mimo vysvědčení</p>
          <p className="mb-1.5 text-xs text-muted-foreground">
            Na vysvědčení je Rádce nepíše. Můžete je žákovi nebo rodičům sdělit jinak.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {recommendationsOutside.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
