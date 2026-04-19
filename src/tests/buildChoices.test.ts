import { describe, it, expect } from 'vitest';
import {
  shuffle,
  buildDeptChoicesFacile,
  buildDeptChoicesDifficile,
  buildCodeChoicesFacile,
  buildCodeChoicesDifficile,
  buildRegionChoicesFacile,
  buildRegionChoicesDifficile,
  buildPrefDeptChoicesFacile,
  buildPrefDeptChoicesDifficile,
  buildPrefRegionChoicesFacile,
  buildPrefRegionChoicesDifficile,
  type DeptChoice,
  type RegionChoice,
  type PrefDeptChoice,
  type PrefRegionChoice,
} from '../quiz/buildChoices';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const region84: DeptChoice[] = [
  { code: '01', nom: 'Ain',          regionCode: '84' },
  { code: '03', nom: 'Allier',       regionCode: '84' },
  { code: '07', nom: 'Ardèche',      regionCode: '84' },
  { code: '15', nom: 'Cantal',       regionCode: '84' },
  { code: '26', nom: 'Drôme',        regionCode: '84' },
];

const region11: DeptChoice[] = [
  { code: '75', nom: 'Paris',         regionCode: '11' },
  { code: '77', nom: 'Seine-et-Marne', regionCode: '11' },
  { code: '78', nom: 'Yvelines',      regionCode: '11' },
];

const allDepts: DeptChoice[] = [...region84, ...region11];

const allRegions: RegionChoice[] = [
  { code: '11', nom: 'Île-de-France' },
  { code: '84', nom: 'Auvergne-Rhône-Alpes' },
  { code: '28', nom: 'Normandie' },
  { code: '32', nom: 'Hauts-de-France' },
  { code: '44', nom: 'Grand Est' },
];

const allPrefDepts: PrefDeptChoice[] = allDepts.map((d) => ({
  ...d,
  prefecture: `Pref-${d.code}`,
}));

const allPrefRegions: PrefRegionChoice[] = allRegions.map((r) => ({
  code: r.code,
  nom: r.nom,
  prefectureRegionale: `CapReg-${r.code}`,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function assertValid4Choices(choices: ReturnType<typeof buildDeptChoicesFacile>, correctCode: string) {
  expect(choices).toHaveLength(4);
  const codes = choices.map((c) => c.code);
  expect(new Set(codes).size).toBe(4);
  const corrects = choices.filter((c) => c.correct);
  expect(corrects).toHaveLength(1);
  expect(corrects[0].code).toBe(correctCode);
}

// ── shuffle ───────────────────────────────────────────────────────────────────

describe('shuffle', () => {
  it('retourne un tableau de même longueur', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr)).toHaveLength(arr.length);
  });

  it('ne mute pas le tableau original', () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    shuffle(arr);
    expect(arr).toEqual(copy);
  });

  it('contient les mêmes éléments', () => {
    const arr = ['a', 'b', 'c', 'd'];
    expect(shuffle(arr).sort()).toEqual(arr.sort());
  });
});

// ── buildDeptChoicesFacile ────────────────────────────────────────────────────

describe('buildDeptChoicesFacile', () => {
  const correct = region84[0];

  it('retourne 4 choix distincts avec exactement 1 correct', () => {
    const choices = buildDeptChoicesFacile(correct, allDepts);
    assertValid4Choices(choices, correct.code);
  });

  it('les labels sont des noms de départements', () => {
    const choices = buildDeptChoicesFacile(correct, allDepts);
    const nomSet = new Set(allDepts.map((d) => d.nom));
    choices.forEach((c) => expect(nomSet.has(c.label)).toBe(true));
  });
});

// ── buildDeptChoicesDifficile ─────────────────────────────────────────────────

describe('buildDeptChoicesDifficile', () => {
  it('retourne 4 choix distincts avec exactement 1 correct', () => {
    const correct = region84[0];
    const choices = buildDeptChoicesDifficile(correct, allDepts);
    assertValid4Choices(choices, correct.code);
  });

  it('les distracteurs sont prioritairement dans la même région (quand ≥3 disponibles)', () => {
    const correct = region84[0];
    const choices = buildDeptChoicesDifficile(correct, allDepts);
    const distractors = choices.filter((c) => !c.correct);
    distractors.forEach((c) => {
      const dept = allDepts.find((d) => d.code === c.code)!;
      expect(dept.regionCode).toBe('84');
    });
  });

  it('fallback vers autres régions quand pool prioritaire < 3', () => {
    // region11 n'a que 2 autres depts pour le distracteur (75 exclu)
    const correct = region11[0];
    const choices = buildDeptChoicesDifficile(correct, allDepts);
    assertValid4Choices(choices, correct.code);
  });
});

