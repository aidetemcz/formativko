import buddyImg from "./assets/buddy.png";
import React, { useState, useRef, useEffect, useContext, createContext, useCallback } from "react";
import { initialClasses, type Class, type Student } from "./data";

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
  updateTpGoal: (id: string, patch: Partial<TpGoal>) => void;
  planRows: TpRow[];
  setPlanRows: React.Dispatch<React.SetStateAction<TpRow[]>>;
  plans: TpPlan[];
  setPlans: React.Dispatch<React.SetStateAction<TpPlan[]>>;
  lessonsDone: Record<string, boolean>;
  toggleLessonDone: (id: string) => void;
  goToSettings: () => void;
  goToClasses: () => void;
  openGuide: () => void;
  teacherName: string;
  setTeacherName: (v: string) => void;
  schoolName: string;
  setSchoolName: (v: string) => void;
  schoolLevelId: string;
  setSchoolLevelId: (id: string) => void;
  schoolCustomLevels: CustomLevel[];
  setSchoolCustomLevels: (levels: CustomLevel[]) => void;
  updatePlanRow: (rowId: string, patch: Partial<TpRow>) => void;
  navigateCile: () => void;
  animateIn: boolean;
}
const GoalsContext = createContext<GoalsCtx>({
  tpGoals: [], addTpGoals: () => {}, removeTpGoal: () => {}, updateTpGoalText: () => {}, updateTpGoal: () => {},
  planRows: [], setPlanRows: () => {}, updatePlanRow: () => {},
  plans: [], setPlans: () => {},
  lessonsDone: {}, toggleLessonDone: () => {},
  goToSettings: () => {}, goToClasses: () => {}, openGuide: () => {},
  teacherName: "", setTeacherName: () => {},
  schoolName: "", setSchoolName: () => {},
  schoolLevelId: "začínám", setSchoolLevelId: () => {},
  schoolCustomLevels: [], setSchoolCustomLevels: () => {},
  navigateCile: () => {}, animateIn: false,
});

type StudentEvidence = { audio: number; photo: number; note?: number };

interface EvidenceRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  type: "audio" | "photo" | "note";
  note?: string;
  goalText: string;
  goalId: string;
  subject: string;
  date: string;
  criterion?: string;
  level?: string;
}

function er(id: string, studentId: string, studentName: string, className: string, type: "audio" | "photo" | "note", goalId: string, goalText: string, subject: string, date: string, criterion?: string, level?: string): EvidenceRecord {
  return { id, studentId, studentName, className, type, goalId, goalText, subject, date, criterion, level };
}

const sampleEvidenceRecords: EvidenceRecord[] = [
  er("e5","3a-4","Dvořák, Daniel","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-09-05","Zpaměťové počítání","Zvládám"),
  er("e6","3a-4","Dvořák, Daniel","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-09-06","Strategie odečítání","Rozvíjím"),
  er("e7","3a-5","Fišerová, Eliška","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-09-07","Zpaměťové počítání","Rozvíjím"),
  er("e10","3a-8","Jelínek, Jan","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-08-28","Název a funkce orgánů","Zvládám"),
  er("e11","3a-9","Kopecká, Karolína","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-08-28","Název a funkce orgánů","Rozvíjím"),
  er("e12","3a-10","Kratochvíl, Lukáš","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-08-29","Popis pohybového aparátu","Začínám"),
  er("e15","3a-13","Marková, Natálie","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-08-20","Strategie odečítání","Zvládám"),
  er("e16","3a-14","Novák, Ondřej","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-08-20"),
  er("e17","3a-15","Pokorná, Petra","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-08-21"),
  er("e18","3a-16","Procházka, Radek","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-07-10"),
  er("e19","3a-17","Růžičková, Simona","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-07-11"),
  er("e22","3a-20","Šimánková, Veronika","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2027-06-05"),
  er("e23","3a-21","Veselý, Vojtěch","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2027-06-06"),
  er("e24","3a-1","Beneš, Adam","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2027-06-10"),
  er("e25","3a-2","Blahová, Anežka","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2027-06-10"),
  er("e26","3a-3","Čermáková, Barbora","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2027-06-11"),
  er("e27","3a-5","Fišerová, Eliška","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-04-15"),
  er("e28","3a-6","Hájek, Filip","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-04-15"),
  er("e29","3a-7","Horáková, Gabriela","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-04-16"),
  er("e30","3a-8","Jelínek, Jan","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-04-16"),
  er("e33","3a-11","Křížková, Marie","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2027-02-12"),
  er("e34","3a-12","Macháček, Martin","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2027-02-12"),
  er("e35","3a-13","Marková, Natálie","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-11-08"),
  er("e36","3a-14","Novák, Ondřej","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-11-08"),
  er("e39","3a-17","Růžičková, Simona","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-12-03"),
  er("e40","3a-18","Sedláčková, Tereza","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-12-03"),
  er("e41","3a-19","Svoboda, Tomáš","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-01-14"),
  er("e42","3a-20","Šimánková, Veronika","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-01-14"),

  // druhá sada — různé předměty, kritéria, úrovně, typy
  er("e44","3a-1","Beneš, Adam","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-08-15","Název a funkce orgánů","Zvládám"),
  er("e45","3a-1","Beneš, Adam","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2027-06-18","Rozpoznání tvarů","Rozvíjím"),
  er("e46","3a-2","Blahová, Anežka","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-09-03","Zpaměťové počítání","Zvládám"),
  er("e47","3a-2","Blahová, Anežka","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-04-20","Fáze životního cyklu","Rozvíjím"),
  er("e48","3a-3","Čermáková, Barbora","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-08-30","Strategie odečítání","Rozvíjím"),
  er("e49","3a-3","Čermáková, Barbora","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-04-22","Podmínky růstu","Začínám"),
  er("e51","3a-4","Dvořák, Daniel","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-07-20","Popis pohybového aparátu","Rozvíjím"),
  er("e53","3a-5","Fišerová, Eliška","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2027-06-14","Pojmenování tvarů","Zvládám"),
  er("e54","3a-6","Hájek, Filip","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-09-01","Zpaměťové počítání","Rozvíjím"),
  er("e55","3a-6","Hájek, Filip","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-08-10","Název a funkce orgánů","Začínám"),
  er("e56","3a-7","Horáková, Gabriela","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2027-06-08","Rozpoznání tvarů","Zvládám"),
  er("e57","3a-7","Horáková, Gabriela","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-04-18","Podmínky růstu","Rozvíjím"),
  er("e59","3a-8","Jelínek, Jan","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-08-22","Strategie odečítání","Zvládám"),
  er("e60","3a-9","Kopecká, Karolína","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2027-05-28","Pojmenování tvarů","Rozvíjím"),
  er("e61","3a-9","Kopecká, Karolína","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-04-25","Fáze životního cyklu","Zvládám"),
  er("e62","3a-10","Kratochvíl, Lukáš","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2027-06-03","Rozpoznání tvarů","Začínám"),
  er("e63","3a-10","Kratochvíl, Lukáš","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-04-12","Podmínky růstu","Rozvíjím"),
  er("e64","3a-11","Křížková, Marie","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-07-15","Popis pohybového aparátu","Zvládám"),
  er("e65","3a-11","Křížková, Marie","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2027-05-30","Pojmenování tvarů","Zvládám"),
  er("e66","3a-12","Macháček, Martin","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-08-05","Název a funkce orgánů","Rozvíjím"),
  er("e67","3a-12","Macháček, Martin","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2027-06-02","Rozpoznání tvarů","Zvládám"),
  er("e69","3a-13","Marková, Natálie","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-04-10","Fáze životního cyklu","Začínám"),
  er("e71","3a-14","Novák, Ondřej","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2027-05-25","Pojmenování tvarů","Rozvíjím"),
  er("e72","3a-15","Pokorná, Petra","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-07-08","Název a funkce orgánů","Zvládám"),
  er("e73","3a-15","Pokorná, Petra","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-04-08","Podmínky růstu","Zvládám"),
  er("e74","3a-16","Procházka, Radek","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-09-02","Zpaměťové počítání","Začínám"),
  er("e75","3a-16","Procházka, Radek","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2027-06-01","Rozpoznání tvarů","Rozvíjím"),
  er("e77","3a-17","Růžičková, Simona","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-08-12","Popis pohybového aparátu","Rozvíjím"),
  er("e78","3a-18","Sedláčková, Tereza","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-08-18","Strategie odečítání","Zvládám"),
  er("e79","3a-18","Sedláčková, Tereza","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-04-07","Fáze životního cyklu","Rozvíjím"),
  er("e80","3a-19","Svoboda, Tomáš","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-08-25","Zpaměťové počítání","Rozvíjím"),
  er("e81","3a-19","Svoboda, Tomáš","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-07-22","Název a funkce orgánů","Zvládám"),
  er("e83","3a-20","Šimánková, Veronika","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-04-06","Podmínky růstu","Zvládám"),
  er("e84","3a-21","Veselý, Vojtěch","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2026-09-04","Strategie odečítání","Zvládám"),
  er("e85","3a-21","Veselý, Vojtěch","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-04-14","Fáze životního cyklu","Rozvíjím"),

  // třetí sada — starší záznamy, různorodé typy (bez kritéria = čistá audio/foto)
  er("e86","3a-1","Beneš, Adam","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-01-20"),
  er("e88","3a-3","Čermáková, Barbora","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-12-10","Pojmenování tvarů","Rozvíjím"),
  er("e89","3a-4","Dvořák, Daniel","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-01-18"),
  er("e90","3a-5","Fišerová, Eliška","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2027-02-05","Zpaměťové počítání","Začínám"),
  er("e92","3a-7","Horáková, Gabriela","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2027-02-18"),
  er("e93","3a-8","Jelínek, Jan","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-12-15","Rozpoznání tvarů","Zvládám"),
  er("e94","3a-9","Kopecká, Karolína","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2027-02-20","Strategie odečítání","Zvládám"),
  er("e96","3a-11","Křížková, Marie","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-01-10","Fáze životního cyklu","Zvládám"),
  er("e97","3a-12","Macháček, Martin","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-01-12"),
  er("e98","3a-13","Marková, Natálie","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-12-08","Pojmenování tvarů","Rozvíjím"),
  er("e99","3a-14","Novák, Ondřej","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-01-16","Podmínky růstu","Začínám"),
  er("e100","3a-15","Pokorná, Petra","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-12-01"),
  er("e102","3a-17","Růžičková, Simona","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-01-08"),
  er("e103","3a-18","Sedláčková, Tereza","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-11-20","Popis pohybového aparátu","Zvládám"),
  er("e105","3a-20","Šimánková, Veronika","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-11-25","Název a funkce orgánů","Rozvíjím"),
  er("e106","3a-21","Veselý, Vojtěch","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2027-02-08","Zpaměťové počítání","Rozvíjím"),
  er("e108","3a-2","Blahová, Anežka","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-11-12","Název a funkce orgánů","Zvládám"),
  er("e110","3a-4","Dvořák, Daniel","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-12-20","Rozpoznání tvarů","Zvládám"),
  er("e111","3a-5","Fišerová, Eliška","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-11-15","Popis pohybového aparátu","Rozvíjím"),
  er("e112","3a-6","Hájek, Filip","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-01-06","Fáze životního cyklu","Začínám"),
  er("e114","3a-8","Jelínek, Jan","3.A","photo","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-11-10"),
  er("e115","3a-9","Kopecká, Karolína","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-12-18","Pojmenování tvarů","Začínám"),
  er("e116","3a-10","Kratochvíl, Lukáš","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2027-02-15","Strategie odečítání","Rozvíjím"),
  er("e117","3a-11","Křížková, Marie","3.A","audio","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-12-06","Rozpoznání tvarů","Zvládám"),
  er("e119","3a-13","Marková, Natálie","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-11-06","Název a funkce orgánů","Zvládám"),
  er("e120","3a-14","Novák, Ondřej","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2027-02-10"),
  er("e122","3a-16","Procházka, Radek","3.A","photo","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-01-04","Podmínky růstu","Rozvíjím"),
  er("e123","3a-17","Růžičková, Simona","3.A","audio","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2027-02-22","Zpaměťové počítání","Zvládám"),
  er("e124","3a-18","Sedláčková, Tereza","3.A","photo","tp-mat-2","Dokážu rozpoznat a pojmenovat základní geometrické tvary","Matematika","2026-12-12"),
  er("e125","3a-19","Svoboda, Tomáš","3.A","audio","tp-prv-2","Dokážu popsat životní cyklus rostliny a podmínky jejího růstu","Prvouka","2027-01-22","Fáze životního cyklu","Zvládám"),
  er("e126","3a-20","Šimánková, Veronika","3.A","photo","tp-mat-1","Dokážu sečíst a odečíst čísla do 100 zpaměti","Matematika","2027-02-28","Strategie odečítání","Rozvíjím"),
  er("e127","3a-21","Veselý, Vojtěch","3.A","audio","tp-prv-1","Dokážu pojmenovat části lidského těla a vysvětlit jejich funkci","Prvouka","2026-11-18","Popis pohybového aparátu","Zvládám"),
];

interface EvidenceCtx {
  studentEvidence: Record<string, StudentEvidence>;
  addStudentEvidence: (studentId: string, type: "audio" | "photo" | "note") => void;
  evidenceRecords: EvidenceRecord[];
  addEvidenceRecords: (records: EvidenceRecord[]) => void;
  updateEvidenceRecord: (record: EvidenceRecord) => void;
  removeEvidenceRecord: (id: string) => void;
}
const EvidenceContext = createContext<EvidenceCtx>({
  studentEvidence: {},
  addStudentEvidence: () => {},
  evidenceRecords: [],
  addEvidenceRecords: () => {},
  updateEvidenceRecord: () => {},
  removeEvidenceRecord: () => {},
});

// ─── ai hint wrapper ──────────────────────────────────────────────────────────

// 4-pointed sparkle SVG used in AI hint button
// Jeden úchyt pro přetahování všude: sloupce, řádky plánu, vyučovací hodiny
function DragGrip({ size = 14, opacity = 0.3 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size * 10 / 16} height={size} viewBox="0 0 10 16" fill="none" aria-hidden="true" style={{ opacity, flexShrink: 0 }}>
      <circle cx="3" cy="3" r="1.2" fill="currentColor"/><circle cx="7" cy="3" r="1.2" fill="currentColor"/>
      <circle cx="3" cy="8" r="1.2" fill="currentColor"/><circle cx="7" cy="8" r="1.2" fill="currentColor"/>
      <circle cx="3" cy="13" r="1.2" fill="currentColor"/><circle cx="7" cy="13" r="1.2" fill="currentColor"/>
    </svg>
  );
}

function SparkleIcon() {
  // stejná hvězdička jako u tlačítka pro přidání kontextu Buddymu
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5l1.6 4.9 4.9 1.6-4.9 1.6L8 14.5l-1.6-4.9L1.5 8l4.9-1.6z" fill="currentColor"/>
    </svg>
  );
}

// Nenápadné, ale trvale viditelné tlačítko pro přidání kontextu Buddymu.
// Dřív se objevovalo až při najetí myší — na dotyku se tak nedalo najít vůbec.
function BuddyButton({ onClick, title, style }: { onClick: (e: React.MouseEvent) => void; title: string; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: 24, height: 24, borderRadius: 7, padding: 0, flexShrink: 0, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "transparent", border: "1px solid rgba(0,0,0,0.13)", color: "#9a9aa8",
        opacity: 0.75, transition: "opacity 0.14s, background 0.14s, border-color 0.14s, color 0.14s",
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.background = "#f3e8ff"; e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.color = "#7c3aed"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "0.75"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.13)"; e.currentTarget.style.color = "#9a9aa8"; }}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1.5l1.6 4.9 4.9 1.6-4.9 1.6L8 14.5l-1.6-4.9L1.5 8l4.9-1.6z" fill="currentColor"/>
      </svg>
    </button>
  );
}

function AIHint({ children, message, inline }: { children: React.ReactNode; message: string; inline?: boolean }) {
  const openBuddy = useContext(BuddyContext);
  return (
    <div
      style={{
        position: "relative",
        display: inline ? "inline-block" : "block",
        marginLeft: -34,
        paddingLeft: 34,
      }}
    >
      <BuddyButton
        onClick={e => { e.stopPropagation(); openBuddy(message); }}
        title="Přidat do kontextu Buddyho"
        style={{ position: "absolute", left: 2, top: "50%", transform: "translateY(-50%)", zIndex: 20 }}
      />
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

const ICON_TRASH = "M2 4h12M5.333 4V2.667a.667.667 0 0 1 .667-.667h4a.667.667 0 0 1 .667.667V4M12.667 4l-.667 9.333A1.333 1.333 0 0 1 10.667 14H5.333A1.333 1.333 0 0 1 4 13.333L3.333 4";
function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d={ICON_TRASH} stroke="#717182" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
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
        <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 16, color: "#0a0a0a", marginBottom: 20 }}>
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
      <label style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12, color: "#717182", marginBottom: 6, letterSpacing: "0.02em" }}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", boxSizing: "border-box", padding: "9px 12px",
          borderRadius: 10, border: "1px solid rgba(0,0,0,0.14)",
          fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#0a0a0a",
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
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
      <button onClick={onCancel} style={btnStyle("ghost")}>Zrušit</button>
      <button onClick={onConfirm} style={btnStyle(danger ? "danger" : "primary")}>{confirmLabel}</button>
    </div>
  );
}

function btnStyle(variant: "primary" | "ghost" | "danger"): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer",
    fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13,
    transition: "opacity 0.15s",
  };
  if (variant === "primary") return { ...base, background: "#0a0a0a", color: "#fff" };
  if (variant === "danger") return { ...base, background: "#dc2626", color: "#fff" };
  return { ...base, background: "rgba(236,236,240,0.8)", color: "#0a0a0a" };
}

// ─── breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({ crumbs }: { crumbs: { label: string; onClick?: () => void }[] }) {
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
      {crumbs.map((crumb, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
                fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0a0a0a")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#717182")}
            >
              {crumb.label}
            </button>
          ) : (
            <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#0a0a0a" }}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ─── nav data ─────────────────────────────────────────────────────────────────

type NavItem = "tridy" | "cile" | "dukazy" | "hodnoceni" | "tematicky-plan" | "profil" | "napady" | "tinyboti" | "lekce" | "asistenti" | "navody" | "zpetna-vazba";

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
      id: "e1", type: "note", date: "4. 9. 2026", goal: "Dokážu napsat srozumitelný text o mém oblíbeném zvířeti",
      criterion: "Výběr výstižných slov",
      note: "Barbora použila opravdu pěkná přídavná jména – popisovala srst kočky jako 'hedvábně měkkou'. Text byl čtivý a čtenář si zvíře dokázal představit.",
    },
    {
      id: "e2", type: "criterion", date: "4. 9. 2026", goal: "Dokážu napsat srozumitelný text o mém oblíbeném zvířeti",
      criterion: "Uspořádání textu", level: "Rozvíjím",
    },
    {
      id: "e3", type: "criterion", date: "4. 9. 2026", goal: "Dokážu napsat srozumitelný text o mém oblíbeném zvířeti",
      criterion: "Stavba vět", level: "Zvládám",
    },
    {
      id: "e4", type: "photo", date: "4. 9. 2026", goal: "Dokážu napsat srozumitelný text o mém oblíbeném zvířeti",
      note: "Fotografie psaného textu z hodiny.", fileName: "foto_text_barbora.jpg",
    },
    {
      id: "e5", type: "audio", date: "28. 8. 2026", goal: "Dokážu napsat srozumitelný text o mém oblíbeném zvířeti",
      note: "Barbora přečetla svůj text nahlas. Plynulé čtení, správná intonace.", duration: "1:24",
    },
  ],
  "3a-7": [
    {
      id: "e6", type: "note", date: "4. 9. 2026", goal: "Dokážu napsat srozumitelný text o mém oblíbeném zvířeti",
      criterion: "Srozumitelnost textu",
      note: "Gabriela popsala morče podrobně, ale některé věty byly příliš dlouhé a ztrácely nit. Domluvily jsme se, že příště zkusí kratší věty.",
    },
    {
      id: "e7", type: "criterion", date: "4. 9. 2026", goal: "Dokážu napsat srozumitelný text o mém oblíbeném zvířeti",
      criterion: "Popis vzhledu", level: "Zvládám",
    },
    {
      id: "e8", type: "file", date: "4. 9. 2026", goal: "Dokážu napsat srozumitelný text o mém oblíbeném zvířeti",
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
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.09)", padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: ev.note || ev.level ? 10 : 0 }}>
        <EvidenceIcon type={ev.type} />
        <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a" }}>
          {evidenceLabel(ev.type)}
        </span>
        {ev.criterion && (
          <span style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(236,236,240,0.8)", color: "#717182", fontFamily: "'Inter:Regular', sans-serif", fontSize: 11 }}>
            {ev.criterion}
          </span>
        )}
        {ev.level && lc && (
          <span style={{ padding: "2px 8px", borderRadius: 20, background: lc.bg, color: lc.color, fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11 }}>
            {ev.level}
          </span>
        )}
        <span style={{ marginLeft: "auto", fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#b0b0bc" }}>{ev.date}</span>
      </div>
      {!hideGoal && (
        <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#a0a0b0", margin: "0 0 6px", fontStyle: "italic" }}>
          {ev.goal}
        </p>
      )}
      {ev.note && <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#3a3a4a", lineHeight: 1.6, margin: 0 }}>{ev.note}</p>}
      {ev.duration && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.667" stroke="#b0b0bc" strokeWidth="1.2" />
            <path d="M8 5.333V8l1.667 1.667" stroke="#b0b0bc" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#b0b0bc" }}>{ev.duration}</span>
        </div>
      )}
      {ev.fileName && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, padding: "5px 10px", borderRadius: 8, background: "rgba(236,236,240,0.5)" }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M9.333 1.333H4A1.333 1.333 0 0 0 2.667 2.667v10.666A1.333 1.333 0 0 0 4 14.667h8a1.333 1.333 0 0 0 1.333-1.334V5.333L9.333 1.333z" stroke="#717182" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.333 1.333v4h4" stroke="#717182" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182" }}>{ev.fileName}</span>
        </div>
      )}
    </div>
  );
}

type ProfileView = "type" | "goal";

// Předměty v 6. pádu, ať věty od Buddyho zní česky.
const SUBJECT_LOCATIVE: Record<string, string> = {
  "Čeština": "češtině",
  "Matematika": "matematice",
  "Prvouka": "prvouce",
  "Anglický jazyk": "angličtině",
  "Hudební výchova": "hudební výchově",
  "Výtvarná výchova": "výtvarné výchově",
  "Tělesná výchova": "tělesné výchově",
  "Informatika": "informatice",
};
const subjectLoc = (s: string) => SUBJECT_LOCATIVE[s] ?? `předmětu ${s}`;

const SHEET_LEVELS = ["Začínám", "Rozvíjím", "Zvládám"] as const;
const SHEET_LEVEL_STYLE: Record<string, { border: string; bg: string; fg: string }> = {
  "Začínám": { border: "#dc2626", bg: "#fee2e2", fg: "#991b1b" },
  "Rozvíjím": { border: "#ca8a04", bg: "#fef9c3", fg: "#854d0e" },
  "Zvládám": { border: "#16a34a", bg: "#dcfce7", fg: "#166534" },
};

// Shrnutí od Buddyho: z důkazů se po předmětech poskládá jedna věta o posunu.
function buddySummary(name: string, records: EvidenceRecord[], subjects: string[]) {
  return subjects.map(subject => {
    const all = records.filter(r => r.subject === subject);
    const recs = all.filter(r => r.level).sort((a, b) => a.date.localeCompare(b.date));
    if (all.length === 0) {
      return { subject, count: 0, text: "Zatím žádné důkazy o učení.", missing: true };
    }
    if (recs.length === 0) {
      return { subject, count: all.length, text: `${all.length} ${pluralDukaz(all.length)}, zatím ale žádný s určenou úrovní.`, missing: false };
    }
    const byCrit: Record<string, EvidenceRecord[]> = {};
    recs.forEach(r => { (byCrit[r.criterion ?? "\u2013"] ??= []).push(r); });
    const [crit, items] = Object.entries(byCrit).sort((a, b) => b[1].length - a[1].length)[0];
    const first = items[0].level!;
    const last = items[items.length - 1].level!;
    const text = first === last
      ? `U krit\u00e9ria \u201e${crit}\u201c je na \u00farovni ${last.toLowerCase()} \u2014 ${all.length} ${pluralDukaz(all.length)}.`
      : `U krit\u00e9ria \u201e${crit}\u201c se posouv\u00e1 z ${first.toLowerCase()} na ${last.toLowerCase()} \u2014 ${all.length} ${pluralDukaz(all.length)}.`;
    return { subject, count: all.length, text, missing: false };
  }).sort((a, b) => a.count - b.count);
}

function pluralDukaz(n: number) {
  return n === 1 ? "d\u016fkaz" : n <= 4 ? "d\u016fkazy" : "d\u016fkaz\u016f";
}

