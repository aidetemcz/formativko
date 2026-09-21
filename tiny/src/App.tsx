import React, { useState, useRef, useEffect, useContext, createContext, useCallback } from "react";
import { initialClasses, type Class, type Student } from "./data";
import buddyImg from "./assets/buddy.png";

const BuddyContext = createContext<(msg: string) => void>(() => {});

interface TpGoal {
  id: string;
  text: string;
  subject: string;
  trida: string;
  month: string;
  rozsah: string;
  vystupy?: string;
  criteria: { id: string; label: string; desc: string }[];
}
interface GoalsCtx {
  tpGoals: TpGoal[];
  addTpGoals: (goals: TpGoal[]) => void;
  removeTpGoal: (id: string) => void;
  updateTpGoalText: (id: string, text: string) => void;
  navigateCile: () => void;
  animateIn: boolean;
}
const GoalsContext = createContext<GoalsCtx>({
  tpGoals: [], addTpGoals: () => {}, removeTpGoal: () => {}, updateTpGoalText: () => {}, navigateCile: () => {}, animateIn: false,
});

type StudentEvidence = { audio: number; photo: number };

interface EvidenceRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  type: "audio" | "photo";
  goalText: string;
  goalId: string;
  subject: string;
  date: string;
  criterion?: string;
  level?: string;
}

function er(id: string, studentId: string, studentName: string, className: string, type: "audio" | "photo", goalId: string, goalText: string, subject: string, date: string, criterion?: string, level?: string): EvidenceRecord {
  return { id, studentId, studentName, className, type, goalId, goalText, subject, date, criterion, level };
}

const sampleEvidenceRecords: EvidenceRecord[] = [
  er("e1","3a-1","Beneš, Adam","3.A","audio","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-09-10","Výběr výstižných slov","Zvládám"),
  er("e2","3a-1","Beneš, Adam","3.A","photo","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-09-10","Uspořádání textu","Rozvíjím"),
  er("e3","3a-2","Blahová, Anežka","3.A","audio","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-09-11","Stavba vět","Zvládám"),
  er("e4","3a-3","Čermáková, Barbora","3.A","photo","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-09-11","Výběr výstižných slov","Začínám"),
  er("e5","3a-4","Dvořák, Daniel","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-09-05","Zpaměťové počítání","Zvládám"),
  er("e6","3a-4","Dvořák, Daniel","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-09-06","Strategie odečítání","Rozvíjím"),
  er("e7","3a-5","Fišerová, Eliška","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-09-07","Zpaměťové počítání","Rozvíjím"),
  er("e8","3a-6","Hájek, Filip","3.A","photo","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-09-12","Uspořádání textu","Zvládám"),
  er("e9","3a-7","Horáková, Gabriela","3.A","audio","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-09-12","Stavba vět","Rozvíjím"),
  er("e10","3a-8","Jelínek, Jan","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-08-28","Název a funkce orgánů","Zvládám"),
  er("e11","3a-9","Kopecká, Karolína","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-08-28","Název a funkce orgánů","Rozvíjím"),
  er("e12","3a-10","Kratochvíl, Lukáš","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-08-29","Popis pohybového aparátu","Začínám"),
  er("e13","3a-11","Křížková, Marie","3.A","audio","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-09-15","Výběr výstižných slov","Zvládám"),
  er("e14","3a-12","Macháček, Martin","3.A","photo","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-09-15","Uspořádání textu","Rozvíjím"),
  er("e15","3a-13","Marková, Natálie","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-08-20","Strategie odečítání","Zvládám"),
  er("e16","3a-14","Novák, Ondřej","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-08-20"),
  er("e17","3a-15","Pokorná, Petra","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-08-21"),
  er("e18","3a-16","Procházka, Radek","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-07-10"),
  er("e19","3a-17","Růžičková, Simona","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-07-11"),
  er("e20","3a-18","Sedláčková, Tereza","3.A","audio","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-09-16"),
  er("e21","3a-19","Svoboda, Tomáš","3.A","photo","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-09-16"),
  er("e22","3a-20","Šimánková, Veronika","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-06-05"),
  er("e23","3a-21","Veselý, Vojtěch","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-06-06"),
  er("e24","3a-1","Beneš, Adam","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-06-10"),
  er("e25","3a-2","Blahová, Anežka","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-06-10"),
  er("e26","3a-3","Čermáková, Barbora","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-06-11"),
  er("e27","3a-5","Fišerová, Eliška","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-04-15"),
  er("e28","3a-6","Hájek, Filip","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-04-15"),
  er("e29","3a-7","Horáková, Gabriela","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-04-16"),
  er("e30","3a-8","Jelínek, Jan","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-04-16"),
  er("e31","3a-9","Kopecká, Karolína","3.A","photo","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-03-20"),
  er("e32","3a-10","Kratochvíl, Lukáš","3.A","audio","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-03-20"),
  er("e33","3a-11","Křížková, Marie","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-02-12"),
  er("e34","3a-12","Macháček, Martin","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-02-12"),
  er("e35","3a-13","Marková, Natálie","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2025-11-08"),
  er("e36","3a-14","Novák, Ondřej","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2025-11-08"),
  er("e37","3a-15","Pokorná, Petra","3.A","photo","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2025-10-22"),
  er("e38","3a-16","Procházka, Radek","3.A","audio","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2025-10-22"),
  er("e39","3a-17","Růžičková, Simona","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2025-12-03"),
  er("e40","3a-18","Sedláčková, Tereza","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2025-12-03"),
  er("e41","3a-19","Svoboda, Tomáš","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-01-14"),
  er("e42","3a-20","Šimánková, Veronika","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-01-14"),
  er("e43","3a-21","Veselý, Vojtěch","3.A","photo","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2025-10-05"),

  // druhá sada — různé předměty, kritéria, úrovně, typy
  er("e44","3a-1","Beneš, Adam","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-08-15","Název a funkce orgánů","Zvládám"),
  er("e45","3a-1","Beneš, Adam","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-06-18","Rozpoznání tvarů","Rozvíjím"),
  er("e46","3a-2","Blahová, Anežka","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-09-03","Zpaměťové počítání","Zvládám"),
  er("e47","3a-2","Blahová, Anežka","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-04-20","Fáze životního cyklu","Rozvíjím"),
  er("e48","3a-3","Čermáková, Barbora","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-08-30","Strategie odečítání","Rozvíjím"),
  er("e49","3a-3","Čermáková, Barbora","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-04-22","Podmínky růstu","Začínám"),
  er("e50","3a-4","Dvořák, Daniel","3.A","photo","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-09-14","Stavba vět","Začínám"),
  er("e51","3a-4","Dvořák, Daniel","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-07-20","Popis pohybového aparátu","Rozvíjím"),
  er("e52","3a-5","Fišerová, Eliška","3.A","photo","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-09-09","Výběr výstižných slov","Zvládám"),
  er("e53","3a-5","Fišerová, Eliška","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-06-14","Pojmenování tvarů","Zvládám"),
  er("e54","3a-6","Hájek, Filip","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-09-01","Zpaměťové počítání","Rozvíjím"),
  er("e55","3a-6","Hájek, Filip","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-08-10","Název a funkce orgánů","Začínám"),
  er("e56","3a-7","Horáková, Gabriela","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-06-08","Rozpoznání tvarů","Zvládám"),
  er("e57","3a-7","Horáková, Gabriela","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-04-18","Podmínky růstu","Rozvíjím"),
  er("e58","3a-8","Jelínek, Jan","3.A","audio","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-09-13","Stavba vět","Zvládám"),
  er("e59","3a-8","Jelínek, Jan","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-08-22","Strategie odečítání","Zvládám"),
  er("e60","3a-9","Kopecká, Karolína","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-05-28","Pojmenování tvarů","Rozvíjím"),
  er("e61","3a-9","Kopecká, Karolína","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-04-25","Fáze životního cyklu","Zvládám"),
  er("e62","3a-10","Kratochvíl, Lukáš","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-06-03","Rozpoznání tvarů","Začínám"),
  er("e63","3a-10","Kratochvíl, Lukáš","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-04-12","Podmínky růstu","Rozvíjím"),
  er("e64","3a-11","Křížková, Marie","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-07-15","Popis pohybového aparátu","Zvládám"),
  er("e65","3a-11","Křížková, Marie","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-05-30","Pojmenování tvarů","Zvládám"),
  er("e66","3a-12","Macháček, Martin","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-08-05","Název a funkce orgánů","Rozvíjím"),
  er("e67","3a-12","Macháček, Martin","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-06-02","Rozpoznání tvarů","Zvládám"),
  er("e68","3a-13","Marková, Natálie","3.A","photo","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-09-17","Výběr výstižných slov","Rozvíjím"),
  er("e69","3a-13","Marková, Natálie","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-04-10","Fáze životního cyklu","Začínám"),
  er("e70","3a-14","Novák, Ondřej","3.A","photo","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-09-14","Stavba vět","Zvládám"),
  er("e71","3a-14","Novák, Ondřej","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-05-25","Pojmenování tvarů","Rozvíjím"),
  er("e72","3a-15","Pokorná, Petra","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-07-08","Název a funkce orgánů","Zvládám"),
  er("e73","3a-15","Pokorná, Petra","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-04-08","Podmínky růstu","Zvládám"),
  er("e74","3a-16","Procházka, Radek","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-09-02","Zpaměťové počítání","Začínám"),
  er("e75","3a-16","Procházka, Radek","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-06-01","Rozpoznání tvarů","Rozvíjím"),
  er("e76","3a-17","Růžičková, Simona","3.A","audio","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-09-11","Uspořádání textu","Zvládám"),
  er("e77","3a-17","Růžičková, Simona","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-08-12","Popis pohybového aparátu","Rozvíjím"),
  er("e78","3a-18","Sedláčková, Tereza","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-08-18","Strategie odečítání","Zvládám"),
  er("e79","3a-18","Sedláčková, Tereza","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-04-07","Fáze životního cyklu","Rozvíjím"),
  er("e80","3a-19","Svoboda, Tomáš","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-08-25","Zpaměťové počítání","Rozvíjím"),
  er("e81","3a-19","Svoboda, Tomáš","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-07-22","Název a funkce orgánů","Zvládám"),
  er("e82","3a-20","Šimánková, Veronika","3.A","photo","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2026-09-08","Výběr výstižných slov","Rozvíjím"),
  er("e83","3a-20","Šimánková, Veronika","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-04-06","Podmínky růstu","Zvládám"),
  er("e84","3a-21","Veselý, Vojtěch","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-09-04","Strategie odečítání","Zvládám"),
  er("e85","3a-21","Veselý, Vojtěch","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-04-14","Fáze životního cyklu","Rozvíjím"),

  // třetí sada — starší záznamy, různorodé typy (bez kritéria = čistá audio/foto)
  er("e86","3a-1","Beneš, Adam","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-01-20"),
  er("e87","3a-2","Blahová, Anežka","3.A","audio","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2025-10-14"),
  er("e88","3a-3","Čermáková, Barbora","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2025-12-10","Pojmenování tvarů","Rozvíjím"),
  er("e89","3a-4","Dvořák, Daniel","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-01-18"),
  er("e90","3a-5","Fišerová, Eliška","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-02-05","Zpaměťové počítání","Začínám"),
  er("e91","3a-6","Hájek, Filip","3.A","audio","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2025-10-28","Stavba vět","Rozvíjím"),
  er("e92","3a-7","Horáková, Gabriela","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-02-18"),
  er("e93","3a-8","Jelínek, Jan","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2025-12-15","Rozpoznání tvarů","Zvládám"),
  er("e94","3a-9","Kopecká, Karolína","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-02-20","Strategie odečítání","Zvládám"),
  er("e95","3a-10","Kratochvíl, Lukáš","3.A","audio","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2025-10-30"),
  er("e96","3a-11","Křížková, Marie","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-01-10","Fáze životního cyklu","Zvládám"),
  er("e97","3a-12","Macháček, Martin","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-01-12"),
  er("e98","3a-13","Marková, Natálie","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2025-12-08","Pojmenování tvarů","Rozvíjím"),
  er("e99","3a-14","Novák, Ondřej","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-01-16","Podmínky růstu","Začínám"),
  er("e100","3a-15","Pokorná, Petra","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2025-12-01"),
  er("e101","3a-16","Procházka, Radek","3.A","audio","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2025-10-20","Výběr výstižných slov","Začínám"),
  er("e102","3a-17","Růžičková, Simona","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-01-08"),
  er("e103","3a-18","Sedláčková, Tereza","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2025-11-20","Popis pohybového aparátu","Zvládám"),
  er("e104","3a-19","Svoboda, Tomáš","3.A","photo","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2025-10-10"),
  er("e105","3a-20","Šimánková, Veronika","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2025-11-25","Název a funkce orgánů","Rozvíjím"),
  er("e106","3a-21","Veselý, Vojtěch","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-02-08","Zpaměťové počítání","Rozvíjím"),
  er("e107","3a-1","Beneš, Adam","3.A","audio","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2025-10-08","Uspořádání textu","Zvládám"),
  er("e108","3a-2","Blahová, Anežka","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2025-11-12","Název a funkce orgánů","Zvládám"),
  er("e109","3a-3","Čermáková, Barbora","3.A","audio","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2025-10-18"),
  er("e110","3a-4","Dvořák, Daniel","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2025-12-20","Rozpoznání tvarů","Zvládám"),
  er("e111","3a-5","Fišerová, Eliška","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2025-11-15","Popis pohybového aparátu","Rozvíjím"),
  er("e112","3a-6","Hájek, Filip","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-01-06","Fáze životního cyklu","Začínám"),
  er("e113","3a-7","Horáková, Gabriela","3.A","audio","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2025-10-16","Výběr výstižných slov","Zvládám"),
  er("e114","3a-8","Jelínek, Jan","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2025-11-10"),
  er("e115","3a-9","Kopecká, Karolína","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2025-12-18","Pojmenování tvarů","Začínám"),
  er("e116","3a-10","Kratochvíl, Lukáš","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-02-15","Strategie odečítání","Rozvíjím"),
  er("e117","3a-11","Křížková, Marie","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2025-12-06","Rozpoznání tvarů","Zvládám"),
  er("e118","3a-12","Macháček, Martin","3.A","photo","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2025-10-25","Stavba vět","Rozvíjím"),
  er("e119","3a-13","Marková, Natálie","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2025-11-06","Název a funkce orgánů","Zvládám"),
  er("e120","3a-14","Novák, Ondřej","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-02-10"),
  er("e121","3a-15","Pokorná, Petra","3.A","audio","g1","Dokážu napsat srozumitelný text o mém oblíbeném zvířeti","Čeština","2025-10-24","Uspořádání textu","Začínám"),
  er("e122","3a-16","Procházka, Radek","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-01-04","Podmínky růstu","Rozvíjím"),
  er("e123","3a-17","Růžičková, Simona","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-02-22","Zpaměťové počítání","Zvládám"),
  er("e124","3a-18","Sedláčková, Tereza","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2025-12-12"),
  er("e125","3a-19","Svoboda, Tomáš","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2026-01-22","Fáze životního cyklu","Zvládám"),
  er("e126","3a-20","Šimánková, Veronika","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-02-28","Strategie odečítání","Rozvíjím"),
  er("e127","3a-21","Veselý, Vojtěch","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2025-11-18","Popis pohybového aparátu","Zvládám"),
];

interface EvidenceCtx {
  studentEvidence: Record<string, StudentEvidence>;
  addStudentEvidence: (studentId: string, type: "audio" | "photo") => void;
  evidenceRecords: EvidenceRecord[];
  addEvidenceRecords: (records: EvidenceRecord[]) => void;
}
const EvidenceContext = createContext<EvidenceCtx>({
  studentEvidence: {},
  addStudentEvidence: () => {},
  evidenceRecords: [],
  addEvidenceRecords: () => {},
});

// ─── ai hint wrapper ──────────────────────────────────────────────────────────

// 4-pointed sparkle SVG used in AI hint button
function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      {/* large 4-pointed star */}
      <path d="M9 1C9 1 9.5 5.5 7 8C4.5 10.5 1 10 1 10C1 10 4.5 9.5 7 12C9.5 14.5 9 19 9 19C9 19 9.5 14.5 12 12C14.5 9.5 17 10 17 10C17 10 14.5 10.5 12 8C9.5 5.5 9 1 9 1Z" fill="white"/>
      {/* small 4-pointed star */}
      <path d="M15.5 3C15.5 3 15.75 5 14.5 6.25C13.25 7.5 11 7.5 11 7.5C11 7.5 13.25 7.25 14.5 8.5C15.75 9.75 15.5 12 15.5 12C15.5 12 15.75 9.75 17 8.5C18.25 7.25 20 7.5 20 7.5C20 7.5 18.25 7.5 17 6.25C15.75 5 15.5 3 15.5 3Z" fill="white" opacity="0.85"/>
    </svg>
  );
}

function AIHint({ children, message, inline }: { children: React.ReactNode; message: string; inline?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const openBuddy = useContext(BuddyContext);
  // Extend left edge 38px so moving mouse toward the icon stays inside the hover zone
  return (
    <div
      style={{
        position: "relative",
        display: inline ? "inline-block" : "block",
        marginLeft: -38,
        paddingLeft: 38,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() => openBuddy(message)}
        title="Otevřít Buddy AI"
        style={{
          position: "absolute", left: 6, top: "50%",
          transform: `translateY(-50%) scale(${hovered ? 1 : 0.75})`,
          width: 26, height: 26, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "linear-gradient(135deg, #a855f7, #7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 10px rgba(124,58,237,0.4)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.14s ease, transform 0.14s ease",
          zIndex: 20,
        }}
      >
        <SparkleIcon />
      </button>
      {children}
    </div>
  );
}

// ─── icons ───────────────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="5.333" stroke="#717182" strokeWidth="1.33" />
      <path d="M11 11l3 3" stroke="#717182" strokeWidth="1.33" strokeLinecap="round" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 2.667v10.666M2.667 8h10.666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M11.333 2a1.886 1.886 0 0 1 2.667 2.667L4.667 14H2v-2.667L11.333 2z" stroke="#717182" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M5.333 4V2.667a.667.667 0 0 1 .667-.667h4a.667.667 0 0 1 .667.667V4M12.667 4l-.667 9.333A1.333 1.333 0 0 1 10.667 14H5.333A1.333 1.333 0 0 1 4 13.333L3.333 4" stroke="#717182" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBack() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 12L6 8l4-4" stroke="#717182" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke="#717182" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── modal ────────────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
  width = 400,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0,0,0,0.25)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-lg"
        style={{ width, padding: "28px 28px 24px", border: "1px solid rgba(0,0,0,0.09)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 18, color: "#0a0a0a", marginBottom: 20 }}>
          {title}
        </p>
        {children}
      </div>
    </div>
  );
}

function ModalInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, color: "#717182", marginBottom: 6, letterSpacing: "0.02em" }}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", boxSizing: "border-box", padding: "12px 12px",
          borderRadius: 10, border: "1px solid rgba(0,0,0,0.14)",
          fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, color: "#0a0a0a",
          background: "#fafafa", outline: "none",
        }}
      />
    </div>
  );
}

function ModalActions({ onCancel, onConfirm, confirmLabel, danger }: {
  onCancel: () => void; onConfirm: () => void; confirmLabel: string; danger?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
      <button onClick={onCancel} style={btnStyle("ghost")}>Zrušit</button>
      <button onClick={onConfirm} style={btnStyle(danger ? "danger" : "primary")}>{confirmLabel}</button>
    </div>
  );
}

function btnStyle(variant: "primary" | "ghost" | "danger"): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "11px 16px", borderRadius: 10, border: "none", cursor: "pointer",
    fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15,
    transition: "opacity 0.15s",
  };
  if (variant === "primary") return { ...base, background: "#0a0a0a", color: "#fff" };
  if (variant === "danger") return { ...base, background: "#dc2626", color: "#fff" };
  return { ...base, background: "rgba(236,236,240,0.8)", color: "#0a0a0a" };
}

