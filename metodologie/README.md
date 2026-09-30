# Formativní hodnocení s AI — podklady pro prototyp (Tiny)

Sada Markdown souborů pro implementaci modulu formativního hodnocení. Vychází z metodiky **AI v praxi pedagoga: Využití chatbotů ve formativním hodnocení** (AI dětem, v06, 03/2026) a z metodologie **Vysvědčení JINAK** (PdF MU, doc. Jana Kratochvílová).

**Začni zde:** `metodika/00-jak-ai-pomaha-s-formativnim-hodnocenim.md` — vysvětluje celý proces, pořadí kroků a doporučení pro implementaci.

## Struktura

```
.
├── README.md
├── metodika/
│   └── 00-jak-ai-pomaha-s-formativnim-hodnocenim.md   ← přehled procesu (4 fáze + Rádce)
├── prompty/                                             ← systémové prompty jednotlivých rolí
│   ├── 01-asistent-formulace-vzdelavacich-cilu.md
│   ├── 02-asistent-formulace-kriterii-hodnoceni.md
│   ├── 03-asistent-gradace-kriterii-jctu.md
│   ├── 04-asistent-generovani-slovniho-hodnoceni.md
│   └── 05-radce-formulace-slovniho-hodnoceni.md
├── data/                                                ← znalostní soubory přikládané k promptům
│   ├── formulace-vzdelavacich-cilu.md
│   ├── spravna-formulace-kriterii-hodnoceni.md
│   ├── klicove-kompetence.md
│   ├── prurezova-temata.md
│   ├── jedinci-se-specialnimi-vzdelavacimi-potrebami.md
│   └── jak-psat-slovni-hodnoceni.md
└── vysvedceni-jinak/                                    ← přepis metodiky PdF MU po kapitolách
    ├── 00-prehled-a-mapa-metodiky.md
    ├── 01-jak-pracovat-s-metodikou.md
    ├── 02-pojeti-vysvedceni-a-zasady-hodnoceni.md
    ├── 03-prostredky-hodnoceni.md
    ├── 04-slovnicek-pouzitych-vyrazu.md
    ├── 05-hodnoceni-oblasti-chovani-zaka.md
    ├── 06-hodnoceni-v-teoretickych-predmetech.md
    ├── 07-hodnoceni-ve-vychovnych-predmetech.md
    └── 08-ukazky-prace-s-vysvedcenim.md
```

## Která role potřebuje jaký kontext

| Role | Systémový prompt | Znalostní soubory (do kontextu / RAG) |
|---|---|---|
| 1 · Vzdělávací cíl | `prompty/01-…` | `data/formulace-vzdelavacich-cilu.md`, `data/klicove-kompetence.md`, `data/prurezova-temata.md` |
| 2 · Kritéria hodnocení | `prompty/02-…` | `data/spravna-formulace-kriterii-hodnoceni.md`, `data/klicove-kompetence.md`, `data/prurezova-temata.md`; **jen při SVP:** `data/jedinci-se-specialnimi-vzdelavacimi-potrebami.md` |
| 3 · Škála JČTÚ | `prompty/03-…` | žádné (vše v promptu); volitelně `vysvedceni-jinak/06-…` kap. 6.3 |
| 4 · Slovní hodnocení | `prompty/04-…` | `data/jak-psat-slovni-hodnoceni.md`; doporučeno `vysvedceni-jinak/03-…` (3.2), `06-…` (6.2), `07-…` (příklady) |
| 5 · Rádce (kontrola) | `prompty/05-…` | `vysvedceni-jinak/02-…` až `07-…`; volitelně `data/jak-psat-slovni-hodnoceni.md` |

## Tok dat mezi kroky

```
[předmět, ročník, OVU z RVP, kontext, kompetence]
        │
        ▼  (role 1)
   vzdělávací cíl ──────────────────────────────┐
        │                                        │
        ▼  (role 2)  + ročník, předmět, [SVP]    │
   3 kritéria × {učitel, žák, [SVP]}             │
        │                                        │
        ▼  (role 3)                              │
   ke každému kritériu: J / Č / T / Ú            │
        │                                        │
        ▼  (role 4)  + důkazy o učení, info o žákovi (iniciály!)
   slovní hodnocení / zpětná vazba
        │
        ▼  (role 5, volitelně automaticky)
   připomínky Rádce (max 4 věty)
```

## Poznámky k původu souborů

- **prompty/** — přepis Google dokumentů „Formativní hodnocení — 01…05“ (Drive). Systémové prompty jsou ponechány doslovně; opraveny jen zjevné překlepy (uvedeno v každém souboru). Původní varianta „03 … ÚSTJ“ (obrácené pořadí písmen) je nahrazena platnou JČTÚ.
- **data/** — přepis `.txt` souborů, kterými byli krmeni původní GPT/Gem asistenti. Pseudo-nadpisy (`# H1 …`) převedeny na Markdown; obsah nezměněn. Soubor `pruzerova-temata_.txt` je zde pod správným názvem `prurezova-temata.md`.
- **vysvedceni-jinak/** — přepis Google dokumentů 0–8 (původně MD → Google Docs → zpět MD). Tabulky převedeny na Markdown tabulky.
- **metodika/** — nové srozumitelné vysvětlení napsané podle PDF metodiky AI dětem (v06, 03/2026).

## Autorství a licence

- Metodika AI v praxi pedagoga: Eva Nečasová, Michaela Bezděková, Šárka Polanecká (AI dětem, z.s.), CC BY 4.0.
- Rádce (05): systémový prompt Šárka Polanecká (ZŠ Pod Beckovem).
- Vysvědčení JINAK: Jana Kratochvílová et al., PdF MU, projekt TA ČR ÉTA TL05000360 — https://vysvedcenijinak.ped.muni.cz/
- Text „Jak psát slovní hodnocení na vysvědčení?“: Jana Kratochvílová.
