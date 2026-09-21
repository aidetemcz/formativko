import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Karta, Nadpis, Pole, Prazdno, Tlacitko } from "../components/ui";

const navrh = [
  { nazev: "Rozumím pojmu zlomek", popis: "Zlomek jako část celku, znázornění." },
  { nazev: "Porovnávám zlomky", popis: "Společný jmenovatel, zdůvodnění postupu." },
  { nazev: "Převádím zlomky na desetinná čísla", popis: "Obousměrný převod." },
  { nazev: "Počítám se zlomky", popis: "Sčítání a odčítání." },
];

export default function NovyPlan() {
  const [predmet, setPredmet] = useState("Matematika");
  const [rocnik, setRocnik] = useState("6. ročník");
  const [obdobi, setObdobi] = useState("Září – listopad");
  const [zadani, setZadani] = useState("");
  const [stav, setStav] = useState<"formular" | "generuje" | "hotovo">("formular");
  const navigate = useNavigate();

  const generuj = () => {
    setStav("generuje");
    setTimeout(() => setStav("hotovo"), 1200);
  };

  return (
    <>
      <Nadpis popis="Zadej rámec a nech si navrhnout tematický plán. V prototypu je výstup ukázkový.">
        Nový tematický plán
      </Nadpis>

      <div className="grid gap-6 md:grid-cols-2">
        <Karta className="space-y-4 p-4">
          <Pole label="Předmět" value={predmet} onChange={setPredmet} />
          <Pole label="Ročník" value={rocnik} onChange={setRocnik} />
          <Pole label="Období" value={obdobi} onChange={setObdobi} />
          <Pole
            label="Co chceš probrat"
            value={zadani}
            onChange={setZadani}
            vicerádkove
            placeholder="Např. zlomky, desetinná čísla, převody mezi nimi…"
          />
          <Tlacitko onClick={generuj} disabled={stav === "generuje"}>
            {stav === "generuje" ? "Generuji…" : "Vygenerovat plán"}
          </Tlacitko>
        </Karta>

        <div>
          {stav === "formular" && <Prazdno>Návrh plánu se zobrazí tady.</Prazdno>}
          {stav === "generuje" && <Prazdno>Generuji návrh…</Prazdno>}
          {stav === "hotovo" && (
            <Karta className="p-4">
              <div className="mb-3 text-sm font-medium">Návrh cílů učení</div>
              <ol className="space-y-2">
                {navrh.map((c, i) => (
                  <li key={c.nazev} className="rounded-md border border-line p-3">
                    <div className="text-sm font-medium">
                      {i + 1}. {c.nazev}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{c.popis}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex gap-2">
                <Tlacitko onClick={() => navigate("/plany/plan-1")}>Uložit plán</Tlacitko>
                <Tlacitko varianta="vedlejsi" onClick={generuj}>
                  Vygenerovat znovu
                </Tlacitko>
              </div>
            </Karta>
          )}
        </div>
      </div>
    </>
  );
}
