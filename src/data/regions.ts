export interface Region {
  code: string;
  nom: string;
}

export const REGIONS: Region[] = [
  { code: '11', nom: 'Île-de-France' },
  { code: '24', nom: 'Centre-Val de Loire' },
  { code: '27', nom: 'Bourgogne-Franche-Comté' },
  { code: '28', nom: 'Normandie' },
  { code: '32', nom: 'Hauts-de-France' },
  { code: '44', nom: 'Grand Est' },
  { code: '52', nom: 'Pays de la Loire' },
  { code: '53', nom: 'Bretagne' },
  { code: '75', nom: 'Nouvelle-Aquitaine' },
  { code: '76', nom: 'Occitanie' },
  { code: '84', nom: 'Auvergne-Rhône-Alpes' },
  { code: '93', nom: 'Provence-Alpes-Côte d\'Azur' },
  { code: '94', nom: 'Corse' },
];
