/**
 * Sample inputs taken from metodologie/ (prompt examples and the sample
 * evaluation in data/jak-psat-slovni-hodnoceni.md). Used by the unit tests and
 * by the live check against the model (methodology.live.test.ts).
 */
export const SAMPLE_GOAL_INPUT = {
  subject: "Český jazyk",
  grade: "2. ročník",
  rvpOutcome: "Žák rozlišuje ve slovech hlásky a správně je zapisuje.",
  context: "Měkké hlásky Ď, Ť, Ň ve slovech a jejich zápis",
  competences: "komunikační, k učení",
};

export const SAMPLE_CRITERIA_INPUT = {
  goal: "Žák ve slyšeném i čteném slově rozpozná měkké hlásky Ď, Ť, Ň, správně je zapíše a vysvětlí, podle čeho je poznal.",
  grade: "2. ročník, 7–8 let",
  subject: "Český jazyk",
  notes: "",
  svpNeeds: [] as string[],
};

/** From data/jak-psat-slovni-hodnoceni.md, "Ukázka slovního hodnocení". */
export const SAMPLE_GOOD_EVALUATION =
  "Tvé písmo se stále vyvíjí. Píšeš pohotověji a přitom častěji se správným sklonem i velikostí písma. Už většinou píšeš bezchybně slova s i/y po měkkých a tvrdých souhláskách, slova s ě a vlastní jména. U psaní slov, které na konci jinak slyšíme a jinak píšeme, potřebuješ ještě více času k bezchybnému psaní. Čteš plynule. Bezchybně přepisuješ i delší text.";

/** Deliberately breaks the rules prompt 05 checks for. */
export const SAMPLE_FLAWED_EVALUATION =
  "Jsi snaživá a pilná žačka. V matematice umíš násobilku a mám radost, jak ti to jde. Slovní úlohy jsi nezvládla, příště se víc snaž. V příštím pololetí určitě dosáhneš výborných výsledků.";