function StudentProfile({
  student,
  className,
  onBack,
}: {
  student: Student;
  className: string;
  onBack: () => void;
}) {
  const { evidenceRecords, removeEvidenceRecord } = useContext(EvidenceContext);
  const { tpGoals } = useContext(GoalsContext);
  const goalNums = buildGoalNumbers(tpGoals);
  const fullName = `${student.firstName} ${student.lastName}`;
  const allStudentRecords = [...evidenceRecords]
    .filter(r => r.studentId === student.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const [addOpen, setAddOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EvidenceRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<EvidenceRecord | null>(null);

  // stejný filtr jako na přehledu důkazů, jen s předvybranou třídou a žákem
  const [filterSubject, setFilterSubject] = useState("vse");
  const [filterClass, setFilterClass] = useState(className);
  const [filterStudentId, setFilterStudentId] = useState(student.id);
  const [filterGoalId, setFilterGoalId] = useState("vse");
  const [filterPeriod, setFilterPeriod] = useState("vse");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const allSubjects = Array.from(new Set([...SUBJECTS, ...evidenceRecords.map(r => r.subject)])).sort();
  const allClasses = Array.from(new Set([...initialClasses.map(c => c.name), ...evidenceRecords.map(r => r.className)])).sort();
  const studentsOfClass = (initialClasses.find(c => c.name === filterClass)?.students ?? [])
    .map(st => ({ id: st.id, name: `${st.lastName}, ${st.firstName}` }));
  const allGoals = [
    ...tpGoals.map(g => ({ id: g.id, text: g.text })),
    ...Array.from(new Set(evidenceRecords.map(r => r.goalId)))
      .filter(id => !tpGoals.find(g => g.id === id))
      .map(id => ({ id, text: evidenceRecords.find(r => r.goalId === id)?.goalText ?? id })),
  ];

  const studentRecords = [...evidenceRecords]
    .filter(r => {
      if (filterStudentId !== "vse" && r.studentId !== filterStudentId) return false;
      if (filterClass !== "vse" && r.className !== filterClass) return false;
      if (filterSubject !== "vse" && r.subject !== filterSubject) return false;
      if (filterGoalId !== "vse" && r.goalId !== filterGoalId) return false;
      if (!inSelectedPeriod(r.date, filterPeriod, filterDateFrom, filterDateTo)) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const activeFilters = [filterSubject, filterGoalId, filterPeriod].filter(v => v !== "vse").length;
  function resetFilters() {
    setFilterSubject("vse"); setFilterGoalId("vse"); setFilterPeriod("vse");
    setFilterDateFrom(""); setFilterDateTo("");
    setFilterClass(className); setFilterStudentId(student.id);
  }

  // předměty do shrnutí: co žák má v důkazech plus co ho čeká podle hodin
  const summarySubjects = Array.from(new Set([
    ...allStudentRecords.map(r => r.subject),
    ...tpGoals.filter(g => g.trida === className).map(g => g.subject),
  ])).sort();
  const summary = buddySummary(fullName, allStudentRecords, summarySubjects);
  const missingSubjects = summary.filter(x => x.missing).map(x => x.subject);
  // kritéria, kde Buddymu chybí úroveň, aby uměl navrhnout hodnocení
  const openQuestions = tpGoals
    .filter(g => g.trida === className)
    .flatMap(g => g.criteria.map(c => ({ goalId: g.id, criterion: c.label, subject: g.subject })))
    .filter(q => !allStudentRecords.some(r => r.goalId === q.goalId && r.criterion === q.criterion && r.level))
    .slice(0, 3);
  const [preset, setPreset] = useState<AddEvidencePreset | null>(null);

  return (
    <div style={{ padding: "32px 40px" }}>
      <Breadcrumb crumbs={[
        { label: "Formativní hodnocení" },
        { label: "Třídy", onClick: onBack },
        { label: `Třída ${className}`, onClick: onBack },
        { label: fullName },
      ]} />

      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", background: avatarColor(student.lastName),
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 17, color: "#fff", flexShrink: 0,
          }}>
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div>
            <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 22, lineHeight: "40px", color: "#0a0a0a", margin: 0 }}>
              {fullName}
            </h1>
            <span style={{ padding: "2px 9px", borderRadius: 20, background: "rgba(236,236,240,0.9)", color: CHIP_FG, fontFamily: "'Inter:Regular', sans-serif", fontSize: 12 }}>
              {className}
            </span>
          </div>
        </div>

        <button
          onClick={() => setAddOpen(true)}
          style={{ ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", flexShrink: 0 }}
        >
          <IconPlus />
          Přidat důkaz o učení
        </button>
      </div>

      {/* shrnutí od Buddyho */}
      <div style={{ background: "#faf7ff", borderRadius: 14, border: "1px solid rgba(124,77,189,0.22)", padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{
            width: 22, height: 22, borderRadius: "50%", background: "#5b21b6", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <img src={buddyImg} alt="" style={{ width: 15, height: 15, objectFit: "contain" }} />
          </span>
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#5b21b6", margin: 0 }}>
            Shrnutí od Buddyho
          </p>
        </div>

        {summary.length === 0 ? (
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#5c5c6b", margin: 0, lineHeight: 1.6 }}>
            Zatím není z čeho shrnovat — nejdřív vytvořte tématický plán a zaznamenejte první důkazy o učení.
          </p>
        ) : (
          <>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13.5, color: "#2f2f3a", margin: "0 0 14px", lineHeight: 1.65 }}>
              U {student.firstName}a je nyní <strong style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500 }}>{allStudentRecords.length} {pluralDukaz(allStudentRecords.length)} o učení</strong>.
              {missingSubjects.length > 0
                ? ` Z ${missingSubjects.map(subjectLoc).join(" a ")} zatím nemáte žádný — doporučil bych je doplnit, než budete generovat hodnocení.`
                : ` Nejméně jich máte z ${subjectLoc(summary[0].subject)} — tam bych ještě přidal.`}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {summary.map(({ subject, text, missing }) => (
                <div key={subject} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                  <span style={{ flexShrink: 0 }}><SubjectChip subject={subject} /></span>
                  <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: missing ? "#8a8a99" : "#2f2f3a", lineHeight: 1.6 }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>

            {/* co Buddymu chybí, aby uměl navrhnout hodnocení */}
            {(openQuestions.length > 0 || missingSubjects.length > 0) && (
              <div style={{ borderTop: "1px solid rgba(124,77,189,0.18)", paddingTop: 12 }}>
                <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#7c4dbd", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                  Odpovězte Buddymu
                </p>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {openQuestions.map(q => (
                    <button
                      key={q.goalId + q.criterion}
                      onClick={() => setPreset({ kind: "uroven", goalId: q.goalId, criterion: q.criterion, subject: q.subject })}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 7,
                        padding: "7px 12px", borderRadius: 20, cursor: "pointer",
                        border: "1px solid rgba(124,77,189,0.35)", background: "#fff", color: "#5b21b6",
                        fontFamily: "'Inter:Regular', sans-serif", fontSize: 12.5, textAlign: "left",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f3e8ff")}
                      onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                    >
                      <SubjectIcon subject={q.subject} size={12} />
                      Na jaké úrovni je {student.firstName} v „{q.criterion}"?
                    </button>
                  ))}
                  {missingSubjects.slice(0, 2).map(sub => (
                    <button
                      key={sub}
                      onClick={() => setPreset({ kind: "uroven", subject: sub })}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 7,
                        padding: "7px 12px", borderRadius: 20, cursor: "pointer",
                        border: "1px solid rgba(124,77,189,0.35)", background: "#fff", color: "#5b21b6",
                        fontFamily: "'Inter:Regular', sans-serif", fontSize: 12.5,
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f3e8ff")}
                      onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                    >
                      <SubjectIcon subject={sub} size={12} />
                      Doplnit důkaz z {subjectLoc(sub)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* filtr — stejný jako v důkazech o učení */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.09)", padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={FILTER_SELECT_STYLE}>
            <option value="vse">Všechny předměty</option>
            {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterStudentId("vse"); }} style={FILTER_SELECT_STYLE}>
            <option value="vse">Všechny třídy</option>
            {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={filterStudentId} onChange={e => setFilterStudentId(e.target.value)} style={FILTER_SELECT_STYLE}>
            <option value="vse">{filterClass === "vse" ? "Všichni žáci" : "Všichni žáci třídy"}</option>
            {studentsOfClass.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
          </select>

          <select value={filterGoalId} onChange={e => setFilterGoalId(e.target.value)} style={{ ...FILTER_SELECT_STYLE, flex: "1 1 220px", minWidth: 0 }}>
            <option value="vse">Všechny vyučovací hodiny</option>
            {allGoals.map(g => {
              const num = goalNums.get(g.id);
              const prefix = num ? `Hodina ${num} · ` : "";
              const label = prefix + (g.text.length > 52 ? g.text.slice(0, 50) + "…" : g.text);
              return <option key={g.id} value={g.id}>{label}</option>;
            })}
          </select>

          <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} style={FILTER_SELECT_STYLE}>
            {PERIOD_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
          </select>

          {filterPeriod === "vlastni" && (
            <>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} style={{ ...FILTER_SELECT_STYLE, paddingRight: 12, backgroundImage: "none" }} title="Od" />
              <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182" }}>–</span>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} style={{ ...FILTER_SELECT_STYLE, paddingRight: 12, backgroundImage: "none" }} title="Do" />
            </>
          )}

          {activeFilters > 0 && (
            <button
              onClick={resetFilters}
              style={{
                padding: "7px 14px", borderRadius: 8, border: "1.5px solid rgba(220,38,38,0.3)",
                background: "rgba(254,226,226,0.5)", cursor: "pointer",
                fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#dc2626", whiteSpace: "nowrap",
              }}
            >
              Zrušit ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {studentRecords.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.09)", padding: "28px 24px", fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182" }}>
          Zatím žádné důkazy nebyly zaznamenány.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {studentRecords.map(r => <EvidenceRecordCard key={r.id} r={r} goalNums={goalNums} hideStudent onEdit={() => setEditRecord(r)} onDelete={() => setDeleteRecord(r)} />)}
        </div>
      )}

      {addOpen && <AddEvidenceModal student={student} className={className} onClose={() => setAddOpen(false)} />}
      {preset && <AddEvidenceModal student={student} className={className} preset={preset} onClose={() => setPreset(null)} />}
      {deleteRecord && (
        <DeleteEvidenceModal
          record={deleteRecord}
          onClose={() => setDeleteRecord(null)}
          onConfirm={() => { removeEvidenceRecord(deleteRecord.id); setDeleteRecord(null); }}
        />
      )}
      {editRecord && <AddEvidenceModal student={student} className={className} record={editRecord} onClose={() => setEditRecord(null)} />}
    </div>
  );
}

// Ilustrovaná profilovka — v prototypu kreslená, ne skutečná fotka.
function PersonAvatar({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" style={{ display: "block", borderRadius: "50%" }}>
      <circle cx="32" cy="32" r="32" fill="#e8ddf5" />
      {/* krk spojuje hlavu s rameny */}
      <path d="M26 36h12v12H26z" fill="#e8bfa4" />
      {/* ramena */}
      <path d="M11 62c1.2-9.6 9.4-15.4 21-15.4S51.8 52.4 53 62z" fill="#7c4dbd" />
      {/* límec */}
      <path d="M26 44.6c1.6 2.6 3.6 3.9 6 3.9s4.4-1.3 6-3.9l3.4 1.6c-2.4 3.7-5.6 5.6-9.4 5.6s-7-1.9-9.4-5.6z" fill="#f2ecfa" />
      {/* hlava */}
      <ellipse cx="32" cy="27" rx="12.6" ry="14" fill="#f3d9c6" />
      {/* uši */}
      <circle cx="19.6" cy="28" r="2.4" fill="#e8bfa4" />
      <circle cx="44.4" cy="28" r="2.4" fill="#e8bfa4" />
      {/* vlasy */}
      <path d="M32 11c7.4 0 12.6 5 12.6 12.4 0 1.6-.2 3-.5 4.2-.5-3.6-1.5-6-3-7.4-3 1.8-7.6 2.6-12.7 1.7-2.7-.5-4.6.4-5.7 2.4-.9 1.6-1.4 2.4-1.8 3.9-.4-1.4-.5-3-.5-4.8C19.4 16 24.6 11 32 11z" fill="#4a3555" />
      {/* oči a úsměv */}
      <circle cx="27.4" cy="27.4" r="1.5" fill="#4a3555" />
      <circle cx="36.6" cy="27.4" r="1.5" fill="#4a3555" />
      <path d="M28.4 33.2c1 1.1 2.2 1.7 3.6 1.7s2.6-.6 3.6-1.7" stroke="#b9866a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Nastavení učitele — jméno, škola a úrovně hodnocení pro celou aplikaci.
function ProfilView() {
  const {
    schoolLevelId, setSchoolLevelId, schoolCustomLevels, setSchoolCustomLevels,
    teacherName, setTeacherName, schoolName,
  } = useContext(GoalsContext);
  const [editingLevels, setEditingLevels] = useState(false);
  const [confirmLevel, setConfirmLevel] = useState<string | null>(null);
  const opt = levelOptions.find(o => o.id === schoolLevelId) ?? levelOptions[1];

  const fieldStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 10,
    border: "1.5px solid rgba(0,0,0,0.13)", outline: "none",
    fontFamily: "'Inter:Regular', sans-serif", fontSize: 13.5, color: "#0a0a0a",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500,
    fontSize: 12, color: "#717182", marginBottom: 6,
  };

  return (
    <div style={{ padding: "32px 40px" }}>
      <Breadcrumb crumbs={[{ label: "Formativní hodnocení" }, { label: "Nastavení" }]} />

      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 22, lineHeight: "40px", color: "#0a0a0a", margin: 0 }}>
          Nastavení
        </h1>
      </div>

      <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 28 }}>
        <section style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.09)", padding: "20px 22px", display: "flex", gap: 28, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ display: "block" }}>
              <span style={labelStyle}>Jméno</span>
              <input value={teacherName} onChange={e => setTeacherName(e.target.value)} style={fieldStyle} />
            </label>
            <div>
              <span style={labelStyle}>Škola</span>
              <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13.5, color: "#0a0a0a", margin: "0 0 4px" }}>
                {schoolName}
              </p>
              <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#8a8a99", margin: 0, lineHeight: 1.5 }}>
                Školu nastavuje správce účtu, sami ji nepřepíšete.
              </p>
            </div>
          </div>

          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <PersonAvatar size={92} />
            <button style={{ ...btnStyle("ghost"), fontSize: 12, padding: "6px 12px" }}>
              Změnit fotku
            </button>
          </div>
        </section>

        <section>
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#717182", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 6px", display: "flex", alignItems: "center" }}>
            Úrovně hodnocení školy
            <InfoHint text="Úrovně popisují, jak daleko na cestě k cíli žák je. Vyberte metodiku, kterou používá vaše škola, nebo si napište vlastní stupnici." />
          </p>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182", lineHeight: 1.6, margin: "0 0 14px" }}>
            Tahle stupnice platí pro celou aplikaci — pro všechny vyučovací hodiny i pro sběr důkazů o učení.
          </p>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12.5, color: "#8a6a1f", background: "#fffbeb", border: "1px solid rgba(180,83,9,0.22)", borderRadius: 10, padding: "10px 13px", lineHeight: 1.55, margin: "0 0 16px" }}>
            Nastavte ji na začátku roku. Pozdější změna se zpětně nepropíše — už odučené hodiny a zaznamenané důkazy zůstanou na staré škále.
          </p>

          {editingLevels ? (
            <LevelPicker
              current={schoolLevelId}
              onDone={id => { if (id === schoolLevelId) { setEditingLevels(false); } else { setConfirmLevel(id); } }}
              onSaveCustom={setSchoolCustomLevels}
              savedCustomLevels={schoolCustomLevels}
            />
          ) : schoolLevelId === "vlastní" ? (
            <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a" }}>Vlastní úrovně</span>
                <button onClick={() => setEditingLevels(true)} style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <IconEdit />Upravit
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {schoolCustomLevels.map((lv, i) => (
                  <div key={lv.id} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ flexShrink: 0, padding: "2px 10px", borderRadius: 20, background: "rgba(236,236,240,0.7)", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12, color: "#0a0a0a", whiteSpace: "nowrap" }}>
                      {lv.name || `Úroveň ${i + 1}`}
                    </span>
                    {lv.desc && <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182", lineHeight: 1.5 }}>{lv.desc}</span>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ flexShrink: 0, width: 16, height: 16, borderRadius: "50%", marginTop: 2, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />
                </span>
                <span>
                  <span style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a", marginBottom: 4 }}>{opt.name}</span>
                  <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182", lineHeight: 1.55 }}>{opt.desc}</span>
                </span>
              </div>
              <button onClick={() => setEditingLevels(true)} style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <IconEdit />Změnit
              </button>
            </div>
          )}
        </section>
      </div>

      {confirmLevel && (
        <Modal title="Opravdu změnit úrovně hodnocení?" onClose={() => setConfirmLevel(null)} width={460}>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13.5, color: "#717182", lineHeight: 1.65, margin: "0 0 10px" }}>
            Nová stupnice se použije u vyučovacích hodin, které teprve vzniknou.
          </p>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13.5, color: "#991b1b", lineHeight: 1.65, margin: 0 }}>
            Už odučené hodiny a zaznamenané důkazy zůstanou na staré škále — zpětně je přepsat nejde.
          </p>
          <ModalActions
            onCancel={() => setConfirmLevel(null)}
            onConfirm={() => { setSchoolLevelId(confirmLevel); setConfirmLevel(null); setEditingLevels(false); }}
            confirmLabel="Změnit úrovně"
            danger
          />
        </Modal>
      )}
    </div>
  );
}

