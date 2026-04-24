import { describe, it, expect } from 'vitest';
import { DEPARTEMENTS } from '../data/departements';
import { REGIONS } from '../data/regions';
import { REGION_ADJACENCY } from '../data/regionAdjacency';
import { FLEUVES_DEPTS } from '../data/fleuvesDepts';
import { ZONES, ZONES_BY_CODE } from '../data/zones';

const REGION_CODES = new Set(REGIONS.map((r) => r.code));
const DEPT_CODES = new Set(DEPARTEMENTS.map((d) => d.code));

describe('DEPARTEMENTS — intégrité des données', () => {
  it('contient exactement 96 départements métropolitains', () => {
    expect(DEPARTEMENTS).toHaveLength(96);
  });

  it('chaque code de département est unique', () => {
    const codes = DEPARTEMENTS.map((d) => d.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('chaque département référence une région existante', () => {
    DEPARTEMENTS.forEach((d) => {
      expect(REGION_CODES.has(d.regionCode), `dept ${d.code} → région ${d.regionCode} inconnue`).toBe(true);
    });
  });

  it('aucun champ nom, prefecture ou regionCode n\'est vide', () => {
    DEPARTEMENTS.forEach((d) => {
      expect(d.nom.trim(), `dept ${d.code} : nom vide`).not.toBe('');
      expect(d.prefecture.trim(), `dept ${d.code} : prefecture vide`).not.toBe('');
      expect(d.regionCode.trim(), `dept ${d.code} : regionCode vide`).not.toBe('');
    });
  });

  it('les codes 2A et 2B sont présents (Corse)', () => {
    const codes = new Set(DEPARTEMENTS.map((d) => d.code));
    expect(codes.has('2A')).toBe(true);
    expect(codes.has('2B')).toBe(true);
  });

  it('isPrefectureRegionale est vrai pour au moins 1 département par région', () => {
    for (const region of REGIONS) {
      const depts = DEPARTEMENTS.filter((d) => d.regionCode === region.code);
      const hasPrefReg = depts.some((d) => d.isPrefectureRegionale === true);
      expect(hasPrefReg, `région ${region.code} (${region.nom}) sans isPrefectureRegionale`).toBe(true);
    }
  });

  it('la préfecture régionale d\'un département isPrefectureRegionale correspond à la préfecture de la région', () => {
    const regionMap = new Map(REGIONS.map((r) => [r.code, r]));
    DEPARTEMENTS.filter((d) => d.isPrefectureRegionale).forEach((d) => {
      const region = regionMap.get(d.regionCode)!;
      expect(d.prefecture, `dept ${d.code} isPrefectureRegionale mais préfecture ≠ préfectureRegionale`).toBe(region.prefectureRegionale);
    });
  });
});

describe('REGIONS — intégrité des données', () => {
  it('contient exactement 13 régions métropolitaines', () => {
    expect(REGIONS).toHaveLength(13);
  });

  it('chaque code de région est unique', () => {
    const codes = REGIONS.map((r) => r.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('aucun champ nom ou prefectureRegionale n\'est vide', () => {
    REGIONS.forEach((r) => {
      expect(r.nom.trim(), `région ${r.code} : nom vide`).not.toBe('');
      expect(r.prefectureRegionale.trim(), `région ${r.code} : prefectureRegionale vide`).not.toBe('');
    });
  });
});

describe('REGION_ADJACENCY — intégrité du graphe', () => {
  it('contient exactement 13 régions', () => {
    expect(Object.keys(REGION_ADJACENCY)).toHaveLength(13);
  });

  it('chaque région du graphe correspond à un code de région connu', () => {
    for (const code of Object.keys(REGION_ADJACENCY)) {
      expect(REGION_CODES.has(code), `code ${code} dans REGION_ADJACENCY mais absent de REGIONS`).toBe(true);
    }
  });

  it('toutes les régions du graphe d\'adjacence référencent des régions connues', () => {
    for (const [code, neighbors] of Object.entries(REGION_ADJACENCY)) {
      for (const neighbor of neighbors) {
        expect(REGION_CODES.has(neighbor), `région ${code} : voisine ${neighbor} inconnue`).toBe(true);
      }
    }
  });

  it('le graphe est bidirectionnel (si A→B alors B→A)', () => {
    for (const [code, neighbors] of Object.entries(REGION_ADJACENCY)) {
      for (const neighbor of neighbors) {
        const reverseNeighbors = REGION_ADJACENCY[neighbor] ?? [];
        expect(
          (reverseNeighbors as readonly string[]).includes(code),
          `graphe non bidirectionnel : ${code}→${neighbor} mais pas ${neighbor}→${code}`,
        ).toBe(true);
      }
    }
  });

  it('aucune région n\'est voisine d\'elle-même', () => {
    for (const [code, neighbors] of Object.entries(REGION_ADJACENCY)) {
      expect((neighbors as readonly string[]).includes(code), `${code} est voisine d'elle-même`).toBe(false);
    }
  });
});

describe('FLEUVES_DEPTS — intégrité des données (généré par compute-fleuves-depts.mjs)', () => {
  const entries = Object.entries(FLEUVES_DEPTS);

  it('contient au moins 20 cours d\'eau', () => {
    expect(entries.length).toBeGreaterThanOrEqual(20);
  });

  it('les grands fleuves (Loire, Rhône, Seine, Garonne) sont présents', () => {
    for (const name of ['Loire', 'Rhône', 'Seine', 'Garonne']) {
      expect(FLEUVES_DEPTS, `${name} absent de FLEUVES_DEPTS`).toHaveProperty(name);
    }
  });

  it('chaque cours d\'eau a au moins un département', () => {
    for (const [name, { depts }] of entries) {
      expect(depts.length, `${name} : liste de depts vide`).toBeGreaterThan(0);
    }
  });

  it('chaque code de département référence un département métropolitain connu', () => {
    for (const [name, { depts }] of entries) {
      for (const code of depts) {
        expect(DEPT_CODES.has(code), `${name} : code dept "${code}" inconnu`).toBe(true);
      }
    }
  });

  it('les codes de département sont uniques au sein de chaque cours d\'eau', () => {
    for (const [name, { depts }] of entries) {
      expect(new Set(depts).size, `${name} : codes depts dupliqués`).toBe(depts.length);
    }
  });

  it('les codes numériques sont triés en ordre croissant', () => {
    for (const [name, { depts }] of entries) {
      const numericCodes = depts.filter((c) => /^\d+$/.test(c));
      for (let i = 1; i < numericCodes.length; i++) {
        expect(
          parseInt(numericCodes[i], 10),
          `${name} : code ${numericCodes[i]} avant ${numericCodes[i - 1]} (ordre non croissant)`,
        ).toBeGreaterThan(parseInt(numericCodes[i - 1], 10));
      }
    }
  });

  it('scalerank est un entier positif pour chaque cours d\'eau', () => {
    for (const [name, { scalerank }] of entries) {
      expect(Number.isInteger(scalerank), `${name} : scalerank non entier`).toBe(true);
      expect(scalerank, `${name} : scalerank ≤ 0`).toBeGreaterThan(0);
    }
  });

  it('la Loire traverse des départements du Massif Central et du Val de Loire', () => {
    const loireDepts = new Set(FLEUVES_DEPTS['Loire'].depts);
    expect(loireDepts.has('42')).toBe(true); // Loire (source, Massif Central)
    expect(loireDepts.has('44')).toBe(true); // Loire-Atlantique (embouchure)
    expect(loireDepts.has('37')).toBe(true); // Indre-et-Loire (Val de Loire)
  });
});

describe('ZONES — intégrité des données', () => {
  const nonTout = ZONES.filter(z => z.code !== 'tout');

  it('la zone "tout" a regionCodes vide', () => {
    expect(ZONES_BY_CODE['tout'].regionCodes).toHaveLength(0);
  });

  it('chaque regionCode référence une région connue', () => {
    for (const zone of nonTout) {
      for (const code of zone.regionCodes) {
        expect(REGION_CODES.has(code), `zone ${zone.code} : région ${code} inconnue`).toBe(true);
      }
    }
  });

  it('les 4 zones non-tout couvrent exactement les 13 régions sans chevauchement', () => {
    const all = nonTout.flatMap(z => z.regionCodes);
    expect(all).toHaveLength(13);
    expect(new Set(all).size).toBe(13);
  });

  it('ZONES_BY_CODE indexe chaque zone par son code', () => {
    for (const zone of ZONES) {
      expect(ZONES_BY_CODE[zone.code]).toBe(zone);
    }
  });
});
