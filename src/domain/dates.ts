import type { DayISO } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

/** Jour local (pas UTC) : une quête faite à 23 h compte pour le jour du joueur. */
export function toDayISO(date: Date): DayISO {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parts(day: DayISO): [number, number, number] {
  const [y, m, d] = day.split("-").map(Number);
  return [y ?? 1970, m ?? 1, d ?? 1];
}

/** Nombre de jours de `from` à `to` (négatif si `to` est avant). Insensible aux changements d'heure. */
export function daysBetween(from: DayISO, to: DayISO): number {
  const [y1, m1, d1] = parts(from);
  const [y2, m2, d2] = parts(to);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

export function addDays(day: DayISO, n: number): DayISO {
  const [y, m, d] = parts(day);
  return toDayISO(new Date(y, m - 1, d + n));
}

export function isDayISO(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = parts(value);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function formatShort(day: DayISO): string {
  const [, m, d] = parts(day);
  return `${pad(d)}/${pad(m)}`;
}
