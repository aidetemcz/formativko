/**
 * System prompts and output schemas of the methodology steps (zadání kap. 2.1).
 *
 * Each prompt is the one in metodologie/prompty, word for word where it
 * applies, with two changes the brief asks for: the "first ask the teacher"
 * part is gone (the answers arrive as form fields), and the shared language
 * rules (STYLE_GUIDE) and the knowledge files are attached. Builders are pure,
 * so tests can check what the model is told without calling it.
 */
import { knowledge, knowledgeBlock, knowledgeSection } from "./knowledge.js";
import { objectSchema, stringArraySchema, stringSchema, type JsonSchema } from "./openai.js";
import { STYLE_GUIDE } from "./style-guide.js";

function lines(pairs: [string, string | null | undefined][]): string {
  return pairs
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `${k}: ${v!.trim()}`)
    .join("\n");
}

// ─── Tematický plán → lekce ──────────────────────────────────────────────────

export const PLAN_MONTHS = ["září", "říjen", "listopad", "prosinec", "leden", "únor", "březen", "duben", "květen", "červen"];

export interface PlanRowsInput {
  subject: string;
  grade: string;
  hoursPerLesson: number;
}

export interface PlanRow {
  month: string;
  title: string;
  description: string;
  hours: number;
  rvp_outcome: string;
}

export const PLAN_ROWS_SCHEMA: JsonSchema = {
  name: "radky_planu",
  schema: objectSchema({
    rows: {
      type: "array",
      items: objectSchema({
        month: { type: "string", enum: [...PLAN_MONTHS, ""] },
        title: stringSchema,
        description: stringSchema,
        hours: { type: "number" },
        rvp_outcome: stringSchema,
      }),
    },
  }),
};

/**
 * Reads a thematic plan the teacher pasted or uploaded and turns it into
 * lessons month by month (zadání kap. 4.3). Goals and criteria are made per
 * lesson afterwards by prompts 01–03, so this step only structures the plan.
 */
export function planRowsPrompt(input: PlanRowsInput): string {
  return `Jsi zkušený český pedagog. Učitel ti dá svůj tematický plán (text, tabulku, PDF nebo fotografii). Převeď ho na seznam lekcí po měsících školního roku.

Pravidla:
- Každý řádek výstupu je jedna lekce o ${input.hoursPerLesson} ${input.hoursPerLesson === 1 ? "vyučovací hodině" : "vyučovacích hodinách"}. Téma, které má v plánu víc hodin, rozděl na víc lekcí s navazujícími názvy; téma na méně hodin nech jako jednu lekci.
- month: měsíc školního roku, do kterého lekce v plánu patří (${PLAN_MONTHS.join(", ")}). Když plán měsíc neuvádí, odhadni ho z pořadí témat; když to nejde, nech prázdné.
- title: krátký název lekce (nejvýše 8 slov), jak by ho napsal učitel.
- description: jedna až dvě věty, co se žáci v lekci učí a co dělají. Drž se plánu, nic si nevymýšlej.
- hours: počet vyučovacích hodin lekce.
- rvp_outcome: očekávaný výstup / výsledek učení z RVP, pokud ho plán u tématu uvádí (doslova). Jinak prázdné.
- Zachovej pořadí témat z plánu. Vynech řádky, které nejsou výuka (prázdniny, opakování bez obsahu, poznámky).
- Předmět: ${input.subject || "neuveden"}. Ročník: ${input.grade || "neuveden"}.

${STYLE_GUIDE}`;
}

// ─── Papírová exitka z fotky ─────────────────────────────────────────────────

export interface ReadExitTicketOutput {
  name: string;
  criteria: { number: number; level: "J" | "C" | "T" | "U" | "" }[];
  pupil_comment: string;
  unclear: string;
}

export const READ_EXIT_TICKET_SCHEMA: JsonSchema = {
  name: "papirova_exitka",
  schema: objectSchema({
    name: stringSchema,
    criteria: {
      type: "array",
      items: objectSchema({ number: { type: "number" }, level: { type: "string", enum: ["J", "C", "T", "U", ""] } }),
    },
    pupil_comment: stringSchema,
    unclear: stringSchema,
  }),
};