// ── buildCodeChoicesFacile ────────────────────────────────────────────────────

describe('buildCodeChoicesFacile', () => {
  it('retourne 4 choix distincts avec exactement 1 correct', () => {
    const correct = allDepts[0];
    const choices = buildCodeChoicesFacile(correct, allDepts);
    assertValid4Choices(choices, correct.code);
  });

  it('les labels sont les codes (pas les noms)', () => {
    const correct = allDepts[0];
    const choices = buildCodeChoicesFacile(correct, allDepts);
    const codeSet = new Set(allDepts.map((d) => d.code));
    choices.forEach((c) => {
      expect(c.label).toBe(c.code);
      expect(codeSet.has(c.label)).toBe(true);
    });
  });

  it('les choix sont triés numériquement (pas alphabétiquement)', () => {
    const depts: DeptChoice[] = [
      { code: '9',  nom: 'Ariège',  regionCode: '76' },
      { code: '02', nom: 'Aisne',   regionCode: '32' },
      { code: '10', nom: 'Aube',    regionCode: '44' },
      { code: '01', nom: 'Ain',     regionCode: '84' },
      { code: '2A', nom: 'Corse-du-Sud', regionCode: '94' },
    ];
    const correct = depts[0];
    const choices = buildCodeChoicesFacile(correct, depts);
    const nums = choices.map((c) =>
      c.code === '2A' ? 20.1 : c.code === '2B' ? 20.2 : parseInt(c.code, 10),
    );
    for (let i = 1; i < nums.length; i++) {
      expect(nums[i]).toBeGreaterThanOrEqual(nums[i - 1]);
    }
  });
});

// ── buildCodeChoicesDifficile ─────────────────────────────────────────────────

describe('buildCodeChoicesDifficile', () => {
  it('retourne 4 choix distincts avec exactement 1 correct', () => {
    const correct = allDepts[0];
    const choices = buildCodeChoicesDifficile(correct, allDepts);
    assertValid4Choices(choices, correct.code);
  });

  it('les distracteurs sont parmi les 6 codes numériquement les plus proches', () => {
    const depts: DeptChoice[] = Array.from({ length: 20 }, (_, i) => ({
      code: String(i + 1).padStart(2, '0'),
      nom: `Dept ${i + 1}`,
      regionCode: '84',
    }));
    const correct = depts[9]; // code '10'
    const toNum = (code: string) => parseInt(code, 10);
    const choices = buildCodeChoicesDifficile(correct, depts);
    const distractors = choices.filter((c) => !c.correct);
    distractors.forEach((c) => {
      const distractorNum = toNum(c.code);
      const targetNum = toNum(correct.code);
      const closerCount = depts.filter(
        (d) => d.code !== correct.code && Math.abs(toNum(d.code) - targetNum) < Math.abs(distractorNum - targetNum),
      ).length;
      expect(closerCount).toBeLessThan(6);
    });
  });

  it('les choix sont triés numériquement', () => {
    const correct = allDepts[0];
    const choices = buildCodeChoicesDifficile(correct, allDepts);
    const nums = choices.map((c) =>
      c.code === '2A' ? 20.1 : c.code === '2B' ? 20.2 : parseInt(c.code, 10),
    );
    for (let i = 1; i < nums.length; i++) {
      expect(nums[i]).toBeGreaterThanOrEqual(nums[i - 1]);
    }
  });
});

// ── buildRegionChoicesFacile ──────────────────────────────────────────────────

describe('buildRegionChoicesFacile', () => {
  it('retourne 4 choix distincts avec exactement 1 correct', () => {
    const correct = allRegions[0];
    const choices = buildRegionChoicesFacile(correct, allRegions);
    assertValid4Choices(choices, correct.code);
  });

  it('les labels sont des noms de régions', () => {
    const correct = allRegions[0];
    const choices = buildRegionChoicesFacile(correct, allRegions);
    const nomSet = new Set(allRegions.map((r) => r.nom));
    choices.forEach((c) => expect(nomSet.has(c.label)).toBe(true));
  });
});

