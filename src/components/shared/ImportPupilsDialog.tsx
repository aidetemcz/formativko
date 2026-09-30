import { useState } from "react";
import { FileUp, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAddPupilsToClass } from "@/hooks/useClassOverview";
import { isTextFile, parseNamesFromText, processFileWithAI } from "@/utils/nameParser";

interface Name {
  first: string;
  last: string;
}

/**
 * Add pupils to a class from a list: pasted names, or a photo / PDF of the
 * class register read by the AI (extract-names). The teacher checks the names
 * before anything is saved.
 */
export function ImportPupilsDialog({
  classId,
  open,
  onOpenChange,
}: {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const add = useAddPupilsToClass();
  const [text, setText] = useState("");
  const [names, setNames] = useState<Name[] | null>(null);
  const [reading, setReading] = useState(false);

  const close = (o: boolean) => {
    if (!o) {
      setNames(null);
      setText("");
    }
    onOpenChange(o);
  };

  const readFile = async (file: File) => {
    setReading(true);
    try {
      const found = isTextFile(file) ? parseNamesFromText(await file.text()) : await processFileWithAI(file);
      if (found.length === 0) throw new Error("V souboru se nepodařilo najít žádná jména.");
      setNames(found);
    } catch (e) {
      toast({ title: "Soubor se nepodařilo přečíst", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setReading(false);
    }
  };

  const valid = (names ?? []).filter((n) => n.first.trim());

  const save = async () => {
    try {
      const count = await add.mutateAsync({
        classId,
        pupils: valid.map((n) => ({ first: n.first.trim(), last: n.last.trim() })),
      });
      toast({ title: `Přidáno ${count} žáků`, description: "Každý dostal přezdívku, pod kterou ho uvidí AI." });
      close(false);
    } catch (e) {
      toast({ title: "Žáky se nepodařilo přidat", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Přidat žáky</DialogTitle>
          <DialogDescription>Vložte seznam jmen, nebo nahrajte fotku či PDF třídní listiny.</DialogDescription>
        </DialogHeader>

        {!names ? (
          <Tabs defaultValue="text">
            <TabsList>
              <TabsTrigger value="text">Vložit seznam</TabsTrigger>
              <TabsTrigger value="file">Nahrát soubor</TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="space-y-3">
              <Textarea
                aria-label="Seznam jmen"
                className="min-h-[180px]"
                placeholder={"Adam Bílý\nEva Černá\n…"}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <Button onClick={() => setNames(parseNamesFromText(text))} disabled={!text.trim()}>
                Pokračovat
              </Button>
            </TabsContent>
            <TabsContent value="file">
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground hover:border-input">
                {reading ? <Loader2 className="h-6 w-6 animate-spin" /> : <FileUp className="h-6 w-6" />}
                {reading ? "Čtu jména…" : "Fotka, PDF nebo textový soubor"}
                <input
                  type="file"
                  accept="image/*,application/pdf,.txt,.csv"
                  className="sr-only"
                  disabled={reading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) readFile(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">Zkontrolujte jména ({valid.length}).</p>
            {names.map((n, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  aria-label="Jméno"
                  className="h-8"
                  value={n.first}
                  onChange={(e) => setNames(names.map((x, j) => (j === i ? { ...x, first: e.target.value } : x)))}
                />
                <Input
                  aria-label="Příjmení"
                  className="h-8"
                  value={n.last}
                  onChange={(e) => setNames(names.map((x, j) => (j === i ? { ...x, last: e.target.value } : x)))}
                />
                <Button variant="ghost" size="icon" title="Odebrat" onClick={() => setNames(names.filter((_, j) => j !== i))}>
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        )}

        {names && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNames(null)}>
              Zpět
            </Button>
            <Button onClick={save} disabled={valid.length === 0 || add.isPending}>
              {add.isPending && <Loader2 className="animate-spin" />}
              Přidat {valid.length} {valid.length === 1 ? "žáka" : "žáků"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