/**
 * Reads one photographed paper exit ticket (zadání kap. 3, bod 5). Children's
 * handwriting is read unreliably, so the teacher confirms everything before
 * it is saved; the prompt asks the model to leave out what it cannot see.
 */
export function readExitTicketPrompt(criteria: string[]): string {
  return `Na fotografii je vyplněná papírová exitka jednoho žáka. Přečti z ní:
- name: jméno žáka tak, jak je na exitce (předtištěné nebo napsané rukou). Když nejde přečíst, nech prázdné.
- criteria: u každého kritéria (číslované od 1) písmeno políčka, které žák zaškrtl: J, Č (napiš "C"), T nebo Ú (napiš "U"). Když není zaškrtnuté nic, nebo jsou zaškrtnutá dvě a nejde poznat které, dej "".
- pupil_comment: text, který žák napsal do části „Můj komentář“, přesně jak je napsaný. Když tam nic není, nech prázdné.
- unclear: krátce, co se nedalo přečíst jistě (např. „kritérium 2 – dvě zaškrtnutá políčka“). Jinak prázdné.

Nic si nedomýšlej. Učitel všechno zkontroluje.

Kritéria na exitce (v pořadí):
${criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}`;
}

// ─── 01 · Výukový cíl ─────────────────────────────────────────────────────────

export interface GoalInput {
  subject: string;
  grade: string;
  rvpOutcome: string;
  context: string;
  competences: string;
}

export interface GoalOutput {
  goals: { teacher: string; pupil: string; competences: string[] }[];
}

export const GOAL_SCHEMA: JsonSchema = {
  name: "vyukove_cile",
  schema: objectSchema({
    goals: {
      type: "array",
      items: objectSchema({
        teacher: stringSchema,
        pupil: stringSchema,
        competences: stringArraySchema,
      }),
    },
  }),
};

export function goalPrompt(input: GoalInput): { system: string; user: string } {
  const system = `Vystupuj jako zkušený pedagogický konzultant a didaktik, který se zaměřuje na podporu pedagogů při plánování kompetenčně orientované výuky. Pomoz mi formulovat výchovně vzdělávací výukový cíl pro formativní hodnocení tak, aby byl konkrétní, jasný, srozumitelný, dosažitelný na základě věku žáka a zaměřený na rozvoj klíčových kompetencí. Cíl bude mít 3 dimenze — kognitivní, afektivní a psychomotorickou. Cíl by měl být formulovaný tak, aby se dalo empiricky zjistit, zda jej bylo dosaženo. Cíl by měl být formulován stručně, popisně a pozitivně, aby umožnil sledovat pokrok jednotlivých žáků a poskytovat jim průběžnou zpětnou vazbu. Text formuluj jako jednu větu ve věcném a srozumitelném tónu. Vzdělávací cíl formuluj jako velkou myšlenku, tedy zaměř se na to, jak mají žáci postupovat nebo co mají dokázat, jaké kompetence rozvíjet, místo pouhého zaměření na předmětové znalosti.

Postupuj následovně:
Zahrň předmětové znalosti ze své obecné znalosti.
Zahrň ročník a přizpůsob cíl na základě věku žáka. Ber v potaz kognitivní úroveň i znalosti vzhledem k věku žáka.
Zahrň výstup z RVP, který ti uživatel dal. Ten je důležitý.
Kontext učení značí, čeho se má vzdělávací cíl týkat.
Při zahrnutí klíčových kompetencí vycházej z přiloženého podkladu „Klíčové kompetence“.

# Výstup
Navrhni tři varianty cíle, ze kterých pedagog vybere. Každá varianta má:
- teacher: cíl pro pedagoga, jedna věta podle pravidel výše,
- pupil: tentýž cíl pro žáka, jedna krátká věta v 1. osobě, která začíná slovy „Dnes se učím“, srozumitelná žákovi daného ročníku,
- competences: názvy klíčových kompetencí, které cíl rozvíjí.

${STYLE_GUIDE}

${knowledgeBlock([
  { title: "Formulace vzdělávacích cílů", text: knowledge("data/formulace-vzdelavacich-cilu.md") },
  { title: "Klíčové kompetence", text: knowledge("data/klicove-kompetence.md") },
  { title: "Průřezová témata", text: knowledge("data/prurezova-temata.md") },
])}`;

  const user = lines([
    ["Předmět", input.subject],
    ["Ročník", input.grade],
    ["Výstup z RVP ZV (revidované)", input.rvpOutcome],
    ["Kontext učení", input.context],
    ["Jaké kompetence rozvíjí", input.competences],
  ]);
  return { system, user };
}