// ─── breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({ crumbs }: { crumbs: { label: string; onClick?: () => void }[] }) {
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
      {crumbs.map((crumb, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {i > 0 && (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.35 }}>
              <path d="M6 4l4 4-4 4" stroke="#717182" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {crumb.onClick ? (
            <button
              onClick={crumb.onClick}
              style={{
                background: "none", border: "none", padding: 0, cursor: "pointer",
                fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0a0a0a")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#717182")}
            >
              {crumb.label}
            </button>
          ) : (
            <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#0a0a0a" }}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ─── nav data ─────────────────────────────────────────────────────────────────

type NavItem = "tridy" | "cile" | "dukazy" | "hodnoceni" | "tematicky-plan" | "tinyboti" | "lekce" | "asistenti" | "navody" | "zpetna-vazba";

// nav items v2
const navItems: { id: NavItem; label: string; icon: React.ReactNode }[] = [
  {
    id: "tematicky-plan",
    label: "Tématický plán",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 3.333C2 2.597 2.597 2 3.333 2h9.334C13.403 2 14 2.597 14 3.333v9.334C14 13.403 13.403 14 12.667 14H3.333C2.597 14 2 13.403 2 12.667V3.333z" stroke="currentColor" strokeWidth="1.33" strokeLinejoin="round"/>
        <path d="M5.333 5.333h5.334M5.333 8h5.334M5.333 10.667h3.334" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
        <path d="M5.333 2v12" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" opacity="0.35"/>
      </svg>
    ),
  },
  {
    id: "cile",
    label: "Vyučovací hodiny",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 3C6.5 2 4.5 2 2 3v9c2.5-1 4.5-1 6-0.5M8 3c1.5-1 3.5-1 6 0v9c-2.5-1-4.5-1-6 0.5M8 3v9.5" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "tridy",
    label: "Třídy",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M13.333 2H2.667C1.93 2 1.333 2.597 1.333 3.333v9.334C1.333 13.403 1.93 14 2.667 14h10.666c.737 0 1.334-.597 1.334-1.333V3.333C14.667 2.597 14.07 2 13.333 2z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.333 5.333h5.334M5.333 8h3.334" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "dukazy",
    label: "Důkazy o učení",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10.667 2H5.333A1.333 1.333 0 0 0 4 3.333v9.334A1.333 1.333 0 0 0 5.333 14h5.334A1.333 1.333 0 0 0 12 12.667V3.333A1.333 1.333 0 0 0 10.667 2z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.667 5.333h2.666M6.667 8h2.666M6.667 10.667h1.333" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "hodnoceni",
    label: "Hodnocení",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.333L9.857 5.1l4.143.6-3 2.924.708 4.109L8 10.667l-3.708 1.966L5 8.624 2 5.7l4.143-.6L8 1.333z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

// ─── třídy view ───────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2);
}

// ─── evidence types ───────────────────────────────────────────────────────────

type EvidenceType = "note" | "audio" | "photo" | "file" | "criterion";

interface Evidence {
  id: string;
  type: EvidenceType;
  date: string;
  goal: string;
  note?: string;
  criterion?: string;
  level?: string;
  fileName?: string;
  duration?: string;
}

const sampleEvidence: Record<string, Evidence[]> = {
  "3a-3": [
    {
      id: "e1", type: "note", date: "4. 9. 2025", goal: "Dokážu napsat srozumitelný text o mém oblíbeném zvířeti",
      criterion: "Výběr výstižných slov",
      note: "Barbora použila opravdu pěkná přídavná jména – popisovala srst kočky jako 'hedvábně měkkou'. Text byl čtivý a čtenář si zvíře dokázal představit.",
    },
    {
      id: "e2", type: "criterion", date: "4. 9. 2025", goal: "Dokážu napsat srozumitelný text o mém oblíbeném zvířeti",
      criterion: "Uspořádání textu", level: "Rozvíjím",
    },
    {
      id: "e3", type: "criterion", date: "4. 9. 2025", goal: "Dokážu napsat srozumitelný text o mém oblíbeném zvířeti",
      criterion: "Stavba vět", level: "Zvládám",
    },
    {
      id: "e4", type: "photo", date: "4. 9. 2025", goal: "Dokážu napsat srozumitelný text o mém oblíbeném zvířeti",
      note: "Fotografie psaného textu z hodiny.", fileName: "foto_text_barbora.jpg",
    },
    {
      id: "e5", type: "audio", date: "28. 8. 2025", goal: "Dokážu napsat srozumitelný text o mém oblíbeném zvířeti",
      note: "Barbora přečetla svůj text nahlas. Plynulé čtení, správná intonace.", duration: "1:24",
    },
  ],
  "3a-7": [
    {
      id: "e6", type: "note", date: "4. 9. 2025", goal: "Dokážu napsat srozumitelný text o mém oblíbeném zvířeti",
      criterion: "Srozumitelnost textu",
      note: "Gabriela popsala morče podrobně, ale některé věty byly příliš dlouhé a ztrácely nit. Domluvily jsme se, že příště zkusí kratší věty.",
    },
    {
      id: "e7", type: "criterion", date: "4. 9. 2025", goal: "Dokážu napsat srozumitelný text o mém oblíbeném zvířeti",
      criterion: "Popis vzhledu", level: "Zvládám",
    },
    {
      id: "e8", type: "file", date: "4. 9. 2025", goal: "Dokážu napsat srozumitelný text o mém oblíbeném zvířeti",
      note: "Naskenovaný pracovní list.", fileName: "pracovni_list_gabriela.pdf",
    },
  ],
};

// ─── student profile ──────────────────────────────────────────────────────────

function EvidenceIcon({ type }: { type: EvidenceType }) {
  if (type === "audio") return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.667" stroke="#717182" strokeWidth="1.2" />
      <path d="M6 5.5v5l4.5-2.5L6 5.5z" fill="#717182" />
    </svg>
  );
  if (type === "photo") return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="1.333" y="3.333" width="13.333" height="9.333" rx="1.333" stroke="#717182" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="2" stroke="#717182" strokeWidth="1.2" />
      <path d="M5.333 3.333l1-2h3.333l1 2" stroke="#717182" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (type === "file") return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M9.333 1.333H4A1.333 1.333 0 0 0 2.667 2.667v10.666A1.333 1.333 0 0 0 4 14.667h8a1.333 1.333 0 0 0 1.333-1.334V5.333L9.333 1.333z" stroke="#717182" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.333 1.333v4h4" stroke="#717182" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (type === "criterion") return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2.667 8l3.333 3.333 7.333-6.666" stroke="#717182" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M13.333 2H2.667C1.93 2 1.333 2.597 1.333 3.333v9.334C1.333 13.403 1.93 14 2.667 14h10.666c.737 0 1.334-.597 1.334-1.333V3.333C14.667 2.597 14.07 2 13.333 2z" stroke="#717182" strokeWidth="1.2" />
      <path d="M5.333 5.333h5.334M5.333 8h3.334" stroke="#717182" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function evidenceLabel(type: EvidenceType) {
  if (type === "note") return "Poznámka";
  if (type === "audio") return "Audio nahrávka";
  if (type === "photo") return "Fotografie";
  if (type === "file") return "Soubor";
  if (type === "criterion") return "Kritérium a úroveň";
  return "Důkaz";
}

function levelBadgeColor(level: string): { bg: string; color: string } {
  if (level === "Zvládám") return { bg: "#dcfce7", color: "#166534" };
  if (level === "Rozvíjím") return { bg: "#fef9c3", color: "#854d0e" };
  return { bg: "rgba(236,236,240,0.8)", color: "#717182" };
}

function EvidenceCard({ ev, hideGoal }: { ev: Evidence; hideGoal?: boolean }) {
  const lc = ev.level ? levelBadgeColor(ev.level) : null;
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.09)", padding: "21px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: ev.note || ev.level ? 10 : 0 }}>
        <EvidenceIcon type={ev.type} />
        <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a" }}>
          {evidenceLabel(ev.type)}
        </span>
        {ev.criterion && (
          <span style={{ padding: "3px 8px", borderRadius: 20, background: "rgba(236,236,240,0.8)", color: "#717182", fontFamily: "'Inter:Regular', sans-serif", fontSize: 13 }}>
            {ev.criterion}
          </span>
        )}
        {ev.level && lc && (
          <span style={{ padding: "3px 8px", borderRadius: 20, background: lc.bg, color: lc.color, fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13 }}>
            {ev.level}
          </span>
        )}
        <span style={{ marginLeft: "auto", fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#b0b0bc" }}>{ev.date}</span>
      </div>
      {!hideGoal && (
        <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#a0a0b0", margin: "0 0 6px", fontStyle: "italic" }}>
          {ev.goal}
        </p>
      )}
      {ev.note && <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#3a3a4a", lineHeight: 1.7, margin: 0 }}>{ev.note}</p>}
      {ev.duration && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.667" stroke="#b0b0bc" strokeWidth="1.2" />
            <path d="M8 5.333V8l1.667 1.667" stroke="#b0b0bc" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#b0b0bc" }}>{ev.duration}</span>
        </div>
      )}
      {ev.fileName && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8, padding: "8px 10px", borderRadius: 8, background: "rgba(236,236,240,0.5)" }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M9.333 1.333H4A1.333 1.333 0 0 0 2.667 2.667v10.666A1.333 1.333 0 0 0 4 14.667h8a1.333 1.333 0 0 0 1.333-1.334V5.333L9.333 1.333z" stroke="#717182" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.333 1.333v4h4" stroke="#717182" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182" }}>{ev.fileName}</span>
        </div>
      )}
    </div>
  );
}

type ProfileView = "type" | "goal";

function StudentProfile({
  student,
  className,
  onBack,
}: {
  student: Student;
  className: string;
  onBack: () => void;
}) {
  const { evidenceRecords } = useContext(EvidenceContext);
  const { tpGoals } = useContext(GoalsContext);
  const goalNums = buildGoalNumbers(tpGoals);
  const studentRecords = [...evidenceRecords]
    .filter(r => r.studentId === student.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const [view, setView] = useState<"goal" | "all">("all");

  const byGoal: Record<string, EvidenceRecord[]> = {};
  studentRecords.forEach(r => { (byGoal[r.goalText] ??= []).push(r); });
  const groups = Object.entries(byGoal);

  return (
    <div style={{ padding: "32px 40px" }}>
      <Breadcrumb crumbs={[
        { label: "Formativní hodnocení" },
        { label: "Třídy", onClick: onBack },
        { label: `Třída ${className}`, onClick: onBack },
        { label: `${student.firstName} ${student.lastName}` },
      ]} />

      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", background: avatarColor(student.lastName),
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 19, color: "#fff", flexShrink: 0,
          }}>
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div>
            <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 24, color: "#0a0a0a", margin: "0 0 2px" }}>
              {student.firstName} {student.lastName}
            </h1>
            <span style={{ padding: "3px 9px", borderRadius: 20, background: "rgba(236,236,240,0.9)", color: "#717182", fontFamily: "'Inter:Regular', sans-serif", fontSize: 14 }}>
              {className}
            </span>
          </div>
        </div>

        {/* view toggle */}
        <div style={{ display: "flex", gap: 6, background: "rgba(236,236,240,0.6)", borderRadius: 9, padding: 3 }}>
          {([["all", "Vše"], ["goal", "Podle cíle"]] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "8px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                fontFamily: view === v ? "'Inter:Medium', sans-serif" : "'Inter:Regular', sans-serif",
                fontWeight: view === v ? 500 : 400, fontSize: 14,
                background: view === v ? "#fff" : "transparent",
                color: view === v ? "#0a0a0a" : "#717182",
                boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                transition: "background 0.12s, color 0.12s",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* evidence */}
      {studentRecords.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.09)", padding: "28px 24px", fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, color: "#717182" }}>
          Zatím žádné důkazy nebyly zaznamenány.
        </div>
      ) : view === "all" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {studentRecords.map(r => <EvidenceRecordCard key={r.id} r={r} goalNums={goalNums} hideStudent />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {groups.map(([goalText, items]) => (
            <div key={goalText}>
              <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#717182", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 10px" }}>
                {goalText.length > 80 ? goalText.slice(0, 78) + "…" : goalText}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map(r => <EvidenceRecordCard key={r.id} r={r} goalNums={goalNums} hideStudent />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassesView() {
  const { studentEvidence } = useContext(EvidenceContext);
  const [classes, setClasses] = useState<Class[]>(initialClasses);
  const [search, setSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // modals – class level
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [addClassDragOver, setAddClassDragOver] = useState(false);
  const [addClassDropped, setAddClassDropped] = useState<string | null>(null);
  const [editClassOpen, setEditClassOpen] = useState(false);
  const [deleteClassOpen, setDeleteClassOpen] = useState(false);
  const [classNameInput, setClassNameInput] = useState("");

  // modals – student level
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [editStudentOpen, setEditStudentOpen] = useState(false);
  const [deleteStudentOpen, setDeleteStudentOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentLastName, setStudentLastName] = useState("");
  const [targetStudentId, setTargetStudentId] = useState<string | null>(null);

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null;

  const filtered = classes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredStudents = selectedClass
    ? [...selectedClass.students]
        .sort((a, b) => a.lastName.localeCompare(b.lastName, "cs"))
        .filter(
          (s) =>
            `${s.firstName} ${s.lastName}`
              .toLowerCase()
              .includes(studentSearch.toLowerCase()) ||
            `${s.lastName} ${s.firstName}`
              .toLowerCase()
              .includes(studentSearch.toLowerCase())
        )
    : [];

  // ── class actions ──
  function handleAddClass() {
    if (!classNameInput.trim()) return;
    setClasses((prev) => [
      ...prev,
      { id: uid(), name: classNameInput.trim(), students: [] },
    ]);
    setClassNameInput("");
    setAddClassOpen(false);
  }

  function handleEditClass() {
    if (!classNameInput.trim() || !selectedClassId) return;
    setClasses((prev) =>
      prev.map((c) =>
        c.id === selectedClassId ? { ...c, name: classNameInput.trim() } : c
      )
    );
    setEditClassOpen(false);
  }

  function handleDeleteClass() {
    setClasses((prev) => prev.filter((c) => c.id !== selectedClassId));
    setSelectedClassId(null);
    setDeleteClassOpen(false);
  }

  // ── student actions ──
  function handleAddStudent() {
    if (!studentFirstName.trim() || !studentLastName.trim() || !selectedClassId) return;
    const student: Student = {
      id: uid(),
      firstName: studentFirstName.trim(),
      lastName: studentLastName.trim(),
    };
    setClasses((prev) =>
      prev.map((c) =>
        c.id === selectedClassId ? { ...c, students: [...c.students, student] } : c
      )
    );
    setStudentFirstName("");
    setStudentLastName("");
    setAddStudentOpen(false);
  }

  function handleEditStudent() {
    if (!studentFirstName.trim() || !studentLastName.trim() || !selectedClassId || !targetStudentId) return;
    setClasses((prev) =>
      prev.map((c) =>
        c.id === selectedClassId
          ? {
              ...c,
              students: c.students.map((s) =>
                s.id === targetStudentId
                  ? { ...s, firstName: studentFirstName.trim(), lastName: studentLastName.trim() }
                  : s
              ),
            }
          : c
      )
    );
    setEditStudentOpen(false);
  }

  function handleDeleteStudent() {
    if (!selectedClassId || !targetStudentId) return;
    setClasses((prev) =>
      prev.map((c) =>
        c.id === selectedClassId
          ? { ...c, students: c.students.filter((s) => s.id !== targetStudentId) }
          : c
      )
    );
    setDeleteStudentOpen(false);
  }

  function openEditStudent(student: Student) {
    setTargetStudentId(student.id);
    setStudentFirstName(student.firstName);
    setStudentLastName(student.lastName);
    setEditStudentOpen(true);
  }

  function openDeleteStudent(student: Student) {
    setTargetStudentId(student.id);
    setDeleteStudentOpen(true);
  }

  // ─── student profile view ─────────────────────────────────────────────────
  const selectedStudent = selectedClass?.students.find((s) => s.id === selectedStudentId) ?? null;
  if (selectedStudent && selectedClass) {
    return (
      <StudentProfile
        student={selectedStudent}
        className={selectedClass.name}
        onBack={() => setSelectedStudentId(null)}
      />
    );
  }

  // ─── class list view ──────────────────────────────────────────────────────
  if (!selectedClass) {
    return (
      <div style={{ padding: "32px 40px" }}>
        <Breadcrumb crumbs={[{ label: "Formativní hodnocení" }, { label: "Třídy" }]} />
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 24, color: "#0a0a0a", margin: 0 }}>
            Třídy
          </h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" }}>
                <IconSearch />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Hledat třídu…"
                style={{
                  paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  borderRadius: 10, border: "1px solid rgba(0,0,0,0.13)",
                  fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a",
                  background: "#fff", width: 200, outline: "none",
                }}
              />
            </div>
            <button
              onClick={() => { setClassNameInput(""); setAddClassOpen(true); }}
              style={{ ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 8 }}
            >
              <IconPlus />
              Přidat třídu
            </button>
          </div>
        </div>

        {/* list */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.09)", overflow: "hidden" }}>
          {filtered.length === 0 && (
            <p style={{ padding: "24px 20px", fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, color: "#717182" }}>
              Žádná třída nebyla nalezena.
            </p>
          )}
          {filtered.map((cls, i) => (
            <button
              key={cls.id}
              onClick={() => { setSelectedClassId(cls.id); setStudentSearch(""); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "19px 20px", background: "transparent", border: "none",
                borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.07)",
                cursor: "pointer", textAlign: "left",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(236,236,240,0.35)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: "rgba(236,236,240,0.7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a",
                }}>
                  {cls.name}
                </div>
                <div>
                  <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 16, color: "#0a0a0a", margin: 0 }}>
                    Třída {cls.name}
                  </p>
                  <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", margin: "2px 0 0" }}>
                    {cls.students.length} {studentCountLabel(cls.students.length)}
                  </p>
                </div>
              </div>
              <IconChevronRight />
            </button>
          ))}
        </div>

        {/* add class modal */}
        {addClassOpen && (
          <Modal title="Přidat třídu" onClose={() => { setAddClassOpen(false); setAddClassDropped(null); }} width={520}>
            <ModalInput label="Název třídy" value={classNameInput} onChange={setClassNameInput} placeholder="např. 6.C" />

            {/* school systems */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, color: "#717182", letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 10px" }}>
                Nahrát ze školního systému
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { name: "Bakaláři", color: "#1e40af" },
                  { name: "iSAS", color: "#7c3aed" },
                  { name: "Edookit", color: "#0891b2" },
                  { name: "Škola OnLine", color: "#059669" },
                  { name: "DM Evidence", color: "#d97706" },
                  { name: "SAS", color: "#dc2626" },
                ].map(sys => (
                  <button
                    key={sys.name}
                    style={{
                      padding: "10px 14px", borderRadius: 8,
                      border: `1.5px solid ${sys.color}22`,
                      background: `${sys.color}0d`,
                      fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15,
                      color: sys.color, cursor: "pointer", transition: "background 0.12s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${sys.color}1a`)}
                    onMouseLeave={e => (e.currentTarget.style.background = `${sys.color}0d`)}
                  >
                    {sys.name}
                  </button>
                ))}
              </div>
            </div>

            {/* drag & drop zone */}
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, color: "#717182", letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 10px" }}>
                Nebo nahrát soubor
              </p>
              <div
                onDragOver={e => { e.preventDefault(); setAddClassDragOver(true); }}
                onDragLeave={() => setAddClassDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setAddClassDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) setAddClassDropped(file.name);
                }}
                style={{
                  border: `2px dashed ${addClassDragOver ? "#0a0a0a" : "rgba(0,0,0,0.15)"}`,
                  borderRadius: 12,
                  padding: "24px 20px",
                  textAlign: "center",
                  background: addClassDragOver ? "rgba(10,10,10,0.03)" : "#fafafa",
                  transition: "border-color 0.15s, background 0.15s",
                  cursor: "default",
                }}
              >
                {addClassDropped ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6.667" stroke="#16a34a" strokeWidth="1.33"/>
                      <path d="M5.333 8l1.667 1.667L10.667 6" stroke="#16a34a" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#16a34a" }}>
                      {addClassDropped}
                    </span>
                    <button
                      onClick={() => setAddClassDropped(null)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#717182", fontSize: 16, padding: 0, lineHeight: 1 }}
                    >×</button>
                  </div>
                ) : (
                  <>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 10px", display: "block", color: "#b0b0be" }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#3a3a4a", margin: "0 0 4px" }}>
                      Přetáhněte screenshot nebo PDF se seznamem žáků
                    </p>
                    <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", margin: 0, lineHeight: 1.6 }}>
                      AI automaticky rozpozná jména žáků z libovolného formátu nebo systému
                    </p>
                  </>
                )}
              </div>
            </div>

            <ModalActions onCancel={() => { setAddClassOpen(false); setAddClassDropped(null); }} onConfirm={handleAddClass} confirmLabel="Přidat" />
          </Modal>
        )}
      </div>
    );
  }

  // ─── student list view ────────────────────────────────────────────────────
  return (
    <div style={{ padding: "32px 40px" }}>
      <Breadcrumb crumbs={[
        { label: "Formativní hodnocení" },
        { label: "Třídy", onClick: () => setSelectedClassId(null) },
        { label: `Třída ${selectedClass.name}` },
      ]} />
      {/* title row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <button
          onClick={() => setSelectedClassId(null)}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4, borderRadius: 8 }}
          title="Zpět"
        >
          <IconBack />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 24, color: "#0a0a0a", margin: "0 0 1px" }}>
            Třída {selectedClass.name}
          </h1>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#717182", margin: 0 }}>
            {selectedClass.students.length} {studentCountLabel(selectedClass.students.length)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" }}>
              <IconSearch />
            </span>
            <input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Hledat žáka…"
              style={{
                paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                borderRadius: 10, border: "1px solid rgba(0,0,0,0.13)",
                fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a",
                background: "#fff", width: 190, outline: "none",
              }}
            />
          </div>
          <button
            onClick={() => { setStudentFirstName(""); setStudentLastName(""); setAddStudentOpen(true); }}
            style={{ ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 8 }}
          >
            <IconPlus />
            Přidat žáka
          </button>
        </div>
      </div>

      {/* student list */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.09)", overflow: "hidden" }}>
        {filteredStudents.length === 0 && (
          <p style={{ padding: "24px 20px", fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, color: "#717182" }}>
            Žádný žák nebyl nalezen.
          </p>
        )}
        {filteredStudents.map((student, i) => (
          <div
            key={student.id}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px",
              borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.07)",
            }}
          >
            <button
              onClick={() => setSelectedStudentId(student.id)}
              style={{
                display: "flex", alignItems: "center", gap: 14, flex: 1,
                background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0,
              }}
              onMouseEnter={(e) => ((e.currentTarget.querySelector("span:last-child") as HTMLElement).style.color = "#555")}
              onMouseLeave={(e) => ((e.currentTarget.querySelector("span:last-child") as HTMLElement).style.color = "#0a0a0a")}
            >
              <div style={{
                width: 30, height: 30, borderRadius: "50%", background: avatarColor(student.lastName),
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#fff", flexShrink: 0,
              }}>
                {student.firstName[0]}{student.lastName[0]}
              </div>
              <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, color: "#0a0a0a", transition: "color 0.12s" }}>
                {student.lastName}, {student.firstName}
              </span>
              {(() => {
                const ev = studentEvidence[student.id];
                if (!ev || (ev.audio === 0 && ev.photo === 0)) return null;
                return (
                  <span style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 4 }}>
                    {ev.audio > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#7c3aed", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13 }}>
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                          <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M2.667 8A5.333 5.333 0 0 0 8 13.333 5.333 5.333 0 0 0 13.333 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M8 13.333V15.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        {ev.audio}
                      </span>
                    )}
                    {ev.photo > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#0891b2", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13 }}>
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                          <path d="M1.333 5.333A1.333 1.333 0 0 1 2.667 4h1.2L5.2 2h5.6l1.333 2h1.2A1.333 1.333 0 0 1 14.667 5.333v7.334A1.333 1.333 0 0 1 13.333 14H2.667a1.333 1.333 0 0 1-1.334-1.333V5.333z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="8" cy="9" r="2.333" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        {ev.photo}
                      </span>
                    )}
                  </span>
                );
              })()}
            </button>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => openEditStudent(student)}
                title="Upravit"
                style={{ background: "none", border: "none", cursor: "pointer", padding: "9px 8px", borderRadius: 8, display: "flex", opacity: 0.6 }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
              >
                <IconEdit />
              </button>
              <button
                onClick={() => openDeleteStudent(student)}
                title="Odstranit"
                style={{ background: "none", border: "none", cursor: "pointer", padding: "9px 8px", borderRadius: 8, display: "flex", opacity: 0.5 }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4h12M5.333 4V2.667a.667.667 0 0 1 .667-.667h4a.667.667 0 0 1 .667.667V4M12.667 4l-.667 9.333A1.333 1.333 0 0 1 10.667 14H5.333A1.333 1.333 0 0 1 4 13.333L3.333 4" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* edit class modal */}
      {editClassOpen && (
        <Modal title="Upravit název třídy" onClose={() => setEditClassOpen(false)}>
          <ModalInput label="Název třídy" value={classNameInput} onChange={setClassNameInput} />
          <ModalActions onCancel={() => setEditClassOpen(false)} onConfirm={handleEditClass} confirmLabel="Uložit" />
        </Modal>
      )}

      {/* delete class modal */}
      {deleteClassOpen && (
        <Modal title="Odstranit třídu" onClose={() => setDeleteClassOpen(false)}>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, color: "#717182", margin: "0 0 4px" }}>
            Opravdu chcete odstranit třídu <strong style={{ color: "#0a0a0a" }}>{selectedClass.name}</strong>?
          </p>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#dc2626", margin: 0 }}>
            Tato akce je nevratná.
          </p>
          <ModalActions onCancel={() => setDeleteClassOpen(false)} onConfirm={handleDeleteClass} confirmLabel="Odstranit" danger />
        </Modal>
      )}

      {/* add student modal */}
      {addStudentOpen && (
        <Modal title="Přidat žáka" onClose={() => setAddStudentOpen(false)}>
          <ModalInput label="Jméno" value={studentFirstName} onChange={setStudentFirstName} placeholder="Jana" />
          <ModalInput label="Příjmení" value={studentLastName} onChange={setStudentLastName} placeholder="Nováková" />
          <ModalActions onCancel={() => setAddStudentOpen(false)} onConfirm={handleAddStudent} confirmLabel="Přidat" />
        </Modal>
      )}

      {/* edit student modal */}
      {editStudentOpen && (
        <Modal title="Upravit žáka" onClose={() => setEditStudentOpen(false)}>
          <ModalInput label="Jméno" value={studentFirstName} onChange={setStudentFirstName} />
          <ModalInput label="Příjmení" value={studentLastName} onChange={setStudentLastName} />
          <ModalActions onCancel={() => setEditStudentOpen(false)} onConfirm={handleEditStudent} confirmLabel="Uložit" />
        </Modal>
      )}

      {/* delete student modal */}
      {deleteStudentOpen && (() => {
        const st = selectedClass.students.find((s) => s.id === targetStudentId);
        return (
          <Modal title="Odstranit žáka" onClose={() => setDeleteStudentOpen(false)}>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, color: "#717182", margin: "0 0 4px" }}>
              Opravdu chcete odstranit žáka{" "}
              <strong style={{ color: "#0a0a0a" }}>{st?.firstName} {st?.lastName}</strong>?
            </p>
            <ModalActions onCancel={() => setDeleteStudentOpen(false)} onConfirm={handleDeleteStudent} confirmLabel="Odstranit" danger />
          </Modal>
        );
      })()}
    </div>
  );
}

function studentCountLabel(n: number) {
  if (n === 1) return "žák";
  if (n >= 2 && n <= 4) return "žáci";
  return "žáků";
}

const AVATAR_COLORS = ["#6366f1", "#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];
function avatarColor(lastName: string) {
  let hash = 0;
  for (let i = 0; i < lastName.length; i++) hash = lastName.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── level picker (přednastavené úrovně hodnocení) ────────────────────────────

const levelOptions = [
  { id: "vysvědčení", name: "Vysvědčení jinak", desc: "Slovní hodnocení místo známek — popisuje pokrok žáka vlastními slovy." },
  { id: "začínám", name: "Začínám · Rozvíjím · Zvládám", desc: "Třístupňová škála zaměřená na cestu k cíli, ne na výkon." },
  { id: "hvězdičky", name: "Hvězdičková škála", desc: "Vizuální hodnocení 1–4 hvězdičkami, srozumitelné pro mladší žáky." },
  { id: "portfolio", name: "Portfoliové hodnocení", desc: "Žák dokládá zvládnutí vlastními důkazy a sebehodnocením." },
];

interface CustomLevel { id: string; name: string; desc: string; }

const defaultCustomLevels: CustomLevel[] = [
  { id: "cl1", name: "Začínám", desc: "Žák se pokouší o splnění cíle, ale sdělení je zatím nesrozumitelné nebo velmi kusé." },
  { id: "cl2", name: "Rozvíjím se", desc: "Žák pracuje na dosažení cíle, základní myšlenky jsou přítomny, ale nejsou vždy jasně vyjádřeny." },
  { id: "cl3", name: "Zvládám", desc: "Žák cíle dosahuje — výsledek je srozumitelný a obsahuje konkrétní detaily." },
  { id: "cl4", name: "Ovládám", desc: "Žák cíle dosahuje s přesahem — výsledek je výstižný, poutavý a svědčí o hlubokém porozumění." },
];

function CustomLevelList({ animateIn, initial, onItemsChange }: { animateIn?: boolean; initial?: CustomLevel[]; onItemsChange?: (items: CustomLevel[]) => void }) {
  const [items, setItems] = useState<CustomLevel[]>(initial ?? defaultCustomLevels);

  function setItemsAndNotify(fn: (prev: CustomLevel[]) => CustomLevel[]) {
    setItems(prev => {
      const next = fn(prev);
      onItemsChange?.(next);
      return next;
    });
  }
  const inputBg = "rgba(236,236,240,0.6)";

  function updateItem(id: string, field: "name" | "desc", value: string) {
    setItemsAndNotify(prev => prev.map(x => x.id === id ? { ...x, [field]: value } : x));
  }

  function removeItem(id: string) {
    setItemsAndNotify(prev => prev.filter(x => x.id !== id));
  }

  function addItem() {
    setItemsAndNotify(prev => [...prev, { id: uid(), name: "Nová úroveň", desc: "" }]);
  }

  const rowContent = (c: CustomLevel, i: number) => (
    <AIHint message={`Chci upravit level: ${c.name}`}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px 10px 16px", borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.07)" }}>
      <input
        value={c.name}
        onChange={e => updateItem(c.id, "name", e.target.value)}
        style={{
          flexShrink: 0, width: 118, boxSizing: "border-box",
          fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a",
          background: "rgba(236,236,240,0.5)", border: "1px solid rgba(0,0,0,0.09)",
          borderRadius: 20, outline: "none", padding: "8px 12px",
          transition: "background 0.12s, border-color 0.12s", cursor: "text",
          textAlign: "center",
        }}
        onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = inputBg; }}
        onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = "rgba(236,236,240,0.5)"; }}
        onFocus={e => { e.currentTarget.style.background = inputBg; e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)"; }}
        onBlur={e => { e.currentTarget.style.background = "rgba(236,236,240,0.5)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.09)"; }}
      />
      <input
        value={c.desc}
        onChange={e => updateItem(c.id, "desc", e.target.value)}
        placeholder="Popis úrovně..."
        style={{
          flex: 1, minWidth: 0, boxSizing: "border-box",
          fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a",
          background: "transparent", border: "none", borderRadius: 6, outline: "none",
          padding: "8px 6px", margin: "0 -6px", transition: "background 0.12s", cursor: "text",
        }}
        onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = inputBg; }}
        onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = "transparent"; }}
        onFocus={e => (e.currentTarget.style.background = inputBg)}
        onBlur={e => (e.currentTarget.style.background = "transparent")}
      />
      <button
        onClick={() => removeItem(c.id)}
        title="Smazat"
        style={{ flexShrink: 0, padding: 5, background: "transparent", border: "none", cursor: "pointer", color: "#b0b0be", borderRadius: 7, transition: "color 0.12s, background 0.12s" }}
        onMouseEnter={e => { e.currentTarget.style.color = "#e53e3e"; e.currentTarget.style.background = "rgba(229,62,62,0.07)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#b0b0be"; e.currentTarget.style.background = "transparent"; }}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
    </AIHint>
  );

  return (
    <>
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.09)", overflow: "visible" }}>
        {items.map((c, i) =>
          animateIn
            ? <FadeIn key={c.id} delay={80 + i * 130}><div>{rowContent(c, i)}</div></FadeIn>
            : <div key={c.id}>{rowContent(c, i)}</div>
        )}
      </div>
      <button
        onClick={addItem}
        style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}
      >
        <IconPlus />
        Přidat úroveň
      </button>
    </>
  );
}

function LevelPicker({ onDone, onSaveCustom, savedCustomLevels }: { onDone: (id: string) => void; onSaveCustom?: (levels: CustomLevel[]) => void; savedCustomLevels?: CustomLevel[] }) {
  const [selected, setSelected] = useState<string>("vysvědčení");
  const [customMode, setCustomMode] = useState(false);
  const [draftItems, setDraftItems] = useState<CustomLevel[]>(savedCustomLevels ?? defaultCustomLevels);

  if (customMode) {
    return (
      <div>
        <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#717182", margin: "0 0 14px", lineHeight: 1.6 }}>
          Upravte názvy a popisy úrovní podle svých potřeb. Úrovně jsou seřazeny od nejnižší po nejvyšší.
        </p>
        <CustomLevelList animateIn initial={draftItems} onItemsChange={setDraftItems} />
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button onClick={() => { onSaveCustom?.(draftItems); onDone("vlastní"); setCustomMode(false); }} style={btnStyle("primary")}>Uložit vlastní úrovně</button>
          <button onClick={() => setCustomMode(false)} style={btnStyle("ghost")}>Zpět</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {levelOptions.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              style={{
                background: "#fff",
                border: isSelected ? "1.5px solid #0a0a0a" : "1.5px solid rgba(0,0,0,0.12)",
                borderRadius: 14, padding: "19px 16px", textAlign: "left",
                cursor: "pointer", transition: "border-color 0.15s",
                display: "flex", alignItems: "flex-start", gap: 14,
              }}
            >
              <span style={{
                flexShrink: 0, width: 16, height: 16, borderRadius: "50%", marginTop: 2,
                border: isSelected ? "none" : "1.5px solid rgba(0,0,0,0.25)",
                background: isSelected ? "#0a0a0a" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s, border-color 0.15s",
              }}>
                {isSelected && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />}
              </span>
              <span>
                <span style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a", marginBottom: 4 }}>
                  {opt.name}
                </span>
                <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", lineHeight: 1.65 }}>
                  {opt.desc}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => onDone(selected)} style={btnStyle("primary")}>Uložit výběr</button>
        <button onClick={() => setCustomMode(true)} style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 8 }}>
          <IconPlus />
          Vytvořit vlastní hodnocení
        </button>
      </div>
    </div>
  );
}

// ─── print modal ──────────────────────────────────────────────────────────────

const observationCriteria = [
  { short: "Popis vzhledu", full: "Popis vzhledu" },
  { short: "Popis chování", full: "Popis chování a zvyků" },
  { short: "Výstižná slova", full: "Výběr výstižných slov" },
  { short: "Stavba vět", full: "Stavba vět" },
  { short: "Srozumitelnost", full: "Srozumitelnost textu" },
  { short: "Uspořádání", full: "Uspořádání textu" },
];

const levelLegend = [
  { letter: "Z", label: "Zvládám", desc: "Žák cíl splnil samostatně a spolehlivě.", color: "#166534", bg: "#dcfce7" },
  { letter: "R", label: "Rozvíjím", desc: "Žák je na dobré cestě, potřebuje ještě čas nebo podporu.", color: "#854d0e", bg: "#fef9c3" },
  { letter: "S", label: "Začínám", desc: "Žák s tímto prvkem teprve začíná, potřebuje vedení.", color: "#1d4ed8", bg: "#eff6ff" },
];

