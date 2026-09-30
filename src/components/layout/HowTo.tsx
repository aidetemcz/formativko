import { useState, type ReactNode } from "react";
import { HowToContext } from "./howToContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * "Jak na to": a short walk through the formative cycle. The full tutorial
 * (Veronika's OnboardingModal) arrives in phase 11; until then this is the one
 * place the menu entry and every page's help open.
 */
const STEPS = [
  {
    title: "Kam žák směřuje",
    text: "Ke každé lekci patří jeden výukový cíl a tři kritéria hodnocení. Žák je dostane ve své verzi i se škálou J, Č, T, Ú, aby věděl, jak vypadá dobrý výsledek.",
  },
  {
    title: "Kde je teď",
    text: "V hodině zaznamenáváte důkazy o učení a úroveň u jednotlivých kritérií. Žáci se sami ohodnotí na exitce, papírové nebo online přes QR kód.",
  },
  {
    title: "Jak se tam dostane",
    text: "Z důkazů a úrovní připravíte slovní hodnocení. Popisuje, co už žák zvládá, a naznačuje další krok. Text vždy zkontrolujete a schválíte vy.",
  },
];

export function HowToProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <HowToContext.Provider value={() => setOpen(true)}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Jak na formativní hodnocení</DialogTitle>
            <DialogDescription>Tři otázky, kolem kterých je Tiny postavené.</DialogDescription>
          </DialogHeader>
          <ol className="space-y-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-medium text-brand-strong">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </HowToContext.Provider>
  );
}
