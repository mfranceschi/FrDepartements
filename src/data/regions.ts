export interface Region {
  code: string;
  nom: string;
  prefectureRegionale: string;
}

export const REGIONS: Region[] = [
  { code: '11', nom: 'Île-de-France',                  prefectureRegionale: 'Paris' },
  { code: '24', nom: 'Centre-Val de Loire',             prefectureRegionale: 'Orléans' },
  { code: '27', nom: 'Bourgogne-Franche-Comté',        prefectureRegionale: 'Dijon' },
  { code: '28', nom: 'Normandie',                       prefectureRegionale: 'Rouen' },
  { code: '32', nom: 'Hauts-de-France',                 prefectureRegionale: 'Lille' },
  { code: '44', nom: 'Grand Est',                       prefectureRegionale: 'Strasbourg' },
  { code: '52', nom: 'Pays de la Loire',                prefectureRegionale: 'Nantes' },
  { code: '53', nom: 'Bretagne',                        prefectureRegionale: 'Rennes' },
  { code: '75', nom: 'Nouvelle-Aquitaine',              prefectureRegionale: 'Bordeaux' },
  { code: '76', nom: 'Occitanie',                       prefectureRegionale: 'Toulouse' },
  { code: '84', nom: 'Auvergne-Rhône-Alpes',           prefectureRegionale: 'Lyon' },
  { code: '93', nom: 'Provence-Alpes-Côte d\'Azur',   prefectureRegionale: 'Marseille' },
  { code: '94', nom: 'Corse',                           prefectureRegionale: 'Ajaccio' },
];