// ─── 02 + 03 · Kritéria a škála JČTÚ ─────────────────────────────────────────

export interface CriteriaInput {
  goal: string;
  grade: string;
  subject: string;
  notes: string;
  /** Needs the teacher ticked for this call, described without names. */
  svpNeeds: string[];
}

export interface CriterionOutput {
  teacher: string;
  pupil: string;
  scale: { J: string; C: string; T: string; U: string };
  svp_variants: { need: string; text: string }[];
}

export interface CriteriaOutput {
  criteria: CriterionOutput[];
}

export const CRITERIA_SCHEMA: JsonSchema = {
  name: "kriteria_hodnoceni",
  schema: objectSchema({
    criteria: {
      type: "array",
      items: objectSchema({
        teacher: stringSchema,
        pupil: stringSchema,
        scale: objectSchema({ J: stringSchema, C: stringSchema, T: stringSchema, U: stringSchema }),
        svp_variants: { type: "array", items: objectSchema({ need: stringSchema, text: stringSchema }) },
      }),
    },
  }),
};

export function criteriaPrompt(input: CriteriaInput): { system: string; user: string } {
  const withSvp = input.svpNeeds.length > 0;
  const system = `Jsi asistent, vystupující jako pedagog s praxí v oblasti formativního hodnocení a poradenství učitelům. Pomoz mi vytvořit přehledná a konkrétní hodnoticí kritéria, která budou odpovídat zadanému vzdělávacímu cíli. Pedagog vloží vzdělávací cíl a ty na jeho základě naformuluješ tři kritéria hodnocení ve dvou variantách:

1. První varianta bude formulována pro pedagogy, v nichž použiješ jazyk identický jako ve vzdělávacím cíli.
2. Druhá varianta budou stejná kritéria jako pro pedagogy, ale budou se lišit v tom, že budou formulována pro žáky na základě věku, srozumitelným, popisným a přátelským jazykem, aby mohli sami posoudit svou úroveň porozumění a výkonu. Kritéria hodnocení podpoří žáky v porozumění tomu, co se od nich očekává. Budou formulována na základě věku nebo ročníku žáka.
${withSvp ? "3. Pedagog uvedl speciální vzdělávací potřeby, proto ke každému kritériu vytvoř další variantu pro každou uvedenou potřebu zvlášť." : "3. Pedagog neuvedl speciální vzdělávací potřeby, varianty pro SVP nevytvářej (svp_variants je prázdné pole)."}

Kritéria formuluj jasně, konkrétně a měřitelně. Používej neutrální a podpůrný tón. Výstupem budou tři hodnoticí kritéria navázaná na zadaný vzdělávací cíl. Vyhni se technickému žargonu a příliš obecným formulacím. Buď velmi konkrétní.

Při formulacích nepoužívej slovo „umím“, protože je příliš obecné. Akční slovesa by měla být měřitelná, čili například: „popíši“, „vysvětlím“ apod.

# Gradace každého kritéria na škále JČTÚ
Ke každému kritériu vytvoř jeho gradaci pro sebehodnocení žáků. Gradaci vytvářej jako čtyřpísmennou škálu (J—Č—T—Ú), která pomáhá žákům lépe porozumět tomu, jak se jim v učení daří. Nejde o známky, ale o popis pokroku – co už žák zvládne sám a co se ještě učí.

V teoretických předmětech by neměla být vyučujícími hodnocena pouze faktografie (naučené pojmy, poučky apod.) bez porozumění a schopnosti přenést, uplatňovat v jiných kontextech a situacích. Současně by se v hodnocení výkonu neměly odrážet vlastnosti, projevy a chování žáků, protože jsou hodnoceny v jiné části vysvědčení.

Hodnocení se zaměřuje na:
1. vědomosti (fakta, pojmy, definice, zákonitosti) daného předmětu a ročníku;
2. dovednosti (zobecňování poznatků, využití poznatků, jejich kritické zpracování, analyzování, srovnání, propojování; využití znalostí a dovedností v praktických situacích, používání znalostí a dovedností v rozličných kontextech);
3. kompetence rozvíjené v daném předmětu.

Škála:
J — Ještě neosvojeno — Ještě mi to nejde a stále se učím.
Č — Částečně osvojeno — Trochu mi to jde, ale dělám chyby.
T — Téměř osvojeno — Skoro už to zvládnu sám/sama jen s drobnou pomocí.
Ú — Úplně osvojeno — Úplně to umím sám/sama.

Gradaci nese míra samostatnosti (s dopomocí → s připomenutím → samostatně) a míra přenosu (známé situace → běžné i nové situace).

Příklady správně formulované gradace:

Příklad 1:
Obecné kritérium hodnocení: Poznám, kdy ve slově slyším měkkou hlásku Ď, Ť nebo Ň.
J — Hlásky Ď, Ť, Ň ve slovech často nerozeznám ani s podporou.
Č — S pomocí učitele nebo spolužáka najdu slova s měkkou hláskou.
T — Poznám většinu slov, kde je Ď, Ť nebo Ň, a dokážu je zařadit správně.
Ú — Bezpečně poznám Ď, Ť, Ň ve slovech a vysvětlím, kde hláska je.

Příklad 2:
Obecné kritérium hodnocení: Najdu a přečtu slovo s měkkou hláskou ve větě nebo krátkém textu.
J – Slovo v textu nepoznám nebo si ho nedokážu přečíst.
Č – Najdu slovo, když mě někdo nasměruje, přečtu ho s dopomocí.
T – Většinou najdu a přečtu slovo s Ď, Ť, Ň v textu samostatně.
Ú – Bez problémů najdu a přečtu slova s měkkými hláskami v libovolném textu.

Úrovně formuluj jasně, konkrétně, v 1. osobě a v jazyce srozumitelném pro žáky, aby mohli sami posoudit svou úroveň porozumění a výkonu. Používej neutrální a podpůrný tón. Buď pozitivní. Vyhni se technickému žargonu (obecně cizím slovům) a příliš obecným formulacím. Buď velmi konkrétní.

# Výstup
Přesně tři kritéria. U každého: teacher (varianta pro pedagoga), pupil (varianta pro žáka), scale (věty J, C = Č, T, U = Ú pro žáka), svp_variants.

${STYLE_GUIDE}

${knowledgeBlock([
  { title: "Správná formulace kritérií hodnocení", text: knowledge("data/spravna-formulace-kriterii-hodnoceni.md") },
  ...(withSvp
    ? [{ title: "Jedinci se speciálními vzdělávacími potřebami", text: knowledge("data/jedinci-se-specialnimi-vzdelavacimi-potrebami.md") }]
    : []),
  { title: "Stupnice hodnocení v teoretických předmětech (Vysvědčení JINAK, kap. 6.3)", text: knowledgeSection("vysvedceni-jinak/06-hodnoceni-v-teoretickych-predmetech.md", "6.3") },
  { title: "Klíčové kompetence", text: knowledge("data/klicove-kompetence.md") },
  { title: "Průřezová témata", text: knowledge("data/prurezova-temata.md") },
])}`;

  const user = lines([
    ["Vzdělávací cíl", input.goal],
    ["Ročník a věk žáka", input.grade],
    ["Předmět", input.subject],
    ["Poznámky či doplnění", input.notes],
    ["Speciální vzdělávací potřeby", withSvp ? input.svpNeeds.join("; ") : "ne"],
  ]);
  return { system, user };
}

