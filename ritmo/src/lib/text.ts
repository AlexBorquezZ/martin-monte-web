/** Elige un elemento de forma estable para una fecha (no cambia en cada render). */
export function pickForDay<T>(items: readonly T[], key: string, salt = 0): T {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return items[Math.abs(h) % items.length];
}

export function clampText(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