function NapadyView() {
  const { tpGoals, lessonsDone } = useContext(GoalsContext);
  const { evidenceRecords, addEvidenceRecords, addStudentEvidence } = useContext(EvidenceContext);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  // Otázka = žák × kritérium bez zaznamenané úrovně, jen u odučených hodin.
  // Dávka je krátká schválně — ptát se na všechno najednou nemá smysl.
  const BATCH = 12;
  const pending = tpGoals
    .filter(g => lessonsDone[g.id] || evidenceRecords.some(r => r.goalId === g.id))
    .flatMap(g => {
      const students = initialClasses.find(c => c.name === g.trida)?.students ?? [];
      return g.criteria.flatMap(c => students.map(st => ({
        key: `${g.id}|${c.label}|${st.id}`,
        goal: g, criterion: c.label, student: st,
      })));
    })
    .filter(q => !evidenceRecords.some(r =>
      r.studentId === q.student.id && r.goalId === q.goal.id && r.criterion === q.criterion && r.level));

  const open = pending.filter(q => !skipped.has(q.key)).slice(0, BATCH - answered.size);
  const current = open[0] ?? null;
  const total = Math.min(BATCH, pending.length + answered.size);
  const rest = Math.max(0, pending.length - open.length);

  function answer(level: string) {
    if (!current) return;
    addEvidenceRecords([{
      id: "ev" + Date.now(),
      studentId: current.student.id,
      studentName: `${current.student.lastName}, ${current.student.firstName}`,
      className: current.goal.trida,
      type: "photo",
      goalId: current.goal.id,
      goalText: current.goal.text,
      subject: current.goal.subject,
      date: new Date().toISOString().slice(0, 10),
      criterion: current.criterion,
      level,
    }]);
    addStudentEvidence(current.student.id, "photo");
    setAnswered(prev => new Set(prev).add(current.key));
  }

  return (
    <div style={{ padding: "32px 40px" }}>
      <Breadcrumb crumbs={[{ label: "Formativní hodnocení" }, { label: "Nápady" }]} />

      <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 22, lineHeight: "40px", color: "#0a0a0a", margin: 0, display: "flex", alignItems: "center" }}>
          Nápady
          <PageHelp
            text="Buddy se ptá na to, co mu chybí, aby uměl navrhnout hodnocení. Každá odpověď je rovnou důkaz o učení."
            buddy="Nápady"
          />
        </h1>
      </div>

      <div style={{ maxWidth: 640 }}>
        {!current ? (
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.09)", padding: "28px 24px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a", margin: "0 0 6px" }}>
              {total === 0 ? "Zatím se není na co ptát" : "Hotovo, nic dalšího nechybí"}
            </p>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182", margin: 0, lineHeight: 1.6 }}>
              {total === 0
                ? "Vytvořte tématický plán, vygenerujte z něj vyučovací hodiny a označte je jako probrané — Buddy se pak začne ptát."
                : rest > 0
                  ? `Dnešní dávku máte za sebou. Dalších ${rest} otázek počká na příště.`
                  : "U odučených hodin máte zaznamenané úrovně. Můžete jít generovat hodnocení."}
            </p>
            {skipped.size > 0 && (
              <button onClick={() => setSkipped(new Set())} style={{ ...btnStyle("ghost"), marginTop: 16 }}>
                Vrátit přeskočené ({skipped.size})
              </button>
            )}
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.09)", padding: "20px 22px" }}>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#7c4dbd", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
              Dnešní dávka · otázka {answered.size + 1} z {total}
            </p>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 17, color: "#0a0a0a", margin: "0 0 10px", lineHeight: 1.45 }}>
              Na jaké úrovni je <strong style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500 }}>{current.student.firstName}</strong> v kritériu „{current.criterion}"?
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
              <SubjectChip subject={current.goal.subject} />
              <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 11.5, color: "#8a8a99" }}>
                {current.goal.trida} · {current.goal.text}
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {SHEET_LEVELS.map(lv => {
                const c = SHEET_LEVEL_STYLE[lv];
                return (
                  <button
                    key={lv}
                    onClick={() => answer(lv)}
                    style={{
                      flex: 1, padding: "11px 12px", borderRadius: 10, cursor: "pointer",
                      border: `1.5px solid ${c.border}`, background: "#fff", color: c.fg,
                      fontFamily: "'Inter:Regular', sans-serif", fontSize: 13.5,
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = c.bg)}
                    onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                  >
                    {lv}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => setSkipped(prev => new Set(prev).add(current.key))}
                style={{ border: "none", background: "none", color: "#8a8a99", fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, cursor: "pointer", padding: 0 }}
              >
                Přeskočit
              </button>
              <span style={{ flexGrow: 1, height: 5, borderRadius: 3, background: "rgba(0,0,0,0.07)", overflow: "hidden", display: "block" }}>
                <span style={{ display: "block", height: "100%", width: `${total ? (answered.size / total) * 100 : 0}%`, background: "#7c3aed", transition: "width 0.25s" }} />
              </span>
              <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 11.5, color: "#8a8a99", whiteSpace: "nowrap" }}>
                {open.length} zbývá{rest > 0 ? ` · ${rest} na příště` : ""}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ClassesView() {
  const { evidenceRecords } = useContext(EvidenceContext);
  const { tpGoals, lessonsDone } = useContext(GoalsContext);
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
          <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 22, lineHeight: "40px", color: "#0a0a0a", margin: 0, display: "flex", alignItems: "center" }}>
            Třídy
            <PageHelp
              text="Třídy a žáci, u kterých sbíráte důkazy o učení. V detailu třídy uvidíte, kdo je připravený na hodnocení a komu ještě důkazy chybí."
              buddy="Třídy"
            />
          </h1>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
                  fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#0a0a0a",
                  background: "#fff", width: 200, outline: "none",
                }}
              />
            </div>
            <button
              onClick={() => { setClassNameInput(""); setAddClassOpen(true); }}
              style={{ ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 6 }}
            >
              <IconPlus />
              Přidat třídu
            </button>
          </div>
        </div>

        {/* list */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.09)", overflow: "hidden" }}>
          {filtered.length === 0 && (
            <p style={{ padding: "24px 20px", fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182" }}>
              Žádná třída nebyla nalezena.
            </p>
          )}
          {filtered.map((cls, i) => (
            <button
              key={cls.id}
              onClick={() => { setSelectedClassId(cls.id); setStudentSearch(""); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "14px 20px", background: "transparent", border: "none",
                borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.07)",
                cursor: "pointer", textAlign: "left",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(236,236,240,0.35)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: "rgba(236,236,240,0.7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a",
                }}>
                  {cls.name}
                </div>
                <div>
                  <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, color: "#0a0a0a", margin: 0 }}>
                    Třída {cls.name}
                  </p>
                  <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182", margin: "2px 0 0" }}>
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
              <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12, color: "#717182", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 10px" }}>
                Nahrát ze školního systému
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                      padding: "7px 14px", borderRadius: 8,
                      border: `1.5px solid ${sys.color}22`,
                      background: `${sys.color}0d`,
                      fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13,
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
              <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12, color: "#717182", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 10px" }}>
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
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6.667" stroke="#16a34a" strokeWidth="1.33"/>
                      <path d="M5.333 8l1.667 1.667L10.667 6" stroke="#16a34a" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#16a34a" }}>
                      {addClassDropped}
                    </span>
                    <button
                      onClick={() => setAddClassDropped(null)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#717182", fontSize: 14, padding: 0, lineHeight: 1 }}
                    >×</button>
                  </div>
                ) : (
                  <>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 10px", display: "block", color: "#b0b0be" }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#3a3a4a", margin: "0 0 4px" }}>
                      Přetáhněte screenshot nebo PDF se seznamem žáků
                    </p>
                    <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182", margin: 0, lineHeight: 1.5 }}>
                      Buddy automaticky rozpozná jména žáků z libovolného formátu nebo systému
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
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
        <button
          onClick={() => setSelectedClassId(null)}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4, borderRadius: 8 }}
          title="Zpět"
        >
          <IconBack />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 22, color: "#0a0a0a", margin: "0 0 1px" }}>
            Třída {selectedClass.name}
          </h1>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182", margin: 0 }}>
            {selectedClass.students.length} {studentCountLabel(selectedClass.students.length)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
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
                fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#0a0a0a",
                background: "#fff", width: 190, outline: "none",
              }}
            />
          </div>
          <button
            onClick={() => { setStudentFirstName(""); setStudentLastName(""); setAddStudentOpen(true); }}
            style={{ ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 6 }}
          >
            <IconPlus />
            Přidat žáka
          </button>
        </div>
      </div>

      {/* student list */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.09)", overflow: "hidden" }}>
        {filteredStudents.length === 0 && (
          <p style={{ padding: "24px 20px", fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182" }}>
            Žádný žák nebyl nalezen.
          </p>
        )}
        {filteredStudents.map((student, i) => (
          <div
            key={student.id}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "11px 20px",
              borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.07)",
            }}
          >
            <button
              onClick={() => setSelectedStudentId(student.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12, flex: 1,
                background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0,
              }}
              onMouseEnter={(e) => ((e.currentTarget.querySelector("span:last-child") as HTMLElement).style.color = "#555")}
              onMouseLeave={(e) => ((e.currentTarget.querySelector("span:last-child") as HTMLElement).style.color = "#0a0a0a")}
            >
              <div style={{
                width: 30, height: 30, borderRadius: "50%", background: avatarColor(student.lastName),
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#fff", flexShrink: 0,
              }}>
                {student.firstName[0]}{student.lastName[0]}
              </div>
              <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#0a0a0a", transition: "color 0.12s" }}>
                {student.lastName}, {student.firstName}
              </span>
              {(() => {
                // počty podle skutečných záznamů, ve stejných ikonách jako v detailu žáka
                const recs = evidenceRecords.filter(r => r.studentId === student.id);
                if (recs.length === 0) return null;
                const counts = { uroven: 0, foto: 0, audio: 0, poznamka: 0 } as Record<EvidenceKind, number>;
                recs.forEach(r => { counts[evidenceKind(r)]++; });
                return (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
                    {(Object.keys(EVIDENCE_KINDS) as EvidenceKind[]).filter(k => counts[k] > 0).map(k => {
                      const cfg = EVIDENCE_KINDS[k];
                      return (
                        <span key={k} title={`${cfg.label}: ${counts[k]}`} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{
                            width: 18, height: 18, borderRadius: 5, background: cfg.bg, color: cfg.color,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <EvidenceKindIcon kind={k} size={11} />
                          </span>
                          <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#5c5c6b" }}>
                            {counts[k]}
                          </span>
                        </span>
                      );
                    })}
                  </span>
                );
              })()}
            </button>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => openEditStudent(student)}
                title="Upravit"
                style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: 8, display: "flex", opacity: 0.6 }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
              >
                <IconEdit />
              </button>
              <button
                onClick={() => openDeleteStudent(student)}
                title="Odstranit"
                style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: 8, display: "flex", opacity: 0.5 }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d={ICON_TRASH} stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* semafor připravenosti k hodnocení */}
      {(() => {
        // počítají se jen hodiny, které už se odučily — jinde ještě není co sbírat
        const taught = tpGoals
          .filter(g => g.trida === selectedClass.name)
          .filter(g => lessonsDone[g.id] || evidenceRecords.some(r => r.goalId === g.id))
          .map(g => g.id);
        const bucket = (st: Student) => {
          const recs = evidenceRecords.filter(r => r.studentId === st.id);
          if (taught.length === 0) return recs.length >= 6 ? 2 : recs.length >= 2 ? 1 : 0;
          const covered = taught.filter(gid => recs.some(r => r.goalId === gid && r.level)).length;
          const share = covered / taught.length;
          return share >= 0.9 ? 2 : share >= 0.4 ? 1 : 0;
        };
        const groups: Student[][] = [[], [], []];
        selectedClass.students.forEach(st => groups[bucket(st)].push(st));
        const cols = [
          { i: 0, title: "Žádné nebo málo důkazů", color: "#dc2626", bg: "#fef2f2", border: "rgba(220,38,38,0.25)" },
          { i: 1, title: "Ještě potřeba pár důkazů", color: "#b45309", bg: "#fffbeb", border: "rgba(180,83,9,0.25)" },
          { i: 2, title: "Připravení k hodnocení", color: "#15803d", bg: "#f0fdf4", border: "rgba(21,128,61,0.25)" },
        ];
        return (
          <div style={{ marginTop: 28 }}>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#717182", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 6px", display: "flex", alignItems: "center" }}>
              Připravenost k hodnocení
              <InfoHint text="Počítá se z odučených hodin — u kolika z nich má žák zaznamenanou úroveň. Klepnutím na jméno se dostanete k jeho důkazům." />
            </p>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182", lineHeight: 1.6, margin: "0 0 14px" }}>
              U koho už jde vygenerovat hodnocení a u koho ještě chybí důkazy o učení.
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              {cols.map(c => (
                <div key={c.i} style={{ flex: 1, minWidth: 0, background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0, display: "block" }} />
                    <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12.5, color: "#0a0a0a" }}>{c.title}</span>
                    <span style={{ marginLeft: "auto", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12, color: c.color }}>{groups[c.i].length}</span>
                  </div>
                  {groups[c.i].length === 0 ? (
                    <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#8a8a99", margin: 0 }}>Nikdo</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {groups[c.i].map(st => (
                        <button
                          key={st.id}
                          onClick={() => setSelectedStudentId(st.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
                            padding: "5px 7px", borderRadius: 8, border: "none", background: "transparent",
                            cursor: "pointer", transition: "background 0.12s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.75)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <span style={{
                            width: 20, height: 20, borderRadius: "50%", flexShrink: 0, background: avatarColor(st.lastName),
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 9, color: "#fff",
                          }}>
                            {st.firstName[0]}{st.lastName[0]}
                          </span>
                          <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#0a0a0a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {st.lastName}, {st.firstName}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

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
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", margin: "0 0 4px" }}>
            Opravdu chcete odstranit třídu <strong style={{ color: "#0a0a0a" }}>{selectedClass.name}</strong>?
          </p>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#dc2626", margin: 0 }}>
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
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", margin: "0 0 4px" }}>
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
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px 10px 16px", borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.07)" }}>
      <input
        value={c.name}
        onChange={e => updateItem(c.id, "name", e.target.value)}
        style={{
          flexShrink: 0, width: 118, boxSizing: "border-box",
          fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a",
          background: "rgba(236,236,240,0.5)", border: "1px solid rgba(0,0,0,0.09)",
          borderRadius: 20, outline: "none", padding: "5px 12px",
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
          fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#0a0a0a",
          background: "transparent", border: "none", borderRadius: 6, outline: "none",
          padding: "5px 6px", margin: "0 -6px", transition: "background 0.12s", cursor: "text",
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
          <path d={ICON_TRASH} stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
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
        style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}
      >
        <IconPlus />
        Přidat úroveň
      </button>
    </>
  );
}

function LevelPicker({ onDone, onSaveCustom, savedCustomLevels, current }: { onDone: (id: string) => void; onSaveCustom?: (levels: CustomLevel[]) => void; savedCustomLevels?: CustomLevel[]; current?: string }) {
  const [selected, setSelected] = useState<string>(current ?? "vysvědčení");
  const [customMode, setCustomMode] = useState(false);
  const [draftItems, setDraftItems] = useState<CustomLevel[]>(savedCustomLevels ?? defaultCustomLevels);

  if (customMode) {
    return (
      <div>
        <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182", margin: "0 0 14px", lineHeight: 1.5 }}>
          Upravte názvy a popisy úrovní podle svých potřeb. Úrovně jsou seřazeny od nejnižší po nejvyšší.
        </p>
        <CustomLevelList animateIn initial={draftItems} onItemsChange={setDraftItems} />
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={() => { onSaveCustom?.(draftItems); onDone("vlastní"); setCustomMode(false); }} style={btnStyle("primary")}>Uložit vlastní úrovně</button>
          <button onClick={() => setCustomMode(false)} style={btnStyle("ghost")}>Zpět</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {levelOptions.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              style={{
                background: "#fff",
                border: isSelected ? "1.5px solid #0a0a0a" : "1.5px solid rgba(0,0,0,0.12)",
                borderRadius: 14, padding: "14px 16px", textAlign: "left",
                cursor: "pointer", transition: "border-color 0.15s",
                display: "flex", alignItems: "flex-start", gap: 12,
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
                <span style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a", marginBottom: 4 }}>
                  {opt.name}
                </span>
                <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182", lineHeight: 1.55 }}>
                  {opt.desc}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onDone(selected)} style={btnStyle("primary")}>Uložit výběr</button>
        <button onClick={() => setCustomMode(true)} style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 6 }}>
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

function PrintModal({ onClose, students, goal, onPrinted }: {
  onClose: () => void;
  students: Student[];
  goal: string;
  onPrinted?: () => void;
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
        <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, color: "#fff" }}>
          Náhled před tiskem
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => onPrinted?.()} style={{ ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 6 }}>
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
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#717182", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>
            Tabulka hodnocení · Čeština · 3.A
          </p>
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a", margin: 0, lineHeight: 1.4 }}>
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
                  padding: "8px 10px", borderBottom: "2px solid #0a0a0a", borderRight: "1px solid rgba(0,0,0,0.1)",
                  fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#717182",
                  textAlign: "left", background: "#fafafa",
                }}>
                  Žák / Žákyně
                </th>
                {observationCriteria.map((c) => (
                  <th key={c.short} style={{
                    padding: "8px 6px", borderBottom: "2px solid #0a0a0a", borderRight: "1px solid rgba(0,0,0,0.1)",
                    fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#0a0a0a",
                    textAlign: "center", background: "#fafafa", lineHeight: 1.3,
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
                    padding: "9px 10px", borderBottom: "1px solid rgba(0,0,0,0.07)", borderRight: "1px solid rgba(0,0,0,0.1)",
                    fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#0a0a0a",
                  }}>
                    {student.lastName}, {student.firstName}
                  </td>
                  {observationCriteria.map((c) => (
                    <td key={c.short} style={{
                      padding: "9px 6px", borderBottom: "1px solid rgba(0,0,0,0.07)", borderRight: "1px solid rgba(0,0,0,0.1)",
                      textAlign: "center", fontSize: 13, color: "#0a0a0a",
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
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 10, color: "#717182", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
            Legenda úrovní hodnocení
          </p>
          <div style={{ display: "flex", gap: 24 }}>
            {levelLegend.map((l) => (
              <div key={l.letter} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{
                  flexShrink: 0, width: 24, height: 24, borderRadius: 6,
                  background: l.bg, color: l.color,
                  fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${l.color}33`,
                }}>
                  {l.letter}
                </span>
                <div>
                  <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#0a0a0a", margin: "0 0 1px" }}>
                    {l.label}
                  </p>
                  <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 11, color: "#717182", margin: 0, lineHeight: 1.4 }}>
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
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 16 }}>
          <div>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#717182", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>
              Důkazy o učení · Tabulka hodnocení
            </p>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a", margin: 0, lineHeight: 1.4 }}>
              {goal}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* audio */}
            <button
              onClick={() => addEvidence("audio")}
              title={anyChecked ? "Přidat audio nahrávku označeným žákům" : "Nejdřív zaškrtněte žáky"}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 13px", borderRadius: 8, border: "1.5px solid rgba(0,0,0,0.12)",
                cursor: anyChecked ? "pointer" : "default",
                background: anyChecked ? "#f3f0ff" : "#fafafa",
                color: anyChecked ? "#7c3aed" : "#b0b0be",
                fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13,
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
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 13px", borderRadius: 8, border: "1.5px solid rgba(0,0,0,0.12)",
                cursor: anyChecked ? "pointer" : "default",
                background: anyChecked ? "#ecfeff" : "#fafafa",
                color: anyChecked ? "#0891b2" : "#b0b0be",
                fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13,
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
                    fontFamily: "'Inter:Medium', sans-serif", fontWeight: 600, fontSize: 14,
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
                <th style={{ padding: "8px 8px", borderBottom: "2px solid #0a0a0a", background: "#fafafa", textAlign: "center", verticalAlign: "middle" }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = someChecked; }}
                    onChange={toggleAll}
                    title={allChecked ? "Odznačit vše" : "Označit vše"}
                    style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#0a0a0a" }}
                  />
                </th>
                <th style={{ padding: "8px 10px", borderBottom: "2px solid #0a0a0a", borderRight: "1px solid rgba(0,0,0,0.1)", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#717182", textAlign: "left", background: "#fafafa" }}>
                  Žák / Žákyně
                </th>
                {observationCriteria.map(c => {
                  const colChecked = checkedCriteria.has(c.short);
                  return (
                    <th key={c.short} style={{ padding: "6px 6px 8px", borderBottom: "2px solid #0a0a0a", borderRight: "1px solid rgba(0,0,0,0.1)", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: colChecked ? "#0a0a0a" : "#717182", textAlign: "center", background: colChecked ? "rgba(10,10,10,0.04)" : "#fafafa", lineHeight: 1.3, cursor: "pointer", transition: "background 0.12s, color 0.12s" }} onClick={() => toggleCriterion(c.short)}>
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
                <th style={{ padding: "8px 6px", borderBottom: "2px solid #0a0a0a", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#717182", textAlign: "center", background: "#fafafa" }}>
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
                      style={{ padding: "9px 8px", borderBottom: "1px solid rgba(0,0,0,0.07)", textAlign: "center", verticalAlign: "middle", cursor: "pointer" }}
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
                    <td style={{ padding: "9px 10px", borderBottom: "1px solid rgba(0,0,0,0.07)", borderRight: "1px solid rgba(0,0,0,0.1)", verticalAlign: "middle", fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#0a0a0a" }}>
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
                            fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13,
                            transition: "background 0.12s, color 0.12s",
                            ...ls,
                          }}>
                            {level ?? ""}
                          </span>
                        </td>
                      );
                    })}
                    {/* evidence summary */}
                    <td style={{ padding: "9px 6px", borderBottom: "1px solid rgba(0,0,0,0.07)", textAlign: "center", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                        {ev.audio > 0 && (
                          <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#7c3aed", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11 }}>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                              <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M2.667 8A5.333 5.333 0 0 0 8 13.333 5.333 5.333 0 0 0 13.333 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              <path d="M8 13.333V15.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            {ev.audio}
                          </span>
                        )}
                        {ev.photo > 0 && (
                          <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#0891b2", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11 }}>
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
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 10, color: "#717182", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
              Legenda úrovní hodnocení
            </p>
            <div style={{ display: "flex", gap: 20 }}>
              {levelLegend.map(l => (
                <div key={l.letter} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 6, background: l.bg, color: l.color, fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${l.color}33` }}>
                    {l.letter}
                  </span>
                  <div>
                    <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#0a0a0a", margin: "0 0 1px" }}>{l.label}</p>
                    <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 11, color: "#717182", margin: 0, lineHeight: 1.4 }}>{l.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#717182", fontFamily: "'Inter:Regular', sans-serif", lineHeight: 1.5, maxWidth: 260 }}>
            <strong style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, color: "#0a0a0a" }}>Tip:</strong> Klikněte do pole pro přiřazení úrovně. Zaškrtněte žáky a klikněte na ikonu nahoře pro přidání důkazu o učení.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── camera modal ─────────────────────────────────────────────────────────────

function CameraModal({ onClose, onUploaded }: { onClose: () => void; onUploaded?: () => void }) {
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
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #333", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} />
              <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182", margin: 0 }}>
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
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, color: "#fff", margin: "0 0 4px", textAlign: "center" }}>
              Ukažte tabulku hodnocení do kamery
            </p>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.7)", margin: 0, textAlign: "center" }}>
              Přidržte arch rovně, aby byl celý viditelný
            </p>
          </div>
        </div>

        {/* body */}
        <div style={{ padding: "20px 24px 24px" }}>
          {/* privacy notice */}
          <div style={{
            display: "flex", gap: 10, alignItems: "flex-start",
            background: "rgba(236,236,240,0.5)", borderRadius: 10, padding: "10px 14px", marginBottom: 0,
          }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="8" cy="8" r="6.667" stroke="#717182" strokeWidth="1.2" />
              <path d="M8 7.333V11M8 5.333v.334" stroke="#717182" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182", margin: 0, lineHeight: 1.55 }}>
              <strong style={{ color: "#0a0a0a" }}>Fotografie se neukládá.</strong> Snímek slouží pouze k rozpoznání textu z tabulky hodnocení. Data nejsou sdílena ani archivována.
            </p>
          </div>

          {/* fallback */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182", margin: "0 0 10px", textAlign: "center" }}>
              Nejde to?
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...btnStyle("ghost"), flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="2" width="14" height="20" rx="2" stroke="#0a0a0a" strokeWidth="1.5" />
                  <path d="M12 18h.01" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Skenovat na mobilu
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ ...btnStyle("ghost"), flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Nahrát fotografii
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => { if (e.target.files && e.target.files.length) onUploaded?.(); }} />
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
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "11px 14px 11px 18px", borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.07)" }}>
      <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 7, background: "rgba(236,236,240,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#717182", marginTop: 6 }}>
        {i + 1}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <input
          value={c.label}
          onChange={e => updateItem(c.id, "label", e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a", background: "transparent", border: "none", borderRadius: 6, outline: "none", padding: "2px 6px", margin: "0 0 2px -6px", transition: "background 0.12s", cursor: "text" }}
          onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = inputBg; }}
          onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = "transparent"; }}
          onFocus={e => (e.currentTarget.style.background = inputBg)}
          onBlur={e => (e.currentTarget.style.background = "transparent")}
        />
        <input
          value={c.desc}
          onChange={e => updateItem(c.id, "desc", e.target.value)}
          placeholder="Popis..."
          style={{ width: "100%", boxSizing: "border-box", fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182", background: "transparent", border: "none", borderRadius: 6, outline: "none", padding: "2px 6px", margin: "0 -6px", transition: "background 0.12s", cursor: "text" }}
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
          <path d={ICON_TRASH} stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
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
        style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}
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

// Náhled toho, co z popisu vznikne — zjednodušená tabulka plánu.
function PlanPreviewIllustration() {
  const rows = [
    { cas: "Září", tema: "Stavba slova", cil: "Rozliším části slova", h: "2" },
    { cas: "", tema: "Hláskosloví", cil: "Správně vyslovuji hlásky", h: "1" },
    { cas: "Říjen", tema: "Slovní druhy", cil: "Rozliším slovní druhy", h: "1" },
    { cas: "", tema: "Podstatná jména", cil: "Určím rod, číslo a pád", h: "2" },
    { cas: "Listopad", tema: "Přídavná jména", cil: "Rozliším druhy přídavných jmen", h: "2" },
  ];
  const cell: React.CSSProperties = {
    padding: "8px 10px", borderBottom: "1px solid rgba(0,0,0,0.06)",
    fontFamily: "'Inter:Regular', sans-serif", fontSize: 11.5, color: "#3f3f4b",
    verticalAlign: "top", lineHeight: 1.4,
  };
  const head: React.CSSProperties = {
    padding: "9px 10px", textAlign: "left", background: "#fafafa",
    fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 9.5,
    color: "#8a8a99", textTransform: "uppercase", letterSpacing: "0.07em",
    borderBottom: "1px solid rgba(0,0,0,0.08)", whiteSpace: "nowrap",
  };
  return (
    <div style={{
      width: 360, borderRadius: 14, overflow: "hidden", background: "#fff",
      border: "1.5px solid rgba(0,0,0,0.09)", boxShadow: "0 8px 28px rgba(0,0,0,0.07)",
      transform: "rotate(-1.2deg)",
    }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M14 2.5H6.5A1.5 1.5 0 0 0 5 4v16a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 20V7.5L14 2.5z" stroke="#7c4dbd" strokeWidth="1.7" strokeLinejoin="round"/>
            <path d="M14 2.5V7.5h5" stroke="#7c4dbd" strokeWidth="1.7" strokeLinejoin="round"/>
          </svg>
        </span>
        <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a" }}>Čeština 3.A</span>
        <span style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 20, background: "rgba(236,236,240,0.9)", fontFamily: "'Inter:Regular', sans-serif", fontSize: 10, color: CHIP_FG }}>
          celý rok
        </span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={head}>Čas</th>
            <th style={head}>Cíl hodiny</th>
            <th style={head}>Téma</th>
            <th style={{ ...head, textAlign: "center" }}>Hod.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: r.cas ? "#fff" : "rgba(0,0,0,0.012)" }}>
              <td style={{ ...cell, fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, color: "#0a0a0a", whiteSpace: "nowrap", background: "#fafafa" }}>{r.cas}</td>
              <td style={cell}>{r.cil}</td>
              <td style={{ ...cell, color: "#717182" }}>{r.tema}</td>
              <td style={{ ...cell, textAlign: "center", color: "#717182" }}>{r.h}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Náhled vyučovací hodiny — co z jedné věty vznikne.
function LessonPreviewIllustration() {
  const criteria = [
    "Pozná kořen slova",
    "Rozliší předponu od kořene",
    "Použije správný tvar ve větě",
  ];
  return (
    <div style={{
      width: 340, borderRadius: 14, overflow: "hidden", background: "#fff",
      border: "1.5px solid rgba(0,0,0,0.09)", boxShadow: "0 8px 28px rgba(0,0,0,0.07)",
      transform: "rotate(1deg)", padding: "16px 18px",
    }}>
      <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 9.5, color: "#8a8a99", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>
        Výukový cíl
      </p>
      <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, color: "#0a0a0a", margin: "0 0 10px", lineHeight: 1.45 }}>
        Rozliším a správně pojmenuji části slova.
      </p>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 16 }}>
        {["Čeština", "3.A", "2 hodiny"].map(t => (
          <span key={t} style={{ padding: "3px 9px", borderRadius: 20, background: CHIP_BG, color: CHIP_FG, fontFamily: "'Inter:Regular', sans-serif", fontSize: 10.5 }}>{t}</span>
        ))}
      </div>
      <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 9.5, color: "#8a8a99", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>
        Kritéria hodnocení
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {criteria.map((c, i) => (
          <div key={c} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{
              width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
              background: "rgba(236,236,240,0.9)", color: CHIP_FG,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 10,
            }}>{i + 1}</span>
            <span style={{ flex: 1, fontFamily: "'Inter:Regular', sans-serif", fontSize: 11.5, color: "#3f3f4b" }}>{c}</span>
            <span style={{ display: "flex", gap: 3 }}>
              {(["Začínám", "Rozvíjím", "Zvládám"] as const).map((lv, j) => {
                const st = SHEET_LEVEL_STYLE[lv];
                const on = j === (i % 3);
                return (
                  <span key={lv} style={{
                    width: 16, height: 8, borderRadius: 4,
                    background: on ? st.bg : "rgba(0,0,0,0.05)",
                    border: `1px solid ${on ? st.border : "rgba(0,0,0,0.07)"}`,
                    display: "block",
                  }} />
                );
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


// Náhled hotového hodnocení — co ze zaznamenaných důkazů vznikne.
function AssessmentPreviewIllustration() {
  return (
    <div style={{
      width: 360, borderRadius: 14, background: "#fff", margin: "0 auto",
      border: "1.5px solid rgba(0,0,0,0.09)", boxShadow: "0 8px 28px rgba(0,0,0,0.07)",
      padding: "16px 18px", textAlign: "left",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
        <span style={{
          width: 28, height: 28, borderRadius: "50%", background: "#10b981", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#fff",
        }}>AB</span>
        <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a" }}>Beneš, Adam</span>
        <span style={{ marginLeft: "auto" }}><SubjectChip subject="Čeština" /></span>
      </div>
      <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 11.5, color: "#3f3f4b", lineHeight: 1.65, margin: 0 }}>
        Adam v tomto období udělal velký kus práce. Části slova už rozliší sám a bez nápovědy,
        u předpon si ještě občas není jistý. V diktátu si dvakrát sám našel a opravil chybu —
        to je velký posun. Doporučuji dál číst nahlas a povídat si o přečteném.
      </p>
      <div style={{ display: "flex", gap: 5, marginTop: 14, flexWrap: "wrap" }}>
        {(["Zvládám", "Rozvíjím", "Zvládám"] as const).map((lv, i) => {
          const c = EVIDENCE_LEVEL_COLORS[lv];
          return (
            <span key={i} style={{ padding: "2px 9px", borderRadius: 20, background: c.bg, color: c.color, fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 10.5 }}>
              {lv}
            </span>
          );
        })}
      </div>
    </div>
  );
}

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
        { label: "Nová hodina" },
      ]} />

      {/* hlavička stejná jako v detailu hodiny */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, marginBottom: 16 }}>
        <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 22, lineHeight: "40px", color: "#0a0a0a", margin: 0, display: "flex", alignItems: "center" }}>
          Vytvořit novou hodinu
          <InfoHint text="Buddy navrhl výukový cíl a kritéria. Projděte je, upravte, co nesedí, a hodinu uložte — pak už do ní můžete sbírat důkazy o učení." />
        </h1>
        <button
          onClick={() => {
            const className = initialClasses.find(c => c.id === classId)?.name ?? classId;
            onSave({ text: goalText, subject, className });
          }}
          style={{ ...btnStyle("primary"), flexShrink: 0, whiteSpace: "nowrap" }}
        >
          Uložit hodinu
        </button>
      </div>

      <FadeIn delay={100}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#717182", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px", display: "flex", alignItems: "center" }}>
            Výukový cíl
            <InfoHint text="Výukový cíl říká, co má žák na konci hodiny umět. Formuluje se z pohledu žáka, konkrétně a tak, aby šlo poznat, že ho zvládl." />
          </p>
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 17, color: "#0a0a0a", lineHeight: 1.45, margin: "0 0 12px" }}>
            {goalText}
          </p>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <ChipSelect
              title="Předmět"
              value={subject}
              options={subjectOptions}
              subjectStyled
              big
              onChange={setSubject}
            />
            <ChipSelect
              title="Třída"
              value={initialClasses.find(c => c.id === classId)?.name ?? classId}
              options={initialClasses.map(c => c.name)}
              big
              onChange={v => setClassId(initialClasses.find(c => c.name === v)?.id ?? classId)}
            />
          </div>
        </div>
      </FadeIn>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {/* criteria */}
        <FadeIn delay={500}>
          <section>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#717182", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 6px", display: "flex", alignItems: "center" }}>
              Kritéria hodnocení
              <InfoHint text="Kritéria jsou konkrétní pozorovatelné projevy, podle kterých poznáte, jak je žák na cestě k cíli daleko." />
            </p>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182", lineHeight: 1.6, margin: "0 0 16px" }}>
              Kritéria hodnocení určují, co konkrétně pozorujete za aktivity a chování, které se snažíte vyhodnotit.
            </p>
            <CriteriaList initial={generatedCriteria.map((c) => ({ id: String(c.n), label: c.label, desc: c.desc }))} animateIn />
          </section>
        </FadeIn>

        {/* levels */}
        <FadeIn delay={1900}>
          <section>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#717182", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 6px", display: "flex", alignItems: "center" }}>
              Úrovně hodnocení
              <InfoHint text="Úrovně popisují, jak daleko na cestě k cíli žák je — například začínám, rozvíjím, zvládám." />
            </p>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182", lineHeight: 1.6, margin: "0 0 16px" }}>
              Úrovně popisují, na jaké úrovni zvládnutí se žák na cestě k cíli nachází. Vyberte si z přednastavených úrovní hodnocení podle vytvořených metodik, nebo si nastavte vlastní.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {levelOptions.map((opt, i) => {
                const isSelected = selectedLevelId === opt.id;
                return (
                  <FadeIn key={opt.id} delay={2100 + i * 120}>
                    <button
                      onClick={() => setSelectedLevelId(isSelected ? null : opt.id)}
                      style={{ background: "#fff", border: isSelected ? "1.5px solid #0a0a0a" : "1.5px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12, width: "100%", textAlign: "left", cursor: "pointer", transition: "border-color 0.15s" }}
                    >
                      <span style={{ flexShrink: 0, width: 16, height: 16, borderRadius: "50%", marginTop: 2, background: isSelected ? "#0a0a0a" : "transparent", border: isSelected ? "none" : "1.5px solid rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}>
                        {isSelected && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />}
                      </span>
                      <span>
                        <span style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a", marginBottom: 4 }}>{opt.name}</span>
                        <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182", lineHeight: 1.55 }}>{opt.desc}</span>
                      </span>
                    </button>
                  </FadeIn>
                );
              })}
            </div>
          </section>
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

const initialGoals: Goal[] = [];

function buildGoalNumbers(tpGoals: TpGoal[]): Map<string, number> {
  const m = new Map<string, number>();
  let n = 1;
  for (const g of initialGoals) m.set(g.id, n++);
  for (const g of tpGoals) m.set(g.id, n++);
  return m;
}

// ─── datumy hodiny ────────────────────────────────────────────────────────────
// Hodina může mít víc datumů (probírá se ve víc vyučovacích hodinách).
// Uloženo jako pole; starý klíč s jedním datem se drží v souladu kvůli detailu.
function readLessonDates(goalId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`lesson-dates-${goalId}`);
    if (raw) { const a = JSON.parse(raw); return Array.isArray(a) ? a.filter(Boolean) : []; }
    const old = localStorage.getItem(`lesson-date-${goalId}`);
    return old ? [old] : [];
  } catch { return []; }
}
function writeLessonDates(goalId: string, dates: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`lesson-dates-${goalId}`, JSON.stringify(dates));
    if (dates[0]) localStorage.setItem(`lesson-date-${goalId}`, dates[0]);
    else localStorage.removeItem(`lesson-date-${goalId}`);
  } catch { /* soukromé okno, zablokované úložiště */ }
}
// Nativní kalendář otevřít hned, bez mezikroku
function openDatePicker(el: HTMLInputElement | null) {
  if (!el) return;
  const anyEl = el as any;
  if (typeof anyEl.showPicker === "function") {
    try { anyEl.showPicker(); return; } catch { /* showPicker může vyhodit mimo gesto */ }
  }
  el.focus();
  el.click();
}
const fmtDateShort = (d: string) => {
  if (!d) return "";
  const dt = new Date(d);
  const dow = dt.toLocaleDateString("cs-CZ", { weekday: "short" }).replace(".", "");
  return `${dow} ${dt.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" })}`;
};
const fmtDateLong = (d: string) => d ? new Date(d).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" }) : "";

const CAL_PATH = "M1.333 6.667h13.333M5.333 1.333v2.667M10.667 1.333v2.667";

function LessonDates({ goalId, big }: { goalId: string; big?: boolean }) {
  const [dates, setDates] = useState<string[]>(() => readLessonDates(goalId));

  useEffect(() => { setDates(readLessonDates(goalId)); }, [goalId]);

  const save = (next: string[]) => {
    const clean = Array.from(new Set(next.filter(Boolean))).sort();
    setDates(clean);
    writeLessonDates(goalId, clean);
  };

  // Nativní kalendář se ukotvuje k inputu, takže input musí mít skutečnou
  // velikost. Leží průhledně přes celý chip: klik kamkoli na chip otevře
  // kalendář nad ním.
  const overlay: React.CSSProperties = {
    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
    opacity: 0, border: "none", padding: 0, margin: 0, background: "transparent",
    cursor: "pointer", fontFamily: "inherit", fontSize: "inherit",
  };

  return (
    <>
      {dates.map((d, i) => (
        <span
          key={d}
          onClick={e => e.stopPropagation()}
          title={fmtDateLong(d)}
          style={{
            position: "relative",
            display: "inline-flex", alignItems: "center", gap: big ? 6 : 4,
            padding: big ? "6px 7px 6px 13px" : "3px 4px 3px 9px", borderRadius: 20,
            background: CHIP_BG, color: CHIP_FG, fontFamily: "'Inter:Regular', sans-serif", fontSize: big ? 13 : 11,
            transition: "box-shadow 0.12s",
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = "inset 0 0 0 1.5px rgba(0,0,0,0.13)")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
        >
          <span style={{ whiteSpace: "nowrap" }}>{fmtDateShort(d)}</span>
          <input
            type="date"
            value={d}
            aria-label={`Datum vyučovací hodiny ${fmtDateLong(d)}`}
            title="Změnit datum"
            onClick={e => { e.stopPropagation(); openDatePicker(e.currentTarget); }}
            onChange={e => save(dates.map((x, j) => j === i ? e.target.value : x))}
            style={overlay}
          />
          <button
            onClick={e => { e.stopPropagation(); save(dates.filter((_, j) => j !== i)); }}
            title="Odebrat datum"
            aria-label={`Odebrat datum ${fmtDateLong(d)}`}
            style={{
              position: "relative", zIndex: 1,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 16, height: 16, borderRadius: "50%", border: "none", background: "none",
              color: CHIP_FG, cursor: "pointer", padding: 0, opacity: 0.55,
              transition: "opacity 0.12s, color 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#c81e1e"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "0.55"; e.currentTarget.style.color = CHIP_FG; }}
          >
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </span>
      ))}

      <span
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          height: big ? 29 : 23, padding: big ? "0 13px" : "0 10px", borderRadius: 20,
          background: CHIP_BG, color: CHIP_FG, cursor: "pointer",
          transition: "box-shadow 0.12s",
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = "inset 0 0 0 1.5px rgba(0,0,0,0.13)")}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1.333" y="2.667" width="13.333" height="12" rx="1.333" stroke="currentColor" strokeWidth="1.4"/>
          <path d={CAL_PATH} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M8 9v2.667M6.667 10.333h2.666" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <input
          type="date"
          value=""
          aria-label={dates.length ? "Přidat další datum" : "Přidat datum"}
          title={dates.length ? "Přidat další datum" : "Přidat datum"}
          onClick={e => { e.stopPropagation(); openDatePicker(e.currentTarget); }}
          onChange={e => save([...dates, e.target.value])}
          style={overlay}
        />
      </span>
    </>
  );
}

type AnyGoal = { id: string; text: string; subject: string; cls: string; period: string; isTp: boolean };

const LESSON_MONTHS = ["Září", "Říjen", "Listopad", "Prosinec", "Leden", "Únor", "Březen", "Duben", "Květen", "Červen"];
// Školní rok na jednom místě; roky u měsíců se odvozují od něj.
const SCHOOL_YEAR_START = 2026;
const SCHOOL_YEAR_LABEL = `${SCHOOL_YEAR_START}/${SCHOOL_YEAR_START + 1}`;
const AUTUMN_MONTHS = ["Září", "Říjen", "Listopad", "Prosinec"];
const monthYear = (m: string) => String(AUTUMN_MONTHS.includes(m) ? SCHOOL_YEAR_START : SCHOOL_YEAR_START + 1);
const monthLabel = (m: string) => m ? `${m} ${monthYear(m)}` : "";