// ── buildRegionChoicesDifficile ───────────────────────────────────────────────

describe('buildRegionChoicesDifficile', () => {
  it('retourne 4 choix distincts avec exactement 1 correct', () => {
    const correct = allRegions[0]; // Île-de-France (11), adjacente à 28,32,44,27,24
    const choices = buildRegionChoicesDifficile(correct, allRegions);
    assertValid4Choices(choices, correct.code);
  });

  it('les distracteurs sont prioritairement des régions adjacentes', () => {
    // '11' (Île-de-France) est adjacent à '28','32','44' — tous présents dans allRegions
    const correct = allRegions[0];
    const choices = buildRegionChoicesDifficile(correct, allRegions);
    const adjacentCodes = new Set(['28', '32', '44', '27', '24']);
    const distractors = choices.filter((c) => !c.correct);
    distractors.forEach((c) => {
      expect(adjacentCodes.has(c.code)).toBe(true);
    });
  });

  it('fallback quand région isolée (Corse : 1 seul voisin)', () => {
    const corse: RegionChoice = { code: '94', nom: 'Corse' };
    const choices = buildRegionChoicesDifficile(corse, allRegions);
    assertValid4Choices(choices, corse.code);
  });
});

// ── buildPrefDeptChoicesFacile ────────────────────────────────────────────────

describe('buildPrefDeptChoicesFacile', () => {
  it('retourne 4 choix distincts avec exactement 1 correct', () => {
    const correct = allPrefDepts[0];
    const choices = buildPrefDeptChoicesFacile(correct, allPrefDepts);
    assertValid4Choices(choices, correct.code);
  });

  it('les labels sont des noms de préfectures', () => {
    const correct = allPrefDepts[0];
    const choices = buildPrefDeptChoicesFacile(correct, allPrefDepts);
    const prefSet = new Set(allPrefDepts.map((d) => d.prefecture));
    choices.forEach((c) => expect(prefSet.has(c.label)).toBe(true));
  });
});

// ── buildPrefDeptChoicesDifficile ─────────────────────────────────────────────

describe('buildPrefDeptChoicesDifficile', () => {
  it('retourne 4 choix distincts avec exactement 1 correct', () => {
    const correct = allPrefDepts[0];
    const choices = buildPrefDeptChoicesDifficile(correct, allPrefDepts);
    assertValid4Choices(choices, correct.code);
  });

  it('distracteurs prioritairement dans la même région quand ≥3 disponibles', () => {
    const correct = allPrefDepts[0]; // région 84 — 4 autres depts disponibles
    const choices = buildPrefDeptChoicesDifficile(correct, allPrefDepts);
    const distractors = choices.filter((c) => !c.correct);
    distractors.forEach((c) => {
      const dept = allPrefDepts.find((d) => d.code === c.code)!;
      expect(dept.regionCode).toBe('84');
    });
  });
});

// ── buildPrefRegionChoicesFacile ──────────────────────────────────────────────

describe('buildPrefRegionChoicesFacile', () => {
  it('retourne 4 choix distincts avec exactement 1 correct', () => {
    const correct = allPrefRegions[0];
    const choices = buildPrefRegionChoicesFacile(correct, allPrefRegions);
    assertValid4Choices(choices, correct.code);
  });

  it('les labels sont des préfectures régionales', () => {
    const correct = allPrefRegions[0];
    const choices = buildPrefRegionChoicesFacile(correct, allPrefRegions);
    const prefSet = new Set(allPrefRegions.map((r) => r.prefectureRegionale));
    choices.forEach((c) => expect(prefSet.has(c.label)).toBe(true));
  });
});

// ── buildPrefRegionChoicesDifficile ───────────────────────────────────────────

describe('buildPrefRegionChoicesDifficile', () => {
  it('retourne 4 choix distincts avec exactement 1 correct', () => {
    const correct = allPrefRegions[0]; // Île-de-France
    const choices = buildPrefRegionChoicesDifficile(correct, allPrefRegions);
    assertValid4Choices(choices, correct.code);
  });

  it('fallback quand région peu connectée', () => {
    const corse: PrefRegionChoice = { code: '94', nom: 'Corse', prefectureRegionale: 'Ajaccio' };
    const choices = buildPrefRegionChoicesDifficile(corse, allPrefRegions);
    assertValid4Choices(choices, corse.code);
  });
});
