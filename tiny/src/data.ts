export interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Class {
  id: string;
  name: string;
  students: Student[];
}

function s(id: string, firstName: string, lastName: string): Student {
  return { id, firstName, lastName };
}

export const initialClasses: Class[] = [
  {
    id: "3a",
    name: "3.A",
    students: [
      s("3a-1", "Adam", "Beneš"),
      s("3a-2", "Anežka", "Blahová"),
      s("3a-3", "Barbora", "Čermáková"),
      s("3a-4", "Daniel", "Dvořák"),
      s("3a-5", "Eliška", "Fišerová"),
      s("3a-6", "Filip", "Hájek"),
      s("3a-7", "Gabriela", "Horáková"),
      s("3a-8", "Jan", "Jelínek"),
      s("3a-9", "Karolína", "Kopecká"),
      s("3a-10", "Lukáš", "Kratochvíl"),
      s("3a-11", "Marie", "Křížková"),
      s("3a-12", "Martin", "Macháček"),
      s("3a-13", "Natálie", "Marková"),
      s("3a-14", "Ondřej", "Novák"),
      s("3a-15", "Petra", "Pokorná"),
      s("3a-16", "Radek", "Procházka"),
      s("3a-17", "Simona", "Růžičková"),
      s("3a-18", "Tereza", "Sedláčková"),
      s("3a-19", "Tomáš", "Svoboda"),
      s("3a-20", "Veronika", "Šimánková"),
      s("3a-21", "Vojtěch", "Veselý"),
      s("3a-22", "Zuzana", "Zemánková"),
    ],
  },
];