function PrintModal({ onClose, students, goal }: {
  onClose: () => void;
  students: Student[];
  goal: string;
}) {
  const sorted = [...students].sort((a, b) => a.lastName.localeCompare(b.lastName, "cs"));

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.45)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "flex-start", overflowY: "auto", padding: "32px 24px",
      }}
      onClick={onClose}
    >
      {/* toolbar */}
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 1040, marginBottom: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 16, color: "#fff" }}>
          Náhled před tiskem
        </span>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={{ ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 6V2h8v4M4 12H3a1.333 1.333 0 0 1-1.333-1.333V7.333A1.333 1.333 0 0 1 3 6h10a1.333 1.333 0 0 1 1.333 1.333v3.334A1.333 1.333 0 0 1 13 12h-1" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 9.333h8V14H4z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Tisknout
          </button>
          <button onClick={onClose} style={btnStyle("ghost")}>Zavřít</button>
        </div>
      </div>

      {/* A4 landscape sheet */}
      <div
        style={{
          width: 1040, background: "#fff", borderRadius: 6,
          boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
          padding: "40px 44px 36px",
          fontFamily: "'Inter:Regular', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* sheet header */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#717182", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 4px" }}>
            Tabulka hodnocení · Čeština · 3.A
          </p>
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 17, color: "#0a0a0a", margin: 0, lineHeight: 1.55 }}>
            {goal}
          </p>
        </div>

        {/* table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 160 }} />
              {observationCriteria.map((_, i) => <col key={i} style={{ width: `${(100 - 18) / observationCriteria.length}%` }} />)}
            </colgroup>
            <thead>
              <tr>
                <th style={{
                  padding: "11px 10px", borderBottom: "2px solid #0a0a0a", borderRight: "1px solid rgba(0,0,0,0.1)",
                  fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#717182",
                  textAlign: "left", background: "#fafafa",
                }}>
                  Žák / Žákyně
                </th>
                {observationCriteria.map((c) => (
                  <th key={c.short} style={{
                    padding: "11px 6px", borderBottom: "2px solid #0a0a0a", borderRight: "1px solid rgba(0,0,0,0.1)",
                    fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a",
                    textAlign: "center", background: "#fafafa", lineHeight: 1.45,
                  }}>
                    {c.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((student, i) => (
                <tr key={student.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{
                    padding: "12px 10px", borderBottom: "1px solid rgba(0,0,0,0.07)", borderRight: "1px solid rgba(0,0,0,0.1)",
                    fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#0a0a0a",
                  }}>
                    {student.lastName}, {student.firstName}
                  </td>
                  {observationCriteria.map((c) => (
                    <td key={c.short} style={{
                      padding: "12px 6px", borderBottom: "1px solid rgba(0,0,0,0.07)", borderRight: "1px solid rgba(0,0,0,0.1)",
                      textAlign: "center", fontSize: 15, color: "#0a0a0a",
                      minWidth: 48,
                    }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* legend */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.1)" }}>
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12, color: "#717182", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 10px" }}>
            Legenda úrovní hodnocení
          </p>
          <div style={{ display: "flex", gap: 26 }}>
            {levelLegend.map((l) => (
              <div key={l.letter} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{
                  flexShrink: 0, width: 24, height: 24, borderRadius: 6,
                  background: l.bg, color: l.color,
                  fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${l.color}33`,
                }}>
                  {l.letter}
                </span>
                <div>
                  <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a", margin: "0 0 1px" }}>
                    {l.label}
                  </p>
                  <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182", margin: 0, lineHeight: 1.55 }}>
                    {l.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── evidence modal ───────────────────────────────────────────────────────────

const evidenceLevelCycle = [null, "Z", "R", "S"] as const;
type EvidenceLevel = "Z" | "R" | "S" | null;

function EvidenceModal({ onClose, students, goal, goalId, subject, className }: {
  onClose: () => void;
  students: Student[];
  goal: string;
  goalId: string;
  subject: string;
  className: string;
}) {
  const sorted = [...students].sort((a, b) => a.lastName.localeCompare(b.lastName, "cs"));
  const [ratings, setRatings] = useState<Record<string, Record<string, EvidenceLevel>>>({});
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [checkedCriteria, setCheckedCriteria] = useState<Set<string>>(new Set());
  const [evidence, setEvidence] = useState<Record<string, { audio: number; photo: number }>>({});
  const { addStudentEvidence, addEvidenceRecords } = useContext(EvidenceContext);
  const dragState = useRef<{ active: boolean; adding: boolean }>({ active: false, adding: true });

  const allChecked = sorted.length > 0 && sorted.every(s => checked.has(s.id));
  const someChecked = !allChecked && sorted.some(s => checked.has(s.id));

  function toggleAll() {
    setChecked(prev => {
      if (allChecked || someChecked) return new Set();
      return new Set(sorted.map(s => s.id));
    });
  }

  function cycleLevel(studentId: string, criterion: string) {
    setRatings(prev => {
      const cur: EvidenceLevel = prev[studentId]?.[criterion] ?? null;
      const idx = evidenceLevelCycle.indexOf(cur);
      const next = evidenceLevelCycle[(idx + 1) % evidenceLevelCycle.length];
      return { ...prev, [studentId]: { ...(prev[studentId] ?? {}), [criterion]: next } };
    });
  }

  const allCriteriaChecked = observationCriteria.length > 0 && observationCriteria.every(c => checkedCriteria.has(c.short));
  const someCriteriaChecked = !allCriteriaChecked && observationCriteria.some(c => checkedCriteria.has(c.short));

  function toggleAllCriteria() {
    setCheckedCriteria(prev => {
      if (allCriteriaChecked || someCriteriaChecked) return new Set();
      return new Set(observationCriteria.map(c => c.short));
    });
  }

  function toggleCriterion(short: string) {
    setCheckedCriteria(prev => {
      const n = new Set(prev);
      n.has(short) ? n.delete(short) : n.add(short);
      return n;
    });
  }

  function applyLevelToChecked(level: EvidenceLevel) {
    if (checked.size === 0) return;
    const targetCriteria = checkedCriteria.size > 0
      ? observationCriteria.filter(c => checkedCriteria.has(c.short))
      : observationCriteria;
    setRatings(prev => {
      const n = { ...prev };
      checked.forEach(id => {
        const row: Record<string, EvidenceLevel> = { ...(n[id] ?? {}) };
        targetCriteria.forEach(c => { row[c.short] = level; });
        n[id] = row;
      });
      return n;
    });
  }

  function toggleCheck(studentId: string) {
    setChecked(prev => {
      const n = new Set(prev);
      n.has(studentId) ? n.delete(studentId) : n.add(studentId);
      return n;
    });
  }

  function startDrag(studentId: string) {
    const adding = !checked.has(studentId);
    dragState.current = { active: true, adding };
    setChecked(prev => {
      const n = new Set(prev);
      adding ? n.add(studentId) : n.delete(studentId);
      return n;
    });
  }

  function extendDrag(studentId: string) {
    if (!dragState.current.active) return;
    setChecked(prev => {
      const n = new Set(prev);
      dragState.current.adding ? n.add(studentId) : n.delete(studentId);
      return n;
    });
  }

  useEffect(() => {
    const stop = () => { dragState.current.active = false; };
    window.addEventListener("mouseup", stop);
    return () => window.removeEventListener("mouseup", stop);
  }, []);

  function addEvidence(type: "audio" | "photo") {
    if (checked.size === 0) return;
    const ids = [...checked];
    setEvidence(prev => {
      const n = { ...prev };
      ids.forEach(id => {
        const cur = n[id] ?? { audio: 0, photo: 0 };
        n[id] = { ...cur, [type]: cur[type] + 1 };
      });
      return n;
    });
    const today = new Date().toISOString().slice(0, 10);
    ids.forEach(id => addStudentEvidence(id, type));
    const student_map = Object.fromEntries(students.map(s => [s.id, s]));
    addEvidenceRecords(ids.map(id => ({
      id: `ev-${Date.now()}-${id}`,
      studentId: id,
      studentName: student_map[id] ? `${student_map[id].lastName}, ${student_map[id].firstName}` : id,
      className,
      type,
      goalId,
      goalText: goal,
      subject,
      date: today,
    })));
  }

  function levelStyle(level: EvidenceLevel) {
    if (level === "Z") return { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" };
    if (level === "R") return { background: "#fef9c3", color: "#854d0e", border: "1px solid #fde68a" };
    if (level === "S") return { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" };
    return { background: "transparent", color: "transparent", border: "1px dashed rgba(0,0,0,0.15)" };
  }

  const anyChecked = checked.size > 0;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.45)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "flex-start", overflowY: "auto", padding: "32px 24px",
      }}
      onClick={onClose}
    >
      {/* sheet */}
      <div
        style={{
          position: "relative", width: 1100, background: "#fff", borderRadius: 6,
          boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
          padding: "40px 44px 36px",
          fontFamily: "'Inter:Regular', sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* sheet header: title left, action buttons + close right */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 18 }}>
          <div>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#717182", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 4px" }}>
              Důkazy o učení · Tabulka hodnocení
            </p>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 17, color: "#0a0a0a", margin: 0, lineHeight: 1.55 }}>
              {goal}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {/* audio */}
            <button
              onClick={() => addEvidence("audio")}
              title={anyChecked ? "Přidat audio nahrávku označeným žákům" : "Nejdřív zaškrtněte žáky"}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 13px", borderRadius: 8, border: "1.5px solid rgba(0,0,0,0.12)",
                cursor: anyChecked ? "pointer" : "default",
                background: anyChecked ? "#f3f0ff" : "#fafafa",
                color: anyChecked ? "#7c3aed" : "#b0b0be",
                fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15,
                transition: "background 0.15s, color 0.15s, border-color 0.15s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.33"/>
                <path d="M2.667 8A5.333 5.333 0 0 0 8 13.333 5.333 5.333 0 0 0 13.333 8" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
                <path d="M8 13.333V15.333" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
              </svg>
              Audio nahrávka
            </button>
            {/* photo */}
            <button
              onClick={() => addEvidence("photo")}
              title={anyChecked ? "Přidat fotografii označeným žákům" : "Nejdřív zaškrtněte žáky"}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 13px", borderRadius: 8, border: "1.5px solid rgba(0,0,0,0.12)",
                cursor: anyChecked ? "pointer" : "default",
                background: anyChecked ? "#ecfeff" : "#fafafa",
                color: anyChecked ? "#0891b2" : "#b0b0be",
                fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15,
                transition: "background 0.15s, color 0.15s, border-color 0.15s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M1.333 5.333A1.333 1.333 0 0 1 2.667 4h1.2L5.2 2h5.6l1.333 2h1.2A1.333 1.333 0 0 1 14.667 5.333v7.334A1.333 1.333 0 0 1 13.333 14H2.667a1.333 1.333 0 0 1-1.334-1.333V5.333z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="8" cy="9" r="2.333" stroke="currentColor" strokeWidth="1.33"/>
              </svg>
              Fotografie
            </button>
            {/* divider */}
            <div style={{ width: 1, height: 28, background: "rgba(0,0,0,0.1)", margin: "0 2px" }} />
            {/* Z R S bulk buttons */}
            {(["Z", "R", "S"] as EvidenceLevel[]).map(lv => {
              const ls = levelStyle(lv);
              return (
                <button
                  key={lv}
                  onClick={() => applyLevelToChecked(lv)}
                  title={anyChecked ? `Nastavit ${lv === "Z" ? "Zvládám" : lv === "R" ? "Rozvíjím" : "Začínám"} všem označeným` : "Nejdřív zaškrtněte žáky"}
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    border: `1.5px solid ${anyChecked ? ls.border.replace("1px solid ", "") : "rgba(0,0,0,0.12)"}`,
                    background: anyChecked ? ls.background : "#fafafa",
                    color: anyChecked ? ls.color : "#b0b0be",
                    fontFamily: "'Inter:Medium', sans-serif", fontWeight: 600, fontSize: 16,
                    cursor: anyChecked ? "pointer" : "default",
                    transition: "background 0.15s, color 0.15s, border-color 0.15s",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {lv}
                </button>
              );
            })}
            <div style={{ width: 1, height: 28, background: "rgba(0,0,0,0.1)", margin: "0 2px" }} />
            {/* close X */}
            <button
              onClick={onClose}
              title="Zavřít"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32, borderRadius: 8, border: "1.5px solid rgba(0,0,0,0.12)",
                background: "transparent", cursor: "pointer", color: "#717182",
                transition: "background 0.12s, color 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.05)"; e.currentTarget.style.color = "#0a0a0a"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#717182"; }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: 28 }} />
              <col style={{ width: 172 }} />
              {observationCriteria.map((_, i) => <col key={i} style={{ width: `${(100 - 18) / observationCriteria.length}%` }} />)}
              <col style={{ width: 60 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ padding: "11px 8px", borderBottom: "2px solid #0a0a0a", background: "#fafafa", textAlign: "center", verticalAlign: "middle" }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = someChecked; }}
                    onChange={toggleAll}
                    title={allChecked ? "Odznačit vše" : "Označit vše"}
                    style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#0a0a0a" }}
                  />
                </th>
                <th style={{ padding: "11px 10px", borderBottom: "2px solid #0a0a0a", borderRight: "1px solid rgba(0,0,0,0.1)", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#717182", textAlign: "left", background: "#fafafa" }}>
                  Žák / Žákyně
                </th>
                {observationCriteria.map(c => {
                  const colChecked = checkedCriteria.has(c.short);
                  return (
                    <th key={c.short} style={{ padding: "6px 6px 8px", borderBottom: "2px solid #0a0a0a", borderRight: "1px solid rgba(0,0,0,0.1)", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: colChecked ? "#0a0a0a" : "#717182", textAlign: "center", background: colChecked ? "rgba(10,10,10,0.04)" : "#fafafa", lineHeight: 1.45, cursor: "pointer", transition: "background 0.12s, color 0.12s" }} onClick={() => toggleCriterion(c.short)}>
                      <div style={{ marginBottom: 5 }}>{c.short}</div>
                      <input
                        type="checkbox"
                        checked={colChecked}
                        onChange={() => toggleCriterion(c.short)}
                        onClick={e => e.stopPropagation()}
                        title={colChecked ? "Odznačit sloupec" : "Označit sloupec"}
                        style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#0a0a0a" }}
                      />
                    </th>
                  );
                })}
                <th style={{ padding: "11px 6px", borderBottom: "2px solid #0a0a0a", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#717182", textAlign: "center", background: "#fafafa" }}>
                  Důkazy
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((student, i) => {
                const isChecked = checked.has(student.id);
                const ev = evidence[student.id] ?? { audio: false, photo: false };
                return (
                  <tr
                    key={student.id}
                    style={{ background: isChecked ? "rgba(10,10,10,0.04)" : i % 2 === 0 ? "#fff" : "#fafafa", userSelect: "none" }}
                    onMouseDown={e => { if ((e.target as HTMLElement).tagName !== "TD" && (e.target as HTMLElement).tagName !== "TR") return; e.preventDefault(); startDrag(student.id); }}
                    onMouseEnter={() => extendDrag(student.id)}
                  >
                    {/* checkbox */}
                    <td
                      style={{ padding: "12px 8px", borderBottom: "1px solid rgba(0,0,0,0.07)", textAlign: "center", verticalAlign: "middle", cursor: "pointer" }}
                      onMouseDown={e => { e.preventDefault(); startDrag(student.id); }}
                      onMouseEnter={() => extendDrag(student.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCheck(student.id)}
                        style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#0a0a0a", pointerEvents: "none" }}
                      />
                    </td>
                    {/* name */}
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid rgba(0,0,0,0.07)", borderRight: "1px solid rgba(0,0,0,0.1)", verticalAlign: "middle", fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#0a0a0a" }}>
                      {student.lastName}, {student.firstName}
                    </td>
                    {/* criterion cells */}
                    {observationCriteria.map(c => {
                      const level: EvidenceLevel = ratings[student.id]?.[c.short] ?? null;
                      const ls = levelStyle(level);
                      return (
                        <td
                          key={c.short}
                          onClick={() => cycleLevel(student.id, c.short)}
                          title={level ? `${level === "Z" ? "Zvládám" : level === "R" ? "Rozvíjím" : "Začínám"} — klikněte pro změnu` : "Klikněte pro hodnocení"}
                          style={{
                            padding: "6px", borderBottom: "1px solid rgba(0,0,0,0.07)", borderRight: "1px solid rgba(0,0,0,0.1)",
                            textAlign: "center", cursor: "pointer", userSelect: "none", verticalAlign: "middle",
                          }}
                        >
                          <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 28, height: 28, borderRadius: 7,
                            fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15,
                            transition: "background 0.12s, color 0.12s",
                            ...ls,
                          }}>
                            {level ?? ""}
                          </span>
                        </td>
                      );
                    })}
                    {/* evidence summary */}
                    <td style={{ padding: "12px 6px", borderBottom: "1px solid rgba(0,0,0,0.07)", textAlign: "center", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                        {ev.audio > 0 && (
                          <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#7c3aed", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13 }}>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                              <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M2.667 8A5.333 5.333 0 0 0 8 13.333 5.333 5.333 0 0 0 13.333 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              <path d="M8 13.333V15.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            {ev.audio}
                          </span>
                        )}
                        {ev.photo > 0 && (
                          <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#0891b2", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13 }}>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                              <path d="M1.333 5.333A1.333 1.333 0 0 1 2.667 4h1.2L5.2 2h5.6l1.333 2h1.2A1.333 1.333 0 0 1 14.667 5.333v7.334A1.333 1.333 0 0 1 13.333 14H2.667a1.333 1.333 0 0 1-1.334-1.333V5.333z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="8" cy="9" r="2.333" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                            {ev.photo}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* legend */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 18 }}>
          <div>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12, color: "#717182", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 10px" }}>
              Legenda úrovní hodnocení
            </p>
            <div style={{ display: "flex", gap: 22 }}>
              {levelLegend.map(l => (
                <div key={l.letter} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 6, background: l.bg, color: l.color, fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${l.color}33` }}>
                    {l.letter}
                  </span>
                  <div>
                    <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a", margin: "0 0 1px" }}>{l.label}</p>
                    <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182", margin: 0, lineHeight: 1.55 }}>{l.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#717182", fontFamily: "'Inter:Regular', sans-serif", lineHeight: 1.6, maxWidth: 260 }}>
            <strong style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, color: "#0a0a0a" }}>Tip:</strong> Klikněte do pole pro přiřazení úrovně. Zaškrtněte žáky a klikněte na ikonu nahoře pro přidání důkazu o učení.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── camera modal ─────────────────────────────────────────────────────────────

function CameraModal({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [camError, setCamError] = useState(false);
  const [camReady, setCamReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
          setCamReady(true);
        }
      })
      .catch(() => setCamError(true));
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 110,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20,
          width: 520, overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* camera viewport */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: "#0a0a0a", overflow: "hidden" }}>
          {/* live video */}
          <video
            ref={videoRef}
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", display: camReady ? "block" : "none" }}
          />

          {/* loading spinner when cam not yet ready */}
          {!camReady && !camError && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #333", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />
              <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#717182", margin: 0 }}>
                Spouštím kameru…
              </p>
            </div>
          )}

          {/* dashed target rectangle — always visible */}
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "78%", height: "62%",
            border: "2px dashed rgba(255,255,255,0.75)",
            borderRadius: 8,
            pointerEvents: "none",
          }} />

          {/* instruction overlay */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)",
            padding: "32px 20px 16px",
          }}>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 16, color: "#fff", margin: "0 0 4px", textAlign: "center" }}>
              Ukažte tabulku hodnocení do kamery
            </p>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.7)", margin: 0, textAlign: "center" }}>
              Přidržte arch rovně, aby byl celý viditelný
            </p>
          </div>
        </div>

        {/* body */}
        <div style={{ padding: "20px 24px 24px" }}>
          {/* privacy notice */}
          <div style={{
            display: "flex", gap: 12, alignItems: "flex-start",
            background: "rgba(236,236,240,0.5)", borderRadius: 10, padding: "15px 14px", marginBottom: 0,
          }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="8" cy="8" r="6.667" stroke="#717182" strokeWidth="1.2" />
              <path d="M8 7.333V11M8 5.333v.334" stroke="#717182" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", margin: 0, lineHeight: 1.65 }}>
              <strong style={{ color: "#0a0a0a" }}>Fotografie se neukládá.</strong> Snímek slouží pouze k rozpoznání textu z tabulky hodnocení. Data nejsou sdílena ani archivována.
            </p>
          </div>

          {/* fallback */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", margin: "0 0 10px", textAlign: "center" }}>
              Nejde to?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...btnStyle("ghost"), flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="2" width="14" height="20" rx="2" stroke="#0a0a0a" strokeWidth="1.5" />
                  <path d="M12 18h.01" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Skenovat na mobilu
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ ...btnStyle("ghost"), flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Nahrát fotografii
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} />
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── criteria list ────────────────────────────────────────────────────────────

interface CriterionItem { id: string; label: string; desc: string; }

function CriteriaList({ initial, animateIn }: { initial: CriterionItem[]; animateIn?: boolean }) {
  const [items, setItems] = useState<CriterionItem[]>(initial);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  function addItem() {
    const id = uid();
    setItems(prev => [...prev, { id, label: "Nové kritérium", desc: "" }]);
    setNewIds(prev => new Set(prev).add(id));
  }

  function updateItem(id: string, field: "label" | "desc", value: string) {
    setItems(prev => prev.map(x => x.id === id ? { ...x, [field]: value } : x));
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(x => x.id !== id));
  }

  const inputBg = "rgba(236,236,240,0.6)";

  const rowContent = (c: CriterionItem, i: number) => (
    <AIHint message={`Chci upravit criterion: ${c.label}`}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "11px 14px 11px 18px", borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.07)" }}>
      <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 7, background: "rgba(236,236,240,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#717182", marginTop: 6 }}>
        {i + 1}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <input
          value={c.label}
          onChange={e => updateItem(c.id, "label", e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a", background: "transparent", border: "none", borderRadius: 6, outline: "none", padding: "3px 6px", margin: "0 0 2px -6px", transition: "background 0.12s", cursor: "text" }}
          onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = inputBg; }}
          onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = "transparent"; }}
          onFocus={e => (e.currentTarget.style.background = inputBg)}
          onBlur={e => (e.currentTarget.style.background = "transparent")}
        />
        <input
          value={c.desc}
          onChange={e => updateItem(c.id, "desc", e.target.value)}
          placeholder="Popis..."
          style={{ width: "100%", boxSizing: "border-box", fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#717182", background: "transparent", border: "none", borderRadius: 6, outline: "none", padding: "3px 6px", margin: "0 -6px", transition: "background 0.12s", cursor: "text" }}
          onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = inputBg; }}
          onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = "transparent"; }}
          onFocus={e => (e.currentTarget.style.background = inputBg)}
          onBlur={e => (e.currentTarget.style.background = "transparent")}
        />
      </div>
      <button
        onClick={() => removeItem(c.id)}
        title="Smazat"
        style={{ flexShrink: 0, marginTop: 4, padding: 5, background: "transparent", border: "none", cursor: "pointer", color: "#b0b0be", borderRadius: 7, transition: "color 0.12s, background 0.12s" }}
        onMouseEnter={e => { e.currentTarget.style.color = "#e53e3e"; e.currentTarget.style.background = "rgba(229,62,62,0.07)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#b0b0be"; e.currentTarget.style.background = "transparent"; }}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
    </AIHint>
  );

  return (
    <>
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.09)", overflow: "visible" }}>
        {items.map((c, i) =>
          (animateIn || newIds.has(c.id))
            ? <FadeIn key={c.id} delay={animateIn ? 700 + i * 150 : 0}>{rowContent(c, i)}</FadeIn>
            : <div key={c.id}>{rowContent(c, i)}</div>
        )}
      </div>
      <button
        onClick={addItem}
        style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}
      >
        <IconPlus />
        Přidat kritérium
      </button>
    </>
  );
}

// ─── goal generator page ──────────────────────────────────────────────────────

const generatedCriteria = [
  { n: 1, label: "Popis hlavního znaku", desc: "Žák uvede alespoň jeden výrazný nebo typický rys popisovaného jevu, věci nebo bytosti." },
  { n: 2, label: "Výběr výstižných slov", desc: "Žák volí konkrétní a přesná slova, která čtenáři nebo posluchači pomohou si téma představit." },
  { n: 3, label: "Srozumitelnost sdělení", desc: "Žák formuluje myšlenky tak, aby jim druhá osoba snadno porozuměla bez dalšího vysvětlování." },
  { n: 4, label: "Stavba vět a větných celků", desc: "Žák sestavuje gramaticky správné věty přiměřené délky a správně je uvozuje a ukončuje." },
  { n: 5, label: "Logická návaznost", desc: "Myšlenky na sebe přirozeně navazují — text nebo mluvený projev mají zřetelný začátek, střed a závěr." },
  { n: 6, label: "Vlastní hlas a zaujetí", desc: "Žák téma zpracovává se zřetelným osobním vztahem nebo nadšením, které čtenář nebo posluchač zaznamená." },
];

function FadeIn({ children, delay }: { children: React.ReactNode; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
    }}>
      {children}
    </div>
  );
}

const subjectOptions = ["Čeština", "Matematika", "Prvouka", "Anglický jazyk", "Výtvarná výchova", "Hudební výchova", "Tělesná výchova", "Informatika"];

