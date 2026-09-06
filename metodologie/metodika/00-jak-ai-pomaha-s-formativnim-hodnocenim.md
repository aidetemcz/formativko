# Jak AI pomáhá s formativním hodnocením — srozumitelné vysvětlení metodiky

*Zpracováno podle metodiky „AI v praxi pedagoga: Využití chatbotů ve formativním hodnocení“ (AI dětem, autorky Eva Nečasová, Michaela Bezděková, Šárka Polanecká; verze 06, 03/2026; kurikulum.aidetem.cz/ai-v-praxi). Metodika staví na přístupu Vysvědčení JINAK (projekt TA ČR TL05000360, doc. Jana Kratochvílová, PdF MU). Licence CC BY 4.0.*

Tento dokument vysvětluje, **co** metodika dělá, **proč** a **v jakém pořadí**, aby podle něj šlo navrhnout modul formativního hodnocení v aplikaci Tiny. Podrobné prompty jsou ve složce `prompty/`, znalostní podklady ve složkách `data/` a `vysvedceni-jinak/`.

---

## 1. O co jde v jedné větě

Učitel projde **čtyřmi na sebe navazujícími kroky** — od vzdělávacího cíle přes kritéria a sebehodnoticí škálu až po slovní hodnocení — a v každém kroku mu AI ušetří čas s formulacemi, aniž by za něj rozhodovala nebo hodnotila žáky.

## 2. Základní východiska

**AI nenahrazuje učitele.** Chatbot nehodnotí žáky samostatně a nenahrazuje odbornost pedagoga. Je to nástroj, který šetří čas při formulacích (cílů, kritérií, hodnocení). Aby dával dobré výstupy, potřebuje **dostatek dat a kontextu** — proto mají původní asistenti přiložené znalostní soubory a proto je důležité, aby aplikace předávala modelu strukturované vstupy.

**Vychází z Vysvědčení JINAK.** Celá metodika stojí na metodologii PdF MU: hodnocení je formativní (dává zpětnou vazbu, dokud se dá výkon ještě zlepšit), kriteriální (podle předem daných kritérií, ne intuitivně), individualizované (neporovnává žáky mezi sebou), popisné (popisuje pozorovatelné chování a výkony, ne vlastnosti) a doplněné o sebehodnocení žáka. Podrobně viz `vysvedceni-jinak/02-pojeti-vysvedceni-a-zasady-hodnoceni.md`.

**Dva typy nástrojů.** Původní metodika nabízí (a) *AI asistenty* v ChatGPT a Gemini — přednastavené role s přiloženými daty, a (b) *prompty* — textová zadání ke zkopírování do chatu. Asistenti jsou doporučenější, protože „nezapomínají“ instrukce v dlouhé konverzaci. V Tiny to znamená: každý krok = samostatná role s vlastním systémovým promptem a vlastním kontextem, ne jeden dlouhý chat.

## 3. Čtyři fáze procesu (a jeden doplňkový nástroj)

```
 ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
 │ 1. Vzdělávací│───▶│ 2. Kritéria  │───▶│ 3. Škála JČTÚ│───▶│ 4. Slovní    │
 │    cíl       │    │    hodnocení │    │  (sebehodn.) │    │   hodnocení  │
 └──────────────┘    └──────────────┘    └──────────────┘    └──────┬───────┘
                                                                     │
                                                              ┌──────▼───────┐
                                                              │ 5. Rádce —   │
                                                              │  kontrola    │
                                                              └──────────────┘
```

Mezi fází 2 a 3 leží *tvorba konkrétních lekcí*, kterou metodika záměrně nepokrývá (je příliš obsáhlá; odkazuje na chatveskole.cz/dp/tvorba-materialu-do-vyuky).

### Fáze 1 — Formulace výukového cíle

**Proč začít tady:** Všechno další — kritéria, obsah lekce, slovní hodnocení — stojí na dobře formulovaném, *kompetenčně orientovaném* cíli. Špatný cíl = špatná kritéria = nic k hodnocení.

**Vstupy:** předmět, ročník, očekávaný výsledek učení (OVU) z RVP/ŠVP, kontext učení (téma), rozvíjené klíčové kompetence.

**Co AI udělá:** doplní předmětové znalosti, přizpůsobí obtížnost věku, zapracuje OVU, zohlední kontext a sladí cíl s vybranými kompetencemi (podle přiložených dat o klíčových kompetencích a průřezových tématech).

