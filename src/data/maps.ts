import { DEPARTEMENTS } from './departements';
import { REGIONS } from './regions';
import type { Departement } from './departements';
import type { Region } from './regions';

export const DEPT_MAP: ReadonlyMap<string, Departement> = new Map(
  DEPARTEMENTS.map(d => [d.code, d]),
);

export const REGION_MAP: ReadonlyMap<string, Region> = new Map(
  REGIONS.map(r => [r.code, r]),
);
