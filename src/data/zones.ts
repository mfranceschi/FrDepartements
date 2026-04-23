export type ZoneCode = 'tout' | 'nord-ouest' | 'nord-est' | 'sud-ouest' | 'sud-est';

export interface Zone {
  code: ZoneCode;
  label: string;
  regionCodes: string[];
  description: string;
}

export const ZONES: Zone[] = [
  {
    code: 'tout',
    label: 'Toute la France',
    regionCodes: [],
    description: '',
  },
  {
    code: 'nord-ouest',
    label: 'Nord-Ouest',
    regionCodes: ['32', '28', '53', '52'],
    description: 'Hauts-de-France, Normandie, Bretagne, Pays de la Loire',
  },
  {
    code: 'nord-est',
    label: 'Nord-Est',
    regionCodes: ['11', '24', '44', '27'],
    description: 'Île-de-France, Centre-Val de Loire, Grand Est, Bourgogne-Franche-Comté',
  },
  {
    code: 'sud-ouest',
    label: 'Sud-Ouest',
    regionCodes: ['75', '76'],
    description: 'Nouvelle-Aquitaine, Occitanie',
  },
  {
    code: 'sud-est',
    label: 'Sud-Est',
    regionCodes: ['84', '93', '94'],
    description: 'Auvergne-Rhône-Alpes, PACA, Corse',
  },
];

export const ZONES_BY_CODE: Record<ZoneCode, Zone> = Object.fromEntries(
  ZONES.map((z) => [z.code, z]),
) as Record<ZoneCode, Zone>;
