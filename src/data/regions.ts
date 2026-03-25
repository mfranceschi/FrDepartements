export interface Region {
  code: string;
  nom: string;
  outresMer: boolean;
}

export const REGIONS: Region[] = [
  { code: '01', nom: 'Guadeloupe', outresMer: true },
  { code: '02', nom: 'Martinique', outresMer: true },
  { code: '03', nom: 'Guyane', outresMer: true },
  { code: '04', nom: 'La Réunion', outresMer: true },
  { code: '06', nom: 'Mayotte', outresMer: true },
  { code: '11', nom: 'Île-de-France', outresMer: false },
  { code: '24', nom: 'Centre-Val de Loire', outresMer: false },
  { code: '27', nom: 'Bourgogne-Franche-Comté', outresMer: false },
  { code: '28', nom: 'Normandie', outresMer: false },
  { code: '32', nom: 'Hauts-de-France', outresMer: false },
  { code: '44', nom: 'Grand Est', outresMer: false },
  { code: '52', nom: 'Pays de la Loire', outresMer: false },
  { code: '53', nom: 'Bretagne', outresMer: false },
  { code: '75', nom: 'Nouvelle-Aquitaine', outresMer: false },
  { code: '76', nom: 'Occitanie', outresMer: false },
  { code: '84', nom: 'Auvergne-Rhône-Alpes', outresMer: false },
  { code: '93', nom: 'Provence-Alpes-Côte d\'Azur', outresMer: false },
  { code: '94', nom: 'Corse', outresMer: false },
];