const CHIP_BG = "rgba(236,236,240,0.9)";
// #717182 na šedém chipu vychází pod 4.5:1 — pro text na chipu tmavší odstín
const CHIP_FG = "#5c5c6b";
const CHIP_CARET = `url("data:image/svg+xml,%3Csvg width='9' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23717182' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

// Chip, ve kterém se vybírá z možností
function ChipSelect({ value, options, onChange, title, labelFor, big, subjectStyled }: {
  value: string; options: string[]; onChange: (v: string) => void;
  title: string; labelFor?: (v: string) => string; big?: boolean; subjectStyled?: boolean;
}) {
  const sub = subjectStyled ? subjectStyle(value) : null;
  const opts = options.includes(value) || !value ? options : [value, ...options];
  const label = labelFor ? labelFor(value) : value;
  return (
    <span
      title={title}
      onClick={e => e.stopPropagation()}
      style={{
        display: "inline-flex", alignItems: "center", gap: sub ? (big ? 6 : 5) : 0,
        padding: big ? (sub ? "6px 8px 6px 11px" : "6px 8px 6px 13px") : (sub ? "3px 5px 3px 7px" : "3px 5px 3px 9px"),
        borderRadius: 20,
        background: sub ? sub.bg : CHIP_BG, color: sub ? sub.color : CHIP_FG,
        fontFamily: sub ? "'Inter:Medium', sans-serif" : "'Inter:Regular', sans-serif",
        fontWeight: sub ? 500 : 400,
        fontSize: big ? 13 : 11, transition: "box-shadow 0.12s",
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "inset 0 0 0 1.5px rgba(0,0,0,0.13)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
    >
      {sub && <SubjectIcon subject={value} size={big ? 14 : 12} />}
      {/* select je jinak široký podle nejdelší možnosti — leží průhledně
          nad viditelným textem, takže do výpočtu šířky nevstupuje */}
      <span style={{ position: "relative", display: "inline-block" }}>
        <span aria-hidden="true" style={{ display: "block", whiteSpace: "pre", paddingRight: 15 }}>
          {label}
        </span>
        <select
          value={value}
          aria-label={title}
          onChange={e => onChange(e.target.value)}
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            appearance: "none", WebkitAppearance: "none", background: "transparent", border: "none", outline: "none",
            fontFamily: "inherit", fontSize: "inherit", color: "transparent", cursor: "pointer",
            padding: 0, margin: 0,
            backgroundImage: CHIP_CARET, backgroundRepeat: "no-repeat", backgroundPosition: "right 1px center",
          }}
        >
          {opts.map(o => <option key={o} value={o}>{labelFor ? labelFor(o) : o}</option>)}
        </select>
      </span>
    </span>
  );
}

// Název hodiny — editovatelný na klik. Textarea, ne input: cíle jsou dlouhé věty
// a input by je usekl bez jakékoli indikace.
function EditableLessonTitle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, []);
  useEffect(resize);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [resize]);

  const bg = "rgba(236,236,240,0.6)";
  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      aria-label="Cíl vyučovací hodiny"
      onChange={e => onChange(e.target.value)}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      style={{
        width: "100%", display: "block", boxSizing: "border-box", resize: "none", overflow: "hidden",
        fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 17, lineHeight: 1.3,
        color: "#0a0a0a", background: "transparent", border: "none", borderRadius: 7, outline: "none",
        padding: "3px 7px", margin: "0 0 4px -7px", transition: "background 0.12s", cursor: "text",
        whiteSpace: "pre-wrap", wordBreak: "break-word",
      }}
      onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = bg; }}
      onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = "transparent"; }}
      onFocus={e => (e.currentTarget.style.background = bg)}
      onBlur={e => (e.currentTarget.style.background = "transparent")}
    />
  );
}

// Stav hodiny vpravo před tlačítkem Detail
function LessonStatus({ printed, uploaded, evidenceCount }: { printed?: boolean; uploaded?: boolean; evidenceCount: number }) {
  const W = 214;
  if (!printed && !uploaded && evidenceCount === 0) return <span style={{ width: W, flexShrink: 0 }} />;
  return (
    <div style={{ width: W, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, marginTop: 5 }}>
      {(printed || uploaded) && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#15803d", fontFamily: "'Inter:Regular', sans-serif", fontSize: 11, whiteSpace: "nowrap" }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
            <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5.4 8.2l1.8 1.8 3.4-3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {uploaded ? "Tabulka hodnocení nahrána" : "Tabulka hodnocení vytisknuta"}
        </span>
      )}
      {evidenceCount > 0 && (
        <span
          title={`${evidenceCount} ${evidenceCount === 1 ? "zaznamenaný důkaz" : evidenceCount >= 2 && evidenceCount <= 4 ? "zaznamenané důkazy" : "zaznamenaných důkazů"} o učení`}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#717182", fontFamily: "'Inter:Regular', sans-serif", fontSize: 11, whiteSpace: "nowrap" }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
            <path d="M9.333 1.333H4A1.333 1.333 0 0 0 2.667 2.667v10.666A1.333 1.333 0 0 0 4 14.667h8a1.333 1.333 0 0 0 1.333-1.334V5.333L9.333 1.333z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.333 1.333v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, color: "#0a0a0a" }}>{evidenceCount}</span>
          {evidenceCount === 1 ? "důkaz" : evidenceCount >= 2 && evidenceCount <= 4 ? "důkazy" : "důkazů"}
        </span>
      )}
    </div>
  );
}

// Ikony akcí nad tabulkou hodnocení — stejné všude: v řádku hodiny,
// v detailu hodiny i na stránce Důkazy o učení.
const ICON_PRINT = "M4.5 6.5V2.5h7v4M4.5 11.5h-1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1M4.5 9.5h7v4h-7z";
// digitální záznam důkazu: obrazovka s odškrtnutím
const ICON_EVIDENCE = "M2.5 3h11a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-7A.5.5 0 0 1 2.5 3zM5.5 14h5M8 11v3M5.6 7l1.6 1.6L10.4 5.4";
// nahrání vyplněné tabulky: list se šipkou nahoru
const ICON_UPLOAD = "M4 14h8a1 1 0 0 0 1-1V5.5L9.5 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1zM9.5 2v3.5H13M8 11.5V7M6.2 8.8L8 7l1.8 1.8";

// Ikonová akce v řádku hodiny
function LessonActionButton({ title, onClick, path, done }: { title: string; onClick: () => void; path: string; done?: boolean }) {
  const base = done ? "#dcfce7" : "#fff";
  const line = done ? "#16a34a" : "rgba(0,0,0,0.12)";
  const ink = done ? "#15803d" : "#5c5c6b";
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: 30, height: 30, borderRadius: 8, padding: 0, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: base, border: `1.5px solid ${line}`, color: ink,
        transition: "background 0.12s, border-color 0.12s, color 0.12s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = done ? "#bbf7d0" : "rgba(236,236,240,0.7)"; e.currentTarget.style.color = done ? "#166534" : "#0a0a0a"; }}
      onMouseLeave={e => { e.currentTarget.style.background = base; e.currentTarget.style.color = ink; }}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d={path} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// Nápověda u nadpisu stránky: vysvětlivka, dotaz Buddymu a návod
function PageHelp({ text, buddy }: { text: string; buddy: string }) {
  const openBuddy = useContext(BuddyContext);
  const { openGuide } = useContext(GoalsContext);
  const linkStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "4px 10px", borderRadius: 20, cursor: "pointer",
    border: "1px solid rgba(0,0,0,0.12)", background: "transparent", color: "#8a8a99",
    fontFamily: "'Inter:Regular', sans-serif", fontSize: 11.5, whiteSpace: "nowrap",
    transition: "background 0.12s, border-color 0.12s, color 0.12s",
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <InfoHint text={text} />
      <button
        onClick={() => openBuddy(buddy)}
        style={linkStyle}
        onMouseEnter={e => { e.currentTarget.style.background = "#f3e8ff"; e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.color = "#5b21b6"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"; e.currentTarget.style.color = "#8a8a99"; }}
      >
        <SparkleIcon />
        Zeptat se Buddyho
      </button>
      <button
        onClick={openGuide}
        style={linkStyle}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(236,236,240,0.7)"; e.currentTarget.style.color = "#5c5c6b"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8a8a99"; }}
      >
        Jak na to
      </button>
    </span>
  );
}

// Vysvětlivka schovaná pod otazníkem u nadpisu
function InfoHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", verticalAlign: "middle", marginLeft: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label="Vysvětlivka"
        aria-expanded={open}
        style={{
          width: 20, height: 20, borderRadius: "50%", padding: 0, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "transparent", border: "1px solid rgba(0,0,0,0.22)", color: "#8a8a99",
          fontFamily: "'Inter:Regular', sans-serif", fontWeight: 400, fontSize: 11.5, lineHeight: 1,
          transition: "border-color 0.12s, color 0.12s",
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute", top: "calc(100% + 8px)", left: -8, zIndex: 40,
            width: 320, padding: "10px 13px", borderRadius: 10,
            background: "#0a0a0a", color: "#fff",
            fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, lineHeight: 1.5,
            textTransform: "none", letterSpacing: "normal", fontWeight: 400,
            boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function LessonList({ filtered, animateIn, tpGoals, removeTpGoal, setSelectedTpGoalId, setSelectedGoalId, btnStyle, onPatch, evidenceCountFor, statusFor, classOptions, onLessonAction, editMode, selectedIds, onToggleSelect, lessonsDone, onToggleDone }: {
  filtered: AnyGoal[];
  animateIn: boolean;
  tpGoals: TpGoal[];
  removeTpGoal: (id: string) => void;
  setSelectedTpGoalId: (id: string) => void;
  setSelectedGoalId: (id: string) => void;
  btnStyle: (v: "primary" | "ghost" | "danger") => React.CSSProperties;
  onPatch: (id: string, isTp: boolean, patch: Record<string, string>) => void;
  evidenceCountFor: (id: string) => number;
  statusFor: (id: string) => { printed?: boolean; uploaded?: boolean };
  classOptions: string[];
  onLessonAction: (goalId: string, isTp: boolean, kind: "print" | "evidence" | "camera") => void;
  editMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  lessonsDone: Record<string, boolean>;
  onToggleDone: (id: string) => void;
}) {
  const [orderedIds, setOrderedIds] = useState<string[]>(() => filtered.map(g => g.id));
  const dragGoalRef = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => { setOrderedIds(filtered.map(g => g.id)); }, [filtered.map(g => g.id).join(",")]);

  const orderedFiltered = orderedIds.map(id => filtered.find(g => g.id === id)).filter(Boolean) as AnyGoal[];
  const globalNumMap = new Map(orderedFiltered.map((g, i) => [g.id, i + 1]));

  // Měsíce se řadí podle školního roku a každý je v seznamu jen jednou —
  // přetažením řádku jinam nesmí vzniknout Září / Listopad / Září.
  const byMonth = new Map<string, AnyGoal[]>();
  for (const g of orderedFiltered) {
    const key = g.period || "";
    const arr = byMonth.get(key);
    if (arr) arr.push(g); else byMonth.set(key, [g]);
  }
  const grouped = Array.from(byMonth.entries())
    .map(([month, items]) => ({ month, items }))
    .sort((a, b) => {
      if (!a.month) return 1;
      if (!b.month) return -1;
      return LESSON_MONTHS.indexOf(a.month) - LESSON_MONTHS.indexOf(b.month);
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 10, color: "#8a8a99", margin: "0 0 12px 2px" }}>
        Školní rok {SCHOOL_YEAR_LABEL}
      </p>
      {grouped.map(({ month, items }, gi) => (
        <div key={`${month || "__none"}-${gi}`} style={{ marginBottom: 24 }}>
          {month && (
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#6b6b7a", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 10px 2px" }}>
              {month}
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map(g => {
              const num = globalNumMap.get(g.id);
              const isTp = g.isTp;
              const tpGoal = isTp ? tpGoals.find(t => t.id === g.id) : null;
              const isDragOver = dragOverId === g.id && dragGoalRef.current !== g.id;
              const st = statusFor(g.id);
              return (
                <FadeIn key={g.id} delay={animateIn && isTp ? 80 * (orderedFiltered.indexOf(g)) : 0}>
                  <div
                    onClick={e => {
                      // celá karta vede na detail, jen ovládací prvky a texty si klik nechávají
                      const t = e.target as HTMLElement;
                      if (t.closest("button, a, select, input, textarea, [data-no-nav]")) return;
                      if (isTp) { setSelectedTpGoalId(g.id); } else setSelectedGoalId(g.id);
                    }}
                    onDragEnter={() => setDragOverId(g.id)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => {
                      const from = dragGoalRef.current;
                      if (!from || from === g.id) return;
                      // přetažení do jiného měsíce hodinu do toho měsíce i přesune
                      const dragged = filtered.find(x => x.id === from);
                      if (dragged && dragged.isTp && g.period && dragged.period !== g.period) {
                        onPatch(from, true, { month: g.period });
                      }
                      setOrderedIds(prev => {
                        const next = [...prev];
                        const fi = next.indexOf(from), ti = next.indexOf(g.id);
                        if (fi < 0 || ti < 0) return prev;
                        next.splice(fi, 1); next.splice(ti, 0, from);
                        return next;
                      });
                      dragGoalRef.current = null; setDragOverId(null);
                    }}
                    style={{
                      background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.09)",
                      borderTop: isDragOver ? "2px solid #7c4dbd" : undefined,
                      position: "relative",
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "18px 16px 18px 12px", transition: "background 0.12s, border-color 0.1s",
                      opacity: dragGoalRef.current === g.id ? 0.45 : 1, cursor: "pointer",
                    }}
                  >
                    {editMode && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(g.id)}
                        onChange={() => onToggleSelect(g.id)}
                        aria-label={`Vybrat hodinu: ${g.text.slice(0, 40)}`}
                        style={{ width: 16, height: 16, marginTop: 13, flexShrink: 0, accentColor: "#7c3aed", cursor: "pointer" }}
                      />
                    )}
                    {/* úchyt pro přetahování — tažení drží jen tato ikona, aby šlo psát do políček */}
                    <div
                      draggable
                      data-no-nav
                      onDragStart={() => { dragGoalRef.current = g.id; }}
                      onDragEnd={() => { dragGoalRef.current = null; setDragOverId(null); }}
                      title="Přetažením změníte pořadí hodin"
                      style={{ flexShrink: 0, marginTop: 11, padding: "1px 2px", opacity: 0.3, cursor: "grab", transition: "opacity 0.12s" }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "0.65")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "0.3")}
                    >
                      <span style={{ color: "#0a0a0a", display: "flex" }}><DragGrip size={16} opacity={1} /></span>
                    </div>

                    {/* číslo hodiny s knížkou */}
                    <div
                      title={num ? `Vyučovací hodina ${num}` : "Vyučovací hodina"}
                      style={{
                        flexShrink: 0, marginTop: 2, width: 46, height: 46, borderRadius: 11,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0,
                        background: "#eff6ff", border: "1px solid rgba(59,130,246,0.25)", color: "#1e40af",
                      }}
                    >
                      <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, lineHeight: 1 }}>{num}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 6C9.5 4 6.5 4 3 5.5v13c3.5-1.5 6.5-1.5 9 0M12 6c2.5-2 5.5-2 9-0.5v13c-3.5-1.5-6.5-1.5-9 0M12 6v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* název hodiny — editovatelný na klik, stejně jako kritéria v detailu */}
                      <EditableLessonTitle
                        value={g.text}
                        onChange={v => onPatch(g.id, isTp, { text: v })}
                      />

                      {/* podrobnosti jako chipsy — všechny editovatelné rovnou odsud */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <ChipSelect
                          title="Předmět"
                          value={g.subject}
                          options={subjectOptions}
                          subjectStyled
                          onChange={v => onPatch(g.id, isTp, { subject: v })}
                        />
                        <ChipSelect
                          title="Třída"
                          value={g.cls}
                          options={classOptions}
                          onChange={v => onPatch(g.id, isTp, { trida: v, className: v })}
                        />
                        {tpGoal && (
                          <ChipSelect
                            title="Rozsah hodin"
                            value={String(parseInt(tpGoal.rozsah) || 1)}
                            options={["1", "2", "3", "4", "5", "6", "7", "8", "9"]}
                            labelFor={(v: string) => `${v} ${v === "1" ? "hodina" : Number(v) <= 4 ? "hodiny" : "hodin"}`}
                            onChange={v => onPatch(g.id, isTp, { rozsah: v })}
                          />
                        )}
                        {isTp && (
                          <ChipSelect
                            title="Měsíc v tématickém plánu"
                            value={g.period}
                            options={LESSON_MONTHS}
                            labelFor={monthLabel}
                            onChange={v => onPatch(g.id, isTp, { month: v })}
                          />
                        )}
                        <LessonDates goalId={g.id} />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, alignItems: "stretch", marginTop: 2 }}>
                      <button
                        onClick={() => isTp ? setSelectedTpGoalId(g.id) : setSelectedGoalId(g.id)}
                        style={{ ...btnStyle("ghost"), fontSize: 12, padding: "6px 14px" }}
                      >
                        Detail
                      </button>
                      <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                        <LessonActionButton
                          title={st.printed ? "Tabulka hodnocení vytisknuta" : "Vytisknout tabulku hodnocení"}
                          onClick={() => onLessonAction(g.id, isTp, "print")}
                          path={ICON_PRINT}
                          done={st.printed}
                        />
                        <LessonActionButton
                          title="Zaznamenat důkazy o učení digitálně"
                          onClick={() => onLessonAction(g.id, isTp, "evidence")}
                          path={ICON_EVIDENCE}
                        />
                        <LessonActionButton
                          title="Nahrát vyplněnou tabulku hodnocení"
                          onClick={() => onLessonAction(g.id, isTp, "camera")}
                          path={ICON_UPLOAD}
                          done={st.uploaded}
                        />
                      </div>
                    </div>

                    {/* odučeno — ovlivní i postup na kartě tématického plánu */}
                    <button
                      onClick={() => onToggleDone(g.id)}
                      title={lessonsDone[g.id] ? "Hodina je probraná — kliknutím zrušíte" : "Označit hodinu jako probranou"}
                      aria-label={lessonsDone[g.id] ? "Hodina je probraná" : "Označit hodinu jako probranou"}
                      aria-pressed={!!lessonsDone[g.id]}
                      style={{
                        flexShrink: 0, alignSelf: "center", width: 30, height: 30, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center", padding: 0, cursor: "pointer",
                        border: lessonsDone[g.id] ? "none" : "1.5px solid rgba(0,0,0,0.16)",
                        background: lessonsDone[g.id] ? "#16a34a" : "#fff",
                        color: lessonsDone[g.id] ? "#fff" : "#c4c4ce",
                        transition: "background 0.12s, border-color 0.12s, color 0.12s",
                      }}
                      onMouseEnter={e => { if (!lessonsDone[g.id]) { e.currentTarget.style.borderColor = "#16a34a"; e.currentTarget.style.color = "#16a34a"; } }}
                      onMouseLeave={e => { if (!lessonsDone[g.id]) { e.currentTarget.style.borderColor = "rgba(0,0,0,0.16)"; e.currentTarget.style.color = "#c4c4ce"; } }}
                    >
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 8.4l3.2 3.2L13 4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
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
  const { tpGoals, removeTpGoal, updateTpGoalText, updateTpGoal, animateIn, lessonsDone, toggleLessonDone, schoolLevelId, schoolCustomLevels, goToSettings } = useContext(GoalsContext);
  const { evidenceRecords } = useContext(EvidenceContext);
  // Stav hodiny: co už je pro ni hotové. Ukázkově má první hodina vytisknutou tabulku.
  const [lessonStatus, setLessonStatus] = useState<Record<string, { printed?: boolean; uploaded?: boolean }>>({});
  const [listModal, setListModal] = useState<{ kind: "print" | "evidence" | "camera"; goalId: string; isTp: boolean } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const markLesson = (id: string | null, patch: { printed?: boolean; uploaded?: boolean }) => {
    if (!id) return;
    setLessonStatus(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };
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

  const tpSelectedLevelId = schoolLevelId;
  const [tpPrintOpen, setTpPrintOpen] = useState(false);
  const [tpCameraOpen, setTpCameraOpen] = useState(false);
  const [tpEvidenceOpen, setTpEvidenceOpen] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<string>(schoolLevelId);
  const [editingLevels, setEditingLevels] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [newGoalText, setNewGoalText] = useState("");
  const [generatingGoal, setGeneratingGoal] = useState(false);
  const [savedCustomLevels, setSavedCustomLevels] = useState<CustomLevel[]>(schoolCustomLevels);
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

        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 22, lineHeight: "40px", color: "#0a0a0a", margin: 0, display: "flex", alignItems: "center" }}>
            Detail vyučovací hodiny
            <InfoHint text="Jedna vyučovací hodina: co se v ní žák učí, podle čeho to poznáte a v jakých úrovních to hodnotíte. Cíl, měsíc a rozsah jsou stejná data jako v tématickém plánu." />
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 32 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#717182", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px", display: "flex", alignItems: "center" }}>
              Výukový cíl
              <InfoHint text="Výukový cíl říká, co má žák na konci hodiny umět. Formuluje se z pohledu žáka, konkrétně a tak, aby šlo poznat, že ho zvládl." />
            </p>
            <AIHint message={`Chci upravit cíl: ${selectedTpGoal.text}`}>
              <input
                value={selectedTpGoal.text}
                onChange={e => updateTpGoalText(selectedTpGoal.id, e.target.value)}
                aria-label="Výukový cíl"
                style={{
                  display: "block", width: "100%", boxSizing: "border-box",
                  fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 17, color: "#0a0a0a", lineHeight: 1.45,
                  margin: "0 0 12px", padding: "3px 8px", marginLeft: -8,
                  background: "transparent", border: "1.5px solid transparent", borderRadius: 8,
                  outline: "none", transition: "background 0.12s, border-color 0.12s",
                }}
                onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = "rgba(236,236,240,0.6)"; }}
                onMouseLeave={e => { if (document.activeElement !== e.currentTarget) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; } }}
                onFocus={e => { e.currentTarget.style.background = "rgba(236,236,240,0.6)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)"; }}
                onBlur={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
              />
            </AIHint>
            {/* stejné chipsy jako na kartě hodiny, včetně editace i termínů */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <ChipSelect
                title="Předmět"
                value={selectedTpGoal.subject}
                options={subjectOptions}
                subjectStyled
                big
                onChange={v => updateTpGoal(selectedTpGoal.id, { subject: v })}
              />
              <ChipSelect
                title="Třída"
                value={selectedTpGoal.trida}
                options={initialClasses.map(c => c.name)}
                big
                onChange={v => updateTpGoal(selectedTpGoal.id, { trida: v })}
              />
              <ChipSelect
                title="Rozsah hodin"
                value={String(parseInt(selectedTpGoal.rozsah) || 1)}
                options={["1", "2", "3", "4", "5", "6", "7", "8", "9"]}
                labelFor={(v: string) => `${v} ${v === "1" ? "hodina" : Number(v) <= 4 ? "hodiny" : "hodin"}`}
                big
                onChange={v => updateTpGoal(selectedTpGoal.id, { rozsah: v })}
              />
              <ChipSelect
                title="Měsíc v tématickém plánu"
                value={selectedTpGoal.month}
                options={LESSON_MONTHS}
                labelFor={monthLabel}
                big
                onChange={v => updateTpGoal(selectedTpGoal.id, { month: v })}
              />
              <LessonDates goalId={selectedTpGoal.id} big />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, paddingTop: 4 }}>
            <button onClick={() => setTpPrintOpen(true)} style={{ ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 6V2h8v4M4 12H3a1.333 1.333 0 0 1-1.333-1.333V7.333A1.333 1.333 0 0 1 3 6h10a1.333 1.333 0 0 1 1.333 1.333v3.334A1.333 1.333 0 0 1 13 12h-1" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 9.333h8V14H4z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Tisknout tabulku hodnocení
            </button>
            <button onClick={() => setTpEvidenceOpen(true)} style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d={ICON_EVIDENCE} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Zaznamenat důkazy o učení
            </button>
            <button onClick={() => setTpCameraOpen(true)} style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d={ICON_UPLOAD} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Nahrát hotovou tabulku hodnocení
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <section>
            <AIHint message="Chci upravit kritéria hodnocení">
              <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#717182", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 6px", display: "flex", alignItems: "center" }}>
                Kritéria hodnocení
                <InfoHint text="Kritéria jsou konkrétní pozorovatelné projevy, podle kterých poznáte, jak je žák na cestě k cíli daleko. Měla by jít vidět nebo slyšet přímo v hodině." />
              </p>
            </AIHint>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182", lineHeight: 1.6, margin: "0 0 16px" }}>
              Kritéria hodnocení určují, co konkrétně pozorujete za aktivity a chování, které se snažíte vyhodnotit.
            </p>
            <CriteriaList initial={selectedTpGoal.criteria} />
          </section>

          <section>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#717182", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 6px", display: "flex", alignItems: "center" }}>
              Úrovně hodnocení
              <InfoHint text="Úrovně nastavuje škola v nastavení a platí pro celou aplikaci. Změna se zpětně nepropíše do už odučených hodin ani do zaznamenaných důkazů." />
            </p>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182", lineHeight: 1.6, margin: "0 0 16px" }}>
              Stupnice je společná pro celou vaši výuku — mění se v Nastavení, ne u jednotlivé hodiny.
            </p>
            <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ flexShrink: 0, width: 16, height: 16, borderRadius: "50%", marginTop: 2, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />
                </span>
                <span>
                  <span style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a", marginBottom: 4 }}>
                    {schoolLevelId === "vlastní" ? "Vlastní úrovně" : tpOpt.name}
                  </span>
                  <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182", lineHeight: 1.55 }}>
                    {schoolLevelId === "vlastní"
                      ? schoolCustomLevels.map(lv => lv.name).filter(Boolean).join(" · ")
                      : tpOpt.desc}
                  </span>
                </span>
              </div>
              <button onClick={goToSettings} style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 6, flexShrink: 0, whiteSpace: "nowrap" }}>
                Změnit v nastavení
              </button>
            </div>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#8a6a1f", background: "#fffbeb", border: "1px solid rgba(180,83,9,0.22)", borderRadius: 10, padding: "9px 12px", lineHeight: 1.55, margin: "10px 0 0" }}>
              Změna stupnice se zpětně nepropíše — už odučené hodiny a zaznamenané důkazy zůstanou na staré škále. Nastavte ji na začátku roku.
            </p>
          </section>
        </div>
      </div>
      {tpPrintOpen && <PrintModal onClose={() => setTpPrintOpen(false)} students={tpClassStudents} goal={selectedTpGoal.text} onPrinted={() => markLesson(selectedTpGoal.id, { printed: true })} />}
      {tpEvidenceOpen && <EvidenceModal onClose={() => setTpEvidenceOpen(false)} students={tpClassStudents} goal={selectedTpGoal.text} goalId={selectedTpGoal.id} subject={selectedTpGoal.subject} className={selectedTpGoal.trida} />}
      {tpCameraOpen && <CameraModal onClose={() => setTpCameraOpen(false)} onUploaded={() => markLesson(selectedTpGoal.id, { uploaded: true })} />}
      </>
    );
  }

  if (creatingGoal) {
    return (
      <div style={{ padding: "32px 40px" }}>
        <Breadcrumb crumbs={[
          { label: "Formativní hodnocení" },
          { label: "Vyučovací hodiny", onClick: () => setCreatingGoal(false) },
          { label: "Nová hodina" },
        ]} />

        <div style={{ display: "flex", gap: 48, alignItems: "flex-start", marginTop: 32, maxWidth: 1060 }}>
        <div style={{ maxWidth: 560, flex: "1 1 500px", minWidth: 0 }}>
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#8a8a99", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 8px" }}>
            Vytvořit hodinu
          </p>
          <h1 style={{
            fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500,
            fontSize: 30, color: "#0a0a0a", margin: "0 0 10px", lineHeight: 1.25,
          }}>
            Co se má žák v hodině naučit?
          </h1>
          <p style={{
            fontFamily: "'Inter:Regular', sans-serif", fontSize: 14,
            color: "#717182", margin: "0 0 24px", lineHeight: 1.65, maxWidth: 480,
          }}>
            Stačí jedna věta — třeba počítání do pěti nebo obojživelníci. Buddy z ní udělá
            výukový cíl a k němu kritéria, podle kterých pak v hodině sbíráte důkazy o učení.
          </p>
          <textarea
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            placeholder="Dokážu…"
            rows={2}
            autoFocus
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "11px 14px", borderRadius: 12,
              border: "1.5px solid rgba(0,0,0,0.15)",
              fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#0a0a0a",
              lineHeight: 1.6, resize: "none", outline: "none",
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
              marginTop: 14, display: "flex", alignItems: "center", gap: 7,
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

        <div style={{ flex: "0 0 auto", paddingTop: 36 }}>
          <LessonPreviewIllustration />
        </div>
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
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 36 }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500,
              fontSize: 11, color: "#717182", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px",
            }}>
              Výzkumný cíl
            </p>
            <AIHint message="Chci upravit tento výzkumný goal">
              <h1 style={{
                fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500,
                fontSize: 24, color: "#0a0a0a", lineHeight: 1.4,
                margin: "0 0 12px", maxWidth: 560,
              }}>
                {selectedGoal.text}
              </h1>
            </AIHint>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{
                padding: "3px 10px", borderRadius: 20,
                background: "#f3e8ff", color: "#8200db",
                fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12,
              }}>
                {selectedGoal.subject}
              </span>
              <span style={{
                padding: "3px 10px", borderRadius: 20,
                background: "rgba(236,236,240,0.9)", color: "#717182",
                fontFamily: "'Inter:Regular', sans-serif", fontSize: 12,
              }}>
                {selectedGoal.className}
              </span>
            </div>
          </div>

          {/* action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, paddingTop: 4 }}>
            <button
              onClick={() => setPrintOpen(true)}
              style={{
                ...btnStyle("primary"),
                display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
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
                display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d={ICON_EVIDENCE} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Zaznamenat důkazy o učení
            </button>
            <button
              onClick={() => setCameraOpen(true)}
              style={{
                ...btnStyle("ghost"),
                display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d={ICON_UPLOAD} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Nahrát hotovou tabulku hodnocení
            </button>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 28, display: "flex", flexDirection: "column", gap: 28 }}>
          {/* criteria */}
          <section>
            <AIHint message="Chci upravit kritéria hodnocení">
              <p style={{
                fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500,
                fontSize: 13, color: "#717182", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 6px",
              }}>
                Kritéria hodnocení
              </p>
            </AIHint>
            <p style={{
              fontFamily: "'Inter:Regular', sans-serif", fontSize: 13,
              color: "#717182", lineHeight: 1.6, margin: "0 0 16px",
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
                fontSize: 13, color: "#717182", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 12px",
              }}>
                Úrovně hodnocení
              </p>
            </AIHint>
            <p style={{
              fontFamily: "'Inter:Regular', sans-serif", fontSize: 13,
              color: "#717182", lineHeight: 1.6, margin: "0 0 16px",
            }}>
              Úrovně popisují, na jaké úrovni zvládnutí se žák na cestě k cíli nachází. Vyberte si z přednastavených úrovní hodnocení podle vytvořených metodik, nebo si nastavte vlastní.
            </p>

            {editingLevels ? (
              <LevelPicker
                current={selectedLevelId}
                onDone={(id) => { setSelectedLevelId(id); setEditingLevels(false); }}
                onSaveCustom={setSavedCustomLevels}
                savedCustomLevels={savedCustomLevels}
              />
            ) : selectedLevelId === "vlastní" ? (
              <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a" }}>
                    Vlastní úrovně
                  </span>
                  <button
                    onClick={() => setEditingLevels(true)}
                    style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
                  >
                    <IconEdit />
                    Upravit
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {savedCustomLevels.map((lv, i) => (
                    <div key={lv.id} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                      <span style={{
                        flexShrink: 0, padding: "2px 10px", borderRadius: 20,
                        background: "rgba(236,236,240,0.7)",
                        fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12, color: "#0a0a0a",
                        whiteSpace: "nowrap",
                      }}>
                        {lv.name || `Úroveň ${i + 1}`}
                      </span>
                      {lv.desc && (
                        <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182", lineHeight: 1.5 }}>
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
                  borderRadius: 14, padding: "14px 16px",
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{
                      flexShrink: 0, width: 16, height: 16, borderRadius: "50%", marginTop: 2,
                      background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />
                    </span>
                    <span>
                      <span style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a", marginBottom: 4 }}>
                        {opt.name}
                      </span>
                      <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182", lineHeight: 1.55 }}>
                        {opt.desc}
                      </span>
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingLevels(true)}
                    style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
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
          onPrinted={() => markLesson(selectedGoal.id, { printed: true })}
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
      {cameraOpen && <CameraModal onClose={() => setCameraOpen(false)} onUploaded={() => markLesson(selectedGoal.id, { uploaded: true })} />}
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
    "Září": "2026-09", "Říjen": "2026-10", "Listopad": "2026-11", "Prosinec": "2026-12",
    "Leden": "2027-01", "Únor": "2027-02", "Březen": "2027-03", "Duben": "2027-04",
    "Květen": "2027-05", "Červen": "2027-06",
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
      if (filterPeriod === "1-pololeti" && !(ym >= "2026-09" && ym <= "2027-01")) return false;
      if (filterPeriod === "2-pololeti" && !(ym >= "2027-02" && ym <= "2027-06")) return false;
      if (filterPeriod === "vlastni") {
        if (filterDateFrom && ym && ym < filterDateFrom.slice(0, 7)) return false;
        if (filterDateTo   && ym && ym > filterDateTo.slice(0, 7))   return false;
      }
    }
    if (search && !g.text.toLowerCase().includes(search.toLowerCase()) && !g.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectStyle: React.CSSProperties = {
    padding: "7px 12px", borderRadius: 8, border: "1.5px solid rgba(0,0,0,0.12)",
    background: "#fff", fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#0a0a0a",
    cursor: "pointer", outline: "none", appearance: "none" as any, WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23717182' stroke-width='1.33' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 30,
  };

  const goalNum = (id: string) => (goalNums.get(id) ?? (goals.findIndex(g => g.id === id) + 1 + tpGoals.length)) || undefined;

  return (
    <div style={{ padding: "32px 40px" }}>
      <Breadcrumb crumbs={[{ label: "Formativní hodnocení" }, { label: "Vyučovací hodiny" }]} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 22, lineHeight: "40px", color: "#0a0a0a", margin: 0, display: "flex", alignItems: "center" }}>
          Vyučovací hodiny
          <PageHelp
            text="Jedna hodina = jeden výukový cíl a kritéria, podle kterých poznáte, že ho žák zvládl. Cíl, měsíc a rozsah jsou stejná data jako v tématickém plánu, úprava se projeví i tam."
            buddy="Vyučovací hodiny"
          />
        </h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => { setEditMode(v => !v); setSelectedIds(new Set()); }}
            style={{
              ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 7,
              borderColor: editMode ? "#7c4dbd" : undefined,
              color: editMode ? "#7c4dbd" : undefined,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M11.3 2.2a1.4 1.4 0 0 1 2 2L6 11.5l-2.7.8.8-2.7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2.5 14h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {editMode ? "Hotovo" : "Upravit hodiny"}
          </button>
          <button
            onClick={() => { setNewGoalText(""); setCreatingGoal(true); }}
            style={{ ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 6 }}
          >
            <IconPlus />
            Vytvořit hodinu
          </button>
        </div>
      </div>

      {editMode && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
          padding: "10px 14px", borderRadius: 11,
          background: "rgba(124,77,189,0.06)", border: "1px solid rgba(124,77,189,0.22)",
        }}>
          <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#5b21b6" }}>
            {selectedIds.size === 0
              ? "Zaškrtněte hodiny, které chcete odstranit."
              : `Vybráno ${selectedIds.size} ${selectedIds.size === 1 ? "hodina" : selectedIds.size <= 4 ? "hodiny" : "hodin"}`}
          </span>
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={selectedIds.size === 0}
            style={{
              ...btnStyle("danger"), fontSize: 13, marginLeft: "auto",
              opacity: selectedIds.size === 0 ? 0.45 : 1,
              cursor: selectedIds.size === 0 ? "default" : "pointer",
            }}
          >
            Odstranit vybrané
          </button>
        </div>
      )}

      {/* filter bar — vše na jednom řádku */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.09)", padding: "12px 16px", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: 150 }}>
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
              <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 11, color: CHIP_FG }}>–</span>
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
              title="Zrušit filtry"
              aria-label="Zrušit filtry"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, padding: 0, borderRadius: 8, border: "1.5px solid rgba(220,38,38,0.3)", background: "rgba(254,242,242,0.6)", color: "#dc2626", cursor: "pointer" }}
            >
              <svg width="13" height="13" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        allGoals.length === 0 ? (
          <div style={{ padding: "44px 0 72px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <LessonPreviewIllustration />
            </div>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 17, color: "#0a0a0a", margin: "18px 0 8px" }}>
              Hodiny vzniknou z vašeho plánu
            </p>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13.5, color: "#717182", margin: "0 auto 22px", lineHeight: 1.65, maxWidth: 430 }}>
              Z každého řádku tématického plánu udělá Buddy jednu vyučovací hodinu i s kritérii,
              podle kterých pak v hodině sbíráte důkazy o učení. Nebo si první hodinu napište sami.
            </p>
            <button
              onClick={() => { setNewGoalText(""); setCreatingGoal(true); }}
              style={{ ...btnStyle("primary"), display: "inline-flex", alignItems: "center", gap: 7 }}
            >
              <IconPlus />
              Vytvořit hodinu
            </button>
          </div>
        ) : (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#b0b0be", margin: 0 }}>
              Žádné hodiny neodpovídají filtru.
            </p>
          </div>
        )
      ) : (
        <LessonList
          filtered={filtered}
          animateIn={animateIn}
          tpGoals={tpGoals}
          removeTpGoal={removeTpGoal}
          setSelectedTpGoalId={id => setSelectedTpGoalId(id)}
          setSelectedGoalId={id => setSelectedGoalId(id)}
          btnStyle={btnStyle}
          classOptions={initialClasses.map(c => c.name)}
          onLessonAction={(goalId, isTp, kind) => setListModal({ kind, goalId, isTp })}
          editMode={editMode}
          selectedIds={selectedIds}
          onToggleSelect={id => setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
          })}
          lessonsDone={lessonsDone}
          onToggleDone={toggleLessonDone}
          evidenceCountFor={id => evidenceRecords.filter(r => r.goalId === id).length}
          statusFor={id => lessonStatus[id] ?? {}}
          onPatch={(id, isTp, patch) => {
            if (isTp) {
              // hodiny z tématického plánu se mění přímo v plánu, odkud pocházejí
              const { className, ...rest } = patch;
              updateTpGoal(id, rest as Partial<TpGoal>);
            } else {
              const { trida, ...rest } = patch;
              setGoals(prev => prev.map(x => x.id === id ? { ...x, ...rest } as Goal : x));
            }
          }}
        />
      )}

      {confirmDelete && (() => {
        const selectedFromPlan = [...selectedIds].filter(id => tpGoals.some(g => g.id === id)).length;
        return (
        <Modal title="Odstranit vybrané hodiny?" onClose={() => setConfirmDelete(false)} width={440}>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, lineHeight: 1.6, color: "#0a0a0a", margin: "0 0 10px" }}>
            Odstraní se {selectedIds.size} {selectedIds.size === 1 ? "vyučovací hodina" : selectedIds.size <= 4 ? "vyučovací hodiny" : "vyučovacích hodin"}.
          </p>
          {selectedFromPlan > 0 && <div style={{
            display: "flex", gap: 9, alignItems: "flex-start",
            padding: "11px 13px", borderRadius: 10, marginBottom: 4,
            background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.22)",
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1, color: "#c81e1e" }} aria-hidden="true">
              <path d="M8 1.8L15 14H1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M8 6.2v3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="8" cy="11.6" r="0.8" fill="currentColor"/>
            </svg>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, lineHeight: 1.55, color: "#991b1b", margin: 0 }}>
              {selectedFromPlan === selectedIds.size
                ? "Odstraní se i z tématického plánu — jsou to stejná data. Tuhle změnu nelze vzít zpět."
                : `${selectedFromPlan} z nich pochází z tématického plánu a odstraní se i tam. Tuhle změnu nelze vzít zpět.`}
            </p>
          </div>}
          <ModalActions
            onCancel={() => setConfirmDelete(false)}
            onConfirm={() => {
              selectedIds.forEach(id => {
                if (tpGoals.some(g => g.id === id)) removeTpGoal(id);
                else setGoals(prev => prev.filter(x => x.id !== id));
              });
              setSelectedIds(new Set());
              setConfirmDelete(false);
              setEditMode(false);
            }}
            confirmLabel={selectedFromPlan > 0 ? "Odstranit i z plánu" : "Odstranit"}
            danger
          />
        </Modal>
        );
      })()}

      {/* akce ze seznamu hodin — tisk, sběr důkazů, nahrání tabulky */}
      {listModal && (() => {
        const lg = allGoals.find(x => x.id === listModal.goalId);
        if (!lg) return null;
        const students = initialClasses.find(c => c.name === lg.cls)?.students ?? [];
        const close = () => setListModal(null);
        if (listModal.kind === "print") return (
          <PrintModal
            onClose={close}
            students={students}
            goal={lg.text}
            onPrinted={() => markLesson(lg.id, { printed: true })}
          />
        );
        if (listModal.kind === "camera") return (
          <CameraModal onClose={close} onUploaded={() => markLesson(lg.id, { uploaded: true })} />
        );
        return (
          <EvidenceModal
            onClose={close}
            students={students}
            goal={lg.text}
            goalId={lg.id}
            subject={lg.subject}
            className={lg.cls}
          />
        );
      })()}
    </div>
  );
}

// ─── sdílená karta důkazu ────────────────────────────────────────────────────

const EVIDENCE_LEVEL_COLORS: Record<string, { bg: string; color: string }> = {
  "Zvládám":  { bg: "#dcfce7", color: "#166534" },
  "Rozvíjím": { bg: "#fef9c3", color: "#854d0e" },
  "Začínám":  { bg: "#fee2e2", color: "#991b1b" },
};

type EvidenceKind = "uroven" | "foto" | "audio" | "poznamka";
const EVIDENCE_KINDS: Record<EvidenceKind, { label: string; bg: string; color: string }> = {
  uroven:   { label: "Úroveň",   bg: "#d6f0e0", color: "#1f6b41" },
  foto:     { label: "Foto",     bg: "#d6eaf2", color: "#145f76" },
  audio:    { label: "Audio",    bg: "#e5ddf8", color: "#4f31a0" },
  poznamka: { label: "Poznámka", bg: "#fbe8d2", color: "#8a5314" },
};
function evidenceKind(r: EvidenceRecord): EvidenceKind {
  if (r.criterion) return "uroven";
  if (r.type === "note") return "poznamka";
  if (r.type === "audio") return "audio";
  return "foto";
}

function EvidenceKindIcon({ kind, size = 17 }: { kind: EvidenceKind; size?: number }) {
  const sz = String(size);
  return (
    <>
{kind === "uroven" ? (
          <svg width={sz} height={sz} viewBox="0 0 16 16" fill="none">
            <path d="M8 14V7" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
            <path d="M8 7c0-2.5 2.5-4 4.5-3.5C12.5 6 10.5 7.5 8 7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
            <path d="M8 9.5c0-2-2.5-3.5-4.5-3C3.5 9 5.5 10 8 9.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
            <path d="M5 14h6" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
          </svg>
        ) : kind === "poznamka" ? (
          <svg width={sz} height={sz} viewBox="0 0 16 16" fill="none">
            <path d="M3 2.5h10a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5z" stroke="currentColor" strokeWidth="1.33" strokeLinejoin="round"/>
            <path d="M5.333 6h5.334M5.333 8.667h3.334" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
          </svg>
        ) : kind === "audio" ? (
          <svg width={sz} height={sz} viewBox="0 0 16 16" fill="none">
            <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.33"/>
            <path d="M2.667 8A5.333 5.333 0 0 0 8 13.333 5.333 5.333 0 0 0 13.333 8" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
            <path d="M8 13.333V15.333" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width={sz} height={sz} viewBox="0 0 16 16" fill="none">
            <path d="M1.333 5.333A1.333 1.333 0 0 1 2.667 4h1.2L5.2 2h5.6l1.333 2h1.2A1.333 1.333 0 0 1 14.667 5.333v7.334A1.333 1.333 0 0 1 13.333 14H2.667a1.333 1.333 0 0 1-1.334-1.333V5.333z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="8" cy="9" r="2.333" stroke="currentColor" strokeWidth="1.33"/>
          </svg>
        )}
    </>
  );
}

// Náhled obsahu důkazu — v prototypu vymyšlený, ale konzistentní pro daný záznam.
function hashOf(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const TRANSCRIPTS = [
  "Uka\u017e mi, jak jsi to slovo rozd\u011blil\u2026 Ano, ko\u0159en je \u201eu\u010d\u201c, p\u0159edpona \u201ena\u201c. A co p\u0159\u00edpona? \u2014 P\u0159\u00edpona je \u201eka\u201c. P\u0159esn\u011b tak.",
  "Zkus to \u0159\u00edct je\u0161t\u011b jednou nahlas. \u2014 Podstatn\u00e9 jm\u00e9no, rod mu\u017esk\u00fd, \u010d\u00edslo jednotn\u00e9. \u2014 V\u00fdborn\u011b, a v jak\u00e9m je p\u00e1du?",
  "P\u0159e\u010dti mi tu v\u011btu\u2026 Sly\u0161\u00ed\u0161, kde ti chyb\u00ed \u010d\u00e1rka? \u2014 Tady, p\u0159ed \u201ea proto\u201c. \u2014 Spr\u00e1vn\u011b, s\u00e1m sis to na\u0161el.",
  "Vysv\u011btli mi, pro\u010d jsi napsal tvrd\u00e9 y. \u2014 Proto\u017ee je to vyjmenovan\u00e9 slovo. \u2014 A um\u00ed\u0161 k n\u011bmu \u0159\u00edct slovo p\u0159\u00edbuzn\u00e9?",
  "Popi\u0161, co se na tom obr\u00e1zku d\u011bje. \u2014 Chlapec s\u00e1z\u00ed strom a kamar\u00e1dka mu dr\u017e\u00ed konev. \u2014 Hezky, p\u0159idal jsi i d\u016fvod.",
];
const NOTES = [
  "S\u00e1m si v\u0161iml chyby a opravil ji, ani\u017e bych na ni upozornila. Poprv\u00e9 pracoval \u00fapln\u011b bez pomoci.",
  "Pot\u0159eboval n\u00e1vodnou ot\u00e1zku, pak u\u017e postupoval jist\u011b. P\u0159\u00edt\u011b zkusit zad\u00e1n\u00ed bez n\u00e1pov\u011bdy.",
  "P\u0159i skupinov\u00e9 pr\u00e1ci vysv\u011btloval postup spolu\u017e\u00e1kovi vlastn\u00edmi slovy \u2014 rozum\u00ed tomu dob\u0159e.",
  "Zvl\u00e1dl \u00favodn\u00ed \u010d\u00e1st, u t\u011b\u017e\u0161\u00edch p\u0159\u00edklad\u016f ztr\u00e1cel jistotu. Domluvili jsme se na kr\u00e1tk\u00e9m procvi\u010den\u00ed.",
  "Pr\u00e1ci odevzdal d\u0159\u00edv ne\u017e ostatn\u00ed a nab\u00eddl pomoc sousedovi. Obsah odpov\u00eddal zad\u00e1n\u00ed.",
];
function evidenceTranscript(r: EvidenceRecord) {
  return TRANSCRIPTS[hashOf(r.id) % TRANSCRIPTS.length];
}
function evidenceNoteText(r: EvidenceRecord) {
  return r.note?.trim() || NOTES[hashOf(r.id) % NOTES.length];
}
function evidencePhotoName(r: EvidenceRecord) {
  const slug = r.studentName.toLowerCase()
    .replace(/[^a-záčďéěíňóřšťúůýž ]/g, "").trim().split(/\s+/).slice(0, 2).join("-")
    .normalize("NFD").replace(/[̀-ͯ]/g, "");
  return `${slug || "zak"}-${r.date}.jpg`;
}

// Miniatura fotky — v prototypu kreslená, ne skutečný snímek
function PhotoThumb() {
  return (
    <span style={{
      width: 52, height: 40, borderRadius: 8, flexShrink: 0, display: "block",
      background: "linear-gradient(135deg, #dbeafe 0%, #ede9fe 60%, #fce7f3 100%)",
      border: "1px solid rgba(0,0,0,0.08)", position: "relative", overflow: "hidden",
    }}>
      <span style={{ position: "absolute", left: 6, bottom: 6, width: 18, height: 12, borderRadius: "3px 3px 0 0", background: "rgba(255,255,255,0.75)", display: "block" }} />
      <span style={{ position: "absolute", left: 20, bottom: 6, width: 26, height: 18, borderRadius: "4px 4px 0 0", background: "rgba(255,255,255,0.55)", display: "block" }} />
      <span style={{ position: "absolute", right: 7, top: 6, width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.85)", display: "block" }} />
    </span>
  );
}

function DeleteEvidenceModal({ record, onClose, onConfirm }: {
  record: EvidenceRecord; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <Modal title="Odstranit důkaz o učení?" onClose={onClose} width={420}>
      <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13.5, color: "#717182", lineHeight: 1.6, margin: "0 0 4px" }}>
        {EVIDENCE_KINDS[evidenceKind(record)].label} u žáka {record.studentName} z {formatDate(record.date)}.
        Tuhle změnu nelze vzít zpět.
      </p>
      <ModalActions onCancel={onClose} onConfirm={onConfirm} confirmLabel="Odstranit" danger />
    </Modal>
  );
}

function EvidenceRecordCard({ r, goalNums, hideStudent, onEdit, onDelete }: {
  r: EvidenceRecord; goalNums: Map<string, number>; hideStudent?: boolean;
  onEdit?: () => void; onDelete?: () => void;
}) {
  const lc = r.level ? (EVIDENCE_LEVEL_COLORS[r.level] ?? { bg: "#f3f4f6", color: "#374151" }) : null;
  const kind = evidenceKind(r);
  const kindStyle = EVIDENCE_KINDS[kind];
  const num = goalNums.get(r.goalId);
  const iconBtn = (title: string, color: string, opacity: number, node: React.ReactNode, onClick?: () => void) => (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: 8, color, display: "flex", opacity, transition: "opacity 0.12s" }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
      onMouseLeave={e => (e.currentTarget.style.opacity = String(opacity))}
    >
      {node}
    </button>
  );

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1.5px solid rgba(0,0,0,0.08)", padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 14 }}>
      {/* druh důkazu vlevo */}
      <div style={{ flexShrink: 0, width: 50, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: kindStyle.bg, display: "flex", alignItems: "center", justifyContent: "center", color: kindStyle.color }}>
          <EvidenceKindIcon kind={kind} />
        </div>
        <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 9.5, color: "#8a8a99", letterSpacing: "0.03em", textTransform: "uppercase" }}>
          {kindStyle.label}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {!hideStudent && (
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a", margin: "0 0 4px" }}>
            {r.studentName}
          </p>
        )}

        {/* napřed obsah důkazu */}
        {kind === "uroven" ? (
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13.5, color: "#0a0a0a", margin: "0 0 6px", lineHeight: 1.5 }}>
            {r.criterion}
            {r.level && lc && (
              <span style={{ marginLeft: 8, padding: "2px 9px", borderRadius: 20, background: lc.bg, color: lc.color, fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11 }}>
                {r.level}
              </span>
            )}
          </p>
        ) : kind === "audio" ? (
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13.5, color: "#0a0a0a", margin: "0 0 6px", lineHeight: 1.5 }}>
            „{evidenceTranscript(r)}"
          </p>
        ) : kind === "poznamka" ? (
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13.5, color: "#0a0a0a", margin: "0 0 6px", lineHeight: 1.5 }}>
            {evidenceNoteText(r)}
          </p>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 6px" }}>
            <PhotoThumb />
            <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13.5, color: "#0a0a0a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {evidencePhotoName(r)}
            </span>
          </div>
        )}

        {/* kontext drobně pod tím */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <SubjectChip subject={r.subject} />
          <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 11, color: "#8a8a99", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 380 }}>
            {num ? `Hodina ${num} · ` : ""}{r.goalText}
          </span>
          {kind !== "uroven" && r.criterion && (
            <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 11, color: "#8a8a99" }}>· {r.criterion}</span>
          )}
          <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 11, color: "#8a8a99" }}>· {formatDate(r.date)}</span>
        </div>
      </div>

      {/* akce */}
      <div style={{ flexShrink: 0, display: "flex", gap: 2, alignItems: "center" }}>
        {(kind === "audio" || kind === "foto") && iconBtn(
          kind === "audio" ? "Přehrát nahrávku" : "Zobrazit fotografii", kindStyle.color, 0.9,
          kind === "audio" ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 3.333l9.333 4.667L4 12.667V3.333z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 8s2.667-5.333 7-5.333S15 8 15 8s-2.667 5.333-7 5.333S1 8 1 8z" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round"/>
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.33"/>
            </svg>
          ),
        )}
        {iconBtn("Upravit důkaz", "#717182", 0.6, (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M11.333 2a1.885 1.885 0 0 1 2.667 2.667L5.333 13.333 1.333 14.667l1.334-4L11.333 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ), onEdit)}
        {iconBtn("Odstranit důkaz", "#dc2626", 0.5, (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d={ICON_TRASH} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ), onDelete)}
      </div>
    </div>
  );
}

// ─── placeholder views ────────────────────────────────────────────────────────

// ─── důkazy o učení view ──────────────────────────────────────────────────────

// Předměty mají po celé aplikaci stejnou ikonu i barvu — světlé pozadí,
// barevná ikona. Důkazy o učení jsou naopak inverzní (tmavé pozadí, bílá ikona),
// aby šlo obojí na první pohled rozlišit.
const SUBJECT_STYLES: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  "Čeština": { bg: "#f0e8fb", color: "#6a3fa0", icon: (
    <><path d="M2.5 3.5h4a2 2 0 0 1 2 2v7a1.5 1.5 0 0 0-1.5-1.5h-4.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M13.5 3.5h-4a2 2 0 0 0-2 2v7a1.5 1.5 0 0 1 1.5-1.5h4.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></>
  )},
  "Matematika": { bg: "#e6eefb", color: "#2f57a3", icon: (
    <><path d="M2.5 4.5h4M4.5 2.5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M9.5 4.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M2.8 10.2l2.8 2.8M5.6 10.2l-2.8 2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M9.5 10.3h4M9.5 12.7h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></>
  )},
  "Prvouka": { bg: "#e4f4ea", color: "#2c7148", icon: (
    <><path d="M8 14V7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M8 7.5c0-2.6 2.6-4.2 4.7-3.7C12.7 6.4 10.6 8 8 7.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M8 10.2c0-2.1-2.6-3.6-4.7-3.1C3.3 9.6 5.4 10.7 8 10.2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></>
  )},
  "Anglický jazyk": { bg: "#fbf0dc", color: "#8a6520", icon: (
    <><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M2.2 8h11.6" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M8 2c1.8 2 2.7 4 2.7 6s-.9 4-2.7 6C6.2 12 5.3 10 5.3 8S6.2 4 8 2z" stroke="currentColor" strokeWidth="1.2"/></>
  )},
  "Hudební výchova": { bg: "#fbe8f0", color: "#a03a6a", icon: (
    <><path d="M6 12V3.8l7-1.3V10" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <circle cx="4.3" cy="12.2" r="1.8" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="11.3" cy="10.2" r="1.8" stroke="currentColor" strokeWidth="1.3"/></>
  )},
  "Výtvarná výchova": { bg: "#fbeade", color: "#a0542a", icon: (
    <><path d="M8 2a6 6 0 0 0 0 12c.9 0 1.4-.6 1.4-1.3 0-.4-.2-.7-.4-.9-.2-.3-.4-.5-.4-.9 0-.7.6-1.2 1.3-1.2h1.2A3 3 0 0 0 14 6.7C14 4.1 11.3 2 8 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <circle cx="5.3" cy="7" r="0.9" fill="currentColor"/><circle cx="8" cy="5.2" r="0.9" fill="currentColor"/><circle cx="10.8" cy="7" r="0.9" fill="currentColor"/></>
  )},
  "Tělesná výchova": { bg: "#ddf2ee", color: "#1f6f64", icon: (
    <><circle cx="9.5" cy="3.3" r="1.6" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M9 6.2L6.7 8l1.4 2.2L7 14M9 6.2l2.6 1.6.9 2.4M9 6.2L5.6 7.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></>
  )},
  "Informatika": { bg: "#eaeef4", color: "#3d4c63", icon: (
    <><rect x="2" y="3" width="12" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M5.5 14h5M8 11v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></>
  )},
};
const DEFAULT_SUBJECT_STYLE = { bg: "rgba(236,236,240,0.9)", color: "#5c5c6b", icon: (
  <><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/></>
)};
const subjectStyle = (s: string) => SUBJECT_STYLES[s] ?? DEFAULT_SUBJECT_STYLE;

function SubjectIcon({ subject, size = 13 }: { subject: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      {subjectStyle(subject).icon}
    </svg>
  );
}

// Chip předmětu: ikona + název, barva podle předmětu
function SubjectChip({ subject, big }: { subject: string; big?: boolean }) {
  const st = subjectStyle(subject);
  return (
    <span
      title={subject}
      style={{
        display: "inline-flex", alignItems: "center", gap: big ? 6 : 5,
        padding: big ? "5px 12px 5px 10px" : "2px 9px 2px 7px", borderRadius: 20,
        background: st.bg, color: st.color,
        fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: big ? 12.5 : 11,
      }}
    >
      <SubjectIcon subject={subject} size={big ? 14 : 12} />
      {subject}
    </span>
  );
}

const SUBJECTS = ["Čeština", "Matematika", "Prvouka", "Anglický jazyk", "Hudební výchova", "Výtvarná výchova", "Tělesná výchova"];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
}

// Filtr důkazů o učení používá stejné ovládání na přehledu i v profilu žáka.
const FILTER_SELECT_STYLE: React.CSSProperties = {
  padding: "7px 12px", borderRadius: 8, border: "1.5px solid rgba(0,0,0,0.12)",
  background: "#fff", fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#0a0a0a",
  cursor: "pointer", outline: "none", appearance: "none" as any, WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23717182' stroke-width='1.33' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 30,
};

const PERIOD_OPTIONS = [
  { id: "vse", label: "Celé období" },
  { id: "mesic", label: "Poslední měsíc" },
  { id: "tri-mesice", label: "Poslední 3 měsíce" },
  { id: "1-pololeti", label: "1. pololetí" },
  { id: "2-pololeti", label: "2. pololetí" },
  { id: "vlastni", label: "Vlastní období" },
];

function inSelectedPeriod(dateStr: string, period: string, from: string, to: string) {
  if (period === "vse") return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (period === "mesic") { const m = new Date(now); m.setMonth(m.getMonth() - 1); return d >= m; }
  if (period === "tri-mesice") { const m = new Date(now); m.setMonth(m.getMonth() - 3); return d >= m; }
  if (period === "1-pololeti") return d >= new Date("2026-09-01") && d <= new Date("2027-01-31");
  if (period === "2-pololeti") return d >= new Date("2027-02-01") && d <= new Date("2027-06-30");
  if (period === "vlastni") {
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(to + "T23:59:59")) return false;
    return true;
  }
  return true;
}

// Předvyplnění modalu, když ho otevře návrh od Buddyho
type AddEvidencePreset = { kind?: EvidenceKind; goalId?: string; criterion?: string; subject?: string };

// Přidání nebo úprava jednoho důkazu o učení u konkrétního žáka.
function AddEvidenceModal({ student, className, record, preset, onClose }: {
  student: Student; className: string; record?: EvidenceRecord | null; preset?: AddEvidencePreset | null; onClose: () => void;
}) {
  const { tpGoals } = useContext(GoalsContext);
  const { addEvidenceRecords, addStudentEvidence, updateEvidenceRecord, evidenceRecords } = useContext(EvidenceContext);
  const lessons = tpGoals.filter(g => g.trida === className);
  const [kind, setKind] = useState<EvidenceKind>(record ? evidenceKind(record) : preset?.kind ?? "uroven");
  const [level, setLevel] = useState(record?.level ?? "");
  const [criterion, setCriterion] = useState(record?.criterion ?? preset?.criterion ?? "");
  const [note, setNote] = useState(record ? evidenceNoteText(record) : "");
  const [fileName, setFileName] = useState(record && record.type === "photo" ? evidencePhotoName(record) : "");
  const [recording, setRecording] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [date, setDate] = useState(record?.date ?? (() => new Date().toISOString().slice(0, 10))());
  const [goalId, setGoalId] = useState(record?.goalId ?? preset?.goalId ?? lessons.find(g => !preset?.subject || g.subject === preset.subject)?.id ?? lessons[0]?.id ?? "");
  const [subject, setSubject] = useState(record?.subject ?? preset?.subject ?? lessons[0]?.subject ?? subjectOptions[0]);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const lesson = lessons.find(g => g.id === goalId) ?? null;
  const criteria = lesson?.criteria ?? [];
  const activeCriterion = criterion || criteria[0]?.label || "";

  // jak na tom žák u téhle hodiny a kritéria zatím je
  const previous = evidenceRecords
    .filter(r => r.studentId === student.id && r.goalId === goalId && r.level && (!activeCriterion || r.criterion === activeCriterion) && r.id !== record?.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  const last = previous[previous.length - 1];

  const ready =
    kind === "uroven" ? !!level :
    kind === "poznamka" ? !!note.trim() :
    !!fileName || recording;

  function save() {
    if (!ready) return;
    const type = kind === "audio" ? "audio" : kind === "poznamka" ? "note" : "photo";
    const next: EvidenceRecord = {
      id: record?.id ?? "ev" + Date.now(),
      studentId: student.id,
      studentName: `${student.lastName}, ${student.firstName}`,
      className,
      type: type as "audio" | "photo" | "note",
      note: kind === "poznamka" ? note.trim() : undefined,
      goalId: goalId || "bez-hodiny",
      goalText: lesson?.text ?? "Bez vyučovací hodiny",
      subject,
      date,
      criterion: kind === "uroven" ? (activeCriterion || "Celkové zvládnutí") : undefined,
      level: kind === "uroven" ? level : undefined,
    };
    if (record) {
      updateEvidenceRecord(next);
    } else {
      addEvidenceRecords([next]);
      addStudentEvidence(student.id, type as "audio" | "photo" | "note");
    }
    onClose();
  }

  const selStyle: React.CSSProperties = { ...FILTER_SELECT_STYLE, width: "100%", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500,
    fontSize: 11, color: "#717182", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6,
  };

  return (
    <Modal
      title={`${record ? "Upravit" : "Přidat"} důkaz o učení — ${student.firstName} ${student.lastName}`}
      onClose={onClose}
      width={560}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* kam důkaz patří */}
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ width: 160, flexShrink: 0 }}>
            <span style={labelStyle}>Datum</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...selStyle, backgroundImage: "none", paddingRight: 12 }} />
            {date && (
              <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 11, color: "#8a8a99", margin: "5px 0 0" }}>
                {fmtDateShort(date).split(" ")[0]} · {fmtDateLong(date)}
              </p>
            )}
          </div>
          <div style={{ width: 150, flexShrink: 0 }}>
            <span style={labelStyle}>Předmět</span>
            <select value={subject} onChange={e => setSubject(e.target.value)} style={selStyle}>
              {subjectOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={labelStyle}>Vyučovací hodina</span>
            <select
              value={goalId}
              onChange={e => {
                setGoalId(e.target.value);
                const g = lessons.find(x => x.id === e.target.value);
                if (g) setSubject(g.subject);
                setCriterion("");
              }}
              style={selStyle}
            >
              <option value="">Bez vyučovací hodiny</option>
              {lessons.map((g, i) => (
                <option key={g.id} value={g.id}>
                  {`Hodina ${i + 1} · ${g.text.length > 46 ? g.text.slice(0, 44) + "…" : g.text}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* druh důkazu */}
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 16 }}>
          <span style={labelStyle}>Druh důkazu</span>
          <div style={{ display: "flex", gap: 8 }}>
            {(Object.keys(EVIDENCE_KINDS) as EvidenceKind[]).map(k => {
              const cfg = EVIDENCE_KINDS[k];
              const on = kind === k;
              return (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  aria-pressed={on}
                  style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
                    padding: "12px 6px", borderRadius: 12, cursor: "pointer",
                    border: on ? `1.5px solid ${cfg.bg}` : "1.5px solid rgba(0,0,0,0.12)",
                    background: "#fff",
                    transition: "border-color 0.12s",
                  }}
                >
                  <span style={{
                    width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
                    background: on ? cfg.bg : "rgba(236,236,240,0.9)", color: on ? cfg.color : "#8a8a99",
                    transition: "background 0.12s, color 0.12s",
                  }}>
                    <EvidenceKindIcon kind={k} size={17} />
                  </span>
                  <span style={{
                    fontFamily: on ? "'Inter:Medium', sans-serif" : "'Inter:Regular', sans-serif",
                    fontWeight: on ? 500 : 400, fontSize: 12, color: "#0a0a0a",
                  }}>
                    {cfg.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* co se podle druhu vyplňuje */}
        {kind === "uroven" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <span style={labelStyle}>Úroveň</span>
              <div style={{ display: "flex", gap: 8 }}>
                {SHEET_LEVELS.map(lv => {
                  const c = SHEET_LEVEL_STYLE[lv];
                  const on = level === lv;
                  return (
                    <button
                      key={lv}
                      onClick={() => setLevel(on ? "" : lv)}
                      aria-pressed={on}
                      style={{
                        flex: 1, padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                        border: `1.5px solid ${c.border}`, background: on ? c.bg : "#fff", color: c.fg,
                        fontFamily: on ? "'Inter:Medium', sans-serif" : "'Inter:Regular', sans-serif",
                        fontWeight: on ? 500 : 400, fontSize: 13, transition: "background 0.12s",
                      }}
                    >
                      {lv}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182", lineHeight: 1.55, margin: "8px 0 0" }}>
                {!goalId
                  ? "Vyberte vyučovací hodinu, uvidíte, kde se v ní žák zatím pohybuje."
                  : last
                    ? `${student.firstName} je u tohoto kritéria zatím na úrovni ${last.level!.toLowerCase()} — naposledy ${fmtDateLong(last.date)}${previous.length > 1 ? `, celkem ${previous.length} důkazy` : ""}.`
                    : `${student.firstName} k tomuto kritériu zatím žádný důkaz nemá.`}
              </p>
            </div>
            {criteria.length > 0 && (
              <div>
                <span style={labelStyle}>Kritérium</span>
                <select value={activeCriterion} onChange={e => setCriterion(e.target.value)} style={selStyle}>
                  {criteria.map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {kind === "poznamka" && (
          <div>
            <span style={labelStyle}>Poznámka</span>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={4}
              autoFocus
              placeholder="Co konkrétně žák udělal nebo řekl…"
              style={{
                width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10,
                border: "1.5px solid rgba(0,0,0,0.13)", outline: "none", resize: "none",
                fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, lineHeight: 1.55, color: "#0a0a0a",
              }}
            />
          </div>
        )}

        {kind === "audio" && (
          <div>
            <span style={labelStyle}>Nahrávka</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { setRecording(r => !r); setFileName(""); }}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "14px 12px", borderRadius: 12, cursor: "pointer",
                  border: recording ? "1.5px solid #dc2626" : "1.5px solid rgba(0,0,0,0.13)",
                  background: recording ? "#fee2e2" : "#fff",
                  fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13,
                  color: recording ? "#991b1b" : "#0a0a0a",
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: recording ? "#dc2626" : "#6d28d9", display: "block" }} />
                {recording ? "Nahrávám… klepnutím zastavte" : "Nahrát teď"}
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                style={{ ...btnStyle("ghost"), padding: "14px 16px", whiteSpace: "nowrap" }}
              >
                Nahrát soubor
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              style={{ display: "none" }}
              onChange={e => { setFileName(e.target.files?.[0]?.name ?? ""); setRecording(false); }}
            />
            {record && (
              <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#5c5c6b", lineHeight: 1.55, margin: "10px 0 0" }}>
                <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, color: "#0a0a0a" }}>Přepis: </span>
                {evidenceTranscript(record)}
              </p>
            )}
            {fileName && (
              <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182", margin: "8px 0 0" }}>{fileName}</p>
            )}
          </div>
        )}

        {kind === "foto" && (
          <div>
            <span style={labelStyle}>Fotografie</span>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); setFileName(e.dataTransfer.files?.[0]?.name ?? "fotka.jpg"); }}
              style={{
                padding: "22px 16px", borderRadius: 12, textAlign: "center",
                border: dragOver ? "1.5px dashed #0e7490" : "1.5px dashed rgba(0,0,0,0.18)",
                background: dragOver ? "#ecfeff" : "#fafafa",
                transition: "border-color 0.12s, background 0.12s",
              }}
            >
              <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182", margin: "0 0 12px" }}>
                Přetáhněte sem fotku
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button onClick={() => fileRef.current?.click()} style={{ ...btnStyle("ghost") }}>Nahrát z počítače</button>
                <button onClick={() => cameraRef.current?.click()} style={{ ...btnStyle("ghost") }}>Vyfotit mobilem</button>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => setFileName(e.target.files?.[0]?.name ?? "")} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => setFileName(e.target.files?.[0]?.name ?? "fotka.jpg")} />
            {fileName && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                <PhotoThumb />
                <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182" }}>{fileName}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <ModalActions onCancel={onClose} onConfirm={save} confirmLabel="Uložit" />
    </Modal>
  );
}

function DukazyView() {
  const { evidenceRecords, removeEvidenceRecord } = useContext(EvidenceContext);
  const { tpGoals } = useContext(GoalsContext);
  const goalNums = buildGoalNumbers(tpGoals);

  const [deleteRecord, setDeleteRecord] = useState<EvidenceRecord | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EvidenceRecord | null>(null);
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

  const inPeriod = (dateStr: string) => inSelectedPeriod(dateStr, filterPeriod, filterDateFrom, filterDateTo);

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

  const selStyle = FILTER_SELECT_STYLE;
  const periodOptions = PERIOD_OPTIONS;

  return (
    <div style={{ padding: "32px 40px", minHeight: "100%" }}>
      <Breadcrumb crumbs={[{ label: "Formativní hodnocení" }, { label: "Důkazy o učení" }]} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 22, color: "#0a0a0a", margin: "0 0 2px" }}>
            Důkazy o učení
            <PageHelp
              text="Důkaz o učení je konkrétní stopa toho, co žák umí — zaznamenaná úroveň u kritéria, fotka práce, nahrávka rozhovoru nebo vaše poznámka. Z důkazů pak vzniká slovní hodnocení."
              buddy="Důkazy o učení"
            />
          </h1>
          <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182" }}>
            {filtered.length} {filtered.length === 1 ? "záznam" : filtered.length >= 2 && filtered.length <= 4 ? "záznamy" : "záznamů"}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <button
            onClick={openEvidenceModal}
            style={{ ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d={ICON_EVIDENCE} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            Zaznamenat důkazy o učení
          </button>
          <button
            onClick={() => setCameraOpen(true)}
            style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d={ICON_UPLOAD} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            Nahrát hotovou tabulku hodnocení
          </button>
        </div>
      </div>

      {/* filter bar */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.09)", padding: "16px 20px", marginBottom: 24 }}>
        {/* filtr na jednom řádku */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={selStyle}>
            <option value="vse">Všechny předměty</option>
            {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterStudentId("vse"); }} style={selStyle}>
            <option value="vse">Všechny třídy</option>
            {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={filterStudentId} onChange={e => setFilterStudentId(e.target.value)} style={selStyle}>
            <option value="vse">{filterClass === "vse" ? "Všichni žáci" : "Všichni žáci třídy"}</option>
            {studentsOfClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {/* místo cílů se filtruje po jednotlivých vyučovacích hodinách */}
          <select value={filterGoalId} onChange={e => setFilterGoalId(e.target.value)} style={{ ...selStyle, flex: "1 1 220px", minWidth: 0 }}>
            <option value="vse">Všechny vyučovací hodiny</option>
            {allGoals.map(g => {
              const num = goalNums.get(g.id);
              const prefix = num ? `Hodina ${num} · ` : "";
              const label = prefix + (g.text.length > 52 ? g.text.slice(0, 50) + "…" : g.text);
              return <option key={g.id} value={g.id}>{label}</option>;
            })}
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
              <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182" }}>–</span>
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
                padding: "7px 14px", borderRadius: 8,
                border: "1.5px solid rgba(220,38,38,0.3)",
                background: "rgba(254,226,226,0.5)",
                cursor: "pointer",
                fontFamily: "'Inter:Regular', sans-serif", fontSize: 12,
                color: "#dc2626", whiteSpace: "nowrap",
              }}
            >
              Zrušit ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {/* evidence list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#717182", fontFamily: "'Inter:Regular', sans-serif", fontSize: 14 }}>
          Žádné záznamy neodpovídají vybraným filtrům.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(r => <EvidenceRecordCard key={r.id} r={r} goalNums={goalNums} onEdit={() => setEditRecord(r)} onDelete={() => setDeleteRecord(r)} />)}
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
      {deleteRecord && (
        <DeleteEvidenceModal
          record={deleteRecord}
          onClose={() => setDeleteRecord(null)}
          onConfirm={() => { removeEvidenceRecord(deleteRecord.id); setDeleteRecord(null); }}
        />
      )}
      {editRecord && (() => {
        const st = initialClasses.find(c => c.name === editRecord.className)?.students.find(x => x.id === editRecord.studentId);
        if (!st) return null;
        return <AddEvidenceModal student={st} className={editRecord.className} record={editRecord} onClose={() => setEditRecord(null)} />;
      })()}
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
    fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#0a0a0a",
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
        <h2 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 18, color: "#0a0a0a", margin: "0 0 6px" }}>
          Zaznamenat důkazy o učení
        </h2>
        <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182", margin: "0 0 24px", lineHeight: 1.5 }}>
          Vyberte třídu a cíl, ke kterému chcete zaznamenat důkazy.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12, color: "#717182", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
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
            <label style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12, color: "#717182", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
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
            <div style={{ background: "#fafafa", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8 }}>
              <span style={{ padding: "2px 8px", borderRadius: 20, background: "#f3e8ff", color: "#8200db", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11 }}>
                {selectedGoal.subject}
              </span>
              <span style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(236,236,240,0.9)", color: "#717182", fontFamily: "'Inter:Regular', sans-serif", fontSize: 11 }}>
                {selectedClass} · {students.length} žáků
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
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
      <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 22, lineHeight: "40px", color: "#0a0a0a", margin: 0, display: "flex", alignItems: "center" }}>
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

const monthOptions = ["Září 2026", "Říjen 2026", "Listopad 2026", "Prosinec 2026", "Leden 2027", "Únor 2027", "Březen 2027", "Duben 2027", "Květen 2027", "Červen 2027"];
const quarterOptions = ["1. čtvrtletí 2026/27", "2. čtvrtletí 2026/27", "3. čtvrtletí 2026/27", "4. čtvrtletí 2026/27"];
const halfOptions = ["1. pololetí 2026/27", "2. pololetí 2026/27"];

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

// Jak je žák připravený na hodnocení — stejná logika jako semafor ve třídě.
const READINESS = [
  { label: "Není připravený", color: "#dc2626", bg: "#fef2f2" },
  { label: "Ještě pár důkazů", color: "#b45309", bg: "#fffbeb" },
  { label: "Připravený", color: "#15803d", bg: "#f0fdf4" },
];
function readinessOf(studentId: string, className: string, tpGoals: TpGoal[], lessonsDone: Record<string, boolean>, records: EvidenceRecord[]) {
  const recs = records.filter(r => r.studentId === studentId);
  const taught = tpGoals
    .filter(g => g.trida === className)
    .filter(g => lessonsDone[g.id] || records.some(r => r.goalId === g.id))
    .map(g => g.id);
  if (taught.length === 0) {
    return { level: recs.length >= 6 ? 2 : recs.length >= 2 ? 1 : 0, count: recs.length, covered: 0, taught: 0 };
  }
  const covered = taught.filter(gid => recs.some(r => r.goalId === gid && r.level)).length;
  const share = covered / taught.length;
  return { level: share >= 0.9 ? 2 : share >= 0.4 ? 1 : 0, count: recs.length, covered, taught: taught.length };
}

// Škály, kterými učitel ladí tón zpětné vazby
const TONE_STEPS = 7;
const TONE_SCALES = [
  { id: "formalita", left: "Profesionální", right: "Přátelská" },
  { id: "delka", left: "Stručná", right: "Podrobná" },
  { id: "osobnost", left: "Obecná", right: "Osobní" },
];

function HodnoceniGeneratorPage({ onBack, onGenerate }: { onBack: () => void; onGenerate: (data: { students: StudentAssessment[]; period: string; className: string }) => void }) {
  const { tpGoals, lessonsDone, goToClasses } = useContext(GoalsContext);
  const { evidenceRecords } = useContext(EvidenceContext);
  const [selectedClassId, setSelectedClassId] = useState(initialClasses[0]?.id ?? "");
  const cls = initialClasses.find(c => c.id === selectedClassId) ?? initialClasses[0];
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<HodnoceniPeriod>("mesic");
  const [periodValue, setPeriodValue] = useState(monthOptions[0]);
  const [customFrom, setCustomFrom] = useState("2026-09-01");
  const [customTo, setCustomTo] = useState(new Date().toISOString().slice(0, 10));
  const [instruction, setInstruction] = useState("");
  const [tone, setTone] = useState<Record<string, number>>({ formalita: 3, delka: 3, osobnost: 4 });
  const [subject, setSubject] = useState("vse");
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
    fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#0a0a0a",
    background: "#fff", border: "1px solid rgba(0,0,0,0.13)", borderRadius: 9,
    padding: "8px 12px", outline: "none", cursor: "pointer", width: "100%",
  };

  return (
    <div style={{ padding: "32px 40px" }}>
      <Breadcrumb crumbs={[
        { label: "Formativní hodnocení" },
        { label: "Hodnocení", onClick: onBack },
        { label: "Nové hodnocení" },
      ]} />
      <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 22, lineHeight: "40px", color: "#0a0a0a", margin: "0 0 4px" }}>
        Vygenerovat hodnocení
      </h1>
      <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", margin: "0 0 28px", lineHeight: 1.55, maxWidth: 560 }}>
        Buddy navrhne slovní hodnocení žáků na základě zaznamenaných důkazů o učení.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 760 }}>
        {/* předmět a třída */}
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px", minWidth: 0 }}>
            <label style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a", marginBottom: 8 }}>
              Předmět
            </label>
            <select value={subject} onChange={e => setSubject(e.target.value)} style={selectStyle}>
              <option value="vse">Všechny předměty</option>
              {subjectOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>
          <div style={{ flex: "1 1 260px", minWidth: 0 }}>
        <div>
          <label style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a", marginBottom: 8 }}>
            Třída
          </label>
          <select value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setSelectedStudents(new Set()); }} style={selectStyle}>
            {initialClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

          </div>
        </div>

        {/* student list */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <label style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a" }}>
              Žáci
              {selectedStudents.size > 0 && (
                <span style={{ marginLeft: 8, fontFamily: "'Inter:Regular', sans-serif", fontWeight: 400, fontSize: 12, color: "#717182" }}>
                  {selectedStudents.size} vybráno
                </span>
              )}
            </label>
            <span style={{ display: "flex", gap: 14 }}>
              <button
                onClick={() => setSelectedStudents(new Set(cls.students.filter(st => readinessOf(st.id, cls.name, tpGoals, lessonsDone, evidenceRecords).level === 2).map(st => st.id)))}
                style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#15803d", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
              >
                Vybrat připravené
              </button>
              <button onClick={toggleAll} style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#0a0a0a", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                {allSelected ? "Zrušit výběr" : "Vybrat všechny"}
              </button>
            </span>
          </div>
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 12, overflow: "hidden", maxHeight: 300, overflowY: "auto" }}>
            {cls.students.map((st, i) => {
              const checked = selectedStudents.has(st.id);
              const rd = readinessOf(st.id, cls.name, tpGoals, lessonsDone, evidenceRecords);
              const rs = READINESS[rd.level];
              return (
                <button
                  key={st.id}
                  onClick={() => toggleStudent(st.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%",
                    padding: "10px 16px", background: checked ? "rgba(10,10,10,0.03)" : "transparent",
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
                  <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#0a0a0a", flexGrow: 1 }}>
                    {st.firstName} {st.lastName}
                  </span>
                  <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 11.5, color: "#8a8a99", whiteSpace: "nowrap" }}>
                    {rd.count} {rd.count === 1 ? "důkaz" : rd.count <= 4 ? "důkazy" : "důkazů"}
                  </span>
                  <span style={{
                    flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "3px 10px", borderRadius: 20, background: rs.bg, color: rs.color,
                    fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11,
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: rs.color, display: "block" }} />
                    {rs.label}
                  </span>
                  {rd.level < 2 && (
                    <span
                      role="link"
                      tabIndex={0}
                      onClick={e => { e.stopPropagation(); goToClasses(); }}
                      onKeyDown={e => { if (e.key === "Enter") { e.stopPropagation(); goToClasses(); } }}
                      style={{
                        flexShrink: 0, padding: "3px 10px", borderRadius: 20, cursor: "pointer",
                        border: "1px solid rgba(124,58,237,0.3)", background: "#fff", color: "#5b21b6",
                        fontFamily: "'Inter:Regular', sans-serif", fontSize: 11, whiteSpace: "nowrap",
                      }}
                    >
                      Přidat důkazy
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* časové období */}
        <div>
          <label style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a", marginBottom: 10 }}>
            Časové období
          </label>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {(["mesic", "ctvrtleti", "pololeti", "vlastni"] as HodnoceniPeriod[]).map(p => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                style={{
                  padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
                  borderColor: period === p ? "#0a0a0a" : "rgba(0,0,0,0.13)",
                  background: period === p ? "#0a0a0a" : "#fff",
                  color: period === p ? "#fff" : "#717182",
                  fontFamily: period === p ? "'Inter:Medium', sans-serif" : "'Inter:Regular', sans-serif",
                  fontSize: 13, cursor: "pointer", transition: "all 0.12s",
                }}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
          {period === "vlastni" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182", marginBottom: 4 }}>Od</label>
                <input
                  type="date"
                  value={customFrom}
                  max={customTo}
                  onChange={e => setCustomFrom(e.target.value)}
                  style={{ ...selectStyle, width: "100%", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flexShrink: 0, color: "#b0b0be", fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, paddingTop: 20 }}>—</div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182", marginBottom: 4 }}>Do</label>
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

        {/* jak má zpětná vazba znít */}
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a", marginBottom: 12 }}>
            <span style={{ color: "#7c3aed", display: "flex" }}><SparkleIcon /></span>
            Jak chci, aby zpětná vazba zněla
          </label>
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 12, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
            {TONE_SCALES.map(sc => (
              <div key={sc.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: tone[sc.id] <= 2 ? "#0a0a0a" : "#8a8a99" }}>{sc.left}</span>
                  <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: tone[sc.id] >= 4 ? "#0a0a0a" : "#8a8a99" }}>{sc.right}</span>
                </div>
                <div style={{ position: "relative" }}>
                  {/* krokové čárky pod táhlem */}
                  <div style={{ position: "absolute", left: 7, right: 7, top: 17, display: "flex", justifyContent: "space-between", pointerEvents: "none" }}>
                    {Array.from({ length: TONE_STEPS }).map((_, i) => (
                      <span key={i} style={{ width: 1, height: 6, background: i === tone[sc.id] ? "#7c3aed" : "rgba(0,0,0,0.16)", display: "block" }} />
                    ))}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={TONE_STEPS - 1}
                    step={1}
                    value={tone[sc.id]}
                    aria-label={`${sc.left} až ${sc.right}`}
                    onChange={e => setTone(prev => ({ ...prev, [sc.id]: Number(e.target.value) }))}
                    style={{ width: "100%", accentColor: "#7c3aed", cursor: "pointer", position: "relative", zIndex: 1, margin: 0 }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p style={{ display: "flex", alignItems: "flex-start", gap: 8, fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182", lineHeight: 1.55, margin: "10px 0 0" }}>
            <span style={{
              flexShrink: 0, width: 15, height: 15, borderRadius: "50%", marginTop: 1,
              border: "1px solid rgba(0,0,0,0.22)", color: "#8a8a99",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Inter:Regular', sans-serif", fontSize: 10, lineHeight: 1,
            }}>i</span>
            Buddy píše podle metodiky formativního hodnocení. Popisuje pokrok, drží se faktů a podporuje žáka.
          </p>
        </div>

        {/* volný pokyn */}
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a", marginBottom: 8 }}>
            <span style={{ color: "#7c3aed", display: "flex" }}><SparkleIcon /></span>
            Pokyn pro Buddyho
            <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontWeight: 400, color: "#717182" }}>(volitelné)</span>
          </label>
          <textarea
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder="Např. Zmiň u každého žáka jeden konkrétní pokrok a jeden další krok…"
            rows={3}
            style={{
              width: "100%", resize: "vertical", padding: "10px 14px", boxSizing: "border-box",
              fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#0a0a0a",
              background: "#fff", border: "1px solid rgba(0,0,0,0.13)", borderRadius: 9,
              outline: "none", lineHeight: 1.6,
            }}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={selectedStudents.size === 0 || generating}
          style={{
            alignSelf: "flex-start", padding: "12px 22px",
            display: "flex", alignItems: "center", gap: 8,
            background: selectedStudents.size === 0 ? "rgba(10,10,10,0.3)" : "#0a0a0a",
            color: "#fff", border: "none", borderRadius: 12, cursor: selectedStudents.size === 0 ? "default" : "pointer",
            fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14.5,
            transition: "background 0.15s", opacity: generating ? 0.6 : 1,
          }}
        >
          <SparkleIcon />
          {generating ? "Generuji…" : `Generovat návrh${selectedStudents.size ? ` pro ${selectedStudents.size} ${selectedStudents.size === 1 ? "žáka" : selectedStudents.size <= 4 ? "žáky" : "žáků"}` : ""}`}
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
  const openBuddy = useContext(BuddyContext);
  const { evidenceRecords } = useContext(EvidenceContext);
  const { tpGoals } = useContext(GoalsContext);
  const goalNums = buildGoalNumbers(tpGoals);
  const [students, setStudents] = useState(initialStudents);
  // čerstvě vygenerované hodnocení rovnou otevře Buddyho, ať je po ruce
  useEffect(() => {
    if (!readOnly) openBuddy(`Hodnocení ${className} · ${period}`);
  }, []);
  const [activeId, setActiveId] = useState(initialStudents[0]?.studentId ?? "");
  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editing, setEditing] = useState(!readOnly);

  const active = students.find(s => s.studentId === activeId) ?? students[0];
  const idx = students.findIndex(s => s.studentId === active?.studentId);

  function updateText(id: string, text: string) {
    setStudents(prev => prev.map(s => s.studentId === id ? { ...s, text } : s));
  }

  function copyActive() {
    if (!active) return;
    navigator.clipboard?.writeText(active.text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const chip = (label: string, value: string) => (
    <span style={{
      display: "inline-flex", alignItems: "baseline", gap: 6,
      padding: "5px 12px", borderRadius: 20, background: "rgba(236,236,240,0.9)",
    }}>
      <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 11, color: "#8a8a99" }}>{label}</span>
      <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12.5, color: "#0a0a0a" }}>{value}</span>
    </span>
  );

  const actionBtn = (label: string, onClick: () => void, node?: React.ReactNode) => (
    <button
      onClick={onClick}
      style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}
    >
      {node}
      {label}
    </button>
  );

  return (
    <div style={{ padding: "32px 40px" }}>
      <Breadcrumb crumbs={[
        { label: "Formativní hodnocení" },
        { label: "Hodnocení", onClick: onBack },
        { label: title },
      ]} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 10 }}>
        <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 22, lineHeight: "40px", color: "#0a0a0a", margin: 0 }}>
          {title}
        </h1>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, position: "relative" }}>
          <div style={{ position: "relative" }}>
            {actionBtn("Exportovat", () => setExportOpen(o => !o), (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2v7.5M5.3 7l2.7 2.7L10.7 7M2.5 12.5v0.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-0.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ))}
            {exportOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 30, minWidth: 150,
                background: "#fff", borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden",
              }}>
                {["PDF", "Word", "Do schránky celé"].map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => {
                      setExportOpen(false);
                      if (fmt === "Do schránky celé") {
                        navigator.clipboard?.writeText(students.map(x => `${x.studentName}\n${x.text}`).join("\n\n")).catch(() => {});
                      }
                    }}
                    style={{
                      display: "block", width: "100%", padding: "9px 14px", border: "none", background: "none",
                      cursor: "pointer", textAlign: "left",
                      fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#0a0a0a",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f7")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>
          {readOnly
            ? actionBtn(editing ? "Hotovo" : "Upravit", () => setEditing(e => !e), <IconEdit />)
            : onSave && (
              <button onClick={() => onSave(students)} style={{ ...btnStyle("primary"), whiteSpace: "nowrap" }}>
                Uložit hodnocení
              </button>
            )}
        </div>
      </div>

      {/* na čem hodnocení stojí */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 24 }}>
        {chip("Třída", className)}
        {chip("Období", period)}
        {chip("Žáků", String(students.length))}
        {chip("Vytvořeno", createdAt)}
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", maxWidth: 1080 }}>
        {/* seznam žáků */}
        <div style={{ width: 230, flexShrink: 0, background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.09)", overflow: "hidden" }}>
          {students.map((st, i) => {
            const on = st.studentId === active?.studentId;
            return (
              <button
                key={st.studentId}
                onClick={() => setActiveId(st.studentId)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  padding: "9px 12px", border: "none",
                  borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.06)",
                  borderLeft: on ? "3px solid #0a0a0a" : "3px solid transparent",
                  background: on ? "rgba(10,10,10,0.04)" : "transparent",
                  cursor: "pointer", transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = "rgba(236,236,240,0.5)"; }}
                onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: avatarColor(st.studentName),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 9.5, color: "#fff",
                }}>
                  {st.studentName.split(" ").map(w => w[0]).slice(0, 2).join("")}
                </span>
                <span style={{
                  fontFamily: on ? "'Inter:Medium', sans-serif" : "'Inter:Regular', sans-serif",
                  fontWeight: on ? 500 : 400, fontSize: 13, color: "#0a0a0a",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {st.studentName}
                </span>
              </button>
            );
          })}
        </div>

        {/* text hodnocení */}
        {active && (
          <div style={{ flex: 1, minWidth: 0, background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.09)", padding: "22px 26px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: avatarColor(active.studentName),
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12, color: "#fff",
              }}>
                {active.studentName.split(" ").map(w => w[0]).slice(0, 2).join("")}
              </span>
              <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a", flexGrow: 1 }}>
                {active.studentName}
              </span>
              <button
                onClick={copyActive}
                title="Kopírovat text hodnocení"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 11px", borderRadius: 20, cursor: "pointer",
                  border: "1px solid rgba(0,0,0,0.13)", background: "#fff", color: copied ? "#15803d" : "#5c5c6b",
                  fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, whiteSpace: "nowrap",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="5.5" y="5.5" width="8" height="9" rx="1.3" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M10.5 5.5v-2a1.3 1.3 0 0 0-1.3-1.3H3.8a1.3 1.3 0 0 0-1.3 1.3v5.4a1.3 1.3 0 0 0 1.3 1.3h1.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                {copied ? "Zkopírováno" : "Kopírovat"}
              </button>
              <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 11.5, color: "#8a8a99" }}>
                {idx + 1} z {students.length}
              </span>
              <span style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => setActiveId(students[Math.max(0, idx - 1)]?.studentId ?? activeId)}
                  aria-label="Předchozí žák"
                  style={{ width: 26, height: 26, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#5c5c6b" }}
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button
                  onClick={() => setActiveId(students[Math.min(students.length - 1, idx + 1)]?.studentId ?? activeId)}
                  aria-label="Další žák"
                  style={{ width: 26, height: 26, borderRadius: 8, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#5c5c6b" }}
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </span>
            </div>

            {editing ? (
              <textarea
                value={active.text}
                onChange={e => updateText(active.studentId, e.target.value)}
                rows={9}
                style={{
                  width: "100%", resize: "vertical", padding: "12px 14px", boxSizing: "border-box",
                  fontFamily: "'Inter:Regular', sans-serif", fontSize: 14.5, color: "#0a0a0a",
                  background: "#fafafa", border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: 10,
                  outline: "none", lineHeight: 1.8,
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.25)"; e.currentTarget.style.background = "#fff"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)"; e.currentTarget.style.background = "#fafafa"; }}
              />
            ) : (
              <p
                style={{
                  fontFamily: "'Inter:Regular', sans-serif", fontSize: 14.5, color: "#0a0a0a",
                  lineHeight: 1.8, margin: 0, padding: "12px 14px", borderRadius: 10,
                  border: "1.5px solid transparent", transition: "background 0.12s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(236,236,240,0.5)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {active.text}
              </p>
            )}

            {/* jak má Buddy text přepsat */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#5b21b6" }}>
                <SparkleIcon />
                Přepsat:
              </span>
              {["Zkrátit", "Prodloužit", "Konkrétněji", "Vlídněji", "Věcněji"].map(lbl => (
                <button
                  key={lbl}
                  onClick={() => openBuddy(`${lbl} hodnocení: ${active.studentName}`)}
                  style={{
                    padding: "5px 11px", borderRadius: 20, cursor: "pointer",
                    border: "1px solid rgba(124,58,237,0.3)", background: "#fff", color: "#5b21b6",
                    fontFamily: "'Inter:Regular', sans-serif", fontSize: 12,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f3e8ff")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                >
                  {lbl}
                </button>
              ))}
            </div>

            {/* z čeho hodnocení vychází */}
            {(() => {
              const basis = evidenceRecords
                .filter(r => r.studentId === active.studentId)
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 5);
              return (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#717182", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                    Napsáno z těchto důkazů o učení
                  </p>
                  {basis.length === 0 ? (
                    <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#8a8a99", margin: 0 }}>
                      U tohohle žáka zatím nejsou žádné důkazy — text je proto obecný.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {basis.map(r => <EvidenceRecordCard key={r.id} r={r} goalNums={goalNums} hideStudent />)}
                    </div>
                  )}
                </div>
              );
            })()}
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
        <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 22, lineHeight: "40px", color: "#0a0a0a", margin: 0, display: "flex", alignItems: "center" }}>
          Hodnocení
          <PageHelp
            text="Slovní hodnocení, které Buddy sestaví z důkazů o učení. Popisuje pokrok žáka vlastními slovy místo známky — vy si ho pak upravíte a exportujete."
            buddy="Hodnocení"
          />
        </h1>
        <button
          onClick={() => setView("generating")}
          style={{ ...btnStyle("primary"), padding: "8px 16px", borderRadius: 10, fontSize: 13.5, display: "flex", alignItems: "center", gap: 7 }}
        >
          <SparkleIcon />
          Vygenerovat hodnocení
        </button>
      </div>

      {hodnoceni.length === 0 ? (
        <div style={{ padding: "44px 0 72px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
            <AssessmentPreviewIllustration />
          </div>
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 17, color: "#0a0a0a", margin: "18px 0 8px" }}>
            Slovní hodnocení psané za vás
          </p>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13.5, color: "#717182", margin: "0 auto 22px", lineHeight: 1.65, maxWidth: 430 }}>
            Z důkazů o učení, které jste u žáků nasbírali, sestaví Buddy návrh hodnocení pro celou
            třídu najednou. Vy ho pak jen projdete a doladíte vlastními slovy.
          </p>
          <button
            onClick={() => setView("generating")}
            style={{ ...btnStyle("primary"), display: "inline-flex", alignItems: "center", gap: 7 }}
          >
            <SparkleIcon />
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
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                width: "100%", padding: "16px 20px", background: "transparent", border: "none",
                borderTop: i === 0 ? "none" : "1px solid rgba(0,0,0,0.07)",
                cursor: "pointer", textAlign: "left", transition: "background 0.12s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(236,236,240,0.35)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div>
                <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, color: "#0a0a0a", margin: "0 0 3px" }}>
                  {h.title}
                </p>
                <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182", margin: 0 }}>
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
  { id: "cile", label: "Cíle vyučovacích hodin", defaultOn: true },
  { id: "tema", label: "Témata", defaultOn: true },
  { id: "rozsahHodin", label: "Rozsah hodin", defaultOn: false },
  { id: "pocetHodin", label: "Počet hodin", defaultOn: false },
  { id: "vystupy", label: "Výstupy", defaultOn: false },
  { id: "rvp", label: "RVP odkaz", defaultOn: false },
];

interface TpRow {
  // _id páruje řádek plánu s vyučovací hodinou, která z něj vznikla
  _id: string;
  cas: string; tema: string; rozsah: string; pocet: string; cile: string; vystupy: string; rvp: string;
  _monthSpan?: number; _isMonthStart?: boolean;
}

type MesicData = { cas: string; topics: { tema: string; rozsah: string; cile: string; vystupy?: string; rvp?: string }[] };

// Cíle se formulují buď z pohledu žáka, nebo z první osoby. Přepínač ve filtru
// přepíše texty, takže se edituje vždycky to, co je vidět.
const VERB_3_TO_1: Record<string, string> = {
  "zopakuje": "zopakuji", "odstraní": "odstraním", "rozliší": "rozliším", "pojmenuje": "pojmenuji",
  "vyslovuje": "vyslovuji", "rozlišuje": "rozlišuji", "napíše": "napíšu", "vyjmenuje": "vyjmenuji",
  "určí": "určím", "skloňuje": "skloňuji", "uplatní": "uplatním", "časuje": "časuji",
  "rozezná": "rozeznám", "použije": "použiji", "píše": "píšu", "vysvětlí": "vysvětlím",
  "uvede": "uvedu", "odvodí": "odvodím", "identifikuje": "identifikuji", "opraví": "opravím",
  "odliší": "odliším", "rozpozná": "rozpoznám", "umístí": "umístím", "zapíše": "zapíšu",
  "uvozuje": "uvozuji", "interpunguje": "interpunguji", "převede": "převedu", "popíše": "popíšu",
  "charakterizuje": "charakterizuji", "formuluje": "formuluji", "propojí": "propojím", "upevní": "upevním",
  "vytvoří": "vytvořím", "představí": "představím", "zhodnotí": "zhodnotím", "stanoví": "stanovím",
  "prokáže": "prokážu", "vybere": "vyberu", "okomentuje": "okomentuji", "reflektuje": "reflektuji",
  "zorientuje": "zorientuji", "obnoví": "obnovím", "vyplní": "vyplním", "porozumí": "porozumím",
  "aplikuje": "aplikuji", "řeší": "řeším", "odstraňuje": "odstraňuji", "spolupracuje": "spolupracuji",
  "sdílí": "sdílím", "zaznačí": "zaznačím", "zvládne": "zvládnu", "procvičuje": "procvičuji",
  "splní": "splním", "vypracuje": "vypracuji", "odevzdá": "odevzdám", "sebehodnotí": "sebehodnotím",
};
const VERB_1_TO_3: Record<string, string> = Object.fromEntries(
  Object.entries(VERB_3_TO_1).map(([a, b]) => [b, a]),
);

function convertVerbs(text: string, dict: Record<string, string>) {
  return text.replace(/[a-záčďéěíňóřšťúůýž]+/gi, w => {
    const hit = dict[w.toLowerCase()];
    if (!hit) return w;
    return w[0] === w[0].toUpperCase() ? hit[0].toUpperCase() + hit.slice(1) : hit;
  });
}

function cileToOsoba(text: string, osoba: "zak" | "ja") {
  const t = text.trim();
  if (!t) return text;
  if (osoba === "ja") {
    if (!/^Žák\b/.test(t)) return text;
    // „Žák si zopakuje" → „Zopakuji si": zvratné zájmeno nesmí větu začínat
    let rest = convertVerbs(t.replace(/^Žák\s+/, ""), VERB_3_TO_1)
      .replace(/^(si|se)\s+(\S+)/, "$2 $1");
    return rest.charAt(0).toUpperCase() + rest.slice(1);
  }
  if (/^Žák\b/.test(t)) return text;
  const rest = convertVerbs(t, VERB_1_TO_3).replace(/^(\S+)\s+(si|se)\b/, "$2 $1");
  return "Žák " + rest.charAt(0).toLowerCase() + rest.slice(1);
}

// Výstup hodiny se odvozuje z tématu — učitel ho pak může přepsat.
function vystupForTema(tema: string) {
  const t = tema.toLowerCase();
  if (/diktát|pravopis|koncovk/.test(t)) return "Diktát s rozborem chyb";
  if (/sloh|popis|vypravován|dialog|časopis|text/.test(t)) return "Napsaný text v portfoliu žáka";
  if (/projekt|prezentac/.test(t)) return "Prezentace před třídou";
  if (/sebehodnoc|reflexe|pohovor|portfolio/.test(t)) return "Vyplněný sebehodnoticí arch";
  if (/opakován|test|hodnotící|zjišťován/.test(t)) return "Vyplněný pracovní list";
  return "Zápis v sešitě a ústní ověření";
}

function buildMesiceRows(mesiceData: MesicData[]): TpRow[] {
  const rows: TpRow[] = [];
  for (const m of mesiceData) {
    m.topics.forEach((t, i) => {
      rows.push({
        _id: uid(),
        cas: m.cas,
        tema: t.tema,
        rozsah: t.rozsah,
        pocet: String(m.topics.reduce((s, x) => s + parseInt(x.rozsah || "0"), 0)),
        cile: t.cile,
        vystupy: t.vystupy ?? vystupForTema(t.tema),
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

// Aplikace startuje prázdná — plán i hodiny vzniknou až generováním.
const initialPlans: TpPlan[] = [];

function AutoTextarea({ value, onChange, color }: { value: string; onChange: (v: string) => void; color?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Výšku je potřeba přepočítat nejen při změně textu, ale i když se změní šířka
  // buňky (užší okno, otevření Buddy panelu) — jinak se text přelomí na víc řádků,
  // výška zůstane stará a přebytek zmizí pod overflow: hidden.
  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, []);
  useEffect(resize);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [resize]);
  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", display: "block", boxSizing: "border-box",
        padding: "4px 7px", borderRadius: 6, border: "1.5px solid transparent",
        fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, lineHeight: 1.55,
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

// Z kolika řádků plánu se mají udělat vyučovací hodiny
function GenerateLessonsModal({ months, countFor, onClose, onConfirm }: {
  months: string[];
  countFor: (month: string) => number;
  onClose: () => void;
  onConfirm: (months: string[] | undefined) => void;
}) {
  const [mode, setMode] = useState<"vse" | "vyber">("vse");
  const [picked, setPicked] = useState<Set<string>>(new Set(months.slice(0, 1)));
  const total = months.reduce((n, m) => n + countFor(m), 0);
  const pickedCount = months.filter(m => picked.has(m)).reduce((n, m) => n + countFor(m), 0);
  const count = mode === "vse" ? total : pickedCount;

  return (
    <Modal title="Generovat plán hodin" onClose={onClose} width={520}>
      <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13.5, color: "#717182", lineHeight: 1.6, margin: "0 0 16px" }}>
        Z každého řádku plánu vznikne jedna vyučovací hodina i s kritérii hodnocení.
        Můžete je vytvořit pro celý plán, nebo jen pro některé časové jednotky.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {([["vse", `Celý plán — ${total} ${total === 1 ? "hodina" : total <= 4 ? "hodiny" : "hodin"}`],
           ["vyber", "Jen vybrané časové jednotky"]] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left",
              padding: "12px 14px", borderRadius: 12, cursor: "pointer",
              border: mode === m ? "1.5px solid #7c3aed" : "1.5px solid rgba(0,0,0,0.12)",
              background: mode === m ? "#faf5ff" : "#fff",
              transition: "border-color 0.12s, background 0.12s",
            }}
          >
            <span style={{
              width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
              border: mode === m ? "none" : "1.5px solid rgba(0,0,0,0.25)",
              background: mode === m ? "#7c3aed" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {mode === m && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />}
            </span>
            <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13.5, color: "#0a0a0a" }}>{label}</span>
          </button>
        ))}
      </div>

      {mode === "vyber" && (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", margin: "14px 0 0" }}>
          {months.map(m => {
            const on = picked.has(m);
            return (
              <button
                key={m}
                onClick={() => setPicked(prev => {
                  const next = new Set(prev);
                  next.has(m) ? next.delete(m) : next.add(m);
                  return next;
                })}
                aria-pressed={on}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 20, cursor: "pointer",
                  border: on ? "1.5px solid #7c3aed" : "1.5px solid rgba(0,0,0,0.12)",
                  background: on ? "#f3e8ff" : "#fff",
                  color: on ? "#5b21b6" : "#5c5c6b",
                  fontFamily: on ? "'Inter:Medium', sans-serif" : "'Inter:Regular', sans-serif",
                  fontWeight: on ? 500 : 400, fontSize: 12.5,
                  transition: "background 0.12s, border-color 0.12s",
                }}
              >
                {m}
                <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontWeight: 400, fontSize: 11, opacity: 0.75 }}>
                  {countFor(m)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12.5, color: "#717182", margin: "16px 0 0" }}>
        Vznikne {count} {count === 1 ? "vyučovací hodina" : count <= 4 ? "vyučovací hodiny" : "vyučovacích hodin"}.
      </p>

      <ModalActions
        onCancel={onClose}
        onConfirm={() => onConfirm(mode === "vse" ? undefined : months.filter(m => picked.has(m)))}
        confirmLabel="Generovat"
      />
    </Modal>
  );
}

function TematickyPlanView() {
  const openBuddy = useContext(BuddyContext);
  const { addTpGoals, navigateCile, planRows, setPlanRows, updatePlanRow, tpGoals, lessonsDone, schoolName, teacherName } = useContext(GoalsContext);
  const { evidenceRecords } = useContext(EvidenceContext);

  // Řádky plánu pro kartu v seznamu: u právě načteného plánu platí sdílený
  // stav (nese i úpravy ze seznamu hodin), jinak uložená kopie.
  const rowsOfPlan = (plan: TpPlan) => {
    const loaded = plan.rows.length > 0 && planRows.some(r => r._id === plan.rows[0]._id);
    return loaded ? planRows : plan.rows;
  };
  const { plans, setPlans } = useContext(GoalsContext);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [view, setView] = useState<"list" | "form" | "generating" | "result">("list");
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // result controls
  const [predmet, setPredmet] = useState("Čeština");
  const [trida, setTrida] = useState("3.A");
  const [unit, setUnit] = useState("měsíc");
  const [period, setPeriod] = useState("3 měsíce");
  const [nazevSkoly, setNazevSkoly] = useState(schoolName);
  const [vyucujici, setVyucujici] = useState(teacherName);
  const [cols, setCols] = useState<Set<TpColumn>>(new Set(["casJednotka", "tema", "cile"]));

  function toggleCol(id: TpColumn) {
    setCols(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // draggable column order (excludes fixed "Čas" and meta cols)
  const draggableCols: TpColumn[] = ["cile", "tema", "rozsahHodin", "pocetHodin", "vystupy", "rvp"];
  const [colOrder, setColOrder] = useState<TpColumn[]>(draggableCols);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  // Z jaké osoby mají být cíle formulované. Ovlivňuje generování nových cílů.
  const [cilOsoba, setCilOsoba] = useState<"zak" | "ja">("zak");
  function applyCilOsoba(osoba: "zak" | "ja") {
    if (osoba === cilOsoba) return;
    setCilOsoba(osoba);
    planRows.forEach(r => {
      const next = cileToOsoba(r.cile, osoba);
      if (next !== r.cile) updatePlanRow(r._id, { cile: next });
    });
  }
  const editRows = planRows;
  const setEditRows = setPlanRows;
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

  function handleGenerateCriteria(onlyMonths?: string[]) {
    const newGoals: TpGoal[] = editRows
      .filter(r => r.cile.trim())
      .filter(r => !onlyMonths || onlyMonths.includes(r.cas))
      .map(r => ({
        id: r._id,
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
    // Řádky se natáhnou z uložené kopie jen tehdy, když ve sdíleném stavu
    // ještě nejsou — jinak by se zahodily úpravy přišlé ze seznamu hodin.
    const alreadyLoaded = plan.rows.length > 0 && planRows.some(r => r._id === plan.rows[0]._id);
    if (!alreadyLoaded) setEditRows(plan.rows);
    setView("result");
  }

  const unitRef = useRef(unit + "|" + period);
  useEffect(() => {
    const key = unit + "|" + period;
    if (unitRef.current === key) return;
    unitRef.current = key;
    if (view === "result") setEditRows(buildRows(period, unit));
  }, [unit, period, view]);

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
          <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 22, lineHeight: "40px", color: "#0a0a0a", margin: 0, display: "flex", alignItems: "center" }}>
            Tématický plán
            <PageHelp
              text="Tématický plán je rozvrh učiva na celý rok — co se kdy probírá a jaký je cíl každé hodiny. Je to základ, ze kterého vzniknou vyučovací hodiny i důkazy o učení."
              buddy="Tématický plán"
            />
          </h1>
          <button
            onClick={() => { setText(""); setSelectedPlanId(null); setView("form"); }}
            style={{ ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 6 }}
          >
            <IconPlus />
            Vytvořit nový plán
          </button>
        </div>

        {plans.length === 0 ? (
          <div style={{ padding: "56px 0 80px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <PlanPreviewIllustration />
            </div>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 17, color: "#0a0a0a", margin: "18px 0 8px" }}>
              Začněte tím, co budete učit
            </p>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13.5, color: "#717182", margin: "0 auto 22px", lineHeight: 1.65, maxWidth: 420 }}>
              Napište pár vět o svém předmětu a Buddy z nich složí tématický plán na celý rok.
              Pak už jen doladíte, co je vaše — a z plánu vzniknou vyučovací hodiny.
            </p>
            <button
              onClick={() => { setText(""); setSelectedPlanId(null); setView("form"); }}
              style={{ ...btnStyle("primary"), display: "inline-flex", alignItems: "center", gap: 7 }}
            >
              <SparkleIcon />
              Vytvořit první plán
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, maxWidth: 1140 }}>
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
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0, marginTop: 1,
                      background: "rgba(0,0,0,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {/* list plánu s přehnutým rohem */}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M14 2.5H6.5A1.5 1.5 0 0 0 5 4v16a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 20V7.5L14 2.5z" stroke="#0a0a0a" strokeWidth="1.7" strokeLinejoin="round"/>
                        <path d="M14 2.5V7.5h5" stroke="#0a0a0a" strokeWidth="1.7" strokeLinejoin="round"/>
                        <path d="M8.5 12h7M8.5 15.5h7M8.5 18.5h4" stroke="#0a0a0a" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#717182", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Tématický plán
                      </span>
                      <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 15, color: "#0a0a0a", margin: 0, lineHeight: 1.3 }}>
                        {plan.name}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ padding: "2px 9px", borderRadius: 20, background: "rgba(0,0,0,0.08)", color: "#0a0a0a", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11 }}>
                      {plan.predmet}
                    </span>
                    <span style={{ padding: "2px 9px", borderRadius: 20, background: "rgba(0,0,0,0.05)", color: "#717182", fontFamily: "'Inter:Regular', sans-serif", fontSize: 11 }}>
                      {plan.trida}
                    </span>
                  </div>
                </div>

                {/* bottom: postup školním rokem */}
                {(() => {
                  const rows = rowsOfPlan(plan).filter(r => r.cile.trim());
                  const total = rows.length;
                  const done = rows.filter(r => lessonsDone[r._id]).length;
                  const firstMonth = rows[0]?.cas ?? "";
                  const lastMonth = rows[rows.length - 1]?.cas ?? "";
                  return (
                    <div style={{ padding: "13px 16px 14px", flex: 1, position: "relative", display: "flex", flexDirection: "column", gap: 8 }}>
                      {/* slabé linky, aby karta působila jako list plánu */}
                      {[0, 1].map(n => (
                        <div key={n} style={{
                          position: "absolute", left: 16, right: 16,
                          bottom: 13 + n * 17, height: 1,
                          background: "rgba(0,0,0,0.04)",
                        }} />
                      ))}

                      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 11, color: "#5c5c6b" }}>Probráno</span>
                        <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12, color: "#0a0a0a" }}>
                          {total === 0 ? "—" : `${done} z ${total} hodin`}
                        </span>
                      </div>

                      <div style={{ position: "relative", display: "flex", gap: 2 }}>
                        {(total ? rows : [null]).map((r, i) => (
                          <span key={i} style={{
                            flex: 1, height: 6, borderRadius: 2,
                            background: !r ? "#ececf0"
                              : lessonsDone[r._id] ? "#16a34a"
                              : tpGoals.some(g => g.id === r._id) ? "#93c5fd"
                              : "#ececf0",
                          }} />
                        ))}
                      </div>

                      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", fontFamily: "'Inter:Regular', sans-serif", fontSize: 11, color: "#8a8a99" }}>
                        <span>{firstMonth || plan.period}</span>
                        <span>{lastMonth && lastMonth !== firstMonth ? lastMonth : ""}</span>
                      </div>

                      <p style={{ position: "relative", fontFamily: "'Inter:Regular', sans-serif", fontSize: 11, color: "#8a8a99", margin: "auto 0 0" }}>
                        Uloženo {plan.savedAt}
                      </p>
                    </div>
                  );
                })()}
                </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (view === "generating") {
    return (
      <div style={{ padding: "32px 40px" }}>
        <Breadcrumb crumbs={[{ label: "Formativní hodnocení" }, { label: "Tématický plán" }]} />
        <div style={{ marginTop: 96, display: "flex", flexDirection: "column", alignItems: "center", gap: 28, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
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
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, color: "#0a0a0a" }}>
              {progress}%
            </span>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 20, color: "#0a0a0a", margin: "0 0 8px" }}>
              Generuji tématický plán…
            </p>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", margin: 0 }}>
              Buddy prochází obsah a skládá z něj strukturovaný plán výuky.
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
      const row = rows[ri];
      if (row) updatePlanRow(row._id, { [field]: val } as Partial<TpRow>);
    }
    const showSkola = cols.has("nazevSkoly");
    const showVyucujici = cols.has("vyucujici");
    // visible draggable cols in user order
    const activeCols = colOrder.filter(id => cols.has(id));

    const selectStyle: React.CSSProperties = {
      padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.10)",
      fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#0a0a0a",
      background: "#fcfcfd", boxShadow: "0 1px 1px rgba(0,0,0,0.03)", outline: "none", cursor: "pointer",
    };
    const thStyle: React.CSSProperties = {
      padding: "11px 14px", textAlign: "left",
      fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11,
      color: "#6b6b7a", textTransform: "uppercase", letterSpacing: "0.06em",
      background: "#fafafa", borderBottom: "1px solid rgba(0,0,0,0.08)",
      borderRight: "1px solid rgba(0,0,0,0.05)",
      whiteSpace: "nowrap", userSelect: "none",
    };
    const tdStyle: React.CSSProperties = {
      padding: "11px 14px", verticalAlign: "top",
      fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#0a0a0a",
      borderBottom: "1px solid rgba(0,0,0,0.05)", borderRight: "1px solid rgba(0,0,0,0.05)", lineHeight: 1.55,
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
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginTop: 28, marginBottom: 28 }}>
          <div>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#6b6b7a", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tématický plán</p>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Plán výuky"
              style={{
                fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 26, color: "#0a0a0a",
                background: "transparent", border: "1.5px solid transparent", borderRadius: 8,
                outline: "none", padding: "2px 8px", margin: "0 -8px",
                width: "calc(100% + 16px)", boxSizing: "border-box",
                transition: "background 0.12s, border-color 0.12s",
              }}
              onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = "rgba(236,236,240,0.6)"; }}
              onMouseLeave={e => { if (document.activeElement !== e.currentTarget) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; } }}
              onFocus={e => { e.currentTarget.style.background = "rgba(236,236,240,0.6)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.2)"; }}
              onBlur={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
            />
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0, alignItems: "center" }}>
            {/* export dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={e => { e.stopPropagation(); setExportOpen(o => !o); }}
                style={{ ...btnStyle("ghost"), display: "flex", alignItems: "center", gap: 6 }}
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
                      display: "flex", alignItems: "center", gap: 10, width: "100%",
                      padding: "10px 16px", border: "none", background: "none", cursor: "pointer",
                      fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#0a0a0a", textAlign: "left",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f7")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                    >
                      <span style={{ fontSize: 14 }}>{ico}</span> {fmt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setGenerateOpen(true)}
              style={{
                ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 6,
                background: "#7c3aed", color: "#fff",
              }}
            >
              <SparkleIcon />
              Generovat plán hodin
            </button>
            <button onClick={savePlan} style={{ ...btnStyle("primary"), display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13.333 10v2.667A1.333 1.333 0 0112 14H4a1.333 1.333 0 01-1.333-1.333V10M5.333 6.667L8 9.333l2.667-2.666M8 9.333V2" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {selectedPlanId ? "Uložit změny" : "Uložit plán"}
            </button>
          </div>
        </div>

        {/* controls panel */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.08)", padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
            {[
              { label: "Předmět", val: predmet, set: setPredmet, opts: subjectOptions },
              { label: "Třída", val: trida, set: setTrida, opts: ["1.A", "2.A", "3.A", "4.A", "5.A"] },
              { label: "Časová jednotka", val: unit, set: setUnit, opts: ["týden", "14 dní", "měsíc"] },
              { label: "Období", val: period, set: setPeriod, opts: ["3 měsíce", "1. pololetí", "2. pololetí", "celý rok"] },
              { label: "Formulace cílů", val: cilOsoba === "zak" ? "Žák…" : "Já…", set: (v: string) => applyCilOsoba(v === "Já…" ? "ja" : "zak"), opts: ["Žák…", "Já…"] },
            ].map(({ label, val, set, opts }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontSize: 11, color: "#717182", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                <select value={val} onChange={e => set(e.target.value)} style={selectStyle}>
                  {opts.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontSize: 11, color: "#717182", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: 4 }}>Sloupce</span>
            {tpColumns.map(col => {
              const on = cols.has(col.id);
              const locked = col.id === "cile" || col.id === "casJednotka";
              return (
                <button key={col.id} onClick={() => !locked && toggleCol(col.id)}
                  title={locked ? "Pevný sloupec — nejde vypnout" : undefined}
                  style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 20, border: "1px solid",
                  borderColor: on ? "#7c4dbd" : "rgba(0,0,0,0.12)",
                  background: on ? "rgba(124,77,189,0.08)" : "#fafafa",
                  fontFamily: on ? "'Inter:Medium', sans-serif" : "'Inter:Regular', sans-serif",
                  fontWeight: on ? 500 : 400,
                  fontSize: 12, color: on ? "#7c4dbd" : "#717182",
                  cursor: locked ? "default" : "pointer", transition: "all 0.13s",
                  opacity: locked ? 1 : undefined,
                }}>
                  {on && (
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
                      <path d="M3 8.4l3.2 3.2L13 4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {col.label}
                  {locked && (
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.55 }} aria-hidden="true">
                      <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
                      <path d="M5.8 7V5.2a2.2 2.2 0 0 1 4.4 0V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {(showSkola || showVyucujici) && (
            <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
              {showSkola && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontSize: 11, color: "#717182", textTransform: "uppercase", letterSpacing: "0.05em" }}>Název školy</span>
                  <input value={nazevSkoly} onChange={e => setNazevSkoly(e.target.value)} style={{ ...selectStyle, minWidth: 200 }} />
                </div>
              )}
              {showVyucujici && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontSize: 11, color: "#717182", textTransform: "uppercase", letterSpacing: "0.05em" }}>Vyučující</span>
                  <input value={vyucujici} onChange={e => setVyucujici(e.target.value)} style={{ ...selectStyle, minWidth: 200 }} />
                </div>
              )}
            </div>
          )}
        </div>

        {(showSkola || showVyucujici) && (
          <div style={{ display: "flex", gap: 24, marginBottom: 12, flexWrap: "wrap" }}>
            {showSkola && <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182" }}><strong style={{ fontFamily: "'Inter:Medium', sans-serif", color: "#0a0a0a" }}>Škola:</strong> {nazevSkoly}</span>}
            {showVyucujici && <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182" }}><strong style={{ fontFamily: "'Inter:Medium', sans-serif", color: "#0a0a0a" }}>Vyučující:</strong> {vyucujici}</span>}
          </div>
        )}

        {generateOpen && (
          <GenerateLessonsModal
            months={Array.from(new Set(editRows.filter(r => r.cile.trim()).map(r => r.cas)))}
            countFor={m => editRows.filter(r => r.cile.trim() && r.cas === m).length}
            onClose={() => setGenerateOpen(false)}
            onConfirm={months => { setGenerateOpen(false); handleGenerateCriteria(months); }}
          />
        )}

        {/* table with draggable columns */}
        <style>{`.tp-row:hover > td { background: rgba(0,0,0,0.018); }`}</style>
        <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid rgba(0,0,0,0.09)", background: "#fff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, borderRadius: "12px 0 0 0", cursor: "default", position: "relative" }}>Čas</th>
                <th style={{ ...thStyle, width: 28, padding: "11px 0" }} aria-label="Přetažení řádku" />
                {activeCols.map((colId, i) => {
                  const col = tpColumns.find(c => c.id === colId)!;
                  const isDragTarget = dragOver === i;
                  // úzké sloupce s čísly: název se zalomí, ať sloupec nezabírá půl tabulky
                  const isNarrowCol = colId === "rozsahHodin" || colId === "pocetHodin";
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
                        ...(isNarrowCol ? { width: 74, padding: "11px 8px", whiteSpace: "normal" } : null),
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: isNarrowCol ? 5 : 8, flexWrap: isNarrowCol ? "wrap" : "nowrap" }}>
                        <DragGrip size={13} opacity={0.35} />
                        <span style={isNarrowCol ? { whiteSpace: "normal", lineHeight: 1.3 } : undefined}>{col.label}</span>
                        <BuddyButton
                          onClick={e => { e.stopPropagation(); openBuddy(`Sloupec: ${col.label}`); }}
                          title="Přidat sloupec do kontextu Buddyho"
                          style={{ width: 20, height: 20 }}
                        />
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
                        width: 52, padding: "4px 7px", borderRadius: 6, border: "1.5px solid transparent",
                        fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, lineHeight: 1.5,
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
                    className="tp-row"
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
                          ...tdStyle, padding: "10px 12px", position: "relative",
                          borderTop: isDragOverMonth ? "2px solid #7c4dbd" : topBorder,
                          verticalAlign: "middle", textAlign: "center",
                          background: isDragOverMonth ? "rgba(124,77,189,0.07)" : "#fafafa",
                          borderRight: "1px solid rgba(0,0,0,0.06)",
                          whiteSpace: "nowrap", cursor: "grab",
                          transition: "background 0.1s",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {/* úchyt pro přetažení měsíce — vlevo od jeho názvu */}
                            <span style={{ color: "#0a0a0a", opacity: isMonthHovered ? 1 : 0.55, transition: "opacity 0.14s", display: "flex" }}>
                              <DragGrip size={14} opacity={isMonthHovered ? 0.4 : 0.18} />
                            </span>
                            <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a" }}>
                              {row.cas}
                            </span>
                          </div>
                          <BuddyButton
                            title={`Poslat ${row.cas} do chatu s Buddym`}
                            onClick={e => { e.stopPropagation(); openBuddy(`${monthLabel(row.cas)} v plánu ${predmet} · ${trida}`); }}
                          />
                        </div>
                      </td>
                    )}
                    <td
                      draggable
                      onDragStart={e => {
                        e.stopPropagation();
                        rowDragRef.current = { kind: "sub", fromMonth: monthKey, fromSubIdx: subIdx };
                      }}
                      onDragEnd={() => { rowDragRef.current = null; setRowDragOverMonth(null); setRowDragOverSub(null); }}
                      title="Přetažením změníte pořadí řádků"
                      style={{
                        ...tdStyle, width: 28, padding: "6px 0", textAlign: "center",
                        verticalAlign: "middle", cursor: "grab", color: "#0a0a0a",
                        borderTop: isMonthStart && !isDragOverSub ? topBorder : undefined,
                      }}
                    >
                      <span style={{ display: "inline-flex" }}>
                        <DragGrip size={14} opacity={hoveredMonthKey === monthKey ? 0.35 : 0.14} />
                      </span>
                    </td>
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

      <div style={{ display: "flex", gap: 48, alignItems: "flex-start", marginTop: 32, maxWidth: 1060 }}>
      <div style={{ maxWidth: 580, flex: "1 1 520px", minWidth: 0 }}>
        <FadeIn delay={0}>
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 11, color: "#8a8a99", textTransform: "uppercase", letterSpacing: "0.09em", margin: "0 0 8px" }}>
            Vytvořit nový plán
          </p>
          <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 30, color: "#0a0a0a", margin: "0 0 10px", lineHeight: 1.25 }}>
            Co chcete učit?
          </h1>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#717182", margin: "0 0 32px", lineHeight: 1.65, maxWidth: 480 }}>
            Napište, čemu se chcete věnovat. Buddy z toho složí tématický plán podle vašich
            představ — od časové jednotky přes konkrétní výstupy až po odkaz na RVP.
            Všechno pak budete moct pohodlně upravit a exportovat.
          </p>
        </FadeIn>

        <FadeIn delay={60}>
          <label style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a", marginBottom: 8 }}>
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
              padding: "12px 14px", borderRadius: 12,
              border: "1.5px solid rgba(0,0,0,0.15)",
              fontFamily: "'Inter:Regular', sans-serif", fontSize: 14, color: "#0a0a0a",
              lineHeight: 1.55, resize: "none", outline: "none",
              background: "#fff", transition: "border-color 0.15s",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "#0a0a0a")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)")}
          />
        </FadeIn>

        <FadeIn delay={120}>
          <div style={{ marginTop: 20 }}>
            <label style={{ display: "block", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a", marginBottom: 8 }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "1.5px solid rgba(0,0,0,0.12)", background: "#fafafa" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(124,77,189,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10.667 2H5.333A1.333 1.333 0 0 0 4 3.333v9.334A1.333 1.333 0 0 0 5.333 14h5.334A1.333 1.333 0 0 0 12 12.667V3.333A1.333 1.333 0 0 0 10.667 2z" stroke="#7c4dbd" strokeWidth="1.33" strokeLinejoin="round"/>
                    <path d="M6.667 5.333h2.666M6.667 8h2.666" stroke="#7c4dbd" strokeWidth="1.33" strokeLinecap="round"/>
                  </svg>
                </div>
                <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#0a0a0a", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
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
                  cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
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
                <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a" }}>Nahrát soubor</span>
                <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#717182" }}>PDF, Word nebo TXT · max. 3 MB</span>
              </button>
            )}
          </div>
        </FadeIn>

        <FadeIn delay={180}>
          <button
            onClick={() => {
              if (!text.trim() && !file) return;
              // prototyp generuje vždy češtinu pro 3.A — plán rovnou vznikne i v seznamu
              const rows = buildRows(period, unit);
              setPredmet("Čeština");
              setTrida("3.A");
              setEditRows(rows);
              if (!selectedPlanId) {
                const id = "tp" + Date.now();
                setSelectedPlanId(id);
                setPlans(prev => [...prev, {
                  id, name: text.trim() || "Čeština 3.A", predmet: "Čeština", trida: "3.A",
                  period, unit, rows, savedAt: new Date().toLocaleDateString("cs-CZ"),
                }]);
              }
              setView("generating");
            }}
            disabled={!text.trim() && !file}
            style={{
              ...btnStyle("primary"),
              marginTop: 28, display: "flex", alignItems: "center", gap: 8,
              opacity: (text.trim() || file) ? 1 : 0.4,
              cursor: (text.trim() || file) ? "pointer" : "default",
              fontSize: 15, padding: "13px 28px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M9 1C9 1 9.5 5.5 7 8C4.5 10.5 1 10 1 10C1 10 4.5 9.5 7 12C9.5 14.5 9 19 9 19C9 19 9.5 14.5 12 12C14.5 9.5 17 10 17 10C17 10 14.5 10.5 12 8C9.5 5.5 9 1 9 1Z" fill="currentColor"/>
            </svg>
            Generovat tématický plán
          </button>
        </FadeIn>
      </div>

      <FadeIn delay={240}>
        <div style={{ flex: "0 0 auto", paddingTop: 36 }}>
          <PlanPreviewIllustration />
        </div>
      </FadeIn>
      </div>
    </div>
  );
}

