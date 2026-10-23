import { describe, expect, it } from 'vitest';
import { KNOWLEDGE_CARDS, KNOWLEDGE_CATEGORIES } from '../../src/data/knowledge';
import { PHRASES, REFLECTION_QUESTIONS } from '../../src/data/phrases';
import { CONNECTION_PROMPTS } from '../../src/data/connection';
import { ROUTINES } from '../../src/data/routines';

describe('contenido incluido', () => {
  it('tiene al menos 30 fichas completas, con ids únicos y todas las categorías', () => {
    expect(KNOWLEDGE_CARDS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(KNOWLEDGE_CARDS.map((c) => c.id)).size).toBe(KNOWLEDGE_CARDS.length);
    for (const c of KNOWLEDGE_CARDS) {
      expect(c.title.trim().length).toBeGreaterThan(3);
      for (const k of ['body', 'example', 'question', 'deeper'] as const) expect(c[k].trim().length).toBeGreaterThan(20);
    }
    for (const cat of KNOWLEDGE_CATEGORIES) expect(KNOWLEDGE_CARDS.some((c) => c.category === cat.id)).toBe(true);
  });

  it('no incluye citas textuales atribuidas (sin comillas de cita directa)', () => {
    for (const c of KNOWLEDGE_CARDS) expect(c.body).not.toMatch(/(dijo|escribió)\s*[:«"“]/i);
  });

  it('no depende de URLs externas', () => {
    const all = JSON.stringify([KNOWLEDGE_CARDS, PHRASES, REFLECTION_QUESTIONS, CONNECTION_PROMPTS, ROUTINES]);
    expect(all).not.toMatch(/https?:\/\//);
  });

  it('las propuestas de conexión tienen ids únicos', () => {
    expect(new Set(CONNECTION_PROMPTS.map((p) => p.id)).size).toBe(CONNECTION_PROMPTS.length);
  });
});
