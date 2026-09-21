import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Karta, Nadpis, Prazdno, Tlacitko } from "../components/ui";
import { Uroven, najdiArch, najdiCil, urovne, zaci } from "../data/mock";

type Zaznamy = Record<string, Uroven>;

export default function DetailArchu() {
  const { archId } = useParams();
  const arch = najdiArch(archId!);
  const [zaznamy, setZaznamy] = useState<Zaznamy>({});
  const [poznamka, setPoznamka] = useState<string | null>(null);

  if (!arch) return <Prazdno>Arch nenalezen.</Prazdno>;
  const cil = najdiCil(arch.cilId)!;

  const klic = (zakId: string, krId: string) => `${zakId}|${krId}`;
  const dalsiUroven = (soucasna?: Uroven): Uroven => {
    const poradi: Uroven[] = ["nezacal", "rozvijí", "zvládá", "presahuje"];
    return poradi[(poradi.indexOf(soucasna ?? "nezacal") + 1) % poradi.length];
  };

  const vyplneno = Object.values(zaznamy).filter((u) => u !== "nezacal").length;

  return (
    <>
      <Link to={`/cile/${cil.id}`} className="mb-3 inline-block text-sm text-muted hover:text-ink">
        ← {cil.nazev}
      </Link>
      <Nadpis popis={`${arch.trida} · ${arch.datum} · klikáním na buňku měníš úroveň`}>
        {arch.nazev}
      </Nadpis>

      <Karta className="mb-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas">
              <th className="w-48 px-3 py-2 text-left font-medium">Žák</th>
              {cil.kriteria.map((k, i) => (
                <th key={k.id} className="px-3 py-2 text-left font-medium" title={k.popis}>
                  <span className="block text-xs text-muted">Kritérium {i + 1}</span>
                  <span className="block max-w-[10rem] truncate text-xs font-normal">{k.popis}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zaci.map((z) => (
              <tr key={z.id} className="border-b border-line last:border-0">
                <td className="px-3 py-2">
                  <Link to={`/zaci/${z.id}`} className="hover:text-accent">
                    {z.jmeno}
                  </Link>
                </td>
                {cil.kriteria.map((k) => {
                  const u = zaznamy[klic(z.id, k.id)] ?? "nezacal";
                  const def = urovne.find((x) => x.id === u)!;
                  return (
                    <td key={k.id} className="px-3 py-2">
                      <button
                        title={def.popis}
                        onClick={() =>
                          setZaznamy((s) => ({ ...s, [klic(z.id, k.id)]: dalsiUroven(s[klic(z.id, k.id)]) }))
                        }
                        className={`h-8 w-8 rounded-md border text-xs font-medium ${
                          u === "nezacal"
                            ? "border-dashed border-line text-muted"
                            : "border-accent bg-accent/10 text-accent"
                        }`}
                      >
                        {def.zkratka}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Karta>

      <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-muted">
        {urovne.map((u) => (
          <span key={u.id}>
            <b className="text-ink">{u.zkratka}</b> {u.popis}
          </span>
        ))}
        <span className="ml-auto">Zaznamenáno {vyplneno} hodnocení</span>
      </div>

      <Karta className="p-4">
        <div className="mb-2 text-sm font-medium">Důkaz o učení</div>
        <textarea
          rows={3}
          value={poznamka ?? ""}
          onChange={(e) => setPoznamka(e.target.value)}
          placeholder="Co konkrétně žák udělal nebo řekl…"
          className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <div className="mt-3 flex gap-2">
          <Tlacitko onClick={() => setPoznamka("")}>Přidat důkaz</Tlacitko>
          <Tlacitko varianta="vedlejsi">Nahrát foto</Tlacitko>
        </div>
      </Karta>
    </>
  );
}
