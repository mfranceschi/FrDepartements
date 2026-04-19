/**
 * Tests de propriétés (property-based) avec fast-check pour buildChoices.
 * Au lieu de cas hardcodés, fast-check génère des milliers d'entrées aléatoires
 * et vérifie des invariants universels.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  shuffle,
  buildDeptChoicesFacile,
  buildDeptChoicesDifficile,
  buildCodeChoicesFacile,
  buildCodeChoicesDifficile,
  buildRegionChoicesFacile,
  buildRegionChoicesDifficile,
  type DeptChoice,
  type RegionChoice,
} from '../quiz/buildChoices';
import { REGION_ADJACENCY } from '../data/regionAdjacency';

// ── Arbitraires ───────────────────────────────────────────────────────────────

const regionCodes = Object.keys(REGION_ADJACENCY);

const deptChoiceArb: fc.Arbitrary<DeptChoice> = fc.record({
  code: fc.stringMatching(/^[0-9]{2}$/).map((s) => s),
  nom: fc.string({ minLength: 2, maxLength: 20 }),
  regionCode: fc.constantFrom(...regionCodes),
});

/** Génère un tableau de ≥5 DeptChoice avec des codes uniques. */
const deptPoolArb: fc.Arbitrary<DeptChoice[]> = fc
  .uniqueArray(deptChoiceArb, { selector: (d) => d.code, minLength: 5, maxLength: 20 });

/** Génère un tableau de régions couvrant tous les codes du graphe d'adjacence. */
const regionPoolArb: fc.Arbitrary<RegionChoice[]> = fc.constant(
  regionCodes.map((code) => ({ code, nom: `Region-${code}` })),
);

// ── Invariants de shuffle ─────────────────────────────────────────────────────

describe('shuffle — propriétés', () => {
  it('conserve toujours tous les éléments (permutation)', () => {
    fc.assert(
      fc.property(fc.array(fc.integer(), { minLength: 0, maxLength: 20 }), (arr) => {
        const result = shuffle(arr);
        expect(result).toHaveLength(arr.length);
        expect([...result].sort((a, b) => a - b)).toEqual([...arr].sort((a, b) => a - b));
      }),
    );
  });

  it('ne mute jamais le tableau source', () => {
    fc.assert(
      fc.property(fc.array(fc.integer(), { minLength: 0, maxLength: 10 }), (arr) => {
        const original = [...arr];
        shuffle(arr);
        expect(arr).toEqual(original);
      }),
    );
  });
});

// ── Invariants de buildDeptChoicesFacile ─────────────────────────────────────

describe('buildDeptChoicesFacile — propriétés', () => {
  it('retourne toujours exactement 4 choix distincts avec 1 correct', () => {
    fc.assert(
      fc.property(deptPoolArb, (pool) => {
        const correct = pool[0];
        const choices = buildDeptChoicesFacile(correct, pool);
        expect(choices).toHaveLength(4);
        expect(new Set(choices.map((c) => c.code)).size).toBe(4);
        expect(choices.filter((c) => c.correct)).toHaveLength(1);
        expect(choices.find((c) => c.correct)!.code).toBe(correct.code);
      }),
    );
  });

  it('la bonne réponse est toujours dans les choix', () => {
    fc.assert(
      fc.property(deptPoolArb, (pool) => {
        const correct = pool[0];
        const choices = buildDeptChoicesFacile(correct, pool);
        expect(choices.some((c) => c.code === correct.code && c.correct)).toBe(true);
      }),
    );
  });
});

// ── Invariants de buildDeptChoicesDifficile ───────────────────────────────────

describe('buildDeptChoicesDifficile — propriétés', () => {
  it('retourne toujours exactement 4 choix distincts avec 1 correct', () => {
    fc.assert(
      fc.property(deptPoolArb, (pool) => {
        const correct = pool[0];
        const choices = buildDeptChoicesDifficile(correct, pool);
        expect(choices).toHaveLength(4);
        expect(new Set(choices.map((c) => c.code)).size).toBe(4);
        expect(choices.filter((c) => c.correct)).toHaveLength(1);
      }),
    );
  });
});

// ── Invariants de buildCodeChoicesFacile ─────────────────────────────────────

describe('buildCodeChoicesFacile — propriétés', () => {
  it('les choix sont toujours triés numériquement', () => {
    fc.assert(
      fc.property(deptPoolArb, (pool) => {
        const correct = pool[0];
        const choices = buildCodeChoicesFacile(correct, pool);
        const toNum = (code: string) =>
          code === '2A' ? 20.1 : code === '2B' ? 20.2 : parseInt(code, 10);
        const nums = choices.map((c) => toNum(c.code));
        for (let i = 1; i < nums.length; i++) {
          expect(nums[i]).toBeGreaterThanOrEqual(nums[i - 1]);
        }
      }),
    );
  });

  it('tous les labels sont égaux aux codes', () => {
    fc.assert(
      fc.property(deptPoolArb, (pool) => {
        const correct = pool[0];
        buildCodeChoicesFacile(correct, pool).forEach((c) => {
          expect(c.label).toBe(c.code);
        });
      }),
    );
  });
});

// ── Invariants de buildCodeChoicesDifficile ───────────────────────────────────

describe('buildCodeChoicesDifficile — propriétés', () => {
  it('retourne 4 choix triés numériquement avec 1 correct', () => {
    fc.assert(
      fc.property(deptPoolArb, (pool) => {
        const correct = pool[0];
        const choices = buildCodeChoicesDifficile(correct, pool);
        expect(choices).toHaveLength(4);
        const toNum = (code: string) =>
          code === '2A' ? 20.1 : code === '2B' ? 20.2 : parseInt(code, 10);
        const nums = choices.map((c) => toNum(c.code));
        for (let i = 1; i < nums.length; i++) {
          expect(nums[i]).toBeGreaterThanOrEqual(nums[i - 1]);
        }
      }),
    );
  });
});

// ── Invariants de buildRegionChoicesFacile ────────────────────────────────────

describe('buildRegionChoicesFacile — propriétés', () => {
  it('retourne toujours 4 choix distincts avec 1 correct', () => {
    fc.assert(
      fc.property(regionPoolArb, (pool) => {
        const correct = pool[0];
        const choices = buildRegionChoicesFacile(correct, pool);
        expect(choices).toHaveLength(4);
        expect(new Set(choices.map((c) => c.code)).size).toBe(4);
        expect(choices.filter((c) => c.correct)).toHaveLength(1);
        expect(choices.find((c) => c.correct)!.code).toBe(correct.code);
      }),
    );
  });
});

// ── Invariants de buildRegionChoicesDifficile ─────────────────────────────────

describe('buildRegionChoicesDifficile — propriétés', () => {
  it('retourne toujours 4 choix distincts avec 1 correct pour toutes les régions', () => {
    fc.assert(
      fc.property(regionPoolArb, (pool) => {
        // Teste chaque région comme bonne réponse possible
        for (const correct of pool) {
          const choices = buildRegionChoicesDifficile(correct, pool);
          expect(choices).toHaveLength(4);
          expect(new Set(choices.map((c) => c.code)).size).toBe(4);
          expect(choices.filter((c) => c.correct)).toHaveLength(1);
        }
      }),
    );
  });
});