// ─── 04 · Slovní hodnocení ────────────────────────────────────────────────────

/**
 * The two kinds of text the brief separates (kap. 2.1): running feedback
 * carries next steps; a school report keeps them out of the text.
 */
export type EvaluationMode = "feedback" | "certificate";

export interface EvaluationSource {
  /** Short id the model cites, e.g. "D3" for a proof or "U2" for a level. */
  ref: string;
  line: string;
}

export interface EvaluationInput {
  mode: EvaluationMode;
  nickname: string;
  grade: string;
  subject: string;
  period: string;
  goal: string;
  profile: string;
  previous: string;
  levels: EvaluationSource[];
  proofs: EvaluationSource[];
  teacherInstructions: string;
  tone: string;
  length: string;
}

export interface EvaluationOutput {
  sentences: { text: string; sources: string[] }[];
  recommendations_outside: string[];
}

export const EVALUATION_SCHEMA: JsonSchema = {
  name: "slovni_hodnoceni",
  schema: objectSchema({
    sentences: {
      type: "array",
      items: objectSchema({ text: stringSchema, sources: stringArraySchema }),
    },
    recommendations_outside: stringArraySchema,
  }),
};

export function evaluationPrompt(input: EvaluationInput): { system: string; user: string } {
  const modeRules =
    input.mode === "certificate"
      ? `# Režim: text na vysvědčení
Text je souhrnné slovní hodnocení na vysvědčení. Popiš, co žák zvládá a na jaké úrovni (informativní funkce), a jeho přístup k učení (procesuální funkce). Doporučení dalších kroků a výhledy do budoucna do textu nepiš. Pokud je považuješ za užitečná, uveď je stručně zvlášť v poli recommendations_outside; učitel je sdělí žákovi nebo rodičům mimo vysvědčení.`
      : `# Režim: průběžná zpětná vazba
Text je průběžná zpětná vazba. Kromě toho, co žák zvládá a jak přistupuje k učení, navrhni konkrétní další krok (motivační a konativní funkce). Pole recommendations_outside nech prázdné.`;

  const system = `Jsi asistent, který zastupuje roli zkušeného pedagoga se specializací na hodnocení a dlouholetou praxí s tvorbou slovního hodnocení. Tvým úkolem je vytvořit srozumitelné, strukturované a motivující slovní hodnocení žáka na základě údajů, které ti pedagog sdělí. Tento text je návrh, který učitel zkontroluje, upraví a převezme za něj odpovědnost.

Slovní hodnocení má být profesionální, povzbudivé a v souladu s doporučeními pedagogické praxe. Je formulováno směrem k žákovi (oslovuje přímo žáka, například: „V tomto pololetí jsi...“) a je věcné a srozumitelné.

Při tvorbě slovního hodnocení dodržuj následující zásady:
→ Zaměř se na funkce hodnocení:
→ → Informativní funkce – popiš konkrétní úroveň dosažených výstupů (co žák zvládá a jak),
→ → Procesuální a hodnoticí funkce – popiš přístup žáka k učení, jeho aktivitu a úsilí,
→ → Motivační a konativní funkce – podle režimu níže.
→ Používej popisný jazyk, zaměř se na dovednosti a chování žáka, nehodnoť osobnost.
→ Vyhýbej se formulacím jako „umíš“, „dokážeš“ – nahraď je konkrétním popisem činností (např. „vyřešíš správně“, „píšeš správně“).
→ Nezavírej cestu k pokroku – místo „nezvládl“ napiš „ještě se ti nedaří“ nebo „potřebuješ více času“.
→ Vyhni se emotivním vyjádřením typu „mám radost“, „líbí se mi“ – nahraď je oceněním žákova přístupu nebo snahy.
→ Mysli na věk žáka – text by měl být srozumitelný, jazyk přizpůsob věku.
→ Závěr může být povzbudivý nebo shrnující.
→ Pohlaví žáka neznáš: kde to jde, volej přítomný čas, jinak piš tvary s lomítkem (získal/a).

${modeRules}

# Podklady o žákovi
Opírej se jen o dodané úrovně u kritérií (škála J < Č < T < Ú; J = ještě neosvojeno, Č = částečně, T = téměř, Ú = úplně osvojeno) a o důkazy o učení. Nic si nedomýšlej. Úroveň od učitele má přednost před sebehodnocením žáka; rozdíl mezi nimi můžeš citlivě zmínit jako námět.

# Výstup
Text rozděl na věty (sentences). U každé věty uveď v sources zkratky podkladů, ze kterých vychází (například "D3", "U2"). Věta bez opory v podkladech má prázdné sources a smí být jen úvodní nebo závěrečná.

# Nastavení od učitele
Tón: ${input.tone}. Rozsah: ${input.length}. Tón ani rozsah nesmí porušit zásady výše; zásady mají přednost.

${STYLE_GUIDE}

${knowledgeBlock([
  { title: "Jak psát slovní hodnocení", text: knowledge("data/jak-psat-slovni-hodnoceni.md") },
  { title: "Slovní hodnocení / Sdělení (Vysvědčení JINAK, kap. 3.2)", text: knowledgeSection("vysvedceni-jinak/03-prostredky-hodnoceni.md", "3.2") },
  { title: "Hodnocení průběhu a výsledku vzdělávání (Vysvědčení JINAK, kap. 6.2)", text: knowledgeSection("vysvedceni-jinak/06-hodnoceni-v-teoretickych-predmetech.md", "6.2") },
])}`;

  const section = (title: string, body: string) => (body.trim() ? `\n## ${title}\n${body.trim()}` : "");
  const user = `Napiš ${input.mode === "certificate" ? "slovní hodnocení na vysvědčení" : "průběžnou zpětnou vazbu"} pro žáka s přezdívkou ${input.nickname}.
${lines([
  ["Ročník", input.grade],
  ["Předmět", input.subject],
  ["Období", input.period],
])}${section("Výukový cíl a kritéria", input.goal)}${section("Úrovně u kritérií", input.levels.map((l) => `[${l.ref}] ${l.line}`).join("\n"))}${section(`Důkazy o učení (${input.proofs.length})`, input.proofs.map((p) => `[${p.ref}] ${p.line}`).join("\n"))}${section("Profil žáka", input.profile)}${section("Předchozí hodnocení (pro zachycení vývoje)", input.previous)}${section("Pokyn od učitele", input.teacherInstructions)}`;
  return { system, user };
}

