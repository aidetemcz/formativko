import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { selfAssessmentUrl } from "@/lib/selfAssessment";
import { useCloseSelfAssessment, useStartSelfAssessment, type SelfAssessmentSession } from "@/hooks/useExitTickets";

/**
 * Starts the online exit ticket and shows its QR code full-screen for the
 * class (zadání kap. 4.3, "Zobrazit QR pro žáky"). Closing it ends the session,
 * so the link stops working.
 */
export function QrDialog({ lessonId, title, onClose }: { lessonId: string; title: string; onClose: () => void }) {
  const { toast } = useToast();
  const start = useStartSelfAssessment();
  const close = useCloseSelfAssessment();
  const [session, setSession] = useState<SelfAssessmentSession | null>(null);

  useEffect(() => {
    start.mutate(lessonId, {
      onSuccess: setSession,
      onError: (e) => {
        toast({ title: "Exitku se nepodařilo spustit", description: e.message, variant: "destructive" });
        onClose();
      },
    });
    // Start exactly once per opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = async () => {
    if (session) await close.mutateAsync(session.id).catch(() => {});
    onClose();
  };

  const url = session ? selfAssessmentUrl(session.token) : "";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-card p-6" role="dialog" aria-label="QR kód exitky">
      <Button variant="ghost" size="icon" className="absolute right-4 top-4" title="Zavřít" onClick={finish}>
        <X />
      </Button>
      <p className="text-center text-2xl font-medium sm:text-3xl">{title}</p>
      <p className="text-center text-lg text-muted-foreground">Naskenuj kód a vyplň exitku.</p>
      {session ? (
        <>
          <div className="rounded-2xl border bg-card p-4">
            <QRCodeSVG value={url} size={320} level="M" className="h-auto w-[min(70vw,60vh)]" />
          </div>
          <p className="break-all text-center font-mono text-sm text-muted-foreground">{url}</p>
          <Button variant="outline" size="lg" onClick={finish} disabled={close.isPending}>
            {close.isPending && <Loader2 className="animate-spin" />}
            Ukončit exitku
          </Button>
          <p className="text-xs text-muted-foreground">Odkaz platí do konce dne, nebo dokud exitku neukončíte.</p>
        </>
      ) : (
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