// buddy chat component
function BuddyChat({ open, onClose, trigger, context, onRemoveContext, onClearContext }: {
  open: boolean; onClose: () => void; trigger: { msg: string; key: number } | null;
  context: string[]; onRemoveContext: (label: string) => void; onClearContext: () => void;
}) {
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
          display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
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
            <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 14, color: "#0a0a0a", margin: 0 }}>Buddy</p>
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 12, color: "#9b72d0", margin: 0 }}>Váš pomocník</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#b0b0be", padding: 4, borderRadius: 6 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map(m => {
            const isAudio = m.text.startsWith("__audio__");
            const audioDur = isAudio ? parseInt(m.text.replace("__audio__", "")) : 0;
            const fmtDur = `${Math.floor(audioDur / 60)}:${String(audioDur % 60).padStart(2, "0")}`;
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", alignItems: "flex-end", gap: 8 }}>
                {m.role === "buddy" && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f3f0fa", border: "1px solid rgba(120,80,180,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <img src={buddyImg} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
                  </div>
                )}
                {isAudio ? (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
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
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.25)", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", left: 0, top: 0, width: "35%", height: "100%", background: "rgba(255,255,255,0.85)", borderRadius: 2 }} />
                      </div>
                      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 16 }}>
                        {Array.from({ length: 22 }, (_, i) => (
                          <div key={i} style={{ width: 2, borderRadius: 2, background: i < 8 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)", height: `${4 + Math.abs(Math.sin(i * 1.3) * 10)}px` }} />
                        ))}
                      </div>
                    </div>
                    <span style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.75)", flexShrink: 0 }}>{fmtDur}</span>
                  </div>
                ) : (
                  <div style={{
                    maxWidth: "78%", padding: "9px 13px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: m.role === "user" ? "#7c4dbd" : "#fff",
                    color: m.role === "user" ? "#fff" : "#0a0a0a",
                    fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, lineHeight: 1.55,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                  }}>
                    {m.text}
                  </div>
                )}
              </div>
            );
          })}
          {typing && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f3f0fa", border: "1px solid rgba(120,80,180,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <img src={buddyImg} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
              </div>
              <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", gap: 4, alignItems: "center" }}>
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

        {/* nasbíraný kontext */}
        {context.length > 0 && (
          <div style={{ padding: "10px 14px 0", background: "#fff", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 10, color: "#6b6b7a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Kontext
              </span>
              <button
                onClick={onClearContext}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "'Inter:Regular', sans-serif", fontSize: 11, color: "#6b6b7a" }}
              >
                Vyprázdnit
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {context.map(label => (
                <span key={label} style={{
                  display: "inline-flex", alignItems: "center", gap: 5, maxWidth: "100%",
                  padding: "3px 6px 3px 8px", borderRadius: 7,
                  background: "#f3e8ff", color: "#6b21a8",
                  fontFamily: "'Inter:Regular', sans-serif", fontSize: 11,
                }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 190 }}>{label}</span>
                  <button
                    onClick={() => onRemoveContext(label)}
                    title="Odebrat z kontextu"
                    aria-label={`Odebrat z kontextu: ${label}`}
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#6b21a8", display: "flex", flexShrink: 0 }}
                  >
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* input */}
        <div style={{ padding: "12px 14px", borderTop: context.length > 0 ? "none" : "1px solid rgba(0,0,0,0.07)", background: "#fff", flexShrink: 0 }}>
          {recording ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 14, background: "#fdf4ff", border: "1.5px solid #c084fc" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#e11d48", display: "block", flexShrink: 0, animation: "recPulse 1s ease-in-out infinite" }} />
              <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#7c4dbd", flex: 1 }}>
                Nahrávám… {Math.floor(recSeconds / 60)}:{String(recSeconds % 60).padStart(2, "0")}
              </span>
              <button
                onClick={stopRecording}
                style={{ padding: "6px 14px", borderRadius: 20, background: "#7c4dbd", border: "none", cursor: "pointer", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12, color: "#fff" }}
              >
                Odeslat
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
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
                  flex: 1, resize: "none", padding: "9px 12px", borderRadius: 12,
                  border: "1.5px solid rgba(0,0,0,0.12)", outline: "none",
                  fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#0a0a0a",
                  lineHeight: 1.5, background: "#faf9fc",
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
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 11, color: "#b0b0be", margin: "7px 0 0", textAlign: "center" }}>
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
          <p style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12, color: "#b0b0be", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 28px", textAlign: "center" }}>
            Jak to funguje?
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, maxWidth: 900, margin: "0 auto" }}>
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
              <div key={num} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{ width: "100%", borderRadius: 12, overflow: "hidden", background: "#f9f9fb", border: "1.5px solid rgba(0,0,0,0.07)", padding: "16px 12px" }}>
                  {illustration}
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: "#0a0a0a", marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 12, color: "#fff" }}>{num}</span>
                  </div>
                  <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#0a0a0a", lineHeight: 1.55, margin: 0 }}>{title}</p>
                </div>
              </div>
            ))}
          </div>

          {/* buddy intro */}
          <div style={{ marginTop: 32, display: "inline-flex", alignItems: "flex-end", gap: 10, background: "#faf9ff", border: "1.5px solid rgba(124,77,189,0.12)", borderRadius: 14, padding: "10px 14px 10px 14px" }}>
            <img src={buddyImg} alt="Buddy" style={{ width: 34, height: 34, objectFit: "contain", flexShrink: 0 }} />
            <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#3d3d52", lineHeight: 1.5, margin: 0, maxWidth: 380 }}>
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
        <div style={{ marginTop: 40, display: "flex", gap: 10, justifyContent: "center", maxWidth: 600, margin: "40px auto 0" }}>
          <input
            placeholder="Vyjmenovaná slova, třicetiletá válka…"
            style={{
              flex: 1, height: 48, borderRadius: 12, border: "1.5px solid rgba(0,0,0,0.14)",
              padding: "0 16px", fontFamily: "'Inter:Regular', sans-serif", fontSize: 14,
              color: "#0a0a0a", outline: "none", background: "#fff",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "#7c4dbd")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.14)")}
          />
          <button style={{
            height: 48, padding: "0 22px", borderRadius: 12, border: "none",
            background: "#0a0a0a", color: "#fff", fontFamily: "'Inter:Medium', sans-serif",
            fontWeight: 500, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap",
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
      <div style={{ position: "absolute", top: 28, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
        {steps.map((_, i) => (
          <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? "#0a0a0a" : "rgba(0,0,0,0.15)", transition: "width 0.2s, background 0.2s" }} />
        ))}
      </div>

      {/* content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 48px 120px", overflowY: "auto" }}>
        <div style={{ maxWidth: 960, width: "100%", textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 36, color: "#0a0a0a", margin: "0 0 16px", lineHeight: 1.2 }}>
            {current.title}
          </h1>
          <p style={{ fontFamily: "'Inter:Regular', sans-serif", fontSize: 16, color: "#717182", lineHeight: 1.55, margin: "0 auto", maxWidth: 560 }}>
            {current.subtitle}
          </p>
          {current.content}
        </div>
      </div>

      {/* bottom nav */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
          style={{ background: "none", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: 10, padding: "9px 20px", fontFamily: "'Inter:Regular', sans-serif", fontSize: 13, color: "#717182", cursor: "pointer" }}
        >
          {step === 0 ? "Přeskočit" : "Zpět"}
        </button>
        <button
          onClick={() => step < totalSteps - 1 ? setStep(s => s + 1) : onClose()}
          style={{ background: "#0a0a0a", border: "none", borderRadius: 10, padding: "9px 24px", fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#fff", cursor: "pointer" }}
        >
          {step < totalSteps - 1 ? "Pokračovat" : "Začít"}
        </button>
      </div>
    </div>
  );
}

// Vygenerované hodiny si s sebou nesou i důkazy o učení, aby prototyp
// nevypadal prázdně — kritéria a úrovně se berou z hodiny samotné.
function buildEvidenceForGoals(goals: TpGoal[]): EvidenceRecord[] {
  const levels = ["Začínám", "Rozvíjím", "Zvládám"];
  const out: EvidenceRecord[] = [];
  goals.slice(0, 4).forEach((g, gi) => {
    const students = initialClasses.find(c => c.name === g.trida)?.students ?? [];
    const mi = Math.max(0, LESSON_MONTHS.indexOf(g.month));
    const month = mi + 9 > 12 ? mi - 3 : mi + 9;
    const year = mi + 9 > 12 ? SCHOOL_YEAR_START + 1 : SCHOOL_YEAR_START;
    students.forEach((st, si) => {
      // pokrytí se liší žák od žáka: pár připravených, pár skoro, pár bez důkazů
      if (gi >= [4, 4, 3, 2, 0][si % 5]) return;
      const crit = g.criteria[(si + gi) % Math.max(1, g.criteria.length)];
      const day = 3 + ((si * 3 + gi) % 12);
      const start = (si + gi * 2) % (levels.length - 1);
      // dva důkazy ke stejnému kritériu, aby byl na žákovi vidět posun
      [0, 1].forEach(k => {
        out.push(er(
          `gen-${g.id}-${st.id}-${k}`, st.id, `${st.lastName}, ${st.firstName}`, g.trida,
          (si + gi + k) % 2 === 0 ? "audio" : "photo",
          g.id, g.text, g.subject,
          `${year}-${String(month).padStart(2, "0")}-${String(day + k * 9).padStart(2, "0")}`,
          crit?.label, levels[start + k],
        ));
      });
    });
  });
  return out;
}

export default function App() {
  const [active, setActive] = useState<NavItem>("tematicky-plan");
  const [navKey, setNavKey] = useState(0);
  const [buddyOpen, setBuddyOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [buddyTrigger, setBuddyTrigger] = useState<{ msg: string; key: number } | null>(null);
  const [buddyContext, setBuddyContext] = useState<string[]>([]);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [tpGoals, setTpGoals] = useState<TpGoal[]>([]);
  // Řádky tématického plánu žijí tady, aby je viděl plán i seznam hodin —
  // jsou to stejná data, jen dvě obrazovky.
  const [planRows, setPlanRows] = useState<TpRow[]>([]);
  const [plans, setPlans] = useState<TpPlan[]>(initialPlans);
  // které hodiny už jsou odučené — drží se nad navigací, ovlivňuje i kartu plánu
  const [lessonsDone, setLessonsDone] = useState<Record<string, boolean>>({});
  // stupnice, kterou používá škola — profil ji nastavuje pro celou aplikaci
  const [teacherName, setTeacherName] = useState("Mgr. Jana Nováková");
  const [schoolName, setSchoolName] = useState("ZŠ Mánesova");
  const [schoolLevelId, setSchoolLevelId] = useState("začínám");
  const [schoolCustomLevels, setSchoolCustomLevels] = useState<CustomLevel[]>(defaultCustomLevels);
  const [animateIn, setAnimateIn] = useState(false);
  const [studentEvidence, setStudentEvidence] = useState<Record<string, StudentEvidence>>(() => {
    const acc: Record<string, StudentEvidence> = {};
    sampleEvidenceRecords.forEach(r => {
      acc[r.studentId] = acc[r.studentId] ?? { audio: 0, photo: 0, note: 0 };
      acc[r.studentId][r.type] = (acc[r.studentId][r.type] ?? 0) + 1;
    });
    return acc;
  });
  const [evidenceRecords, setEvidenceRecords] = useState<EvidenceRecord[]>(sampleEvidenceRecords);
  const mainRef = useRef<HTMLElement>(null);

  const addStudentEvidence = useCallback((studentId: string, type: "audio" | "photo" | "note") => {
    setStudentEvidence(prev => ({
      ...prev,
      [studentId]: {
        audio: (prev[studentId]?.audio ?? 0) + (type === "audio" ? 1 : 0),
        photo: (prev[studentId]?.photo ?? 0) + (type === "photo" ? 1 : 0),
        note: (prev[studentId]?.note ?? 0) + (type === "note" ? 1 : 0),
      },
    }));
  }, []);

  const addEvidenceRecords = useCallback((records: EvidenceRecord[]) => {
    setEvidenceRecords(prev => [...prev, ...records]);
  }, []);

  const updateEvidenceRecord = useCallback((record: EvidenceRecord) => {
    setEvidenceRecords(prev => prev.map(r => r.id === record.id ? record : r));
  }, []);

  const removeEvidenceRecord = useCallback((id: string) => {
    setEvidenceRecords(prev => {
      const gone = prev.find(r => r.id === id);
      if (gone) {
        setStudentEvidence(se => {
          const cur = se[gone.studentId];
          if (!cur) return se;
          return { ...se, [gone.studentId]: { ...cur, [gone.type]: Math.max(0, (cur[gone.type] ?? 0) - 1) } };
        });
      }
      return prev.filter(r => r.id !== id);
    });
  }, []);

  const evidenceCtx: EvidenceCtx = { studentEvidence, addStudentEvidence, evidenceRecords, addEvidenceRecords, updateEvidenceRecord, removeEvidenceRecord };

  function navigate(id: NavItem) {
    setActive(id);
    setNavKey((k) => k + 1);
  }

  const goalsCtx: GoalsCtx = {
    tpGoals,
    animateIn,
    addTpGoals: (newGoals) => {
      const fresh = newGoals.filter(g => !tpGoals.some(x => x.id === g.id));
      setTpGoals(prev => {
        const existingIds = new Set(prev.map(g => g.id));
        return [...prev, ...newGoals.filter(g => !existingIds.has(g.id))];
      });
      // k novým hodinám rovnou i důkazy o učení, ať na ně navazuje zbytek aplikace
      const generated = buildEvidenceForGoals(fresh);
      if (generated.length) {
        setEvidenceRecords(prev => {
          const have = new Set(prev.map(r => r.id));
          return [...prev, ...generated.filter(r => !have.has(r.id))];
        });
        setStudentEvidence(prev => {
          const next = { ...prev };
          generated.forEach(r => {
            const cur = next[r.studentId] ?? { audio: 0, photo: 0, note: 0 };
            next[r.studentId] = { ...cur, [r.type]: (cur[r.type] ?? 0) + 1 };
          });
          return next;
        });
      }
      setAnimateIn(true);
      setTimeout(() => setAnimateIn(false), 3000);
    },
    removeTpGoal: (id) => {
      setTpGoals(prev => prev.filter(g => g.id !== id));
      // hodina a řádek plánu jsou stejná data, takže mizí obojí
      setPlanRows(prev => {
        const next = prev.filter(r => r._id !== id);
        const groups: Record<string, TpRow[]> = {};
        const order: string[] = [];
        for (const r of next) { if (!groups[r.cas]) { groups[r.cas] = []; order.push(r.cas); } groups[r.cas].push(r); }
        const out: TpRow[] = [];
        for (const m of order) groups[m].forEach((r, i) => out.push({ ...r, _isMonthStart: i === 0, _monthSpan: i === 0 ? groups[m].length : undefined }));
        return out;
      });
    },
    updateTpGoalText: (id, text) => {
      setTpGoals(prev => prev.map(g => g.id === id ? { ...g, text } : g));
      setPlanRows(prev => prev.map(r => r._id === id ? { ...r, cile: text } : r));
    },
    updateTpGoal: (id, patch) => {
      setTpGoals(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
      // co má hodina společné s řádkem plánu, se propíše i do plánu
      const rowPatch: Partial<TpRow> = {};
      if (patch.text !== undefined) rowPatch.cile = patch.text;
      if (patch.rozsah !== undefined) rowPatch.rozsah = patch.rozsah;
      if (patch.vystupy !== undefined) rowPatch.vystupy = patch.vystupy;
      if (patch.month !== undefined) rowPatch.cas = patch.month;
      if (Object.keys(rowPatch).length) {
        setPlanRows(prev => prev.map(r => r._id === id ? { ...r, ...rowPatch } : r));
      }
    },
    planRows,
    setPlanRows,
    plans,
    setPlans,
    lessonsDone,
    toggleLessonDone: (id) => setLessonsDone(prev => ({ ...prev, [id]: !prev[id] })),
    goToSettings: () => navigate("profil"),
    goToClasses: () => navigate("tridy"),
    openGuide: () => setOnboardingOpen(true),
    teacherName,
    setTeacherName,
    schoolName,
    setSchoolName,
    schoolLevelId,
    setSchoolLevelId,
    schoolCustomLevels,
    setSchoolCustomLevels,
    updatePlanRow: (rowId, patch) => {
      setPlanRows(prev => prev.map(r => r._id === rowId ? { ...r, ...patch } : r));
      // a naopak: úprava v plánu se projeví na hodině, která z řádku vznikla
      const goalPatch: Partial<TpGoal> = {};
      if (patch.cile !== undefined) goalPatch.text = patch.cile;
      if (patch.rozsah !== undefined) goalPatch.rozsah = patch.rozsah;
      if (patch.vystupy !== undefined) goalPatch.vystupy = patch.vystupy;
      if (patch.cas !== undefined) goalPatch.month = patch.cas;
      if (Object.keys(goalPatch).length) {
        setTpGoals(prev => prev.map(g => g.id === rowId ? { ...g, ...goalPatch } : g));
      }
    },
    navigateCile: () => {
      setActive("cile");
      setNavKey(k => k + 1);
      requestAnimationFrame(() => {
        mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
      });
    },
  };

  // Pomocníci pro proklikávání prototypu: rychle naplnit nebo vyprázdnit
  const devBtnStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", padding: "6px 8px", borderRadius: 9,
    border: "1px dashed rgba(0,0,0,0.14)", background: "transparent", color: "#9a9aa8",
    fontFamily: "'Inter:Regular', sans-serif", fontSize: 12,
    cursor: "pointer", width: "100%", textAlign: "left",
  };

  function clearPlanAndLessons() {
    setPlans([]);
    setPlanRows([]);
    setTpGoals([]);
    setLessonsDone({});
    setEvidenceRecords(prev => prev.filter(r => !r.id.startsWith("gen-") && !r.id.startsWith("ev")));
    navigate("tematicky-plan");
  }

  function addDemoPlan() {
    const rows = buildRows("3 měsíce", "měsíc");
    const id = "tp" + Date.now();
    setPlans([{
      id, name: "Čeština 3.A", predmet: "Čeština", trida: "3.A",
      period: "3 měsíce", unit: "měsíc", rows,
      savedAt: new Date().toLocaleDateString("cs-CZ"),
    }]);
    setPlanRows(rows);
    goalsCtx.addTpGoals(rows.filter(r => r.cile.trim()).map(r => ({
      id: r._id,
      text: r.cile,
      subject: "Čeština",
      trida: "3.A",
      month: r.cas,
      rozsah: r.rozsah,
      vystupy: r.vystupy,
      criteria: [
        { id: "c1", label: "Porozumění tématu", desc: "Žák prokazuje porozumění klíčovým pojmům a souvislostem." },
        { id: "c2", label: "Samostatnost", desc: "Žák pracuje na cíli samostatně a bez výzvy učitele." },
        { id: "c3", label: "Kvalita výstupu", desc: "Výstup je srozumitelný, úplný a odpovídá zadání." },
      ],
    })));
    navigate("cile");
  }

  // Klik na hvězdičku kontext přidá, neodešle rovnou zprávu — učitel vidí,
  // s čím Buddy pracuje, a může toho nasbírat víc.
  const openBuddyWith = useCallback((msg: string) => {
    setBuddyOpen(true);
    const label = msg.replace(/^Chci upravit\s+/i, "");
    setBuddyContext(prev => prev.includes(label) ? prev : [...prev, label]);
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
            <span style={{ fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 18, color: "#0a0a0a" }}>
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
                fontSize: 10, color: "#b0b0be", textTransform: "uppercase", letterSpacing: "0.07em",
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
                    fontSize: 13.5, letterSpacing: "-0.1px",
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
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {vaseVyuka.map(navBtn)}
                </div>

                {sectionLabel("Formativní hodnocení")}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {formativni.map(navBtn)}
                </div>

                <div style={{ flex: 1 }} />

                {!collapsed && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 4 }}>
                    <button onClick={() => navigate("napady")} style={devBtnStyle}>Nápady</button>
                    <button onClick={addDemoPlan} style={devBtnStyle}>Přidat plán a hodiny</button>
                    <button onClick={clearPlanAndLessons} style={devBtnStyle}>Vymazat plán a hodiny</button>

                    <button onClick={() => setOnboardingOpen(true)} style={devBtnStyle}>
                      Jak na formativní hodnocení
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </nav>

        {/* user */}
        <button
          onClick={() => navigate("profil")}
          title={collapsed ? "Nastavení" : undefined}
          style={{
            borderTop: "1px solid rgba(0,0,0,0.08)", borderLeft: "none", borderRight: "none", borderBottom: "none",
            padding: collapsed ? "12px 8px" : "12px 16px", display: "flex", alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start", gap: 10, width: "100%", textAlign: "left",
            background: active === "profil" ? "rgba(236,236,240,0.85)" : "transparent",
            cursor: "pointer", transition: "background 0.12s",
          }}
          onMouseEnter={e => { if (active !== "profil") e.currentTarget.style.background = "rgba(236,236,240,0.45)"; }}
          onMouseLeave={e => { if (active !== "profil") e.currentTarget.style.background = "transparent"; }}
        >
          <PersonAvatar size={30} />
          {!collapsed && (
            <span style={{
              flexGrow: 1, minWidth: 0,
              fontFamily: "'Inter:Medium', sans-serif", fontWeight: 500, fontSize: 13, color: "#0a0a0a",
              lineHeight: 1.35, wordBreak: "break-word",
            }}>
              {teacherName}
            </span>
          )}
          {!collapsed && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0, color: active === "profil" ? "#0a0a0a" : "#b0b0be" }}>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
            </svg>
          )}
        </button>
      </aside>

      {/* main */}
      <main ref={mainRef} className="flex-1 h-full overflow-auto">
        {active === "tridy" && <ClassesView key={navKey} />}
{active === "cile" && <CileView key={navKey} />}
        {active === "dukazy" && <DukazyView key={navKey} />}
        {active === "hodnoceni" && <HodnoceniView key={navKey} />}
        {active === "tematicky-plan" && <TematickyPlanView key={navKey} />}
        {active === "profil" && <ProfilView key={navKey} />}
        {active === "napady" && <NapadyView key={navKey} />}
      </main>

      {/* buddy chat panel — inline, part of the flex row */}
      <BuddyChat
        open={buddyOpen}
        onClose={() => setBuddyOpen(false)}
        trigger={buddyTrigger}
        context={buddyContext}
        onRemoveContext={label => setBuddyContext(prev => prev.filter(x => x !== label))}
        onClearContext={() => setBuddyContext([])}
      />
      {onboardingOpen && <OnboardingModal onClose={() => setOnboardingOpen(false)} />}

      {/* buddy button — hidden when chat is open */}
      {!buddyOpen && (
        <button
          title="Buddy"
          onClick={() => setBuddyOpen(true)}
          style={{
            position: "fixed", top: 12, right: 16, zIndex: 200,
            width: 44, height: 44, borderRadius: "50%",
            background: "#5b21b6",
            boxShadow: "0 2px 10px rgba(91,33,182,0.3), 0 1px 3px rgba(0,0,0,0.12)",
            border: "none",
            cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.18s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <img src={buddyImg} alt="Buddy" style={{ width: 26, height: 26, objectFit: "contain" }} />
        </button>
      )}
    </div>
    </BuddyContext.Provider>
    </GoalsContext.Provider>
    </EvidenceContext.Provider>
  );
}