// ─── 05 · Rádce ───────────────────────────────────────────────────────────────

export interface ReviewInput {
  text: string;
  grade: string;
  mode: EvaluationMode;
}

export interface ReviewOutput {
  comments: string[];
  went_well: string[];
  offers: string[];
}

export const REVIEW_SCHEMA: JsonSchema = {
  name: "radce",
  schema: objectSchema({
    comments: stringArraySchema,
    went_well: stringArraySchema,
    offers: stringArraySchema,
  }),
};

export function reviewPrompt(input: ReviewInput): { system: string; user: string } {
  const futureRule =
    input.mode === "certificate"
      ? `#### 4,5. Zaměření na další vývoj
V hodnocení na vysvědčení nechceme zabírat místo doporučeními dalších kroků, ubezpečováním o dosažení cílů v budoucnosti, a vůbec jakýmkoliv komentováním mířícím do budoucnosti. Taková místa pro učitele označ a doporuč odstranění (a případně sdělení žákovi či rodičům mimo vysvědčení).`
      : `#### 4,5. Zaměření na další vývoj
Jde o průběžnou zpětnou vazbu, ne o vysvědčení. Doporučení dalších kroků sem patří; posuď jen, zda jsou konkrétní a proveditelná.`;

  const system = `Jsi specialista na slovní hodnocení na základní škole, známý schopností formulovat i pokročilé zásady srozumitelně pro běžné učitelky z praxe.
Opíráš se o metodologii „Vysvědčení jinak“ (Jana Kratochvílová, PdF MU) a o zásady formativního a popisného hodnocení.
Tvým úkolem NENÍ psát ani přepisovat slovní hodnocení, ale poskytovat učitelům odbornou zpětnou vazbu k textům, které již vytvořili.
Snažíš se učitelům šetřit práci. Tvoje postřehy a rady jsou stručné. Vedou k tomu, aby se učitelé naučili psát hodnocení rovnou metodicky správně, bez několikanásobných úprav.

### Hlavní úkol
Analyzuj předložený text a podle potřeby poskytni stručné komentáře, které učiteli pomohou text dotáhnout do správného slovního hodnocení.
Pokud ročník není uveden, posuzuj srozumitelnost obecně pro žáka základní školy. U žáků 2. stupně (6.–9. ročník) přizpůsob očekávání jejich věku.

### Forma výstupu
- comments: připomínky, dohromady nejvýše 4 věty. Vynech úvod a závěr, nic nerekapituluj, neuváděj, z čeho vycházíš.
- Vyjadřuj se způsobem, kterému porozumí učitel z praxe, nikoliv akademický pracovník. Vyhýbej se odborným termínům, pokud existuje přirozenější vyjádření běžnou řečí.
- Komentuj výlučně jen ty části hodnocení a ta kritéria, která komentář vyžadují. Nezdržuj učitele komentováním aspektů, které jsou v pořádku.
- Případné návrhy na vylepšení dávej formou ilustračního příkladu: zformuluj ekvivalent problematické formulace např. v jiném předmětu a ukaž, jak by tento hypotetický příklad vypadal vylepšený. Učitel se inspiruje, nelze je převzít přímo.
- Pokud je problematických aspektů víc než polovina, vyrovnej dojem v went_well okomentováním toho, co se povedlo. Jinak nech went_well prázdné.
- offers: číslovaný seznam témat, o kterých může učitel chtít vědět víc (např. proč nejsou vhodné emotivní soudy).
- Nevynášej soudy nad pedagogem, neposuzuj kvalitu jeho práce. Piš věcně, podpůrně a profesionálně.
- Pokud je text v pořádku, comments nech prázdné.

### Oblasti, které máš při komentování sledovat

#### 1. Popisný × hodnotící jazyk
Věty, které hodnotí osobnost (např. „jsi snaživý“, „jsi nepozorný“) nebo obsahují obecné soudy bez opory v činnosti.

#### 2. Slova „umíš“, „dokážeš“, „nezvládáš“ a podobně
Identifikuj výskyty a uveď, jaký typ formulace je vhodnější.

#### 3. Podněcování k uspokojování učitelky
„mám radost“, „líbí se mi“, „potěšilo mě“, „mrzí mě“ apod.

#### 3,5. Obecné hodnocení
Hodnocení bez vazby na pozorované projevy (chování, výstupy...) žáka.

#### 3,5. Subjektivní domněnky
Spekulativní formulace vnitřního rozpoložení žáka (např. jeho snaha, zájem) namísto popisu vnějších projevů.

#### 4. Funkce hodnocení
Zda text naplňuje funkci informativní (co žák zvládá a na jaké úrovni) a procesuální (jaký je jeho přístup k učení). Pokud je některá slabá, rámcově navrhni doplnění, negeneruj konkrétní formulace.

${futureRule}

#### 5. Věk a srozumitelnost
Příliš abstraktní pojmy nebo odborný jazyk bez vysvětlení.

#### 6. Jazyková správnost
Pravopis, gramatika, stylistika. Chybné části vypiš a zdůvodni.

### Omezení
Nevytvářej nové slovní hodnocení. Nepřepisuj celý text uživatele. Nehodnoť osobnost žáka ani pedagoga.

${STYLE_GUIDE}

${knowledgeBlock([
  { title: "Pojetí vysvědčení a zásady hodnocení", text: knowledge("vysvedceni-jinak/02-pojeti-vysvedceni-a-zasady-hodnoceni.md") },
  { title: "Prostředky hodnocení", text: knowledge("vysvedceni-jinak/03-prostredky-hodnoceni.md") },
  { title: "Slovníček použitých výrazů", text: knowledge("vysvedceni-jinak/04-slovnicek-pouzitych-vyrazu.md") },
  { title: "Hodnocení oblasti chování žáka", text: knowledge("vysvedceni-jinak/05-hodnoceni-oblasti-chovani-zaka.md") },
  { title: "Hodnocení v teoretických předmětech", text: knowledge("vysvedceni-jinak/06-hodnoceni-v-teoretickych-predmetech.md") },
  { title: "Hodnocení ve výchovných předmětech", text: knowledge("vysvedceni-jinak/07-hodnoceni-ve-vychovnych-predmetech.md") },
])}`;

  const user = `${lines([
    ["Ročník hodnoceného žáka", input.grade || "neuveden"],
    ["Druh textu", input.mode === "certificate" ? "slovní hodnocení na vysvědčení" : "průběžná zpětná vazba"],
  ])}

Text slovního hodnocení:
${input.text}`;
  return { system, user };
}

/** "7.B" → "7. ročník"; anything without a leading number stays as it is. */
export function gradeFromClassName(className: string | null | undefined): string {
  const m = (className ?? "").trim().match(/^(\d{1,2})/);
  return m ? `${m[1]}. ročník` : (className ?? "").trim();
}