**Výstup:** pozitivně formulovaný, empiricky ověřitelný cíl (metodika mluví o třech variantách; systémový prompt požaduje jednu větu se třemi dimenzemi — kognitivní, afektivní, psychomotorickou).

**Jak vypadá dobrý cíl:** konkrétní, měřitelný (obsahuje pozorovatelné akční sloveso — „formuluje“, „porovná“, „navrhne“; ne „rozumí“, „umí“), dosažitelný pro daný věk, zaměřený na činnost žáka (ne učitele). Podrobně `data/formulace-vzdelavacich-cilu.md` včetně seznamu akčních sloves podle Bloomovy taxonomie.

→ Prompt: `prompty/01-asistent-formulace-vzdelavacich-cilu.md`

### Fáze 2 — Formulace kritérií hodnocení

**Vstupy:** cíl z fáze 1, ročník/věk, předmět, případně poznámky a speciální vzdělávací potřeby žáka.

**Co AI udělá:** převede cíl do **tří** konkrétních, měřitelných kritérií. Každé kritérium ve dvou verzích: *odborná pro učitele* (stejný jazyk jako cíl) a *žákovská* (jednoduchý, popisný, přátelský jazyk přizpůsobený věku, aby žák sám posoudil, kde je). Pokud učitel uvede SVP, přidá cílené varianty pro každou potřebu zvlášť.

**Pravidlo:** kritéria nesmí používat slovo „umím“ — je příliš obecné. Používají se měřitelná slovesa: „popíši“, „vysvětlím“, „vyřeším“…

**Upozornění z metodiky:** varianty pro žáky se SVP jsou stále ve vývoji a testování.

→ Prompt: `prompty/02-asistent-formulace-kriterii-hodnoceni.md`

### Fáze 3 — Sebehodnoticí škály pro žáky (JČTÚ)

**Vstupy:** kritérium z fáze 2 (nejlépe žákovská verze).

**Co AI udělá:** ke každému kritériu vytvoří čtyři úrovně gradace v jazyce srozumitelném žákům:

| | Úroveň | Věta pro žáka |
|---|---|---|
| **Ú** | Úplně osvojeno | Úplně to umím sám/sama. |
| **T** | Téměř osvojeno | Skoro už to zvládnu sám/sama s drobnou pomocí. |
| **Č** | Částečně osvojeno | Trochu mi to jde, ale dělám chyby. |
| **J** | Ještě neosvojeno | Ještě mi to nejde a stále se učím. |

**Proč čtyři úrovně a ne pět:** záměrně chybí středová hodnota, aby se hodnocení nepřevádělo na známky a nešlo „zaškrtnout střed“. Úrovně se liší **mírou samostatnosti** (s pomocí → s připomenutím → sám) a **mírou přenosu** (známé situace → nové situace). Nejde o známku, ale o popis pokroku: co už žák zvládne sám a co se ještě učí.

Škála se dá pro žáky vizualizovat, např. jako schody z Lego kostek. Je vhodná pro 1. i 2. stupeň ZŠ a je přímo prostředkem hodnocení ve Vysvědčení JINAK (`vysvedceni-jinak/06-…`, kap. 6.3).

→ Prompt: `prompty/03-asistent-gradace-kriterii-jctu.md`

### Fáze 4 — Tvorba slovního hodnocení nebo zpětné vazby

**Vstupy:** buď (a) už existující dílčí hodnocení / soubory ke shrnutí, nebo (b) strukturované informace o žákovi: iniciály (nikdy jméno), pohlaví, hodnocené předměty, silné stránky, obtíže, pokrok, přístup k práci, doporučení, požadovaná délka.

**Co AI udělá:** převede podklady do srozumitelného, věku přiměřeného textu vhodného pro průběžnou zpětnou vazbu i pro vysvědčení.

**Zásady textu (z Vysvědčení JINAK):**

- naplňuje tři funkce hodnocení — *informativní* (co žák zvládá a jak), *procesuální* (jak přistupuje k učení), *motivační* (co dál);
- **popisný jazyk** — popisuje, co lze vidět a slyšet („píšeš správně slova s i/y po měkkých souhláskách“), ne vlastnosti („jsi šikovná“);
- ne „umíš / dokážeš“, ale konkrétní činnost;
- **nezavírá cestu** — místo „nezvládl jsi“ → „ještě se ti nedaří“, „potřebuješ více času“;
- **bez emocí učitele** — ne „mám radost“, „líbí se mi“ (žák pak pracuje pro spokojenost učitelky, ne pro sebe) → ocenění přístupu a snahy;
- oslovuje přímo žáka ve 2. osobě („V tomto pololetí jsi…“), jazyk podle věku.

