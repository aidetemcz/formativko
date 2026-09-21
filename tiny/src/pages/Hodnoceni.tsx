import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Karta, Nadpis, Prazdno, Tlacitko } from "../components/ui";
import { dukazyZaka, najdiZaka } from "../data/mock";

export default function Hodnoceni() {
  const { zakId } = useParams();
  const zak = najdiZaka(zakId!);
  const [stav, setStav] = useState<"pripraveno" | "generuje" | "hotovo">("pripraveno");

  if (!zak) return <Prazdno>Žák nenalezen.</Prazdno>;
  const dukazy = dukazyZaka(zak.id);

  const text = `${zak.jmeno} rozumí zlomku jako části celku — znázorní ho na obrázku i na číselné ose a dokáže ho vysvětlit vlastními slovy natolik jasně, že to pomůže i spolužákovi.

Při porovnávání zlomků hledá společný jmenovatel metodou pokus–omyl. Dalším krokem je najít společný jmenovatel rovnou z násobků, aby postup zrychlila.

Doporučení do další hodiny: zkusit tři příklady na společný jmenovatel a nahlas popsat, podle čeho ho vybrala.`;

  return (
    <>
      <Link to={`/zaci/${zak.id}`} className="mb-3 inline-block text-sm text-muted hover:text-ink">
        ← {zak.jmeno}
      </Link>
      <Nadpis popis={`Vychází z ${dukazy.length} důkazů o učení. V prototypu je text ukázkový.`}>
        Formativní hodnocení
      </Nadpis>

      {stav === "pripraveno" && (
        <Karta className="p-4">
          <p className="mb-3 text-sm text-muted">
            Hodnocení vznikne ze zaznamenaných důkazů — co žák zvládá, kde se rozvíjí a co je další krok.
          </p>
          <Tlacitko
            onClick={() => {
              setStav("generuje");
              setTimeout(() => setStav("hotovo"), 1200);
            }}
          >
            Vygenerovat hodnocení
          </Tlacitko>
        </Karta>
      )}

      {stav === "generuje" && <Prazdno>Generuji hodnocení…</Prazdno>}

      {stav === "hotovo" && (
        <Karta className="p-4">
          <textarea
            rows={12}
            defaultValue={text}
            className="w-full resize-none rounded-md border border-line px-3 py-2 text-sm leading-relaxed outline-none focus:border-accent"
          />
          <div className="mt-3 flex gap-2">
            <Tlacitko>Uložit</Tlacitko>
            <Tlacitko varianta="vedlejsi" onClick={() => setStav("pripraveno")}>
              Vygenerovat znovu
            </Tlacitko>
          </div>
        </Karta>
      )}
    </>
  );
}
