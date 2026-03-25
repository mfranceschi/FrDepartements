export interface Departement {
  code: string;
  nom: string;
  regionCode: string;
  outresMer: boolean;
}

export const DEPARTEMENTS: Departement[] = [
  // Auvergne-Rhône-Alpes (84)
  { code: '01', nom: 'Ain', regionCode: '84', outresMer: false },
  { code: '03', nom: 'Allier', regionCode: '84', outresMer: false },
  { code: '07', nom: 'Ardèche', regionCode: '84', outresMer: false },
  { code: '15', nom: 'Cantal', regionCode: '84', outresMer: false },
  { code: '26', nom: 'Drôme', regionCode: '84', outresMer: false },
  { code: '38', nom: 'Isère', regionCode: '84', outresMer: false },
  { code: '42', nom: 'Loire', regionCode: '84', outresMer: false },
  { code: '43', nom: 'Haute-Loire', regionCode: '84', outresMer: false },
  { code: '63', nom: 'Puy-de-Dôme', regionCode: '84', outresMer: false },
  { code: '69', nom: 'Rhône', regionCode: '84', outresMer: false },
  { code: '73', nom: 'Savoie', regionCode: '84', outresMer: false },
  { code: '74', nom: 'Haute-Savoie', regionCode: '84', outresMer: false },

  // Bourgogne-Franche-Comté (27)
  { code: '21', nom: 'Côte-d\'Or', regionCode: '27', outresMer: false },
  { code: '25', nom: 'Doubs', regionCode: '27', outresMer: false },
  { code: '39', nom: 'Jura', regionCode: '27', outresMer: false },
  { code: '58', nom: 'Nièvre', regionCode: '27', outresMer: false },
  { code: '70', nom: 'Haute-Saône', regionCode: '27', outresMer: false },
  { code: '71', nom: 'Saône-et-Loire', regionCode: '27', outresMer: false },
  { code: '89', nom: 'Yonne', regionCode: '27', outresMer: false },
  { code: '90', nom: 'Territoire de Belfort', regionCode: '27', outresMer: false },

  // Bretagne (53)
  { code: '22', nom: 'Côtes-d\'Armor', regionCode: '53', outresMer: false },
  { code: '29', nom: 'Finistère', regionCode: '53', outresMer: false },
  { code: '35', nom: 'Ille-et-Vilaine', regionCode: '53', outresMer: false },
  { code: '56', nom: 'Morbihan', regionCode: '53', outresMer: false },

  // Centre-Val de Loire (24)
  { code: '18', nom: 'Cher', regionCode: '24', outresMer: false },
  { code: '28', nom: 'Eure-et-Loir', regionCode: '24', outresMer: false },
  { code: '36', nom: 'Indre', regionCode: '24', outresMer: false },
  { code: '37', nom: 'Indre-et-Loire', regionCode: '24', outresMer: false },
  { code: '41', nom: 'Loir-et-Cher', regionCode: '24', outresMer: false },
  { code: '45', nom: 'Loiret', regionCode: '24', outresMer: false },

  // Corse (94)
  { code: '2A', nom: 'Corse-du-Sud', regionCode: '94', outresMer: false },
  { code: '2B', nom: 'Haute-Corse', regionCode: '94', outresMer: false },

  // Grand Est (44)
  { code: '08', nom: 'Ardennes', regionCode: '44', outresMer: false },
  { code: '10', nom: 'Aube', regionCode: '44', outresMer: false },
  { code: '51', nom: 'Marne', regionCode: '44', outresMer: false },
  { code: '52', nom: 'Haute-Marne', regionCode: '44', outresMer: false },
  { code: '54', nom: 'Meurthe-et-Moselle', regionCode: '44', outresMer: false },
  { code: '55', nom: 'Meuse', regionCode: '44', outresMer: false },
  { code: '57', nom: 'Moselle', regionCode: '44', outresMer: false },
  { code: '67', nom: 'Bas-Rhin', regionCode: '44', outresMer: false },
  { code: '68', nom: 'Haut-Rhin', regionCode: '44', outresMer: false },
  { code: '88', nom: 'Vosges', regionCode: '44', outresMer: false },

  // Hauts-de-France (32)
  { code: '02', nom: 'Aisne', regionCode: '32', outresMer: false },
  { code: '59', nom: 'Nord', regionCode: '32', outresMer: false },
  { code: '60', nom: 'Oise', regionCode: '32', outresMer: false },
  { code: '62', nom: 'Pas-de-Calais', regionCode: '32', outresMer: false },
  { code: '80', nom: 'Somme', regionCode: '32', outresMer: false },

  // Île-de-France (11)
  { code: '75', nom: 'Paris', regionCode: '11', outresMer: false },
  { code: '77', nom: 'Seine-et-Marne', regionCode: '11', outresMer: false },
  { code: '78', nom: 'Yvelines', regionCode: '11', outresMer: false },
  { code: '91', nom: 'Essonne', regionCode: '11', outresMer: false },
  { code: '92', nom: 'Hauts-de-Seine', regionCode: '11', outresMer: false },
  { code: '93', nom: 'Seine-Saint-Denis', regionCode: '11', outresMer: false },
  { code: '94', nom: 'Val-de-Marne', regionCode: '11', outresMer: false },
  { code: '95', nom: 'Val-d\'Oise', regionCode: '11', outresMer: false },

  // Normandie (28)
  { code: '14', nom: 'Calvados', regionCode: '28', outresMer: false },
  { code: '27', nom: 'Eure', regionCode: '28', outresMer: false },
  { code: '50', nom: 'Manche', regionCode: '28', outresMer: false },
  { code: '61', nom: 'Orne', regionCode: '28', outresMer: false },
  { code: '76', nom: 'Seine-Maritime', regionCode: '28', outresMer: false },

  // Nouvelle-Aquitaine (75)
  { code: '16', nom: 'Charente', regionCode: '75', outresMer: false },
  { code: '17', nom: 'Charente-Maritime', regionCode: '75', outresMer: false },
  { code: '19', nom: 'Corrèze', regionCode: '75', outresMer: false },
  { code: '23', nom: 'Creuse', regionCode: '75', outresMer: false },
  { code: '24', nom: 'Dordogne', regionCode: '75', outresMer: false },
  { code: '33', nom: 'Gironde', regionCode: '75', outresMer: false },
  { code: '40', nom: 'Landes', regionCode: '75', outresMer: false },
  { code: '47', nom: 'Lot-et-Garonne', regionCode: '75', outresMer: false },
  { code: '64', nom: 'Pyrénées-Atlantiques', regionCode: '75', outresMer: false },
  { code: '79', nom: 'Deux-Sèvres', regionCode: '75', outresMer: false },
  { code: '86', nom: 'Vienne', regionCode: '75', outresMer: false },
  { code: '87', nom: 'Haute-Vienne', regionCode: '75', outresMer: false },

  // Occitanie (76)
  { code: '09', nom: 'Ariège', regionCode: '76', outresMer: false },
  { code: '11', nom: 'Aude', regionCode: '76', outresMer: false },
  { code: '12', nom: 'Aveyron', regionCode: '76', outresMer: false },
  { code: '30', nom: 'Gard', regionCode: '76', outresMer: false },
  { code: '31', nom: 'Haute-Garonne', regionCode: '76', outresMer: false },
  { code: '32', nom: 'Gers', regionCode: '76', outresMer: false },
  { code: '34', nom: 'Hérault', regionCode: '76', outresMer: false },
  { code: '46', nom: 'Lot', regionCode: '76', outresMer: false },
  { code: '48', nom: 'Lozère', regionCode: '76', outresMer: false },
  { code: '65', nom: 'Hautes-Pyrénées', regionCode: '76', outresMer: false },
  { code: '66', nom: 'Pyrénées-Orientales', regionCode: '76', outresMer: false },
  { code: '81', nom: 'Tarn', regionCode: '76', outresMer: false },
  { code: '82', nom: 'Tarn-et-Garonne', regionCode: '76', outresMer: false },

  // Pays de la Loire (52)
  { code: '44', nom: 'Loire-Atlantique', regionCode: '52', outresMer: false },
  { code: '49', nom: 'Maine-et-Loire', regionCode: '52', outresMer: false },
  { code: '53', nom: 'Mayenne', regionCode: '52', outresMer: false },
  { code: '72', nom: 'Sarthe', regionCode: '52', outresMer: false },
  { code: '85', nom: 'Vendée', regionCode: '52', outresMer: false },

  // Provence-Alpes-Côte d'Azur (93)
  { code: '04', nom: 'Alpes-de-Haute-Provence', regionCode: '93', outresMer: false },
  { code: '05', nom: 'Hautes-Alpes', regionCode: '93', outresMer: false },
  { code: '06', nom: 'Alpes-Maritimes', regionCode: '93', outresMer: false },
  { code: '13', nom: 'Bouches-du-Rhône', regionCode: '93', outresMer: false },
  { code: '83', nom: 'Var', regionCode: '93', outresMer: false },
  { code: '84', nom: 'Vaucluse', regionCode: '93', outresMer: false },

  // DROM
  { code: '971', nom: 'Guadeloupe', regionCode: '01', outresMer: true },
  { code: '972', nom: 'Martinique', regionCode: '02', outresMer: true },
  { code: '973', nom: 'Guyane', regionCode: '03', outresMer: true },
  { code: '974', nom: 'La Réunion', regionCode: '04', outresMer: true },
  { code: '976', nom: 'Mayotte', regionCode: '06', outresMer: true },
];