→ Prompt: `prompty/04-asistent-generovani-slovniho-hodnoceni.md`; podklady `data/jak-psat-slovni-hodnoceni.md`, `vysvedceni-jinak/03-prostredky-hodnoceni.md` (3.2).

### Doplňkový nástroj — Rádce pro správné formulace slovního hodnocení

**K čemu je:** pro učitele, kteří s Vysvědčením JINAK začínají. Vloží *vlastní* hotové slovní hodnocení a Rádce jim dá stručnou zpětnou vazbu — upozorní na problematické formulace a řekne, co upravit a proč. **Text nepřepisuje** (cílem je, aby se učitel naučil psát správně sám). Autorka: Šárka Polanecká, ZŠ Pod Beckovem.

**Co kontroluje:** popisný × hodnotící jazyk; „umíš/dokážeš/nezvládáš“; emotivní vyjádření učitele; obecná hodnocení bez vazby na pozorované projevy; domněnky o vnitřním stavu žáka; naplnění informativní a procesuální funkce; výhledy do budoucna (na vysvědčení nepatří); přiměřenost věku; pravopis.

**Forma:** max. 4 věty, bez úvodu a závěru, návrhy jen jako ilustrační příklady z jiného předmětu, na konci číslovaná nabídka dalších témat.

V Tiny se nabízí použít Rádce i **automaticky jako kontrolní krok** za fází 4 (model vygeneruje → Rádce zkontroluje → učitel vidí připomínky).

→ Prompt: `prompty/05-radce-formulace-slovniho-hodnoceni.md`

## 4. Co z toho plyne pro návrh modulu v Tiny

1. **Pipeline, ne chat.** Čtyři (pět) oddělených rolí; výstup jednoho kroku je vstupem dalšího. Uživatel může vstoupit v kterémkoli kroku (má-li už cíl, začne kritérii).
2. **Strukturované vstupy místo „vyzvi pedagoga“.** Původní prompty nejprve kladou otázky, protože běží v chatu. V aplikaci se tyto otázky stanou formulářovými poli a instrukce „nejprve se zeptej“ se z promptu vypustí.
3. **Kontext do modelu.** Každá role dostane jen své znalostní soubory (viz tabulka v `README.md`), ne všechno najednou. SVP soubor jen při zaškrtnutí SVP.
4. **Strukturovaný výstup.** Kritéria (3× {učitel, žák, [SVP]}), škála ({kritérium, J, Č, T, Ú}), slovní hodnocení (text + volitelně rozpad na tři funkce) — snáz se zobrazí, uloží a předá do dalšího kroku.
5. **Ochrana osobních údajů.** Nikdy neposílat modelu jméno žáka — jen iniciály/přezdívku; UI to má hlídat.
6. **Transparentnost.** Uvádět, že asistent nenahrazuje učitele a že metodika vychází z Vysvědčení JINAK (Kratochvílová, PdF MU); odkaz https://vysvedcenijinak.ped.muni.cz/.
7. **Konzistence pravidel napříč kroky.** Jazykové zásady (popisnost, ne „umíš“, neuzavírat cestu, bez emocí učitele) platí pro fázi 2, 3 i 4 — vyplatí se je mít jako sdílený „style guide“ blok, který se přidá do všech systémových promptů.
8. **Známý rozpor k rozhodnutí:** asistent 04 do textu zařazuje doporučení do budoucna (motivační funkce), Rádce 05 je z textu *na vysvědčení* vyřazuje. Metodika MUNI doporučení připouští (3.2, zásada 4). Řešení: v UI rozlišit *průběžná zpětná vazba* (doporučení ano) vs. *text na vysvědčení* (doporučení stručně nebo mimo vysvědčení).

## 5. Doporučené chatovací aplikace (pro učitele, mimo Tiny)

Metodika odkazuje na přehledy na chatveskole.cz: dostupné nástroje (`/dostupne-nastroje`), návody k registraci (`/registrace-do-sluzeb`), ceny (`/kolik-stoji`). V době vydání (03/2026) umožňovaly veřejné sdílení asistentů jen ChatGPT a Google Gemini.