function GoalGeneratorPage({ input, onBack, onSave }: { input: string; onBack: () => void; onSave: (goal: { text: string; subject: string; className: string }) => void }) {
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [subject, setSubject] = useState("Čeština");
  const [classId, setClassId] = useState(initialClasses[0]?.id ?? "");

  const goalText = input.trim()
    ? `Dokážu ${input.trim().charAt(0).toLowerCase()}${input.trim().slice(1).replace(/\.$/, "")}, tak aby si to spolužák dokázal představit.`
    : "Dokážu popsat a vysvětlit zvolené téma srozumitelně, s použitím výstižných slov a přehlednou strukturou.";

  return (
    <div style={{ padding: "32px 40px" }}>
      <Breadcrumb crumbs={[
        { label: "Formativní hodnocení" },
        { label: "Vyučovací hodiny", onClick: onBack },
        { label: "Nový cíl" },
      ]} />

      {/* goal header */}
      <FadeIn delay={100}>
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#717182", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 8px" }}>
            Výzkumný cíl
          </p>
          <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 26, color: "#0a0a0a", lineHeight: 1.55, margin: "0 0 12px" }}>
            {goalText}
          </h1>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 14 }}>
            <span style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(236,236,240,0.9)", color: "#717182", fontFamily: "'Inter:Regular', sans-serif", fontSize: 14 }}>
              Nový cíl
            </span>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a", background: "#fff", border: "1px solid rgba(0,0,0,0.13)", borderRadius: 8, padding: "5px 10px", outline: "none", cursor: "pointer" }}
            >
              {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={classId}
              onChange={e => setClassId(e.target.value)}
              style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a", background: "#fff", border: "1px solid rgba(0,0,0,0.13)", borderRadius: 8, padding: "5px 10px", outline: "none", cursor: "pointer" }}
            >
              {initialClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </FadeIn>

      <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 28, display: "flex", flexDirection: "column", gap: 30 }}>
        {/* criteria */}
        <FadeIn delay={500}>
          <section>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#717182", letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 6px" }}>
              Kritéria hodnocení
            </p>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#717182", lineHeight: 1.7, margin: "0 0 16px" }}>
              Kritéria hodnocení určují, co konkrétně pozorujete za aktivity a chování, které se snažíte vyhodnotit.
            </p>
            <CriteriaList initial={generatedCriteria.map((c) => ({ id: String(c.n), label: c.label, desc: c.desc }))} animateIn />
          </section>
        </FadeIn>

        {/* levels */}
        <FadeIn delay={1900}>
          <section>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#717182", letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 6px" }}>
              Úrovně hodnocení
            </p>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#717182", lineHeight: 1.7, margin: "0 0 16px" }}>
              Úrovně popisují, na jaké úrovni zvládnutí se žák na cestě k cíli nachází. Vyberte si z přednastavených úrovní hodnocení podle vytvořených metodik, nebo si nastavte vlastní.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {levelOptions.map((opt, i) => {
                const isSelected = selectedLevelId === opt.id;
                return (
                  <FadeIn key={opt.id} delay={2100 + i * 120}>
                    <button
                      onClick={() => setSelectedLevelId(isSelected ? null : opt.id)}
                      style={{ background: "#fff", border: isSelected ? "1.5px solid #0a0a0a" : "1.5px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: "19px 16px", display: "flex", alignItems: "flex-start", gap: 14, width: "100%", textAlign: "left", cursor: "pointer", transition: "border-color 0.15s" }}
                    >
                      <span style={{ flexShrink: 0, width: 16, height: 16, borderRadius: "50%", marginTop: 2, background: isSelected ? "#0a0a0a" : "transparent", border: isSelected ? "none" : "1.5px solid rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
                        {isSelected && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />}
                      </span>
                      <span>
                        <span style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a", marginBottom: 4 }}>{opt.name}</span>
                        <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", lineHeight: 1.65 }}>{opt.desc}</span>
                      </span>
                    </button>
                  </FadeIn>
                );
              })}
            </div>
          </section>
        </FadeIn>

        {/* save */}
        <FadeIn delay={2700}>
          <button
            onClick={() => {
              const className = initialClasses.find(c => c.id === classId)?.name ?? classId;
              onSave({ text: goalText, subject, className });
            }}
            style={{
              width: "100%", padding: "19px 24px",
              background: "#0a0a0a", color: "#fff", border: "none",
              borderRadius: 14, cursor: "pointer",
              fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 18,
              transition: "opacity 0.15s",
            }}>
            Uložit cíl
          </button>
        </FadeIn>
      </div>
    </div>
  );
}

// ─── cíle view ────────────────────────────────────────────────────────────────

interface Goal {
  id: string;
  text: string;
  subject: string;
  className: string;
}

const initialGoals: Goal[] = [
  {
    id: "g1",
    text: "Dokážu napsat srozumitelný text o mém oblíbeném zvířeti tak, aby si ho čtenář dokázal představit.",
    subject: "Čeština",
    className: "3.A",
  },
];

function buildGoalNumbers(tpGoals: TpGoal[]): Map<string, number> {
  const m = new Map<string, number>();
  let n = 1;
  for (const g of initialGoals) m.set(g.id, n++);
  for (const g of tpGoals) m.set(g.id, n++);
  return m;
}

function LessonDatePicker({ goalId, compact }: { goalId: string; compact?: boolean }) {
  const dateKey = `lesson-date-${goalId}`;
  const [lessonDate, setLessonDate] = useState(() => typeof window !== "undefined" ? localStorage.getItem(dateKey) ?? "" : "");
  const [editingDate, setEditingDate] = useState(false);
  const fmt = (d: string, short?: boolean) => {
    if (!d) return "";
    const dt = new Date(d);
    return short
      ? dt.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" })
      : dt.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
  };
  if (editingDate) return (
    <input type="date" value={lessonDate} autoFocus
      onChange={e => { setLessonDate(e.target.value); localStorage.setItem(dateKey, e.target.value); }}
      onBlur={() => setEditingDate(false)}
      style={{ padding: compact ? "2px 8px" : "7px 12px", borderRadius: compact ? 20 : 8, border: "1.5px solid rgba(0,0,0,0.18)", fontFamily: "'Inter:Regular', sans-serif", fontSize: compact ? 13 : 16, color: "#0a0a0a", outline: "none", background: "#fff", width: compact ? 110 : undefined }}
    />
  );
  if (lessonDate) return (
    <button onClick={() => setEditingDate(true)}
      style={{ display: "inline-flex", alignItems: "center", gap: compact ? 4 : 8, padding: compact ? "2px 7px" : "7px 14px", borderRadius: compact ? 20 : 8, border: compact ? "none" : "1.5px solid rgba(0,0,0,0.12)", background: compact ? "transparent" : "#fff", fontFamily: "'Inter:Regular', sans-serif", fontSize: compact ? 12 : 16, color: "#717182", cursor: "pointer", transition: "color 0.12s" }}
      onMouseEnter={e => (e.currentTarget.style.color = compact ? "#0a0a0a" : "#0a0a0a")}
      onMouseLeave={e => (e.currentTarget.style.color = "#717182")}
    >
      <svg width={compact ? 9 : 14} height={compact ? 9 : 14} viewBox="0 0 16 16" fill="none">
        <rect x="1.333" y="2.667" width="13.333" height="12" rx="1.333" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M1.333 6.667h13.333" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M5.333 1.333v2.667M10.667 1.333v2.667" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
      {fmt(lessonDate, compact)}
    </button>
  );
  if (compact) return (
    <button onClick={() => setEditingDate(true)}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 6, border: "1.5px dashed rgba(0,0,0,0.2)", background: "transparent", color: "#c0c0cc", cursor: "pointer", padding: 0, transition: "border-color 0.12s, color 0.12s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.35)"; e.currentTarget.style.color = "#717182"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)"; e.currentTarget.style.color = "#c0c0cc"; }}
      title="Přidat datum"
    >
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
        <rect x="1.333" y="2.667" width="13.333" height="12" rx="1.333" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M1.333 6.667h13.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M5.333 1.333v2.667M10.667 1.333v2.667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M8 9.333v2M7 10.333h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </button>
  );
  return (
    <button onClick={() => setEditingDate(true)}
      style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "1.5px dashed rgba(0,0,0,0.18)", background: "transparent", fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#b0b0be", cursor: "pointer", transition: "border-color 0.12s, color 0.12s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.3)"; e.currentTarget.style.color = "#717182"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.18)"; e.currentTarget.style.color = "#b0b0be"; }}
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <rect x="1.333" y="2.667" width="13.333" height="12" rx="1.333" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M1.333 6.667h13.333" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M5.333 1.333v2.667M10.667 1.333v2.667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M8 9.333v2M7 10.333h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
      Přidat datum
    </button>
  );
}

type AnyGoal = { id: string; text: string; subject: string; cls: string; period: string; isTp: boolean };

function LessonList({ filtered, animateIn, tpGoals, removeTpGoal, setSelectedTpGoalId, setTpEditingLevels, setSelectedGoalId, btnStyle }: {
  filtered: AnyGoal[];
  animateIn: boolean;
  tpGoals: TpGoal[];
  removeTpGoal: (id: string) => void;
  setSelectedTpGoalId: (id: string) => void;
  setTpEditingLevels: (v: boolean) => void;
  setSelectedGoalId: (id: string) => void;
  btnStyle: (v: "primary" | "ghost" | "danger") => React.CSSProperties;
}) {
  const [orderedIds, setOrderedIds] = useState<string[]>(() => filtered.map(g => g.id));
  const dragGoalRef = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => { setOrderedIds(filtered.map(g => g.id)); }, [filtered.map(g => g.id).join(",")]);

  const orderedFiltered = orderedIds.map(id => filtered.find(g => g.id === id)).filter(Boolean) as AnyGoal[];
  const globalNumMap = new Map(orderedFiltered.map((g, i) => [g.id, i + 1]));

  const grouped: { month: string; items: AnyGoal[] }[] = [];
  const noMonth: AnyGoal[] = [];
  for (const g of orderedFiltered) {
    if (!g.period) { noMonth.push(g); continue; }
    const last = grouped[grouped.length - 1];
    if (last && last.month === g.period) last.items.push(g);
    else grouped.push({ month: g.period, items: [g] });
  }
  if (noMonth.length) grouped.push({ month: "", items: noMonth });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {grouped.map(({ month, items }, gi) => (
        <div key={`${month || "__none"}-${gi}`} style={{ marginBottom: 24 }}>
          {month && (
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#b0b0be", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 10px 2px" }}>
              {month}
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map(g => {
              const num = globalNumMap.get(g.id);
              const isTp = g.isTp;
              const tpGoal = isTp ? tpGoals.find(t => t.id === g.id) : null;
              const isDragOver = dragOverId === g.id && dragGoalRef.current !== g.id;
              return (
                <FadeIn key={g.id} delay={animateIn && isTp ? 80 * (orderedFiltered.indexOf(g)) : 0}>
                  <div
                    draggable
                    onDragStart={() => { dragGoalRef.current = g.id; }}
                    onDragEnter={() => setDragOverId(g.id)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => {
                      const from = dragGoalRef.current;
                      if (!from || from === g.id) return;
                      setOrderedIds(prev => {
                        const next = [...prev];
                        const fi = next.indexOf(from), ti = next.indexOf(g.id);
                        if (fi < 0 || ti < 0) return prev;
                        next.splice(fi, 1); next.splice(ti, 0, from);
                        return next;
                      });
                      dragGoalRef.current = null; setDragOverId(null);
                    }}
                    onDragEnd={() => { dragGoalRef.current = null; setDragOverId(null); }}
                    style={{
                      background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.09)",
                      borderLeft: isDragOver ? "4px solid #7c4dbd" : "4px solid #3b82f6",
                      borderTop: isDragOver ? "2px solid #7c4dbd" : undefined,
                      display: "flex", alignItems: "flex-start", gap: 0,
                      padding: "19px 20px", cursor: "grab", transition: "background 0.12s, border-color 0.1s",
                      opacity: dragGoalRef.current === g.id ? 0.45 : 1,
                    }}
                    onClick={() => isTp ? (setSelectedTpGoalId(g.id), setTpEditingLevels(false)) : setSelectedGoalId(g.id)}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(59,130,246,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                  >
                    <div style={{ marginRight: 12, marginTop: 2, opacity: 0.25, flexShrink: 0, cursor: "grab" }}>
                      <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
                        <circle cx="3" cy="2" r="1.2" fill="#0a0a0a"/><circle cx="7" cy="2" r="1.2" fill="#0a0a0a"/>
                        <circle cx="3" cy="7" r="1.2" fill="#0a0a0a"/><circle cx="7" cy="7" r="1.2" fill="#0a0a0a"/>
                        <circle cx="3" cy="12" r="1.2" fill="#0a0a0a"/><circle cx="7" cy="12" r="1.2" fill="#0a0a0a"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
                        {num && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 10px 2px 7px", borderRadius: 20, background: "linear-gradient(90deg, #dbeafe 0%, #bfdbfe 100%)", color: "#1e40af", border: "1px solid rgba(59,130,246,0.3)", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                              <path d="M12 6C9.5 4 6.5 4 3 5.5v13c3.5-1.5 6.5-1.5 9 0M12 6c2.5-2 5.5-2 9-0.5v13c-3.5-1.5-6.5-1.5-9 0M12 6v13" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Vyučovací hodina {num}
                          </span>
                        )}
                        <span style={{ padding: "3px 9px", borderRadius: 20, background: "#f3e8ff", color: "#8200db", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13 }}>{g.subject}</span>
                        {g.cls && <span style={{ padding: "3px 9px", borderRadius: 20, background: "rgba(236,236,240,0.9)", color: "#717182", fontFamily: "'Inter:Regular', sans-serif", fontSize: 13 }}>{g.cls}</span>}
                        {tpGoal && <span style={{ padding: "3px 9px", borderRadius: 20, background: "rgba(236,236,240,0.9)", color: "#717182", fontFamily: "'Inter:Regular', sans-serif", fontSize: 13 }}>{tpGoal.rozsah} {parseInt(tpGoal.rozsah) === 1 ? "hodina" : parseInt(tpGoal.rozsah) <= 4 ? "hodiny" : "hodin"}</span>}
                        <span onClick={e => e.stopPropagation()}><LessonDatePicker goalId={g.id} compact /></span>
                        {tpGoal?.vystupy && <span style={{ padding: "3px 9px", borderRadius: 20, background: "rgba(236,236,240,0.9)", color: "#717182", fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>{tpGoal.vystupy}</span>}
                      </div>
                      <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, color: "#0a0a0a", lineHeight: 1.6, margin: 0 }}>{g.text}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center", paddingTop: 2, marginLeft: 16 }}>
                      {isTp ? (
                        <>
                          <button onClick={e => { e.stopPropagation(); setSelectedTpGoalId(g.id); setTpEditingLevels(false); }} style={{ ...btnStyle("ghost"), fontSize: 14, padding: "8px 12px" }}>Detail</button>
                          <button onClick={e => { e.stopPropagation(); removeTpGoal(g.id); }} title="Odstranit"
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "9px 8px", borderRadius: 8, display: "flex", opacity: 0.5, transition: "opacity 0.12s" }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                              <path d="M2 4h12M5.333 4V2.667a.667.667 0 0 1 .667-.667h4a.667.667 0 0 1 .667.667V4M12.667 4l-.667 9.333A1.333 1.333 0 0 1 10.667 14H5.333A1.333 1.333 0 0 1 4 13.333L3.333 4" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </>
                      ) : <IconChevronRight />}
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function CileView() {
  const { tpGoals, removeTpGoal, updateTpGoalText, animateIn } = useContext(GoalsContext);
  const goalNums = buildGoalNumbers(tpGoals);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("vse");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedTpGoalId, setSelectedTpGoalId] = useState<string | null>(null);
  const [tpEditingLevels, setTpEditingLevels] = useState(false);
  const [tpSelectedLevelId, setTpSelectedLevelId] = useState("začínám");
  const [tpPrintOpen, setTpPrintOpen] = useState(false);
  const [tpCameraOpen, setTpCameraOpen] = useState(false);
  const [tpEvidenceOpen, setTpEvidenceOpen] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<string>("vysvědčení");
  const [editingLevels, setEditingLevels] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [newGoalText, setNewGoalText] = useState("");
  const [generatingGoal, setGeneratingGoal] = useState(false);
  const [savedCustomLevels, setSavedCustomLevels] = useState<CustomLevel[]>(defaultCustomLevels);
  const selectedGoal = goals.find((g) => g.id === selectedGoalId) ?? null;
  const classStudents = initialClasses.find((c) => c.name === selectedGoal?.className)?.students ?? [];

  if (generatingGoal) {
    return <GoalGeneratorPage
      input={newGoalText}
      onBack={() => { setGeneratingGoal(false); setCreatingGoal(true); }}
      onSave={(g) => {
        const newGoal: Goal = { id: "g" + Date.now(), ...g };
        setGoals(prev => [...prev, newGoal]);
        setGeneratingGoal(false);
        setNewGoalText("");
        setSelectedGoalId(null);
      }}
    />;
  }

  const selectedTpGoal = tpGoals.find(g => g.id === selectedTpGoalId) ?? null;

  if (selectedTpGoal) {
    const tpClassStudents = initialClasses.find(c => c.name === selectedTpGoal.trida)?.students ?? [];
    const tpOpt = levelOptions.find(o => o.id === tpSelectedLevelId) ?? levelOptions[1];
    return (
      <>
      <div style={{ padding: "32px 40px" }}>
        <Breadcrumb crumbs={[
          { label: "Formativní hodnocení" },
          { label: "Vyučovací hodiny", onClick: () => setSelectedTpGoalId(null) },
          { label: selectedTpGoal.subject + " · " + selectedTpGoal.trida + " · " + selectedTpGoal.month },
        ]} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 26, marginBottom: 36 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#717182", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 8px" }}>
              Výukový cíl
            </p>
            <AIHint message={`Chci upravit cíl: ${selectedTpGoal.text}`}>
              <input
                value={selectedTpGoal.text}
                onChange={e => updateTpGoalText(selectedTpGoal.id, e.target.value)}
                style={{
                  display: "block", width: "100%", maxWidth: 560, boxSizing: "border-box",
                  fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 26, color: "#0a0a0a", lineHeight: 1.55,
                  margin: "0 0 14px", padding: "3px 8px", marginLeft: -8,
                  background: "transparent", border: "1.5px solid transparent", borderRadius: 8,
                  outline: "none", transition: "background 0.12s, border-color 0.12s",
                }}
                onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = "rgba(236,236,240,0.6)"; }}
                onMouseLeave={e => { if (document.activeElement !== e.currentTarget) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; } }}
                onFocus={e => { e.currentTarget.style.background = "rgba(236,236,240,0.6)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)"; }}
                onBlur={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
              />
            </AIHint>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span style={{ padding: "4px 10px", borderRadius: 20, background: "#f3e8ff", color: "#8200db", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14 }}>
                {selectedTpGoal.subject}
              </span>
              <span style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(236,236,240,0.9)", color: "#717182", fontFamily: "'Inter:Regular', sans-serif", fontSize: 14 }}>
                {selectedTpGoal.trida}
              </span>
              <span style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(236,236,240,0.9)", color: "#717182", fontFamily: "'Inter:Regular', sans-serif", fontSize: 14 }}>
                {selectedTpGoal.rozsah} {parseInt(selectedTpGoal.rozsah) === 1 ? "hodina" : parseInt(selectedTpGoal.rozsah) <= 4 ? "hodiny" : "hodin"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, paddingTop: 4 }}>
            <button onClick={() => setTpPrintOpen(true)} style={{ ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 9, whiteSpace: "nowrap" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 6V2h8v4M4 12H3a1.333 1.333 0 0 1-1.333-1.333V7.333A1.333 1.333 0 0 1 3 6h10a1.333 1.333 0 0 1 1.333 1.333v3.334A1.333 1.333 0 0 1 13 12h-1" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 9.333h8V14H4z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Tisknout tabulku hodnocení
            </button>
            <button onClick={() => setTpEvidenceOpen(true)} style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 9, whiteSpace: "nowrap" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 12.667C2 11.194 4.686 10 8 10s6 1.194 6 2.667" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
                <circle cx="8" cy="5.333" r="3.333" stroke="currentColor" strokeWidth="1.33"/>
                <path d="M13.333 2v4M11.333 4h4" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
              </svg>
              Zaznamenat důkazy o učení
            </button>
            <button onClick={() => setTpCameraOpen(true)} style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 9, whiteSpace: "nowrap" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M15.333 5.333L10.667 8l4.666 2.667V5.333zM1.333 4h8a1.333 1.333 0 0 1 1.334 1.333v5.334A1.333 1.333 0 0 1 9.333 12h-8A1.333 1.333 0 0 1 0 10.667V5.333A1.333 1.333 0 0 1 1.333 4z" stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Nahrát hotovou tabulku hodnocení
            </button>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 28, display: "flex", flexDirection: "column", gap: 30 }}>
          <section>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#717182", letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 10px" }}>
              Datum hodiny
            </p>
            <LessonDatePicker goalId={selectedTpGoal.id} />
          </section>
          <section>
            <AIHint message="Chci upravit kritéria hodnocení">
              <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#717182", letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 6px" }}>
                Kritéria hodnocení
              </p>
            </AIHint>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#717182", lineHeight: 1.7, margin: "0 0 16px" }}>
              Kritéria hodnocení určují, co konkrétně pozorujete za aktivity a chování, které se snažíte vyhodnotit.
            </p>
            <CriteriaList initial={selectedTpGoal.criteria} />
          </section>

          <section>
            <AIHint message="Chci upravit úrovně hodnocení">
              <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#717182", letterSpacing: "0.04em", textTransform: "uppercase", margin: "0 0 12px" }}>
                Úrovně hodnocení
              </p>
            </AIHint>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#717182", lineHeight: 1.7, margin: "0 0 16px" }}>
              Úrovně popisují, na jaké úrovni zvládnutí se žák na cestě k cíli nachází. Vyberte si z přednastavených úrovní hodnocení podle vytvořených metodik, nebo si nastavte vlastní.
            </p>
            {tpEditingLevels ? (
              <LevelPicker
                onDone={(id) => { setTpSelectedLevelId(id); setTpEditingLevels(false); }}
                onSaveCustom={setSavedCustomLevels}
                savedCustomLevels={savedCustomLevels}
              />
            ) : tpSelectedLevelId === "vlastní" ? (
              <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: "19px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a" }}>Vlastní úrovně</span>
                  <button onClick={() => setTpEditingLevels(true)} style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <IconEdit />Upravit
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {savedCustomLevels.map((lv, i) => (
                    <div key={lv.id} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                      <span style={{ flexShrink: 0, padding: "3px 10px", borderRadius: 20, background: "rgba(236,236,240,0.7)", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, color: "#0a0a0a", whiteSpace: "nowrap" }}>
                        {lv.name || `Úroveň ${i + 1}`}
                      </span>
                      {lv.desc && <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", lineHeight: 1.6 }}>{lv.desc}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: "19px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <span style={{ flexShrink: 0, width: 16, height: 16, borderRadius: "50%", marginTop: 2, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />
                  </span>
                  <span>
                    <span style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a", marginBottom: 4 }}>{tpOpt.name}</span>
                    <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", lineHeight: 1.65 }}>{tpOpt.desc}</span>
                  </span>
                </div>
                <button onClick={() => setTpEditingLevels(true)} style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <IconEdit />Upravit
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
      {tpPrintOpen && <PrintModal onClose={() => setTpPrintOpen(false)} students={tpClassStudents} goal={selectedTpGoal.text} />}
      {tpEvidenceOpen && <EvidenceModal onClose={() => setTpEvidenceOpen(false)} students={tpClassStudents} goal={selectedTpGoal.text} goalId={selectedTpGoal.id} subject={selectedTpGoal.subject} className={selectedTpGoal.trida} />}
      {tpCameraOpen && <CameraModal onClose={() => setTpCameraOpen(false)} />}
      </>
    );
  }

  if (creatingGoal) {
    return (
      <div style={{ padding: "32px 40px" }}>
        <Breadcrumb crumbs={[
          { label: "Formativní hodnocení" },
          { label: "Vyučovací hodiny", onClick: () => setCreatingGoal(false) },
          { label: "Nový cíl" },
        ]} />

        <div style={{ maxWidth: 560, marginTop: 48 }}>
          <h1 style={{
            fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500,
            fontSize: 34, color: "#0a0a0a", margin: "0 0 8px", lineHeight: 1.45,
          }}>
            Co chcete učit?
          </h1>
          <p style={{
            fontFamily: "'Inter:Regular', sans-serif", fontSize: 16,
            color: "#717182", margin: "0 0 24px", lineHeight: 1.7,
          }}>
            Např. Počítání do pěti nebo obojživelníky…
          </p>
          <textarea
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            placeholder="Dokážu…"
            rows={2}
            autoFocus
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "16px 14px", borderRadius: 12,
              border: "1.5px solid rgba(0,0,0,0.15)",
              fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, color: "#0a0a0a",
              lineHeight: 1.7, resize: "none", outline: "none",
              background: "#fff", transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#0a0a0a")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)")}
          />
          <button
            onClick={() => { if (newGoalText.trim()) { setCreatingGoal(false); setGeneratingGoal(true); } }}
            disabled={!newGoalText.trim()}
            style={{
              ...btnStyle("primary"),
              marginTop: 14, display: "flex", alignItems: "center", gap: 9,
              opacity: newGoalText.trim() ? 1 : 0.4,
              cursor: newGoalText.trim() ? "pointer" : "default",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.333l1.88 3.807 4.12.6-3 2.92.707 4.12L8 10.607l-3.707 1.973.707-4.12-3-2.92 4.12-.6L8 1.333z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            Generovat cíl
          </button>
        </div>
      </div>
    );
  }

  if (selectedGoal) {
    return (
      <>
      <div style={{ padding: "32px 40px" }}>
        <Breadcrumb crumbs={[
          { label: "Formativní hodnocení" },
          { label: "Vyučovací hodiny", onClick: () => setSelectedGoalId(null) },
          { label: selectedGoal.subject + " · " + selectedGoal.className },
        ]} />

        {/* header row: goal + action buttons */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 26, marginBottom: 36 }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500,
              fontSize: 13, color: "#717182", letterSpacing: "0.06em",
              textTransform: "uppercase", margin: "0 0 8px",
            }}>
              Výzkumný cíl
            </p>
            <AIHint message="Chci upravit tento výzkumný goal">
              <h1 style={{
                fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500,
                fontSize: 26, color: "#0a0a0a", lineHeight: 1.55,
                margin: "0 0 12px", maxWidth: 560,
              }}>
                {selectedGoal.text}
              </h1>
            </AIHint>
            <div style={{ display: "flex", gap: 10 }}>
              <span style={{
                padding: "4px 10px", borderRadius: 20,
                background: "#f3e8ff", color: "#8200db",
                fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14,
              }}>
                {selectedGoal.subject}
              </span>
              <span style={{
                padding: "4px 10px", borderRadius: 20,
                background: "rgba(236,236,240,0.9)", color: "#717182",
                fontFamily: "'Inter:Regular', sans-serif", fontSize: 14,
              }}>
                {selectedGoal.className}
              </span>
            </div>
          </div>

          {/* action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, paddingTop: 4 }}>
            <button
              onClick={() => setPrintOpen(true)}
              style={{
                ...btnStyle("primary"),
                display: "flex", alignItems: "center", gap: 9, whiteSpace: "nowrap",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 6V2h8v4M4 12H3a1.333 1.333 0 0 1-1.333-1.333V7.333A1.333 1.333 0 0 1 3 6h10a1.333 1.333 0 0 1 1.333 1.333v3.334A1.333 1.333 0 0 1 13 12h-1" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 9.333h8V14H4z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Tisknout tabulku hodnocení
            </button>
            <button
              onClick={() => setEvidenceOpen(true)}
              style={{
                ...btnStyle("ghost"),
                display: "flex", alignItems: "center", gap: 9, whiteSpace: "nowrap",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 12.667C2 11.194 4.686 10 8 10s6 1.194 6 2.667" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
                <circle cx="8" cy="5.333" r="3.333" stroke="currentColor" strokeWidth="1.33"/>
                <path d="M13.333 2v4M11.333 4h4" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
              </svg>
              Zaznamenat důkazy o učení
            </button>
            <button
              onClick={() => setCameraOpen(true)}
              style={{
                ...btnStyle("ghost"),
                display: "flex", alignItems: "center", gap: 9, whiteSpace: "nowrap",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M15.333 5.333L10.667 8l4.666 2.667V5.333zM1.333 4h8a1.333 1.333 0 0 1 1.334 1.333v5.334A1.333 1.333 0 0 1 9.333 12h-8A1.333 1.333 0 0 1 0 10.667V5.333A1.333 1.333 0 0 1 1.333 4z" stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Nahrát hotovou tabulku hodnocení
            </button>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 28, display: "flex", flexDirection: "column", gap: 30 }}>
          {/* criteria */}
          <section>
            <AIHint message="Chci upravit kritéria hodnocení">
              <p style={{
                fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500,
                fontSize: 15, color: "#717182", letterSpacing: "0.04em",
                textTransform: "uppercase", margin: "0 0 6px",
              }}>
                Kritéria hodnocení
              </p>
            </AIHint>
            <p style={{
              fontFamily: "'Inter:Regular', sans-serif", fontSize: 15,
              color: "#717182", lineHeight: 1.7, margin: "0 0 16px",
            }}>
              Kritéria hodnocení určují, co konkrétně pozorujete za aktivity a chování, které se snažíte vyhodnotit.
            </p>
            <CriteriaList initial={[
              { id: "c1", label: "Popis vzhledu", desc: "Žák popisuje, jak zvíře vypadá — jeho barvu, velikost, tvar těla nebo charakteristické znaky." },
              { id: "c2", label: "Popis chování a zvyků", desc: "Žák uvádí, co zvíře dělá, jak se chová, kde žije nebo čím se živí." },
              { id: "c3", label: "Výběr výstižných slov", desc: "Žák volí slova, která čtenáři pomohou zvíře si konkrétně představit." },
              { id: "c4", label: "Stavba vět", desc: "Žák píše celé, smysluplné věty — správně je začíná velkým písmenem a ukončuje tečkou." },
              { id: "c5", label: "Srozumitelnost textu", desc: "Text dává jako celek smysl a čtenář mu bez obtíží porozumí." },
              { id: "c6", label: "Uspořádání textu", desc: "Myšlenky na sebe logicky navazují — text má zřetelný začátek, střed a závěr." },
            ]} />
          </section>

          {/* levels */}
          <section>
            <AIHint message="Chci upravit úrovně hodnocení">
              <p style={{
                fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500,
                fontSize: 15, color: "#717182", letterSpacing: "0.04em",
                textTransform: "uppercase", margin: "0 0 12px",
              }}>
                Úrovně hodnocení
              </p>
            </AIHint>
            <p style={{
              fontFamily: "'Inter:Regular', sans-serif", fontSize: 15,
              color: "#717182", lineHeight: 1.7, margin: "0 0 16px",
            }}>
              Úrovně popisují, na jaké úrovni zvládnutí se žák na cestě k cíli nachází. Vyberte si z přednastavených úrovní hodnocení podle vytvořených metodik, nebo si nastavte vlastní.
            </p>

            {editingLevels ? (
              <LevelPicker
                onDone={(id) => { setSelectedLevelId(id); setEditingLevels(false); }}
                onSaveCustom={setSavedCustomLevels}
                savedCustomLevels={savedCustomLevels}
              />
            ) : selectedLevelId === "vlastní" ? (
              <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: "19px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a" }}>
                    Vlastní úrovně
                  </span>
                  <button
                    onClick={() => setEditingLevels(true)}
                    style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
                  >
                    <IconEdit />
                    Upravit
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {savedCustomLevels.map((lv, i) => (
                    <div key={lv.id} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                      <span style={{
                        flexShrink: 0, padding: "3px 10px", borderRadius: 20,
                        background: "rgba(236,236,240,0.7)",
                        fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, color: "#0a0a0a",
                        whiteSpace: "nowrap",
                      }}>
                        {lv.name || `Úroveň ${i + 1}`}
                      </span>
                      {lv.desc && (
                        <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", lineHeight: 1.6 }}>
                          {lv.desc}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (() => {
              const opt = levelOptions.find((o) => o.id === selectedLevelId) ?? levelOptions[0];
              return (
                <div style={{
                  background: "#fff", border: "1.5px solid rgba(0,0,0,0.12)",
                  borderRadius: 14, padding: "19px 16px",
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <span style={{
                      flexShrink: 0, width: 16, height: 16, borderRadius: "50%", marginTop: 2,
                      background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />
                    </span>
                    <span>
                      <span style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a", marginBottom: 4 }}>
                        {opt.name}
                      </span>
                      <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", lineHeight: 1.65 }}>
                        {opt.desc}
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingLevels(true)}
                    style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
                  >
                    <IconEdit />
                    Upravit
                  </button>
                </div>
              );
            })()}

          </section>
        </div>
      </div>

      {printOpen && (
        <PrintModal
          onClose={() => setPrintOpen(false)}
          students={classStudents}
          goal={selectedGoal.text}
        />
      )}
      {evidenceOpen && (
        <EvidenceModal
          onClose={() => setEvidenceOpen(false)}
          students={classStudents}
          goal={selectedGoal.text}
          goalId={selectedGoal.id}
          subject={selectedGoal.subject}
          className={selectedGoal.className}
        />
      )}
      {cameraOpen && <CameraModal onClose={() => setCameraOpen(false)} />}
      </>
    );
  }

  // merge both goal types into one unified list for display
  const allGoals: AnyGoal[] = [
    ...tpGoals.map(g => ({ id: g.id, text: g.text, subject: g.subject, cls: g.trida, period: g.month, isTp: true })),
    ...goals.map(g => ({ id: g.id, text: g.text, subject: g.subject, cls: g.className, period: "", isTp: false })),
  ];
  const subjects = Array.from(new Set(allGoals.map(g => g.subject))).sort();
  const classes  = Array.from(new Set(allGoals.map(g => g.cls).filter(Boolean))).sort();
  const periods  = Array.from(new Set(tpGoals.map(g => g.month).filter(Boolean))).sort();

  const monthToDate: Record<string, string> = {
    "Září": "2025-09", "Říjen": "2025-10", "Listopad": "2025-11", "Prosinec": "2025-12",
    "Leden": "2026-01", "Únor": "2026-02", "Březen": "2026-03", "Duben": "2026-04",
    "Květen": "2026-05", "Červen": "2026-06",
  };
  const goalPeriodOptions = [
    { id: "vse", label: "Celé období" },
    { id: "1-pololeti", label: "1. pololetí" },
    { id: "2-pololeti", label: "2. pololetí" },
    { id: "vlastni", label: "Vlastní období" },
  ];
  const filtered = allGoals.filter(g => {
    if (filterSubject && g.subject !== filterSubject) return false;
    if (filterClass   && g.cls     !== filterClass)   return false;
    if (filterPeriod !== "vse") {
      const ym = monthToDate[g.period] ?? "";
      if (filterPeriod === "1-pololeti" && !(ym >= "2025-09" && ym <= "2026-01")) return false;
      if (filterPeriod === "2-pololeti" && !(ym >= "2026-02" && ym <= "2026-06")) return false;
      if (filterPeriod === "vlastni") {
        if (filterDateFrom && ym && ym < filterDateFrom.slice(0, 7)) return false;
        if (filterDateTo   && ym && ym > filterDateTo.slice(0, 7))   return false;
      }
    }
    if (search && !g.text.toLowerCase().includes(search.toLowerCase()) && !g.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectStyle: React.CSSProperties = {
    padding: "10px 12px", borderRadius: 8, border: "1.5px solid rgba(0,0,0,0.12)",
    background: "#fff", fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a",
    cursor: "pointer", outline: "none", appearance: "none" as any, WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23717182' stroke-width='1.33' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 30,
  };

  const goalNum = (id: string) => (goalNums.get(id) ?? (goals.findIndex(g => g.id === id) + 1 + tpGoals.length)) || undefined;

  return (
    <div style={{ padding: "32px 40px" }}>
      <Breadcrumb crumbs={[{ label: "Formativní hodnocení" }, { label: "Vyučovací hodiny" }]} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 24, color: "#0a0a0a", margin: 0 }}>
          Vyučovací hodiny
        </h1>
        <button
          onClick={() => { setNewGoalText(""); setCreatingGoal(true); }}
          style={{ ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 8 }}
        >
          <IconPlus />
          Vytvořit hodinu
        </button>
      </div>

      {/* filter bar */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.09)", padding: "21px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 180px", minWidth: 160 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#b0b0be", pointerEvents: "none" }}>
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Hledat hodinu…"
              style={{ ...selectStyle, width: "100%", boxSizing: "border-box", paddingLeft: 30, backgroundImage: "none" }}
            />
          </div>
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={selectStyle}>
            <option value="">Všechny předměty</option>
            {subjects.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={selectStyle}>
            <option value="">Všechny třídy</option>
            {classes.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} style={selectStyle}>
            {goalPeriodOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          {filterPeriod === "vlastni" && (
            <>
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                style={{ ...selectStyle, paddingRight: 12, backgroundImage: "none" }}
                title="Od"
              />
              <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#717182" }}>–</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                style={{ ...selectStyle, paddingRight: 12, backgroundImage: "none" }}
                title="Do"
              />
            </>
          )}
          {(filterSubject || filterClass || filterPeriod !== "vse" || search) && (
            <button
              onClick={() => { setFilterSubject(""); setFilterClass(""); setFilterPeriod("vse"); setFilterDateFrom(""); setFilterDateTo(""); setSearch(""); }}
              style={{ padding: "10px 14px", borderRadius: 8, border: "1.5px solid rgba(220,38,38,0.3)", background: "rgba(254,242,242,0.6)", color: "#dc2626", fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, cursor: "pointer" }}
            >
              Zrušit filtry
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, color: "#b0b0be", margin: 0 }}>
            {allGoals.length === 0 ? "Zatím žádné hodiny. Vytvořte první nebo vygenerujte z tématického plánu." : "Žádné hodiny neodpovídají filtru."}
          </p>
        </div>
      ) : (
        <LessonList
          filtered={filtered}
          animateIn={animateIn}
          tpGoals={tpGoals}
          removeTpGoal={removeTpGoal}
          setSelectedTpGoalId={id => setSelectedTpGoalId(id)}
          setTpEditingLevels={setTpEditingLevels}
          setSelectedGoalId={id => setSelectedGoalId(id)}
          btnStyle={btnStyle}
        />
      )}
    </div>
  );
}

// ─── sdílená karta důkazu ────────────────────────────────────────────────────

const EVIDENCE_LEVEL_COLORS: Record<string, { bg: string; color: string }> = {
  "Zvládám":  { bg: "#dcfce7", color: "#166534" },
  "Rozvíjím": { bg: "#fef9c3", color: "#854d0e" },
  "Začínám":  { bg: "#fee2e2", color: "#991b1b" },
};

function EvidenceRecordCard({ r, goalNums, hideStudent }: { r: EvidenceRecord; goalNums: Map<string, number>; hideStudent?: boolean }) {
  const lc = r.level ? (EVIDENCE_LEVEL_COLORS[r.level] ?? { bg: "#f3f4f6", color: "#374151" }) : null;
  const iconColor = r.type === "audio" ? "#7c3aed" : "#0891b2";
  const iconBg    = r.type === "audio" ? "#f3f0ff" : "#ecfeff";

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid rgba(0,0,0,0.08)", padding: "19px 18px", display: "flex", alignItems: "center", gap: 18 }}>
      {/* type icon */}
      <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 10, background: r.criterion ? "#f0fdf4" : iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: r.criterion ? "#16a34a" : iconColor }}>
        {r.criterion ? (
          <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
            <path d="M8 14V7" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
            <path d="M8 7c0-2.5 2.5-4 4.5-3.5C12.5 6 10.5 7.5 8 7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
            <path d="M8 9.5c0-2-2.5-3.5-4.5-3C3.5 9 5.5 10 8 9.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
            <path d="M5 14h6" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
          </svg>
        ) : r.type === "audio" ? (
          <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
            <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.33"/>
            <path d="M2.667 8A5.333 5.333 0 0 0 8 13.333 5.333 5.333 0 0 0 13.333 8" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
            <path d="M8 13.333V15.333" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
            <path d="M1.333 5.333A1.333 1.333 0 0 1 2.667 4h1.2L5.2 2h5.6l1.333 2h1.2A1.333 1.333 0 0 1 14.667 5.333v7.334A1.333 1.333 0 0 1 13.333 14H2.667a1.333 1.333 0 0 1-1.334-1.333V5.333z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="8" cy="9" r="2.333" stroke="currentColor" strokeWidth="1.33"/>
          </svg>
        )}
      </div>

      {/* main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* row 1: (jméno ·) předmět · třída · datum */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 5 }}>
          {!hideStudent && (
            <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 16, color: "#0a0a0a" }}>
              {r.studentName}
            </span>
          )}
          <span style={{ padding: "3px 8px", borderRadius: 20, background: "#f3e8ff", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#8200db" }}>
            {r.subject}
          </span>
          {!hideStudent && (
            <span style={{ padding: "3px 8px", borderRadius: 20, background: "rgba(236,236,240,0.8)", fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182" }}>
              {r.className}
            </span>
          )}
          <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#b0b0be" }}>
            {formatDate(r.date)}
          </span>
        </div>
        {/* row 2: Cíl N + text cíle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: r.criterion ? 5 : 0 }}>
          {goalNums.get(r.goalId) && (
            <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, padding: "1px 8px 1px 6px", borderRadius: 20, background: "linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)", color: "#92400e", border: "1px solid rgba(245,158,11,0.3)", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M6 2h12v8a6 6 0 0 1-12 0V2z" stroke="#d97706" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M6 6H3a2 2 0 0 0 0 4h3M18 6h3a2 2 0 0 1 0 4h-3" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 16v4M8 20h8" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Cíl {goalNums.get(r.goalId)}
            </span>
          )}
          <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {r.goalText}
          </span>
        </div>
        {/* row 3: kritérium + úroveň */}
        {r.criterion && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(236,236,240,0.7)", fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#374151" }}>
              {r.criterion}
            </span>
            {r.level && lc && (
              <span style={{ padding: "2px 8px", borderRadius: 20, background: lc.bg, color: lc.color, fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13 }}>
                {r.level}
              </span>
            )}
          </div>
        )}
      </div>

      {/* actions */}
      <div style={{ flexShrink: 0, display: "flex", gap: 6, alignItems: "center" }}>
        {!r.criterion && (
          <button
            title={r.type === "audio" ? "Přehrát nahrávku" : "Zobrazit fotografii"}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "9px 8px", borderRadius: 8, color: iconColor, display: "flex", opacity: 0.7, transition: "opacity 0.12s" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
          >
            {r.type === "audio" ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 3.333l9.333 4.667L4 12.667V3.333z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M1 8s2.667-5.333 7-5.333S15 8 15 8s-2.667 5.333-7 5.333S1 8 1 8z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.33"/>
              </svg>
            )}
          </button>
        )}
        <button
          title="Upravit důkaz"
          style={{ background: "none", border: "none", cursor: "pointer", padding: "9px 8px", borderRadius: 8, color: "#717182", display: "flex", opacity: 0.6, transition: "opacity 0.12s" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M11.333 2a1.885 1.885 0 0 1 2.667 2.667L5.333 13.333 1.333 14.667l1.334-4L11.333 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          title="Odstranit důkaz"
          style={{ background: "none", border: "none", cursor: "pointer", padding: "9px 8px", borderRadius: 8, display: "flex", opacity: 0.45, transition: "opacity 0.12s" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0.45")}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M5.333 4V2.667a.667.667 0 0 1 .667-.667h4a.667.667 0 0 1 .667.667V4M12.667 4l-.667 9.333A1.333 1.333 0 0 1 10.667 14H5.333A1.333 1.333 0 0 1 4 13.333L3.333 4" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── placeholder views ────────────────────────────────────────────────────────

// ─── důkazy o učení view ──────────────────────────────────────────────────────

const SUBJECTS = ["Čeština", "Matematika", "Prvouka", "Anglický jazyk", "Hudební výchova", "Výtvarná výchova", "Tělesná výchova"];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
}

function DukazyView() {
  const { evidenceRecords } = useContext(EvidenceContext);
  const { tpGoals } = useContext(GoalsContext);
  const goalNums = buildGoalNumbers(tpGoals);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [evidenceModalCtx, setEvidenceModalCtx] = useState<{ students: Student[]; goal: string; goalId: string; subject: string; className: string } | null>(null);

  const allGoalOptions = [
    ...initialGoals.map(g => ({ id: g.id, text: g.text, subject: g.subject, className: g.className })),
    ...tpGoals.map(g => ({ id: g.id, text: g.text, subject: g.subject, className: g.trida })),
  ];

  function openEvidenceModal() {
    const g = allGoalOptions[0];
    if (!g) return;
    const students = initialClasses.find(c => c.name === g.className)?.students ?? [];
    setEvidenceModalCtx({ goal: g.text, goalId: g.id, subject: g.subject, className: g.className, students });
  }

  const [filterGoalId, setFilterGoalId] = useState("vse");
  const [filterSubject, setFilterSubject] = useState("vse");
  const [filterClass, setFilterClass] = useState("vse");
  const [filterStudentId, setFilterStudentId] = useState("vse");
  const [filterPeriod, setFilterPeriod] = useState("vse");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [search, setSearch] = useState("");

  const allGoals = [
    ...initialGoals.map(g => ({ id: g.id, text: g.text })),
    ...tpGoals.map(g => ({ id: g.id, text: g.text })),
    ...Array.from(new Set(evidenceRecords.map(r => r.goalId)))
      .filter(id => !initialGoals.find(g => g.id === id) && !tpGoals.find(g => g.id === id))
      .map(id => ({ id, text: evidenceRecords.find(r => r.goalId === id)?.goalText ?? id })),
  ];

  const allSubjects = Array.from(new Set([...SUBJECTS, ...evidenceRecords.map(r => r.subject)])).sort();
  const allClasses = Array.from(new Set(evidenceRecords.map(r => r.className))).sort();

  const studentsOfClass = filterClass === "vse"
    ? Array.from(new Map(evidenceRecords.map(r => [r.studentId, { id: r.studentId, name: r.studentName }])).values()).sort((a, b) => a.name.localeCompare(b.name, "cs"))
    : Array.from(new Map(evidenceRecords.filter(r => r.className === filterClass).map(r => [r.studentId, { id: r.studentId, name: r.studentName }])).values()).sort((a, b) => a.name.localeCompare(b.name, "cs"));

  function inPeriod(dateStr: string) {
    if (filterPeriod === "vse") return true;
    const d = new Date(dateStr);
    const now = new Date();
    if (filterPeriod === "mesic") { const m = new Date(now); m.setMonth(m.getMonth() - 1); return d >= m; }
    if (filterPeriod === "tri-mesice") { const m = new Date(now); m.setMonth(m.getMonth() - 3); return d >= m; }
    if (filterPeriod === "1-pololeti") return d >= new Date("2025-09-01") && d <= new Date("2026-01-31");
    if (filterPeriod === "2-pololeti") return d >= new Date("2026-02-01") && d <= new Date("2026-06-30");
    if (filterPeriod === "vlastni") {
      if (filterDateFrom && d < new Date(filterDateFrom)) return false;
      if (filterDateTo && d > new Date(filterDateTo + "T23:59:59")) return false;
      return true;
    }
    return true;
  }

  const filtered = [...evidenceRecords]
    .filter(r => {
      if (filterGoalId !== "vse" && r.goalId !== filterGoalId) return false;
      if (filterSubject !== "vse" && r.subject !== filterSubject) return false;
      if (filterClass !== "vse" && r.className !== filterClass) return false;
      if (filterStudentId !== "vse" && r.studentId !== filterStudentId) return false;
      if (!inPeriod(r.date)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!r.studentName.toLowerCase().includes(q) && !r.goalText.toLowerCase().includes(q) && !r.subject.toLowerCase().includes(q) && !r.className.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const activeFilters = [filterGoalId, filterSubject, filterClass, filterStudentId, filterPeriod].filter(v => v !== "vse").length + (search.trim() ? 1 : 0);

  function resetFilters() {
    setFilterGoalId("vse"); setFilterSubject("vse"); setFilterClass("vse");
    setFilterStudentId("vse"); setFilterPeriod("vse");
    setFilterDateFrom(""); setFilterDateTo(""); setSearch("");
  }

  const selStyle: React.CSSProperties = {
    padding: "10px 12px", borderRadius: 8, border: "1.5px solid rgba(0,0,0,0.12)",
    background: "#fff", fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a",
    cursor: "pointer", outline: "none", appearance: "none" as any, WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23717182' stroke-width='1.33' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 30,
  };

  const periodOptions = [
    { id: "vse", label: "Celé období" },
    { id: "mesic", label: "Poslední měsíc" },
    { id: "tri-mesice", label: "Poslední 3 měsíce" },
    { id: "1-pololeti", label: "1. pololetí" },
    { id: "2-pololeti", label: "2. pololetí" },
    { id: "vlastni", label: "Vlastní období" },
  ];

  return (
    <div style={{ padding: "32px 40px", minHeight: "100%" }}>
      <Breadcrumb crumbs={[{ label: "Formativní hodnocení" }, { label: "Důkazy o učení" }]} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 18 }}>
        <div>
          <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 24, color: "#0a0a0a", margin: "0 0 2px" }}>
            Důkazy o učení
          </h1>
          <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#717182" }}>
            {filtered.length} {filtered.length === 1 ? "záznam" : filtered.length < 5 ? "záznamy" : "záznamů"}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
          <button
            onClick={openEvidenceModal}
            style={{ ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 9, whiteSpace: "nowrap" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 12.667C2 11.194 4.686 10 8 10s6 1.194 6 2.667" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
              <circle cx="8" cy="5.333" r="3.333" stroke="currentColor" strokeWidth="1.33"/>
              <path d="M13.333 2v4M11.333 4h4" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
            </svg>
            Zaznamenat důkazy o učení
          </button>
          <button
            onClick={() => setCameraOpen(true)}
            style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 9, whiteSpace: "nowrap" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M15.333 5.333L10.667 8l4.666 2.667V5.333zM1.333 4h8a1.333 1.333 0 0 1 1.334 1.333v5.334A1.333 1.333 0 0 1 9.333 12h-8A1.333 1.333 0 0 1 0 10.667V5.333A1.333 1.333 0 0 1 1.333 4z" stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Nahrát hotovou tabulku hodnocení
          </button>
        </div>
      </div>

      {/* filter bar */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.09)", padding: "21px 20px", marginBottom: 24 }}>
        {/* row 1: Předmět · Třída · Cíl */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={selStyle}>
            <option value="vse">Všechny předměty</option>
            {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterStudentId("vse"); }} style={selStyle}>
            <option value="vse">Všechny třídy</option>
            {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={filterGoalId} onChange={e => setFilterGoalId(e.target.value)} style={{ ...selStyle, flex: 1, minWidth: 0 }}>
            <option value="vse">Všechny cíle</option>
            {allGoals.map(g => {
              const num = goalNums.get(g.id);
              const prefix = num ? `Cíl ${num} · ` : "";
              const label = prefix + (g.text.length > 60 ? g.text.slice(0, 58) + "…" : g.text);
              return <option key={g.id} value={g.id}>{label}</option>;
            })}
          </select>
        </div>

        {/* row 2: Žáci · Časové období · (vlastní datumový rozsah) · Zrušit filtry */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <select value={filterStudentId} onChange={e => setFilterStudentId(e.target.value)} style={selStyle}>
            <option value="vse">{filterClass === "vse" ? "Všichni žáci" : "Všichni žáci třídy"}</option>
            {studentsOfClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} style={selStyle}>
            {periodOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
          </select>

          {filterPeriod === "vlastni" && (
            <>
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                style={{ ...selStyle, paddingRight: 12, backgroundImage: "none" }}
                title="Od"
              />
              <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#717182" }}>–</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                style={{ ...selStyle, paddingRight: 12, backgroundImage: "none" }}
                title="Do"
              />
            </>
          )}

          {activeFilters > 0 && (
            <button
              onClick={resetFilters}
              style={{
                padding: "10px 14px", borderRadius: 8,
                border: "1.5px solid rgba(220,38,38,0.3)",
                background: "rgba(254,226,226,0.5)",
                cursor: "pointer",
                fontFamily: "'Inter:Regular', sans-serif", fontSize: 14,
                color: "#dc2626", whiteSpace: "nowrap",
              }}
            >
              Zrušit filtry ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {/* evidence list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#717182", fontFamily: "'Inter:Regular', sans-serif", fontSize: 16 }}>
          Žádné záznamy neodpovídají vybraným filtrům.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(r => <EvidenceRecordCard key={r.id} r={r} goalNums={goalNums} />)}
        </div>
      )}

      {evidenceModalCtx && (
        <EvidenceModal
          onClose={() => setEvidenceModalCtx(null)}
          students={evidenceModalCtx.students}
          goal={evidenceModalCtx.goal}
          goalId={evidenceModalCtx.goalId}
          subject={evidenceModalCtx.subject}
          className={evidenceModalCtx.className}
        />
      )}
      {cameraOpen && <CameraModal onClose={() => setCameraOpen(false)} />}
    </div>
  );
}

// ─── goal selector modal ──────────────────────────────────────────────────────

function GoalSelectorModal({ tpGoals, onClose, onConfirm }: {
  tpGoals: TpGoal[];
  onClose: () => void;
  onConfirm: (ctx: { students: Student[]; goal: string; goalId: string; subject: string; className: string }) => void;
}) {
  const goalNums = buildGoalNumbers(tpGoals);
  const allGoalOptions = [
    ...initialGoals.map(g => ({ id: g.id, text: g.text, subject: g.subject, className: g.className })),
    ...tpGoals.map(g => ({ id: g.id, text: g.text, subject: g.subject, className: g.trida })),
  ];

  const [selectedGoalId, setSelectedGoalId] = useState(allGoalOptions[0]?.id ?? "");
  const selectedGoal = allGoalOptions.find(g => g.id === selectedGoalId) ?? allGoalOptions[0];

  const availableClasses = Array.from(new Set(allGoalOptions.map(g => g.className))).sort();
  const [selectedClass, setSelectedClass] = useState(selectedGoal?.className ?? availableClasses[0] ?? "3.A");

  const students = initialClasses.find(c => c.name === selectedClass)?.students ?? [];

  const selStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "9px 32px 9px 12px",
    borderRadius: 9, border: "1.5px solid rgba(0,0,0,0.14)",
    fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a",
    background: "#fff", outline: "none", appearance: "none" as any, WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23717182' stroke-width='1.33' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
    cursor: "pointer",
  };

  function handleConfirm() {
    if (!selectedGoal) return;
    onConfirm({
      students,
      goal: selectedGoal.text,
      goalId: selectedGoal.id,
      subject: selectedGoal.subject,
      className: selectedClass,
    });
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: 18, padding: "32px 32px 28px", width: 480, boxShadow: "0 16px 48px rgba(0,0,0,0.22)" }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 20, color: "#0a0a0a", margin: "0 0 6px" }}>
          Zaznamenat důkazy o učení
        </h2>
        <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#717182", margin: "0 0 24px", lineHeight: 1.6 }}>
          Vyberte třídu a cíl, ke kterému chcete zaznamenat důkazy.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, color: "#717182", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>
              Třída
            </label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              style={selStyle}
            >
              {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
              {!availableClasses.includes(selectedClass) && <option value={selectedClass}>{selectedClass}</option>}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, color: "#717182", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>
              Výukový cíl
            </label>
            <select
              value={selectedGoalId}
              onChange={e => { setSelectedGoalId(e.target.value); const g = allGoalOptions.find(x => x.id === e.target.value); if (g) setSelectedClass(g.className); }}
              style={selStyle}
            >
              {allGoalOptions.map(g => {
                const num = goalNums.get(g.id);
                const prefix = num ? `Cíl ${num} · ` : "";
                const label = prefix + (g.text.length > 60 ? g.text.slice(0, 58) + "…" : g.text);
                return <option key={g.id} value={g.id}>{label}</option>;
              })}
            </select>
          </div>

          {selectedGoal && (
            <div style={{ background: "#fafafa", borderRadius: 10, padding: "15px 14px", display: "flex", gap: 10 }}>
              <span style={{ padding: "3px 8px", borderRadius: 20, background: "#f3e8ff", color: "#8200db", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13 }}>
                {selectedGoal.subject}
              </span>
              <span style={{ padding: "3px 8px", borderRadius: 20, background: "rgba(236,236,240,0.9)", color: "#717182", fontFamily: "'Inter:Regular', sans-serif", fontSize: 13 }}>
                {selectedClass} · {students.length} žáků
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            onClick={handleConfirm}
            disabled={!selectedGoal || students.length === 0}
            style={{ ...btnStyle("primary"), flex: 1, justifyContent: "center", display: "flex", opacity: (!selectedGoal || students.length === 0) ? 0.4 : 1 }}
          >
            Pokračovat
          </button>
          <button onClick={onClose} style={btnStyle("ghost")}>Zrušit</button>
        </div>
      </div>
    </div>
  );
}

function PlaceholderView({ label }: { label: string }) {
  return (
    <div style={{ padding: "32px 40px" }}>
      <Breadcrumb crumbs={[{ label: "Formativní hodnocení" }, { label }]} />
      <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 24, color: "#0a0a0a", margin: 0 }}>
        {label}
      </h1>
    </div>
  );
}

// ─── hodnocení view ───────────────────────────────────────────────────────────

interface StudentAssessment {
  studentId: string;
  studentName: string;
  text: string;
}

interface Hodnoceni {
  id: string;
  title: string;
  className: string;
  period: string;
  createdAt: string;
  students: StudentAssessment[];
}

type HodnoceniPeriod = "mesic" | "ctvrtleti" | "pololeti" | "vlastni";

const periodLabels: Record<HodnoceniPeriod, string> = {
  mesic: "Měsíc",
  ctvrtleti: "Čtvrtletí",
  pololeti: "Pololetí",
  vlastni: "Vlastní",
};

const monthOptions = ["Září 2025", "Říjen 2025", "Listopad 2025", "Prosinec 2025", "Leden 2026", "Únor 2026", "Březen 2026", "Duben 2026", "Květen 2026", "Červen 2026"];
const quarterOptions = ["1. čtvrtletí 2025/26", "2. čtvrtletí 2025/26", "3. čtvrtletí 2025/26", "4. čtvrtletí 2025/26"];
const halfOptions = ["1. pololetí 2025/26", "2. pololetí 2025/26"];

const assessmentTemplates = [
  (name: string) => `${name} je soustředěný žák, který pracuje svědomitě a s chutí. V tomto období prokázal pokrok zejména v porozumění textu a samostatném psaní. Při práci ve skupině přispívá konstruktivně a dokáže naslouchat spolužákům. Doporučuji zaměřit se na rozšiřování slovní zásoby.`,
  (name: string) => `${name} přistupuje k učení s velkou pečlivostí a zodpovědností. Její písemné práce jsou přehledné a dobře strukturované. V tomto období výrazně pokročila v oblasti gramatiky. Ráda pomáhá ostatním a vytváří příjemnou atmosféru ve třídě.`,
  (name: string) => `${name} projevuje přirozené nadání a zájem o výuku. Aktivně se zapojuje do diskuzí a přichází s originálními nápady. Občas potřebuje připomenout, aby dokončoval práci do konce. Jeho pokrok v čtení s porozuměním je v tomto období velmi patrný.`,
  (name: string) => `${name} pracuje svědomitě a systematicky. V tomto období se výrazně zlepšila v samostatné práci a dokáže lépe organizovat své myšlenky v písemném projevu. Je spolehlivá a vždy plní zadané úkoly. Doporučuji více se zapojovat do ústního projevu.`,
  (name: string) => `${name} dělá v tomto období viditelné pokroky. Zvláště v oblasti čtení a psaní je zlepšení znatelné. Potřebuje více času na zpracování zadání, ale výsledky jsou kvalitní. Je klidný a rozvážný, do práce se ponořuje naplno.`,
  (name: string) => `${name} je zvídavá žákyně, která klade mnoho otázek a hledá souvislosti. V tomto období prokázala schopnost samostatného uvažování a kritického myšlení. Písemný projev je výstižný a tvořivý. Doporučuji pokračovat v čtení knih podle vlastního výběru.`,
];

function generateAssessment(firstName: string, lastName: string, index: number): string {
  const fn = assessmentTemplates[index % assessmentTemplates.length];
  return fn(firstName);
}

function HodnoceniGeneratorPage({ onBack, onGenerate }: { onBack: () => void; onGenerate: (data: { students: StudentAssessment[]; period: string; className: string }) => void }) {
  const [selectedClassId, setSelectedClassId] = useState(initialClasses[0]?.id ?? "");
  const cls = initialClasses.find(c => c.id === selectedClassId) ?? initialClasses[0];
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<HodnoceniPeriod>("mesic");
  const [periodValue, setPeriodValue] = useState(monthOptions[0]);
  const [customFrom, setCustomFrom] = useState("2026-09-01");
  const [customTo, setCustomTo] = useState(new Date().toISOString().slice(0, 10));
  const [instruction, setInstruction] = useState("");
  const [generating, setGenerating] = useState(false);

  const allSelected = cls.students.length > 0 && selectedStudents.size === cls.students.length;

  function toggleStudent(id: string) {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelectedStudents(new Set());
    else setSelectedStudents(new Set(cls.students.map(s => s.id)));
  }

  function handlePeriodChange(p: HodnoceniPeriod) {
    setPeriod(p);
    if (p === "mesic") setPeriodValue(monthOptions[0]);
    else if (p === "ctvrtleti") setPeriodValue(quarterOptions[0]);
    else if (p === "pololeti") setPeriodValue(halfOptions[0]);
  }

  const periodSelectOptions = period === "mesic" ? monthOptions : period === "ctvrtleti" ? quarterOptions : halfOptions;

  const resolvedPeriodLabel = period === "vlastni"
    ? `${customFrom.split("-").reverse().join(".")} – ${customTo.split("-").reverse().join(".")}`
    : periodValue;

  function handleGenerate() {
    if (selectedStudents.size === 0) return;
    setGenerating(true);
    setTimeout(() => {
      const selectedList = cls.students.filter(s => selectedStudents.has(s.id));
      const students: StudentAssessment[] = selectedList.map((s, i) => ({
        studentId: s.id,
        studentName: `${s.firstName} ${s.lastName}`,
        text: generateAssessment(s.firstName, s.lastName, i),
      }));
      onGenerate({ students, period: resolvedPeriodLabel, className: cls.name });
    }, 800);
  }

  const selectStyle: React.CSSProperties = {
    fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a",
    background: "#fff", border: "1px solid rgba(0,0,0,0.13)", borderRadius: 9,
    padding: "11px 12px", outline: "none", cursor: "pointer", width: "100%",
  };

  return (
    <div style={{ padding: "32px 40px" }}>
      <Breadcrumb crumbs={[
        { label: "Formativní hodnocení" },
        { label: "Hodnocení", onClick: onBack },
        { label: "Nové hodnocení" },
      ]} />
      <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 24, color: "#0a0a0a", margin: "0 0 6px" }}>
        Vygenerovat hodnocení
      </h1>
      <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, color: "#717182", margin: "0 0 32px", lineHeight: 1.6 }}>
        AI navrhne slovní hodnocení žáků na základě zaznamenaných důkazů o učení.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {/* class picker */}
        <div>
          <label style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a", marginBottom: 8 }}>
            Třída
          </label>
          <select value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setSelectedStudents(new Set()); }} style={selectStyle}>
            {initialClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* student list */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <label style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a" }}>
              Žáci
              {selectedStudents.size > 0 && (
                <span style={{ marginLeft: 8, fontFamily: "'Inter:Regular', sans-serif", fontWeight: 400, fontSize: 14, color: "#717182" }}>
                  {selectedStudents.size} vybráno
                </span>
              )}
            </label>
            <button onClick={toggleAll} style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
              {allSelected ? "Zrušit výběr" : "Vybrat všechny"}
            </button>
          </div>
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 12, overflow: "hidden", maxHeight: 240, overflowY: "auto" }}>
            {cls.students.map((st, i) => {
              const checked = selectedStudents.has(st.id);
              return (
                <button
                  key={st.id}
                  onClick={() => toggleStudent(st.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, width: "100%",
                    padding: "15px 16px", background: checked ? "rgba(10,10,10,0.03)" : "transparent",
                    border: "none", borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.06)",
                    cursor: "pointer", textAlign: "left", transition: "background 0.1s",
                  }}
                >
                  <span style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: checked ? "none" : "1.5px solid rgba(0,0,0,0.2)",
                    background: checked ? "#0a0a0a" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.12s",
                  }}>
                    {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                  <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a" }}>
                    {st.firstName} {st.lastName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* period */}
        <div>
          <label style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a", marginBottom: 10 }}>
            Časové období
          </label>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {(["mesic", "ctvrtleti", "pololeti", "vlastni"] as HodnoceniPeriod[]).map(p => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                style={{
                  padding: "9px 14px", borderRadius: 20, border: "1.5px solid",
                  borderColor: period === p ? "#0a0a0a" : "rgba(0,0,0,0.13)",
                  background: period === p ? "#0a0a0a" : "#fff",
                  color: period === p ? "#fff" : "#717182",
                  fontFamily: period === p ? "'Inter:Medium', sans-serif" : "'Inter:Regular', sans-serif",
                  fontSize: 15, cursor: "pointer", transition: "all 0.12s",
                }}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
          {period === "vlastni" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", marginBottom: 4 }}>Od</label>
                <input
                  type="date"
                  value={customFrom}
                  max={customTo}
                  onChange={e => setCustomFrom(e.target.value)}
                  style={{ ...selectStyle, width: "100%", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flexShrink: 0, color: "#b0b0be", fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, paddingTop: 20 }}>—</div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", marginBottom: 4 }}>Do</label>
                <input
                  type="date"
                  value={customTo}
                  min={customFrom}
                  onChange={e => setCustomTo(e.target.value)}
                  style={{ ...selectStyle, width: "100%", boxSizing: "border-box" }}
                />
              </div>
            </div>
          ) : (
            <select value={periodValue} onChange={e => setPeriodValue(e.target.value)} style={selectStyle}>
              {periodSelectOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
        </div>

        {/* ai instruction */}
        <div>
          <label style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a", marginBottom: 8 }}>
            Pokyn pro AI
            <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontWeight: 400, color: "#717182", marginLeft: 6 }}>(volitelné)</span>
          </label>
          <textarea
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder="Např. Zaměř se na pokrok žáka, piš přátelsky a povzbudivě..."
            rows={3}
            style={{
              width: "100%", resize: "vertical", padding: "15px 14px", boxSizing: "border-box",
              fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a",
              background: "#fff", border: "1px solid rgba(0,0,0,0.13)", borderRadius: 9,
              outline: "none", lineHeight: 1.7,
            }}
          />
        </div>

        {/* generate button */}
        <button
          onClick={handleGenerate}
          disabled={selectedStudents.size === 0 || generating}
          style={{
            width: "100%", padding: "19px 24px",
            background: selectedStudents.size === 0 ? "rgba(10,10,10,0.3)" : "#0a0a0a",
            color: "#fff", border: "none", borderRadius: 14, cursor: selectedStudents.size === 0 ? "default" : "pointer",
            fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 18,
            transition: "background 0.15s", opacity: generating ? 0.6 : 1,
          }}
        >
          {generating ? "Generuji..." : "Generovat návrh hodnocení"}
        </button>
      </div>
    </div>
  );
}

function HodnoceniResultPage({
  students: initialStudents, period, className, title, createdAt, readOnly,
  onBack, onSave,
}: {
  students: StudentAssessment[]; period: string; className: string;
  title: string; createdAt: string; readOnly?: boolean;
  onBack: () => void; onSave?: (students: StudentAssessment[]) => void;
}) {
  const [students, setStudents] = useState(initialStudents);
  const [activeId, setActiveId] = useState(initialStudents[0]?.studentId ?? "");

  const active = students.find(s => s.studentId === activeId) ?? students[0];

  function updateText(id: string, text: string) {
    setStudents(prev => prev.map(s => s.studentId === id ? { ...s, text } : s));
  }

  return (
    <div style={{ padding: "32px 40px" }}>
      <Breadcrumb crumbs={[
        { label: "Formativní hodnocení" },
        { label: "Hodnocení", onClick: onBack },
        { label: title },
      ]} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 24, color: "#0a0a0a", margin: "0 0 4px" }}>
            {title}
          </h1>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#717182", margin: 0 }}>
            {className} · {period} · {createdAt}
          </p>
        </div>
        {!readOnly && onSave && (
          <button
            onClick={() => onSave(students)}
            style={{ ...btnStyle("primary"), padding: "12px 20px", borderRadius: 10, fontSize: 16, flexShrink: 0 }}
          >
            Uložit hodnocení
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 22, alignItems: "flex-start" }}>
        {/* student list sidebar */}
        <div style={{ width: 200, flexShrink: 0, background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.09)", overflow: "hidden" }}>
          {students.map((s, i) => (
            <button
              key={s.studentId}
              onClick={() => setActiveId(s.studentId)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "15px 14px", border: "none",
                borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.06)",
                background: s.studentId === activeId ? "rgba(10,10,10,0.05)" : "transparent",
                fontFamily: s.studentId === activeId ? "'Inter:Medium', sans-serif" : "'Inter:Regular', sans-serif",
                fontWeight: s.studentId === activeId ? 500 : 400,
                fontSize: 15, color: "#0a0a0a", cursor: "pointer", transition: "background 0.1s",
              }}
            >
              {s.studentName}
            </button>
          ))}
        </div>

        {/* assessment text */}
        {active && (
          <div style={{ flex: 1, background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.09)", padding: 24 }}>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#717182", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 10px" }}>
              {active.studentName}
            </p>
            {readOnly ? (
              <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, color: "#0a0a0a", lineHeight: 1.75, margin: 0 }}>
                {active.text}
              </p>
            ) : (
              <>
                <textarea
                  value={active.text}
                  onChange={e => updateText(active.studentId, e.target.value)}
                  rows={8}
                  style={{
                    width: "100%", resize: "vertical", padding: "0", boxSizing: "border-box",
                    fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, color: "#0a0a0a",
                    background: "transparent", border: "none", outline: "none", lineHeight: 1.75,
                  }}
                />
                <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#b0b0be", margin: "12px 0 0", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 10 }}>
                  Text navrhla AI na základě zaznamenaných důkazů o učení. Můžete ho upravit.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function HodnoceniView() {
  const [hodnoceni, setHodnoceni] = useState<Hodnoceni[]>([]);
  const [view, setView] = useState<"list" | "generating" | "result" | "detail">("list");
  const [pendingResult, setPendingResult] = useState<{ students: StudentAssessment[]; period: string; className: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (view === "generating") {
    return (
      <HodnoceniGeneratorPage
        onBack={() => setView("list")}
        onGenerate={(data) => { setPendingResult(data); setView("result"); }}
      />
    );
  }

  if (view === "result" && pendingResult) {
    const title = "Hodnocení " + pendingResult.className;
    const createdAt = new Date().toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
    return (
      <HodnoceniResultPage
        students={pendingResult.students}
        period={pendingResult.period}
        className={pendingResult.className}
        title={title}
        createdAt={createdAt}
        onBack={() => setView("list")}
        onSave={(students) => {
          const h: Hodnoceni = { id: "h" + Date.now(), title, className: pendingResult.className, period: pendingResult.period, createdAt, students };
          setHodnoceni(prev => [h, ...prev]);
          setPendingResult(null);
          setView("list");
        }}
      />
    );
  }

  if (view === "detail" && selectedId) {
    const h = hodnoceni.find(x => x.id === selectedId);
    if (h) return (
      <HodnoceniResultPage
        students={h.students}
        period={h.period}
        className={h.className}
        title={h.title}
        createdAt={h.createdAt}
        readOnly
        onBack={() => setView("list")}
      />
    );
  }

  return (
    <div style={{ padding: "32px 40px" }}>
      <Breadcrumb crumbs={[{ label: "Formativní hodnocení" }, { label: "Hodnocení" }]} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 24, color: "#0a0a0a", margin: 0 }}>
          Hodnocení
        </h1>
        <button
          onClick={() => setView("generating")}
          style={{ ...btnStyle("primary"), padding: "11px 16px", borderRadius: 10, fontSize: 15.5, display: "flex", alignItems: "center", gap: 9 }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.333L9.857 5.1l4.143.6-3 2.924.708 4.109L8 10.667l-3.708 1.966L5 8.624 2 5.7l4.143-.6L8 1.333z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Vygenerovat hodnocení
        </button>
      </div>

      {hodnoceni.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.09)", padding: "48px 32px", textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(236,236,240,0.85)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.333L9.857 5.1l4.143.6-3 2.924.708 4.109L8 10.667l-3.708 1.966L5 8.624 2 5.7l4.143-.6L8 1.333z" stroke="#717182" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 17, color: "#0a0a0a", margin: "0 0 6px" }}>
            Zatím žádná hodnocení
          </p>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#717182", margin: "0 0 20px", lineHeight: 1.6 }}>
            Vygenerujte první hodnocení na základě zaznamenaných důkazů o učení.
          </p>
          <button
            onClick={() => setView("generating")}
            style={{ ...btnStyle("ghost"), padding: "11px 18px", borderRadius: 10, fontSize: 15.5 }}
          >
            Vygenerovat hodnocení
          </button>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.09)", overflow: "hidden" }}>
          {hodnoceni.map((h, i) => (
            <button
              key={h.id}
              onClick={() => { setSelectedId(h.id); setView("detail"); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18,
                width: "100%", padding: "21px 20px", background: "transparent", border: "none",
                borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.07)",
                cursor: "pointer", textAlign: "left", transition: "background 0.12s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(236,236,240,0.35)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div>
                <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 16, color: "#0a0a0a", margin: "0 0 3px" }}>
                  {h.title}
                </p>
                <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", margin: 0 }}>
                  {h.period} · {h.createdAt} · {h.students.length} {h.students.length === 1 ? "žák" : h.students.length < 5 ? "žáci" : "žáků"}
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: "#b0b0be" }}>
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── buddy chat ───────────────────────────────────────────────────────────────

interface ChatMessage { id: string; role: "user" | "buddy"; text: string; }

const buddyReplies = [
  "Ahoj! Jsem Buddy, tvůj pomocník. Jak ti mohu pomoci?",
  "To je skvělá otázka! Formativní hodnocení pomáhá žákům lépe pochopit, kde se nacházejí na cestě k cíli.",
  "Kritéria hodnocení by měla být konkrétní a pozorovatelná. Zkus je formulovat jako 'Žák dokáže...'.",
  "Slovní hodnocení je mocný nástroj — popisuje pokrok žáka vlastními slovy místo číslic.",
  "Důkazy o učení mohou být různorodé: fotografie, nahrávky, písemné práce nebo ústní odpovědi.",
  "Portfoliové hodnocení dává žákům prostor ukázat, co skutečně umí a jak se zlepšili.",
  "Skvěle! Pokud potřebuješ s čímkoliv pomoci, jsem tu.",
];

const aiContextReplies: Record<string, string> = {
  goal: "Rád ti pomůžu s výzkumným cílem! Co chceš udělat?\n\n• Přeformulovat cíl srozumitelněji\n• Přizpůsobit cíl jinému ročníku\n• Rozšířit nebo zjednodušit cíl\n• Navrhnout podobné cíle pro jiná témata",
  criteria: "Mohu ti pomoci s kritérii hodnocení! Co tě zajímá?\n\n• Přidat nová kritéria\n• Přeformulovat stávající kritéria\n• Navrhnout kritéria pro jiný předmět\n• Seřadit kritéria podle důležitosti",
  criterion: "Co chceš s tímto kritériem udělat?\n\n• Přeformulovat název kritéria\n• Rozvinout nebo upřesnit popis\n• Navrhnout konkrétní příklady\n• Nahradit ho jiným kritériem",
  levels: "Pomůžu ti s úrovněmi hodnocení! Co potřebuješ?\n\n• Přejmenovat úrovně\n• Upravit popisy úrovní\n• Navrhnout alternativní škálu\n• Přidat nebo odebrat úrovně",
  level: "Co chceš s touto úrovní udělat?\n\n• Upravit název úrovně\n• Upřesnit nebo rozšířit popis\n• Navrhnout příklady žákovských prací pro tuto úroveň\n• Přeformulovat jazyk",
};

// ─── tématický plán view ──────────────────────────────────────────────────────

type TpColumn = "casJednotka" | "tema" | "rozsahHodin" | "pocetHodin" | "cile" | "vystupy" | "nazevSkoly" | "vyucujici" | "rvp";

interface TpColumnDef { id: TpColumn; label: string; defaultOn: boolean }
const tpColumns: TpColumnDef[] = [
  { id: "casJednotka", label: "Časová jednotka", defaultOn: true },
  { id: "tema", label: "Témata", defaultOn: true },
  { id: "cile", label: "Cíle vyučovacích hodin", defaultOn: true },
  { id: "rozsahHodin", label: "Rozsah hodin", defaultOn: false },
  { id: "pocetHodin", label: "Počet hodin", defaultOn: false },
  { id: "vystupy", label: "Výstupy", defaultOn: false },
  { id: "nazevSkoly", label: "Název školy", defaultOn: false },
  { id: "vyucujici", label: "Vyučující", defaultOn: false },
  { id: "rvp", label: "RVP odkaz", defaultOn: false },
];

interface TpRow {
  cas: string; tema: string; rozsah: string; pocet: string; cile: string; vystupy: string; rvp: string;
  _monthSpan?: number; _isMonthStart?: boolean;
}

type MesicData = { cas: string; topics: { tema: string; rozsah: string; cile: string; vystupy?: string; rvp?: string }[] };

function buildMesiceRows(mesiceData: MesicData[]): TpRow[] {
  const rows: TpRow[] = [];
  for (const m of mesiceData) {
    m.topics.forEach((t, i) => {
      rows.push({
        cas: m.cas,
        tema: t.tema,
        rozsah: t.rozsah,
        pocet: String(m.topics.reduce((s, x) => s + parseInt(x.rozsah || "0"), 0)),
        cile: t.cile,
        vystupy: t.vystupy ?? "",
        rvp: t.rvp ?? "RVP ZV",
        _isMonthStart: i === 0,
        _monthSpan: i === 0 ? m.topics.length : undefined,
      });
    });
  }
  return rows;
}

function buildRows(period: string, unit: string): TpRow[] {
  const mesiceData: MesicData[] = [
    { cas: "Září", topics: [
      { tema: "Opakování gramatiky z 2. ročníku", rozsah: "2", cile: "Žák si zopakuje klíčové jevy z 2. ročníku a odstraní mezery.", rvp: "RVP ZV, str. 24" },
      { tema: "Stavba slova – kořen, předpona, přípona", rozsah: "2", cile: "Žák rozliší a správně pojmenuje části slova.", rvp: "RVP ZV, str. 24" },
      { tema: "Hláskosloví a výslovnost", rozsah: "1", cile: "Žák správně vyslovuje a rozlišuje hlásky.", rvp: "RVP ZV, str. 24" },
      { tema: "Pravopis základních slov", rozsah: "1", cile: "Žák napíše frekventovaná slova bez pravopisných chyb.", rvp: "RVP ZV, str. 24" },
    ]},
    { cas: "Říjen", topics: [
      { tema: "Přehled slovních druhů", rozsah: "1", cile: "Žák vyjmenuje a rozliší základní slovní druhy.", rvp: "RVP ZV, str. 25" },
      { tema: "Podstatná jména – rod, číslo, pád", rozsah: "2", cile: "Žák určí mluvnické kategorie podstatných jmen.", rvp: "RVP ZV, str. 25" },
      { tema: "Skloňování podstatných jmen", rozsah: "3", cile: "Žák skloňuje podstatná jména podle vzorů.", rvp: "RVP ZV, str. 25" },
      { tema: "Pravopis koncovek v textu", rozsah: "2", cile: "Žák napíše správné koncovky v diktátu i vlastním textu.", rvp: "RVP ZV, str. 25" },
    ]},
    { cas: "Listopad", topics: [
      { tema: "Přídavná jména – druhy a určování", rozsah: "2", cile: "Žák rozliší tvrdá, měkká a přivlastňovací přídavná jména.", rvp: "RVP ZV, str. 25" },
      { tema: "Shoda přídavných jmen s podstatnými", rozsah: "2", cile: "Žák správně určí a uplatní shodu v rodě a čísle.", rvp: "RVP ZV, str. 25" },
      { tema: "Skloňování přídavných jmen", rozsah: "2", cile: "Žák skloňuje přídavná jména podle vzorů mladý a jarní.", rvp: "RVP ZV, str. 25" },
      { tema: "Popis předmětu – slohová práce", rozsah: "2", cile: "Žák napíše srozumitelný popis s výstižnými přídavnými jmény.", rvp: "RVP ZV, str. 26" },
    ]},
    { cas: "Prosinec", topics: [
      { tema: "Slovesa – přehled tvarů", rozsah: "2", cile: "Žák určí základní tvary slovesa a jeho funkci ve větě.", rvp: "RVP ZV, str. 26" },
      { tema: "Časování – čas, osoba, číslo", rozsah: "2", cile: "Žák časuje slovesa ve všech osobách a časech.", rvp: "RVP ZV, str. 26" },
      { tema: "Neurčitek a jeho využití", rozsah: "1", cile: "Žák rozezná neurčitek a správně ho použije v textu.", rvp: "RVP ZV, str. 26" },
      { tema: "Pravopis sloves v textu", rozsah: "2", cile: "Žák píše správné tvary sloves ve vlastní větě.", rvp: "RVP ZV, str. 26" },
    ]},
    { cas: "Leden", topics: [
      { tema: "Pravidla psaní i/y – přehled", rozsah: "1", cile: "Žák vysvětlí a uplatní základní pravidla psaní i/y.", rvp: "RVP ZV, str. 27" },
      { tema: "Vyjmenovaná slova a slova příbuzná", rozsah: "3", cile: "Žák uvede vyjmenovaná slova a odvodí příbuzná.", rvp: "RVP ZV, str. 27" },
      { tema: "Psaní i/y v příponách a koncovkách", rozsah: "2", cile: "Žák správně píše i/y v ohebných tvarech slov.", rvp: "RVP ZV, str. 27" },
      { tema: "Diktát a rozbor chyb", rozsah: "2", cile: "Žák identifikuje vlastní chyby a opraví je.", rvp: "RVP ZV, str. 27" },
    ]},
    { cas: "Únor", topics: [
      { tema: "Věta jednoduchá – větné členy", rozsah: "2", cile: "Žák určí základní větné členy a jejich funkci.", rvp: "RVP ZV, str. 27" },
      { tema: "Souvětí – souřadné a podřadné", rozsah: "2", cile: "Žák odliší souřadné a podřadné souvětí.", rvp: "RVP ZV, str. 27" },
      { tema: "Vedlejší věty – druhy", rozsah: "2", cile: "Žák rozpozná a pojmenuje vedlejší větu.", rvp: "RVP ZV, str. 27" },
      { tema: "Interpunkce v souvětí", rozsah: "1", cile: "Žák správně umístí čárky v souvětí.", rvp: "RVP ZV, str. 28" },
    ]},
    { cas: "Březen", topics: [
      { tema: "Přímá řeč – uvozovací věta", rozsah: "2", cile: "Žák zapíše přímou řeč a správně ji uvozuje.", rvp: "RVP ZV, str. 28" },
      { tema: "Interpunkce přímé řeči", rozsah: "1", cile: "Žák správně interpunguje přímou řeč ve všech polohách.", rvp: "RVP ZV, str. 28" },
      { tema: "Nepřímá řeč – přeformulování", rozsah: "2", cile: "Žák převede přímou řeč do nepřímé a naopak.", rvp: "RVP ZV, str. 28" },
      { tema: "Dialog v textu – nácvik zápisu", rozsah: "2", cile: "Žák napíše krátký dialog se správnou interpunkcí.", rvp: "RVP ZV, str. 28" },
    ]},
    { cas: "Duben", topics: [
      { tema: "Slohové útvary – přehled", rozsah: "1", cile: "Žák rozliší základní slohové útvary a jejich znaky.", rvp: "RVP ZV, str. 29" },
      { tema: "Vypravování – kompozice a stavba", rozsah: "2", cile: "Žák popíše strukturu vypravování a její části.", rvp: "RVP ZV, str. 29" },
      { tema: "Popis děje a postav", rozsah: "2", cile: "Žák výstižně popíše děj a charakterizuje postavu.", rvp: "RVP ZV, str. 29" },
      { tema: "Nácvik psaní vypravování", rozsah: "2", cile: "Žák napíše ucelený vypravovací text se správnou stavbou.", rvp: "RVP ZV, str. 29" },
      { tema: "Vzájemné hodnocení textů", rozsah: "1", cile: "Žák formuluje konstruktivní zpětnou vazbu ke spolužákovu textu.", rvp: "RVP ZV, str. 29" },
    ]},
    { cas: "Květen", topics: [
      { tema: "Opakování gramatiky celého roku", rozsah: "2", cile: "Žák propojí a upevní poznatky ze všech gramatických celků.", rvp: "RVP ZV, str. 30" },
      { tema: "Projektová práce – třídní časopis", rozsah: "3", cile: "Žák vytvoří vlastní textový příspěvek do třídního časopisu.", rvp: "RVP ZV, str. 30" },
      { tema: "Prezentace výsledků", rozsah: "1", cile: "Žák srozumitelně představí svou práci před třídou.", rvp: "RVP ZV, str. 30" },
      { tema: "Sebehodnocení a reflexe", rozsah: "1", cile: "Žák zhodnotí vlastní pokrok a stanoví další cíle.", rvp: "RVP ZV, str. 30" },
    ]},
    { cas: "Červen", topics: [
      { tema: "Závěrečné opakování učiva", rozsah: "2", cile: "Žák zopakuje a upevní klíčové jevy celého roku.", rvp: "RVP ZV, str. 30" },
      { tema: "Hodnotící aktivity a testy", rozsah: "1", cile: "Žák prokáže zvládnutí učiva v písemné i ústní formě.", rvp: "RVP ZV, str. 30" },
      { tema: "Portfolio – výběr a komentář prací", rozsah: "1", cile: "Žák vybere a okomentuje práce dokládající jeho pokrok.", rvp: "RVP ZV, str. 30" },
      { tema: "Sebehodnotící pohovor s učitelem", rozsah: "1", cile: "Žák reflektuje vlastní učení v řízeném rozhovoru.", rvp: "RVP ZV, str. 30" },
    ]},
  ];
  const tydnyData: MesicData[] = [
    { cas: "Týden 1", topics: [
      { tema: "Opakování a motivace", rozsah: "2", cile: "Žák se zorientuje v učivu a obnoví znalosti." },
      { tema: "Vstupní zjišťování", rozsah: "1", cile: "Žák vyplní vstupní test a identifikuje mezery." },
    ]},
    { cas: "Týden 2", topics: [
      { tema: "Nové učivo – úvod a pojmy", rozsah: "2", cile: "Žák porozumí klíčovým pojmům nového tématu." },
      { tema: "Řízené procvičování", rozsah: "2", cile: "Žák aplikuje nové poznatky v řízeném cvičení." },
    ]},
    { cas: "Týden 3", topics: [
      { tema: "Samostatné procvičování", rozsah: "2", cile: "Žák řeší úlohy samostatně a odstraňuje chyby." },
      { tema: "Skupinová aktivita", rozsah: "1", cile: "Žák spolupracuje a sdílí postupy řešení." },
    ]},
    { cas: "Týden 4", topics: [
      { tema: "Shrnutí a průběžné hodnocení", rozsah: "2", cile: "Žák zhodnotí pokrok a zaznačí, co ještě procvičit." },
      { tema: "Sebehodnocení", rozsah: "1", cile: "Žák vyplní sebehodnotící arch a formuluje další cíl." },
    ]},
    { cas: "Týden 5", topics: [
      { tema: "Projektová práce", rozsah: "3", cile: "Žák propojí poznatky v mezipředmětovém projektu." },
      { tema: "Prezentace výsledku", rozsah: "1", cile: "Žák představí výsledky projektu spolužákům." },
    ]},
  ];
  const ctrnactDniData: MesicData[] = [
    { cas: "1.–14. den", topics: [
      { tema: "Úvod a opakování", rozsah: "3", cile: "Žák se zorientuje v tématu a obnoví předchozí znalosti." },
      { tema: "Nové učivo – první část", rozsah: "3", cile: "Žák porozumí první části nového učiva." },
    ]},
    { cas: "15.–28. den", topics: [
      { tema: "Nové učivo – druhá část", rozsah: "3", cile: "Žák zvládne druhou část nového učiva." },
      { tema: "Procvičování a upevnění", rozsah: "3", cile: "Žák aktivně procvičuje a splní průběžný test." },
    ]},
    { cas: "29.–42. den", topics: [
      { tema: "Projektová práce", rozsah: "3", cile: "Žák samostatně vypracuje a odevzdá projekt." },
      { tema: "Reflexe a hodnocení", rozsah: "2", cile: "Žák zhodnotí výsledky a sebehodnotí pokrok." },
    ]},
  ];
  if (unit === "týden") return buildMesiceRows(tydnyData);
  if (unit === "14 dní") return buildMesiceRows(ctrnactDniData);
  if (period === "3 měsíce") return buildMesiceRows(mesiceData.slice(0, 3));
  if (period === "1. pololetí") return buildMesiceRows(mesiceData.slice(0, 5));
  if (period === "2. pololetí") return buildMesiceRows(mesiceData.slice(5));
  return buildMesiceRows(mesiceData);
}

interface TpPlan {
  id: string;
  name: string;
  predmet: string;
  trida: string;
  period: string;
  unit: string;
  rows: TpRow[];
  savedAt: string;
}

const initialPlans: TpPlan[] = [
  {
    id: "tp1",
    name: "Čeština plán",
    predmet: "Český jazyk",
    trida: "3.A",
    period: "3 měsíce",
    unit: "měsíc",
    rows: buildRows("3 měsíce", "měsíc"),
    savedAt: "12. 9. 2025",
  },
];

function AutoTextarea({ value, onChange, color }: { value: string; onChange: (v: string) => void; color?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  });
  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", display: "block", boxSizing: "border-box",
        padding: "5px 7px", borderRadius: 6, border: "1.5px solid transparent",
        fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, lineHeight: 1.65,
        color: color ?? "#0a0a0a",
        background: "transparent", outline: "none", resize: "none", overflow: "hidden",
        whiteSpace: "pre-wrap", wordBreak: "break-word",
        transition: "background 0.12s, border-color 0.12s",
      }}
      onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = "rgba(236,236,240,0.6)"; }}
      onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = "transparent"; }}
      onFocus={e => { e.currentTarget.style.background = "rgba(236,236,240,0.6)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)"; }}
      onBlur={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
    />
  );
}

function TematickyPlanView() {
  const openBuddy = useContext(BuddyContext);
  const { addTpGoals, navigateCile } = useContext(GoalsContext);
  const [plans, setPlans] = useState<TpPlan[]>(initialPlans);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [view, setView] = useState<"list" | "form" | "generating" | "result">("list");
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // result controls
  const [predmet, setPredmet] = useState("Český jazyk");
  const [trida, setTrida] = useState("3.A");
  const [unit, setUnit] = useState("měsíc");
  const [period, setPeriod] = useState("3 měsíce");
  const [nazevSkoly, setNazevSkoly] = useState("ZŠ Mánesova");
  const [vyucujici, setVyucujici] = useState("Mgr. Jana Nováková");
  const [cols, setCols] = useState<Set<TpColumn>>(new Set(["casJednotka", "tema", "cile"]));

  function toggleCol(id: TpColumn) {
    setCols(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // draggable column order (excludes fixed "Čas" and meta cols)
  const draggableCols: TpColumn[] = ["tema", "cile", "rozsahHodin", "pocetHodin", "vystupy", "rvp"];
  const [colOrder, setColOrder] = useState<TpColumn[]>(draggableCols);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [editRows, setEditRows] = useState<TpRow[]>(() => buildRows("celý rok", "měsíc"));
  const [hoveredMonthKey, setHoveredMonthKey] = useState<string | null>(null);

  // row drag state — "month" drags whole month group, "sub" drags within a month
  const rowDragRef = useRef<{ kind: "month" | "sub"; fromMonth: string; fromSubIdx?: number } | null>(null);
  const [rowDragOverMonth, setRowDragOverMonth] = useState<string | null>(null);
  const [rowDragOverSub, setRowDragOverSub] = useState<{ month: string; subIdx: number } | null>(null);

  function reorderMonths(fromMonth: string, toMonth: string) {
    if (fromMonth === toMonth) return;
    setEditRows(prev => {
      const groups: Record<string, TpRow[]> = {};
      const order: string[] = [];
      for (const r of prev) {
        if (!groups[r.cas]) { groups[r.cas] = []; order.push(r.cas); }
        groups[r.cas].push(r);
      }
      const fi = order.indexOf(fromMonth), ti = order.indexOf(toMonth);
      if (fi < 0 || ti < 0) return prev;
      order.splice(fi, 1); order.splice(ti, 0, fromMonth);
      const next: TpRow[] = [];
      for (const m of order) {
        groups[m].forEach((r, i) => next.push({ ...r, _isMonthStart: i === 0, _monthSpan: i === 0 ? groups[m].length : undefined }));
      }
      return next;
    });
  }

  function reorderSubRow(month: string, fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return;
    setEditRows(prev => {
      const next = [...prev];
      const monthRows = next.filter(r => r.cas === month);
      const [moved] = monthRows.splice(fromIdx, 1);
      monthRows.splice(toIdx, 0, moved);
      monthRows.forEach((r, i) => { r._isMonthStart = i === 0; r._monthSpan = i === 0 ? monthRows.length : undefined; });
      const base = next.filter(r => r.cas !== month);
      const insertAt = next.findIndex(r => r.cas === month);
      next.splice(insertAt < 0 ? next.length : insertAt, next.filter(r => r.cas === month).length, ...monthRows);
      // rebuild fully
      const groups: Record<string, TpRow[]> = {};
      const order: string[] = [];
      for (const r of prev) { if (!groups[r.cas]) { groups[r.cas] = []; order.push(r.cas); } groups[r.cas].push(r); }
      const result: TpRow[] = [];
      for (const m of order) {
        const mRows = m === month ? monthRows : groups[m];
        mRows.forEach((r, i) => result.push({ ...r, _isMonthStart: i === 0, _monthSpan: i === 0 ? mRows.length : undefined }));
      }
      return result;
    });
  }

  function handleGenerateCriteria() {
    const newGoals: TpGoal[] = editRows
      .filter(r => r.cile.trim())
      .map(r => ({
        id: `tp-${predmet}-${trida}-${r.cas}-${r.tema}`.replace(/\s+/g, "-"),
        text: r.cile,
        subject: predmet,
        trida,
        month: r.cas,
        rozsah: r.rozsah,
        vystupy: r.vystupy,
        criteria: [
          { id: "c1", label: "Porozumění tématu", desc: "Žák prokazuje porozumění klíčovým pojmům a souvislostem." },
          { id: "c2", label: "Samostatnost", desc: "Žák pracuje na cíli samostatně a bez výzvy učitele." },
          { id: "c3", label: "Kvalita výstupu", desc: "Výstup je srozumitelný, úplný a odpovídá zadání." },
        ],
      }));
    addTpGoals(newGoals);
    navigateCile();
  }

  function savePlan() {
    const name = text.trim() || predmet + " – " + period;
    const plan: TpPlan = {
      id: "tp" + Date.now(),
      name,
      predmet,
      trida,
      period,
      unit,
      rows: editRows,
      savedAt: new Date().toLocaleDateString("cs-CZ"),
    };
    if (selectedPlanId) {
      setPlans(prev => prev.map(p => p.id === selectedPlanId ? { ...plan, id: selectedPlanId } : p));
    } else {
      setPlans(prev => [...prev, plan]);
    }
    setView("list");
    setSelectedPlanId(null);
  }

  function openPlan(plan: TpPlan) {
    setSelectedPlanId(plan.id);
    setText(plan.name);
    setPredmet(plan.predmet);
    setTrida(plan.trida);
    setPeriod(plan.period);
    setUnit(plan.unit);
    setEditRows(plan.rows);
    setView("result");
  }

  useEffect(() => {
    if (view === "result") setEditRows(buildRows(period, unit));
  }, [unit, period]);

  useEffect(() => {
    if (view !== "generating") return;
    setProgress(0);
    const steps = [8, 22, 40, 61, 78, 91, 100];
    let i = 0;
    const tick = () => {
      if (i >= steps.length) return;
      setProgress(steps[i++]);
      setTimeout(tick, 320 + Math.random() * 280);
    };
    setTimeout(tick, 200);
    const done = setTimeout(() => setView("result"), 2600);
    return () => clearTimeout(done);
  }, [view]);

  if (view === "list") {
    return (
      <div style={{ padding: "32px 40px" }}>
        <Breadcrumb crumbs={[{ label: "Formativní hodnocení" }, { label: "Tématický plán" }]} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 28, marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 24, color: "#0a0a0a", margin: 0 }}>
            Tématický plán
          </h1>
          <button
            onClick={() => { setText(""); setSelectedPlanId(null); setView("form"); }}
            style={{ ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 8 }}
          >
            <IconPlus />
            Vytvořit nový plán
          </button>
        </div>

        {plans.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div style={{
              display: "inline-flex", flexDirection: "column", alignItems: "center",
              gap: 0, marginBottom: 20,
            }}>
              <div style={{
                width: 72, height: 88, borderRadius: 6, background: "#f5f5f7",
                border: "1.5px solid rgba(0,0,0,0.10)", position: "relative",
                boxShadow: "2px 3px 0 rgba(0,0,0,0.06)",
              }}>
                <div style={{ position: "absolute", left: 10, top: 16, right: 10, height: 2, background: "rgba(0,0,0,0.08)", borderRadius: 1 }} />
                <div style={{ position: "absolute", left: 10, top: 26, right: 16, height: 2, background: "rgba(0,0,0,0.06)", borderRadius: 1 }} />
                <div style={{ position: "absolute", left: 10, top: 36, right: 12, height: 2, background: "rgba(0,0,0,0.06)", borderRadius: 1 }} />
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: "rgba(0,0,0,0.12)", borderRadius: "4px 0 0 4px" }} />
              </div>
            </div>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 17, color: "#717182", margin: "0 0 6px" }}>
              Zatím žádný tématický plán
            </p>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#b0b0be", margin: 0 }}>
              Vytvořte první a AI ho za vás připraví.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => openPlan(plan)}
                style={{
                  display: "flex", flexDirection: "column", textAlign: "left",
                  background: "#fff", border: "1.5px solid rgba(0,0,0,0.10)", cursor: "pointer",
                  borderRadius: 10, padding: 0, overflow: "hidden", width: "100%",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05), 2px 3px 0 rgba(0,0,0,0.04)",
                  transition: "box-shadow 0.16s, transform 0.16s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.10), 2px 3px 0 rgba(0,0,0,0.04)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05), 2px 3px 0 rgba(0,0,0,0.04)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* top: gray header with icon, label, badges */}
                <div style={{
                  background: "#f5f5f7", padding: "14px 16px 12px",
                  borderBottom: "1.5px solid rgba(0,0,0,0.08)",
                  display: "flex", flexDirection: "column", gap: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0, marginTop: 1,
                      background: "rgba(0,0,0,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <rect x="4" y="2" width="14" height="20" rx="2" stroke="#0a0a0a" strokeWidth="1.8" strokeLinejoin="round"/>
                        <path d="M8 7h8M8 11h8M8 15h5" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#717182", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Tématický plán
                      </span>
                      <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 17, color: "#0a0a0a", margin: 0, lineHeight: 1.45 }}>
                        {plan.name}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ padding: "3px 9px", borderRadius: 20, background: "rgba(0,0,0,0.08)", color: "#0a0a0a", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13 }}>
                      {plan.predmet}
                    </span>
                    <span style={{ padding: "3px 9px", borderRadius: 20, background: "rgba(0,0,0,0.05)", color: "#717182", fontFamily: "'Inter:Regular', sans-serif", fontSize: 13 }}>
                      {plan.trida}
                    </span>
                  </div>
                </div>

                {/* bottom: meta */}
                <div style={{ padding: "12px 16px 14px", flex: 1, position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  {[0,1,2].map(n => (
                    <div key={n} style={{
                      position: "absolute", left: 16, right: 16,
                      top: 12 + n * 22, height: 1,
                      background: "rgba(0,0,0,0.04)",
                    }} />
                  ))}
                  <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", margin: 0, position: "relative" }}>
                    {plan.period}
                  </p>
                  <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#b0b0be", margin: "3px 0 0", position: "relative" }}>
                    Uloženo {plan.savedAt}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (view === "generating") {
    return (
      <div style={{ padding: "32px 40px", maxWidth: 600 }}>
        <Breadcrumb crumbs={[{ label: "Formativní hodnocení" }, { label: "Tématický plán" }]} />
        <div style={{ marginTop: 64, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
          <div style={{ position: "relative", width: 72, height: 72 }}>
            <svg width="72" height="72" viewBox="0 0 72 72" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="5"/>
              <circle cx="36" cy="36" r="30" fill="none" stroke="#7c4dbd" strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * (1 - progress / 100)}`}
                style={{ transition: "stroke-dashoffset 0.4s ease" }}
                strokeLinecap="round"
              />
            </svg>
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 16, color: "#0a0a0a" }}>
              {progress}%
            </span>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 22, color: "#0a0a0a", margin: "0 0 8px" }}>
              Generuji tématický plán…
            </p>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, color: "#717182", margin: 0 }}>
              AI analyzuje obsah a vytváří strukturovaný plán výuky.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const colDataMap: Record<TpColumn, (row: TpRow) => string> = {
    casJednotka: r => r.cas,
    tema: r => r.tema,
    rozsahHodin: r => r.rozsah,
    pocetHodin: r => r.pocet,
    cile: r => r.cile,
    vystupy: r => r.vystupy,
    nazevSkoly: () => "",
    vyucujici: () => "",
    rvp: r => r.rvp,
  };

  if (view === "result") {
    const rows = editRows;
    function updateCell(ri: number, field: keyof TpRow, val: string) {
      setEditRows(prev => prev.map((r, i) => i === ri ? { ...r, [field]: val } : r));
    }
    const showSkola = cols.has("nazevSkoly");
    const showVyucujici = cols.has("vyucujici");
    // visible draggable cols in user order
    const activeCols = colOrder.filter(id => cols.has(id));

    const selectStyle: React.CSSProperties = {
      padding: "9px 10px", borderRadius: 8, border: "1.5px solid rgba(0,0,0,0.12)",
      fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a",
      background: "#fff", outline: "none", cursor: "pointer",
    };
    const thStyle: React.CSSProperties = {
      padding: "15px 14px", textAlign: "left",
      fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14,
      color: "#717182", background: "#f5f5f7", borderBottom: "1.5px solid rgba(0,0,0,0.1)",
      whiteSpace: "nowrap", userSelect: "none",
    };
    const tdStyle: React.CSSProperties = {
      padding: "16px 14px", verticalAlign: "top",
      fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a",
      borderBottom: "1px solid rgba(0,0,0,0.07)", lineHeight: 1.65,
    };

    function onDragStart(idx: number) { setDragFrom(idx); }
    function onDragEnter(idx: number) { setDragOver(idx); }
    function onDrop() {
      if (dragFrom === null || dragOver === null || dragFrom === dragOver) {
        setDragFrom(null); setDragOver(null); return;
      }
      setColOrder(prev => {
        const next = [...prev];
        const [moved] = next.splice(dragFrom, 1);
        next.splice(dragOver, 0, moved);
        return next;
      });
      setDragFrom(null); setDragOver(null);
    }

    return (
      <div style={{ padding: "32px 40px", minWidth: 0 }} onClick={() => setExportOpen(false)}>
        <Breadcrumb crumbs={[{ label: "Formativní hodnocení" }, { label: "Tématický plán", onClick: () => setView("list") }, { label: selectedPlanId ? "Upravit plán" : "Výsledek" }]} />

        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 26, marginTop: 28, marginBottom: 28 }}>
          <div>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#9b72d0", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tématický plán</p>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Plán výuky"
              style={{
                fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 28, color: "#0a0a0a",
                background: "transparent", border: "1.5px solid transparent", borderRadius: 8,
                outline: "none", padding: "3px 8px", margin: "0 -8px",
                width: "calc(100% + 16px)", boxSizing: "border-box",
                transition: "background 0.12s, border-color 0.12s",
              }}
              onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = "rgba(236,236,240,0.6)"; }}
              onMouseLeave={e => { if (document.activeElement !== e.currentTarget) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; } }}
              onFocus={e => { e.currentTarget.style.background = "rgba(236,236,240,0.6)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)"; }}
              onBlur={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
            />
          </div>
          <div style={{ display: "flex", gap: 12, flexShrink: 0, alignItems: "center" }}>
            {/* export dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={e => { e.stopPropagation(); setExportOpen(o => !o); }}
                style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 8 }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.667 12h10.666M8 2.667v8M5.333 8l2.667 2.667L10.667 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Exportovat
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {exportOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
                  background: "#fff", borderRadius: 12, border: "1.5px solid rgba(0,0,0,0.1)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.1)", overflow: "hidden", minWidth: 140,
                }} onClick={e => e.stopPropagation()}>
                  {[["PDF", "📄"], ["CSV", "📊"], ["XLS", "📋"]].map(([fmt, ico]) => (
                    <button key={fmt} onClick={() => setExportOpen(false)} style={{
                      display: "flex", alignItems: "center", gap: 12, width: "100%",
                      padding: "15px 16px", border: "none", background: "none", cursor: "pointer",
                      fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a", textAlign: "left",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f7")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                    >
                      <span style={{ fontSize: 16 }}>{ico}</span> {fmt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={savePlan} style={{ ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13.333 10v2.667A1.333 1.333 0 0112 14H4a1.333 1.333 0 01-1.333-1.333V10M5.333 6.667L8 9.333l2.667-2.666M8 9.333V2" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {selectedPlanId ? "Uložit změny" : "Uložit plán"}
            </button>
          </div>
        </div>

        {/* controls panel */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.08)", padding: "23px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
            {[
              { label: "Předmět", val: predmet, set: setPredmet, opts: ["Český jazyk", "Matematika", "Prvouka", "Anglický jazyk", "Výtvarná výchova"] },
              { label: "Třída", val: trida, set: setTrida, opts: ["1.A", "2.A", "3.A", "4.A", "5.A"] },
              { label: "Časová jednotka", val: unit, set: setUnit, opts: ["týden", "14 dní", "měsíc"] },
              { label: "Období", val: period, set: setPeriod, opts: ["3 měsíce", "1. pololetí", "2. pololetí", "celý rok"] },
            ].map(({ label, val, set, opts }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontSize: 13, color: "#717182", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                <select value={val} onChange={e => set(e.target.value)} style={selectStyle}>
                  {opts.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontSize: 13, color: "#717182", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: 4 }}>Sloupce</span>
            {tpColumns.map(col => {
              const on = cols.has(col.id);
              const locked = col.id === "cile";
              return (
                <button key={col.id} onClick={() => !locked && toggleCol(col.id)} style={{
                  padding: "8px 12px", borderRadius: 20, border: "1.5px solid",
                  borderColor: on ? "#7c4dbd" : "rgba(0,0,0,0.12)",
                  background: on ? "rgba(124,77,189,0.08)" : "#fafafa",
                  fontFamily: on ? "'Inter:Medium', sans-serif" : "'Inter:Regular', sans-serif",
                  fontWeight: on ? 500 : 400,
                  fontSize: 14, color: on ? "#7c4dbd" : "#717182",
                  cursor: locked ? "default" : "pointer", transition: "all 0.13s",
                  opacity: locked ? 1 : undefined,
                }}>
                  {on && <span style={{ marginRight: 5, fontSize: 12 }}>✓</span>}
                  {col.label}
                  {locked && <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.6 }}>●</span>}
                </button>
              );
            })}
          </div>

          {(showSkola || showVyucujici) && (
            <div style={{ display: "flex", gap: 18, marginTop: 14, flexWrap: "wrap" }}>
              {showSkola && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontSize: 13, color: "#717182", textTransform: "uppercase", letterSpacing: "0.05em" }}>Název školy</span>
                  <input value={nazevSkoly} onChange={e => setNazevSkoly(e.target.value)} style={{ ...selectStyle, minWidth: 200 }} />
                </div>
              )}
              {showVyucujici && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontSize: 13, color: "#717182", textTransform: "uppercase", letterSpacing: "0.05em" }}>Vyučující</span>
                  <input value={vyucujici} onChange={e => setVyucujici(e.target.value)} style={{ ...selectStyle, minWidth: 200 }} />
                </div>
              )}
            </div>
          )}
        </div>

        {(showSkola || showVyucujici) && (
          <div style={{ display: "flex", gap: 26, marginBottom: 12, flexWrap: "wrap" }}>
            {showSkola && <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#717182" }}><strong style={{ fontFamily: "'Inter:Medium', sans-serif", color: "#0a0a0a" }}>Škola:</strong> {nazevSkoly}</span>}
            {showVyucujici && <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#717182" }}><strong style={{ fontFamily: "'Inter:Medium', sans-serif", color: "#0a0a0a" }}>Vyučující:</strong> {vyucujici}</span>}
          </div>
        )}

        {/* table with draggable columns */}
        <div style={{ overflowX: "auto", borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.08)", background: "#fff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, borderRadius: "12px 0 0 0", cursor: "default", position: "relative" }}>Čas</th>
                {activeCols.map((colId, i) => {
                  const col = tpColumns.find(c => c.id === colId)!;
                  const isDragTarget = dragOver === i;
                  return (
                    <th
                      key={colId}
                      draggable
                      onDragStart={() => onDragStart(i)}
                      onDragEnter={() => onDragEnter(i)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={onDrop}
                      style={{
                        ...thStyle, cursor: "grab", position: "relative",
                        borderRadius: i === activeCols.length - 1 ? "0 12px 0 0" : undefined,
                        borderLeft: isDragTarget ? "2px solid #7c4dbd" : undefined,
                        opacity: dragFrom === i ? 0.45 : 1,
                      }}
                      onMouseEnter={e => { const btn = e.currentTarget.querySelector<HTMLElement>(".tp-ai-btn"); if (btn) { btn.style.opacity = "1"; btn.style.transform = "translateY(-50%) scale(1)"; } }}
                      onMouseLeave={e => { const btn = e.currentTarget.querySelector<HTMLElement>(".tp-ai-btn"); if (btn) { btn.style.opacity = "0"; btn.style.transform = "translateY(-50%) scale(0.75)"; } }}
                    >
                      <button
                        className="tp-ai-btn"
                        onClick={e => { e.stopPropagation(); openBuddy(`Chci upravit sloupec: ${col.label}`); }}
                        style={{
                          position: "absolute", left: -30, top: "50%",
                          transform: "translateY(-50%) scale(0.75)",
                          width: 22, height: 22, borderRadius: "50%", border: "none",
                          background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                          opacity: 0, transition: "opacity 0.14s ease, transform 0.14s ease",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          zIndex: 10, padding: 0,
                        }}
                      >
                        <SparkleIcon />
                      </button>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.4, flexShrink: 0 }}>
                          <circle cx="3" cy="3" r="1" fill="currentColor"/><circle cx="7" cy="3" r="1" fill="currentColor"/>
                          <circle cx="3" cy="7" r="1" fill="currentColor"/><circle cx="7" cy="7" r="1" fill="currentColor"/>
                        </svg>
                        {col.label}
                        {colId === "cile" && (
                          <button
                            onClick={e => { e.stopPropagation(); handleGenerateCriteria(); }}
                            title="Generovat plán hodin"
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 7,
                              padding: "3px 9px 3px 7px", borderRadius: 20, border: "none",
                              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                              color: "#fff", cursor: "pointer",
                              fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13,
                              boxShadow: "0 2px 8px rgba(124,58,237,0.3)",
                              whiteSpace: "nowrap", flexShrink: 0,
                            }}
                          >
                            <SparkleIcon />
                            Generovat kritéria a úrovně
                          </button>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                const colFieldMap: Partial<Record<TpColumn, keyof TpRow>> = {
                  tema: "tema", rozsahHodin: "rozsah", pocetHodin: "pocet",
                  cile: "cile", vystupy: "vystupy", rvp: "rvp",
                };
                const narrowInput = (colId: TpColumn) => {
                  const field = colFieldMap[colId];
                  if (!field) return null;
                  const val = row[field as keyof TpRow] as string;
                  return (
                    <input
                      type="number" min={1} max={8}
                      value={val}
                      onChange={e => updateCell(ri, field, e.target.value)}
                      style={{
                        width: 52, padding: "5px 7px", borderRadius: 6, border: "1.5px solid transparent",
                        fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, lineHeight: 1.6,
                        color: "#0a0a0a", background: "transparent", outline: "none",
                        transition: "background 0.12s, border-color 0.12s", textAlign: "center", boxSizing: "border-box",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
                      onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = "transparent"; }}
                      onFocus={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)"; }}
                      onBlur={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
                    />
                  );
                };
                const isMonthStart = row._isMonthStart;
                const monthKey = row.cas;
                const isMonthHovered = hoveredMonthKey === monthKey;
                const topBorder = isMonthStart ? "2px solid rgba(0,0,0,0.1)" : undefined;
                const rowBg = isMonthStart ? "#fff" : "rgba(0,0,0,0.013)";
                // compute sub-index within this month
                const subIdx = rows.slice(0, ri).filter(r => r.cas === monthKey).length;
                const isDragOverMonth = rowDragOverMonth === monthKey && rowDragRef.current?.kind === "month" && rowDragRef.current?.fromMonth !== monthKey;
                const isDragOverSub = rowDragOverSub?.month === monthKey && rowDragOverSub.subIdx === subIdx && rowDragRef.current?.kind === "sub" && (rowDragRef.current?.fromSubIdx !== subIdx || rowDragRef.current?.fromMonth !== monthKey);
                return (
                  <tr
                    key={ri}
                    draggable
                    onDragStart={() => {
                      rowDragRef.current = { kind: "sub", fromMonth: monthKey, fromSubIdx: subIdx };
                    }}
                    onDragEnter={() => {
                      if (!rowDragRef.current) return;
                      if (rowDragRef.current.kind === "month") setRowDragOverMonth(monthKey);
                      else setRowDragOverSub({ month: monthKey, subIdx });
                    }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => {
                      if (!rowDragRef.current) return;
                      if (rowDragRef.current.kind === "month") {
                        reorderMonths(rowDragRef.current.fromMonth, monthKey);
                      } else if (rowDragRef.current.fromMonth === monthKey) {
                        reorderSubRow(monthKey, rowDragRef.current.fromSubIdx!, subIdx);
                      }
                      rowDragRef.current = null;
                      setRowDragOverMonth(null);
                      setRowDragOverSub(null);
                    }}
                    onDragEnd={() => { rowDragRef.current = null; setRowDragOverMonth(null); setRowDragOverSub(null); }}
                    style={{
                      background: isDragOverSub ? "rgba(124,77,189,0.06)" : rowBg,
                      borderTop: isDragOverSub ? "2px solid #7c4dbd" : undefined,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={() => setHoveredMonthKey(monthKey)}
                    onMouseLeave={() => setHoveredMonthKey(null)}
                  >
                    {isMonthStart && (
                      <td
                        rowSpan={row._monthSpan}
                        draggable
                        onDragStart={e => { e.stopPropagation(); rowDragRef.current = { kind: "month", fromMonth: monthKey }; }}
                        onDragEnter={e => { e.stopPropagation(); if (rowDragRef.current?.kind === "month") setRowDragOverMonth(monthKey); }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.stopPropagation(); if (rowDragRef.current?.kind === "month") { reorderMonths(rowDragRef.current.fromMonth, monthKey); } rowDragRef.current = null; setRowDragOverMonth(null); }}
                        onDragEnd={() => { rowDragRef.current = null; setRowDragOverMonth(null); }}
                        style={{
                          ...tdStyle, padding: "15px 12px", position: "relative",
                          borderTop: isDragOverMonth ? "2px solid #7c4dbd" : topBorder,
                          verticalAlign: "middle", textAlign: "center",
                          background: isDragOverMonth ? "rgba(124,77,189,0.07)" : "#f5f5f7",
                          borderRight: "1.5px solid rgba(0,0,0,0.1)",
                          whiteSpace: "nowrap", cursor: "grab",
                          transition: "background 0.1s",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                          {/* drag handle for month */}
                          <svg width="12" height="10" viewBox="0 0 12 10" fill="none" style={{ opacity: isMonthHovered ? 0.35 : 0.15, transition: "opacity 0.14s", flexShrink: 0 }}>
                            <rect y="0" width="12" height="1.5" rx="0.75" fill="#0a0a0a"/>
                            <rect y="4" width="12" height="1.5" rx="0.75" fill="#0a0a0a"/>
                            <rect y="8" width="12" height="1.5" rx="0.75" fill="#0a0a0a"/>
                          </svg>
                          <button
                            onClick={() => openBuddy(`Chci upravit měsíc: ${row.cas}`)}
                            title="Otevřít Buddy AI"
                            style={{
                              width: 24, height: 24, borderRadius: "50%", border: "none",
                              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                              opacity: isMonthHovered ? 1 : 0,
                              transform: `scale(${isMonthHovered ? 1 : 0.7})`,
                              transition: "opacity 0.14s ease, transform 0.14s ease",
                              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              boxShadow: "0 2px 8px rgba(124,58,237,0.35)",
                              padding: 0, flexShrink: 0,
                            }}
                          >
                            <SparkleIcon />
                          </button>
                          <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a" }}>
                            {row.cas}
                          </span>
                        </div>
                      </td>
                    )}
                    {activeCols.map(colId => {
                      const field = colFieldMap[colId];
                      const isNarrow = colId === "rozsahHodin" || colId === "pocetHodin";
                      return (
                        <td key={colId} style={{
                          ...tdStyle,
                          padding: isNarrow ? "6px 8px" : "6px 10px",
                          borderTop: isMonthStart && !isDragOverSub ? topBorder : undefined,
                        }}>
                          {isNarrow
                            ? narrowInput(colId)
                            : field
                              ? <AutoTextarea
                                  value={row[field as keyof TpRow] as string}
                                  onChange={v => updateCell(ri, field, v)}
                                  color={colId === "rvp" ? "#7c4dbd" : undefined}
                                />
                              : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 40px" }}>
      <Breadcrumb crumbs={[{ label: "Formativní hodnocení" }, { label: "Tématický plán", onClick: () => setView("list") }, { label: "Nový plán" }]} />

      <div style={{ maxWidth: 580, marginTop: 48 }}>
        <FadeIn delay={0}>
          <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 34, color: "#0a0a0a", margin: "0 0 8px", lineHeight: 1.45 }}>
            Co chcete plánovat?
          </h1>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, color: "#717182", margin: "0 0 32px", lineHeight: 1.7 }}>
            Popište téma, předmět nebo vzdělávací oblast. AI vytvoří tématický plán výuky.
          </p>
        </FadeIn>

        <FadeIn delay={60}>
          <label style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a", marginBottom: 8 }}>
            Popis tématu nebo cíle výuky
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Např. Český jazyk pro 3. třídu, celý školní rok, zaměřeno na čtení s porozuměním…"
            rows={4}
            autoFocus
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "17px 14px", borderRadius: 12,
              border: "1.5px solid rgba(0,0,0,0.15)",
              fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, color: "#0a0a0a",
              lineHeight: 1.65, resize: "none", outline: "none",
              background: "#fff", transition: "border-color 0.15s",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "#0a0a0a")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)")}
          />
        </FadeIn>

        <FadeIn delay={120}>
          <div style={{ marginTop: 20 }}>
            <label style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a", marginBottom: 8 }}>
              Nahrát podkladový soubor <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontWeight: 400, color: "#717182" }}>(volitelně)</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              style={{ display: "none" }}
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "17px 16px", borderRadius: 12, border: "1.5px solid rgba(0,0,0,0.12)", background: "#fafafa" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(124,77,189,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10.667 2H5.333A1.333 1.333 0 0 0 4 3.333v9.334A1.333 1.333 0 0 0 5.333 14h5.334A1.333 1.333 0 0 0 12 12.667V3.333A1.333 1.333 0 0 0 10.667 2z" stroke="#7c4dbd" strokeWidth="1.33" strokeLinejoin="round"/>
                    <path d="M6.667 5.333h2.666M6.667 8h2.666" stroke="#7c4dbd" strokeWidth="1.33" strokeLinecap="round"/>
                  </svg>
                </div>
                <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                <button onClick={() => setFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#b0b0be", padding: 2, borderRadius: 4, lineHeight: 1 }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  width: "100%", padding: "20px 16px", borderRadius: 12,
                  border: "1.5px dashed rgba(0,0,0,0.18)", background: "#fafafa",
                  cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#7c4dbd"; e.currentTarget.style.background = "#faf5ff"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.18)"; e.currentTarget.style.background = "#fafafa"; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(124,77,189,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 13V4M10 4L7 7M10 4l3 3" stroke="#7c4dbd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 15h14" stroke="#7c4dbd" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a" }}>Nahrát soubor</span>
                <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182" }}>PDF, Word nebo TXT · max. 3 MB</span>
              </button>
            )}
          </div>
        </FadeIn>

        <FadeIn delay={180}>
          <button
            onClick={() => { if (text.trim() || file) setView("generating"); }}
            disabled={!text.trim() && !file}
            style={{
              ...btnStyle("primary"),
              marginTop: 28, display: "flex", alignItems: "center", gap: 10,
              opacity: (text.trim() || file) ? 1 : 0.4,
              cursor: (text.trim() || file) ? "pointer" : "default",
              fontSize: 17, padding: "18px 28px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M9 1C9 1 9.5 5.5 7 8C4.5 10.5 1 10 1 10C1 10 4.5 9.5 7 12C9.5 14.5 9 19 9 19C9 19 9.5 14.5 12 12C14.5 9.5 17 10 17 10C17 10 14.5 10.5 12 8C9.5 5.5 9 1 9 1Z" fill="currentColor"/>
            </svg>
            Generovat tématický plán
          </button>
        </FadeIn>
      </div>
    </div>
  );
}

// buddy chat component
function BuddyChat({ open, onClose, trigger }: { open: boolean; onClose: () => void; trigger: { msg: string; key: number } | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "init", role: "buddy", text: "Ahoj! Jsem Buddy 👋 Jsem tu, abych ti pomohl s formativním hodnocením. Na co se chceš zeptat?" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const recTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const replyIndex = useRef(1);
  const prevTriggerKey = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger || trigger.key === prevTriggerKey.current) return;
    prevTriggerKey.current = trigger.key;
    const userMsg: ChatMessage = { id: uid(), role: "user", text: trigger.msg };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);
    const contextKey = Object.keys(aiContextReplies).find(k => trigger.msg.toLowerCase().includes(k)) ?? "";
    const reply = aiContextReplies[contextKey] ?? buddyReplies[replyIndex.current % buddyReplies.length];
    if (!contextKey) replyIndex.current++;
    setTimeout(() => {
      setMessages(prev => [...prev, { id: uid(), role: "buddy", text: reply }]);
      setTyping(false);
    }, 700 + Math.random() * 400);
  }, [trigger]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function send() {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: uid(), role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = buddyReplies[replyIndex.current % buddyReplies.length];
      replyIndex.current++;
      setMessages(prev => [...prev, { id: uid(), role: "buddy", text: reply }]);
      setTyping(false);
    }, 900 + Math.random() * 600);
  }

  function startRecording() {
    setRecording(true);
    setRecSeconds(0);
    recTimer.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
  }

  function stopRecording() {
    if (recTimer.current) clearInterval(recTimer.current);
    const secs = recSeconds;
    setRecording(false);
    setRecSeconds(0);
    const dur = secs < 1 ? 1 : secs;
    const audioMsg: ChatMessage = { id: uid(), role: "user", text: `__audio__${dur}` };
    setMessages(prev => [...prev, audioMsg]);
    setTyping(true);
    setTimeout(() => {
      const reply = buddyReplies[replyIndex.current % buddyReplies.length];
      replyIndex.current++;
      setMessages(prev => [...prev, { id: uid(), role: "buddy", text: reply }]);
      setTyping(false);
    }, 1000 + Math.random() * 600);
  }

  return (
    <div style={{
      width: open ? 340 : 0, flexShrink: 0,
      overflow: "hidden",
      transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
      borderLeft: open ? "1px solid rgba(120,80,180,0.1)" : "none",
    }}>
      <div style={{
        width: 340, height: "100%", display: "flex", flexDirection: "column",
        background: "#faf9fc",
      }}>
        {/* header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "17px 16px",
          borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#fff", flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "#f3f0fa",
            border: "1.5px solid rgba(120,80,180,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <img src={buddyImg} alt="Buddy" style={{ width: 24, height: 24, objectFit: "contain" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 16, color: "#0a0a0a", margin: 0 }}>Buddy</p>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#9b72d0", margin: 0 }}>AI asistent</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#b0b0be", padding: 4, borderRadius: 6 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "21px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map(m => {
            const isAudio = m.text.startsWith("__audio__");
            const audioDur = isAudio ? parseInt(m.text.replace("__audio__", "")) : 0;
            const fmtDur = `${Math.floor(audioDur / 60)}:${String(audioDur % 60).padStart(2, "0")}`;
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", alignItems: "flex-end", gap: 10 }}>
                {m.role === "buddy" && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f3f0fa", border: "1px solid rgba(120,80,180,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <img src={buddyImg} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
                  </div>
                )}
                {isAudio ? (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                    borderRadius: "16px 16px 4px 16px",
                    background: "#7c4dbd",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                    minWidth: 160,
                  }}>
                    <button style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.22)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M3 2.5l6 3.5-6 3.5V2.5z" fill="#fff"/>
                      </svg>
                    </button>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.25)", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", left: 0, top: 0, width: "35%", height: "100%", background: "rgba(255,255,255,0.85)", borderRadius: 2 }} />
                      </div>
                      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 16 }}>
                        {Array.from({ length: 22 }, (_, i) => (
                          <div key={i} style={{ width: 2, borderRadius: 2, background: i < 8 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)", height: `${4 + Math.abs(Math.sin(i * 1.3) * 10)}px` }} />
                        ))}
                      </div>
                    </div>
                    <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.75)", flexShrink: 0 }}>{fmtDur}</span>
                  </div>
                ) : (
                  <div style={{
                    maxWidth: "78%", padding: "12px 13px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: m.role === "user" ? "#7c4dbd" : "#fff",
                    color: m.role === "user" ? "#fff" : "#0a0a0a",
                    fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, lineHeight: 1.65,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                  }}>
                    {m.text}
                  </div>
                )}
              </div>
            );
          })}
          {typing && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f3f0fa", border: "1px solid rgba(120,80,180,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <img src={buddyImg} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
              </div>
              <div style={{ padding: "15px 14px", borderRadius: "16px 16px 16px 4px", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", gap: 6, alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: "50%", background: "#c4a8e8", display: "block",
                    animation: `bounce 1.2s ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* input */}
        <div style={{ padding: "17px 14px", borderTop: "1px solid rgba(0,0,0,0.07)", background: "#fff", flexShrink: 0 }}>
          {recording ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "15px 14px", borderRadius: 14, background: "#fdf4ff", border: "1.5px solid #c084fc" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#e11d48", display: "block", flexShrink: 0, animation: "recPulse 1s ease-in-out infinite" }} />
              <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#7c4dbd", flex: 1 }}>
                Nahrávám… {Math.floor(recSeconds / 60)}:{String(recSeconds % 60).padStart(2, "0")}
              </span>
              <button
                onClick={stopRecording}
                style={{ padding: "9px 14px", borderRadius: 20, background: "#7c4dbd", border: "none", cursor: "pointer", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, color: "#fff" }}
              >
                Odeslat
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <button
                onMouseDown={startRecording}
                title="Nahrát audio zprávu"
                style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,77,189,0.12)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.06)")}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="5.5" y="1" width="5" height="8" rx="2.5" fill="#7c4dbd"/>
                  <path d="M2.5 8.5a5.5 5.5 0 0011 0" stroke="#7c4dbd" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M8 14v1.5M6 15.5h4" stroke="#7c4dbd" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Napiš zprávu..."
                rows={1}
                style={{
                  flex: 1, resize: "none", padding: "12px 12px", borderRadius: 12,
                  border: "1.5px solid rgba(0,0,0,0.12)", outline: "none",
                  fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a",
                  lineHeight: 1.6, background: "#faf9fc",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "#9b72d0")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)")}
              />
              <button
                onClick={send}
                disabled={!input.trim()}
                style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: input.trim() ? "#7c4dbd" : "rgba(0,0,0,0.08)",
                  border: "none", cursor: input.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 8H2M14 8l-5-5M14 8l-5 5" stroke={input.trim() ? "#fff" : "#b0b0be"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
          {!recording && (
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#b0b0be", margin: "7px 0 0", textAlign: "center" }}>
              Enter odešle · Shift+Enter nový řádek
            </p>
          )}
        </div>
      </div>
      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes recPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }
      `}</style>
    </div>
  );
}

// ─── app ──────────────────────────────────────────────────────────────────────

function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const totalSteps = 2;

  const steps = [
    {
      title: "Vítejte ve formativním hodnocení",
      subtitle: "Přístup vede žáka k lásce k učivu – zabývá se jeho motivací se učit, pokroky, které dělá a sebehodnocením svého posunu.",
      content: (
        <div style={{ marginTop: 56 }}>
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, color: "#b0b0be", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 28px", textAlign: "center" }}>
            Jak to funguje?
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 26, maxWidth: 900, margin: "0 auto" }}>
            {[
              {
                num: 1,
                title: "Vygenerujte s naší pomocí tématický plán, nebo nahrajte svůj",
                illustration: (
                  <svg viewBox="0 0 120 88" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: 88 }}>
                    <rect x="16" y="8" width="72" height="72" rx="6" fill="#f5f5f7" stroke="#e0e0e6" strokeWidth="1.5"/>
                    <rect x="8" y="14" width="72" height="72" rx="6" fill="#fff" stroke="#e0e0e6" strokeWidth="1.5"/>
                    <path d="M24 32h40M24 42h40M24 52h28" stroke="#d0d0da" strokeWidth="2" strokeLinecap="round"/>
                    <rect x="4" y="4" width="5" height="64" rx="2.5" fill="#0a0a0a" opacity="0.12"/>
                    <circle cx="92" cy="68" r="18" fill="#7c4dbd" opacity="0.12"/>
                    <path d="M86 68l4 4 8-8" stroke="#7c4dbd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
              },
              {
                num: 2,
                title: "Najděte cíl, ke kterému má dítě směřovat",
                illustration: (
                  <svg viewBox="0 0 120 88" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: 88 }}>
                    <circle cx="60" cy="44" r="34" fill="#fef3c7" stroke="#fde68a" strokeWidth="1.5"/>
                    <circle cx="60" cy="44" r="22" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5"/>
                    <circle cx="60" cy="44" r="10" fill="#f59e0b"/>
                    <path d="M60 10v8M60 70v8M26 44h8M86 44h8" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ),
              },
              {
                num: 3,
                title: "Sledujte žáky a zaznamenávejte důkazy o učení",
                illustration: (
                  <svg viewBox="0 0 120 88" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: 88 }}>
                    <rect x="10" y="20" width="44" height="52" rx="6" fill="#f3f0ff" stroke="#c4b5fd" strokeWidth="1.5"/>
                    <circle cx="32" cy="38" r="8" fill="#c4b5fd"/>
                    <path d="M18 58h28M18 66h20" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round"/>
                    <rect x="62" y="28" width="44" height="40" rx="6" fill="#ecfdf5" stroke="#6ee7b7" strokeWidth="1.5"/>
                    <rect x="70" y="36" width="28" height="6" rx="3" fill="#6ee7b7"/>
                    <rect x="70" y="47" width="20" height="6" rx="3" fill="#6ee7b7" opacity="0.5"/>
                    <circle cx="96" cy="18" r="8" fill="#7c4dbd" opacity="0.15"/>
                    <path d="M93 18l2 2 4-4" stroke="#7c4dbd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
              },
              {
                num: 4,
                title: "Vygenerujte hodnocení, které opravdu posouvá žáka dále",
                illustration: (
                  <svg viewBox="0 0 120 88" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: 88 }}>
                    <rect x="12" y="16" width="96" height="60" rx="8" fill="#f5f5f7" stroke="#e0e0e6" strokeWidth="1.5"/>
                    <rect x="22" y="28" width="36" height="6" rx="3" fill="#0a0a0a" opacity="0.12"/>
                    <rect x="22" y="39" width="76" height="4" rx="2" fill="#0a0a0a" opacity="0.07"/>
                    <rect x="22" y="48" width="60" height="4" rx="2" fill="#0a0a0a" opacity="0.07"/>
                    <rect x="22" y="57" width="72" height="4" rx="2" fill="#0a0a0a" opacity="0.07"/>
                    <circle cx="94" cy="28" r="14" fill="#7c4dbd"/>
                    <path d="M89 28l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
              },
            ].map(({ num, title, illustration }) => (
              <div key={num} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
                <div style={{ width: "100%", borderRadius: 12, overflow: "hidden", background: "#f9f9fb", border: "1.5px solid rgba(0,0,0,0.07)", padding: "21px 12px" }}>
                  {illustration}
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: "#0a0a0a", marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, color: "#fff" }}>{num}</span>
                  </div>
                  <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a", lineHeight: 1.65, margin: 0 }}>{title}</p>
                </div>
              </div>
            ))}
          </div>

          {/* buddy intro */}
          <div style={{ marginTop: 32, display: "inline-flex", alignItems: "flex-end", gap: 12, background: "#faf9ff", border: "1.5px solid rgba(124,77,189,0.12)", borderRadius: 14, padding: "10px 14px 10px 14px" }}>
            <img src={buddyImg} alt="Buddy" style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }} />
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#3d3d52", lineHeight: 1.6, margin: 0, maxWidth: 380 }}>
              <span style={{ fontWeight: 600, color: "#7c4dbd" }}>Buddy</span> je tu vždy pro vás — pomůže s cíli, kritérii i hodnocením a vaši práci zjednoduší na minimum.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Co chcete učit tento akademický rok?",
      subtitle: "např. třicetiletou válku, obojživelníky nebo vyjmenovaná slova",
      content: (
        <div style={{ marginTop: 40, display: "flex", gap: 12, justifyContent: "center", maxWidth: 600, margin: "40px auto 0" }}>
          <input
            placeholder="Vyjmenovaná slova, třicetiletá válka…"
            style={{
              flex: 1, height: 48, borderRadius: 12, border: "1.5px solid rgba(0,0,0,0.14)",
              padding: "0 16px", fontFamily: "'Inter:Regular', sans-serif", fontSize: 16,
              color: "#0a0a0a", outline: "none", background: "#fff",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "#7c4dbd")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.14)")}
          />
          <button style={{
            height: 48, padding: "0 22px", borderRadius: 12, border: "none",
            background: "#0a0a0a", color: "#fff", fontFamily: "'Inter:Medium', sans-serif",
            fontWeight: 500, fontSize: 16, cursor: "pointer", whiteSpace: "nowrap",
            transition: "background 0.12s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "#333")}
            onMouseLeave={e => (e.currentTarget.style.background = "#0a0a0a")}
          >
            Generovat
          </button>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "#fff",
      display: "flex", flexDirection: "column",
      animation: "fadeIn 0.2s ease",
    }}>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>

      {/* close */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 20, right: 24,
          background: "rgba(0,0,0,0.06)", border: "none", borderRadius: "50%",
          width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "background 0.12s", zIndex: 10,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.1)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.06)")}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M2 2l12 12M14 2L2 14" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>

      {/* progress dots */}
      <div style={{ position: "absolute", top: 28, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
        {steps.map((_, i) => (
          <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? "#0a0a0a" : "rgba(0,0,0,0.15)", transition: "width 0.2s, background 0.2s" }} />
        ))}
      </div>

      {/* content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 48px 120px", overflowY: "auto" }}>
        <div style={{ maxWidth: 960, width: "100%", textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 38, color: "#0a0a0a", margin: "0 0 16px", lineHeight: 1.4 }}>
            {current.title}
          </h1>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 18, color: "#717182", lineHeight: 1.65, margin: "0 auto", maxWidth: 560 }}>
            {current.subtitle}
          </p>
          {current.content}
        </div>
      </div>

      {/* bottom nav */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
          style={{ background: "none", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: 10, padding: "12px 20px", fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#717182", cursor: "pointer" }}
        >
          {step === 0 ? "Přeskočit" : "Zpět"}
        </button>
        <button
          onClick={() => step < totalSteps - 1 ? setStep(s => s + 1) : onClose()}
          style={{ background: "#0a0a0a", border: "none", borderRadius: 10, padding: "12px 24px", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#fff", cursor: "pointer" }}
        >
          {step < totalSteps - 1 ? "Pokračovat" : "Začít"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState<NavItem>("tematicky-plan");
  const [navKey, setNavKey] = useState(0);
  const [buddyOpen, setBuddyOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [buddyTrigger, setBuddyTrigger] = useState<{ msg: string; key: number } | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [tpGoals, setTpGoals] = useState<TpGoal[]>([]);
  const [animateIn, setAnimateIn] = useState(false);
  const [studentEvidence, setStudentEvidence] = useState<Record<string, StudentEvidence>>(() => {
    const acc: Record<string, StudentEvidence> = {};
    sampleEvidenceRecords.forEach(r => {
      acc[r.studentId] = acc[r.studentId] ?? { audio: 0, photo: 0 };
      acc[r.studentId][r.type]++;
    });
    return acc;
  });
  const [evidenceRecords, setEvidenceRecords] = useState<EvidenceRecord[]>(sampleEvidenceRecords);
  const mainRef = useRef<HTMLElement>(null);

  const addStudentEvidence = useCallback((studentId: string, type: "audio" | "photo") => {
    setStudentEvidence(prev => ({
      ...prev,
      [studentId]: {
        audio: (prev[studentId]?.audio ?? 0) + (type === "audio" ? 1 : 0),
        photo: (prev[studentId]?.photo ?? 0) + (type === "photo" ? 1 : 0),
      },
    }));
  }, []);

  const addEvidenceRecords = useCallback((records: EvidenceRecord[]) => {
    setEvidenceRecords(prev => [...prev, ...records]);
  }, []);

  const evidenceCtx: EvidenceCtx = { studentEvidence, addStudentEvidence, evidenceRecords, addEvidenceRecords };

  function navigate(id: NavItem) {
    setActive(id);
    setNavKey((k) => k + 1);
  }

  const goalsCtx: GoalsCtx = {
    tpGoals,
    animateIn,
    addTpGoals: (newGoals) => {
      setTpGoals(prev => {
        const existingIds = new Set(prev.map(g => g.id));
        return [...prev, ...newGoals.filter(g => !existingIds.has(g.id))];
      });
      setAnimateIn(true);
      setTimeout(() => setAnimateIn(false), 3000);
    },
    removeTpGoal: (id) => setTpGoals(prev => prev.filter(g => g.id !== id)),
    updateTpGoalText: (id, text) => setTpGoals(prev => prev.map(g => g.id === id ? { ...g, text } : g)),
    navigateCile: () => {
      setActive("cile");
      setNavKey(k => k + 1);
      requestAnimationFrame(() => {
        mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
      });
    },
  };

  const openBuddyWith = useCallback((msg: string) => {
    setBuddyOpen(true);
    setBuddyTrigger(prev => ({ msg, key: (prev?.key ?? 0) + 1 }));
  }, []);

  return (
    <EvidenceContext.Provider value={evidenceCtx}>
    <GoalsContext.Provider value={goalsCtx}>
    <BuddyContext.Provider value={openBuddyWith}>
    <div className="size-full flex" style={{ fontFamily: "'Inter:Regular', sans-serif", background: "#f5f5f7" }}>
      {/* sidebar */}
      <aside
        className="flex flex-col shrink-0 h-full bg-white"
        style={{ width: collapsed ? 52 : 220, borderRight: "1px solid rgba(0,0,0,0.08)", transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)", overflow: "hidden" }}
      >
        {/* brand */}
        <div
          style={{ height: 56, borderBottom: "1px solid rgba(0,0,0,0.08)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: collapsed ? "0 10px" : "0 12px 0 20px" }}
        >
          {!collapsed && (
            <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 20, color: "#0a0a0a" }}>
              Tiny
            </span>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? "Rozbalit menu" : "Sbalit menu"}
            style={{
              marginLeft: collapsed ? "auto" : 0,
              width: 28, height: 28, borderRadius: 7, border: "none",
              background: "transparent", cursor: "pointer", color: "#b0b0be",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.12s, color 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(236,236,240,0.8)"; e.currentTarget.style.color = "#0a0a0a"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#b0b0be"; }}
          >
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" style={{ transition: "transform 0.22s" }}>
              {/* outer rounded rect */}
              <rect x="1.5" y="1.5" width="17" height="17" rx="3.5" stroke="currentColor" strokeWidth="1.6" fill="none"/>
              {/* sidebar divider */}
              <line x1="6.5" y1="1.5" x2="6.5" y2="18.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              {/* chevron pointing left when expanded, right when collapsed */}
              {collapsed
                ? <path d="M11.5 7.5L14 10L11.5 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                : <path d="M13.5 7.5L11 10L13.5 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              }
            </svg>
          </button>
        </div>

        {/* nav */}
        <nav className="flex flex-col flex-1 overflow-y-auto" style={{ padding: collapsed ? "16px 8px" : "16px 12px", gap: 0 }}>
          {(() => {
            const sectionLabel = (label: string) => !collapsed ? (
              <p style={{
                padding: "0 8px", margin: "12px 0 4px",
                fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500,
                fontSize: 12, color: "#b0b0be", letterSpacing: "0.07em", textTransform: "uppercase",
              }}>{label}</p>
            ) : <div style={{ height: 8 }} />;

            const navBtn = (item: { id: NavItem; label: string; icon: React.ReactNode }) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: collapsed ? 0 : 10,
                    justifyContent: collapsed ? "center" : "flex-start",
                    padding: collapsed ? "8px" : "7px 8px", borderRadius: 9, border: "none",
                    background: isActive ? "rgba(236,236,240,0.85)" : "transparent",
                    color: isActive ? "#0a0a0a" : "#717182",
                    fontFamily: isActive ? "'Inter:Medium', sans-serif" : "'Inter:Regular', sans-serif",
                    fontWeight: isActive ? 500 : 400,
                    fontSize: 15.5, letterSpacing: "-0.1px",
                    cursor: "pointer", width: "100%", textAlign: "left",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { if (active !== item.id) e.currentTarget.style.background = "rgba(236,236,240,0.45)"; }}
                  onMouseLeave={e => { if (active !== item.id) e.currentTarget.style.background = "transparent"; }}
                >
                  {item.icon}
                  {!collapsed && item.label}
                </button>
              );
            };

            const vaseVyuka = navItems.filter(i => i.id === "tematicky-plan" || i.id === "cile" || i.id === "tridy");
            const formativni = navItems.filter(i => i.id !== "tematicky-plan" && i.id !== "cile" && i.id !== "tridy");

            return (
              <>
                {sectionLabel("Vaše výuka")}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {vaseVyuka.map(navBtn)}
                </div>

                {sectionLabel("Formativní hodnocení")}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {formativni.map(navBtn)}
                </div>

                <div style={{ flex: 1 }} />

                {!collapsed && (
                  <button
                    onClick={() => setOnboardingOpen(true)}
                    style={{
                      display: "flex", alignItems: "center",
                      padding: "10px 8px", borderRadius: 9, border: "none",
                      background: "transparent", color: "#b0b0be",
                      fontFamily: "'Inter:Regular', sans-serif", fontSize: 14.5,
                      cursor: "pointer", width: "100%", textAlign: "left",
                      transition: "color 0.12s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#717182")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#b0b0be")}
                  >
                    Jak na formativní hodnocení
                  </button>
                )}
              </>
            );
          })()}
        </nav>

        {/* user */}
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", padding: collapsed ? "12px 8px" : "12px 16px", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", background: "rgba(236,236,240,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#717182" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="7" r="4" stroke="#717182" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {!collapsed && (
            <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 15, color: "#0a0a0a" }}>
              Můj účet
            </span>
          )}
        </div>
      </aside>

      {/* main */}
      <main ref={mainRef} className="flex-1 h-full overflow-auto">
        {active === "tridy" && <ClassesView key={navKey} />}
{active === "cile" && <CileView key={navKey} />}
        {active === "dukazy" && <DukazyView key={navKey} />}
        {active === "hodnoceni" && <HodnoceniView key={navKey} />}
        {active === "tematicky-plan" && <TematickyPlanView key={navKey} />}
      </main>

      {/* buddy chat panel — inline, part of the flex row */}
      <BuddyChat open={buddyOpen} onClose={() => setBuddyOpen(false)} trigger={buddyTrigger} />
      {onboardingOpen && <OnboardingModal onClose={() => setOnboardingOpen(false)} />}

      {/* buddy button — hidden when chat is open */}
      {!buddyOpen && (
        <button
          title="Buddy"
          onClick={() => setBuddyOpen(true)}
          style={{
            position: "fixed", top: 12, right: 16, zIndex: 200,
            width: 44, height: 44, borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 2px 10px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.07)",
            border: "1.5px solid rgba(120,80,180,0.15)",
            cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.18s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <img src={buddyImg} alt="Buddy" style={{ width: 30, height: 30, objectFit: "contain" }} />
        </button>
      )}
    </div>
    </BuddyContext.Provider>
    </GoalsContext.Provider>
    </EvidenceContext.Provider>
  );
}
