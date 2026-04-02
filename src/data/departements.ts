export interface Departement {
  code: string;
  nom: string;
  regionCode: string;
}

export const DEPARTEMENTS: Departement[] = [
  // Auvergne-Rhône-Alpes (84)
  { code: '01', nom: 'Ain', regionCode: '84' },
  { code: '03', nom: 'Allier', regionCode: '84' },
  { code: '07', nom: 'Ardèche', regionCode: '84' },
  { code: '15', nom: 'Cantal', regionCode: '84' },
  { code: '26', nom: 'Drôme', regionCode: '84' },
  { code: '38', nom: 'Isère', regionCode: '84' },
  { code: '42', nom: 'Loire', regionCode: '84' },
  { code: '43', nom: 'Haute-Loire', regionCode: '84' },
  { code: '63', nom: 'Puy-de-Dôme', regionCode: '84' },
  { code: '69', nom: 'Rhône', regionCode: '84' },
  { code: '73', nom: 'Savoie', regionCode: '84' },
  { code: '74', nom: 'Haute-Savoie', regionCode: '84' },

  // Bourgogne-Franche-Comté (27)
  { code: '21', nom: 'Côte-d\'Or', regionCode: '27' },
  { code: '25', nom: 'Doubs', regionCode: '27' },
  { code: '39', nom: 'Jura', regionCode: '27' },
  { code: '58', nom: 'Nièvre', regionCode: '27' },
  { code: '70', nom: 'Haute-Saône', regionCode: '27' },
  { code: '71', nom: 'Saône-et-Loire', regionCode: '27' },
  { code: '89', nom: 'Yonne', regionCode: '27' },
  { code: '90', nom: 'Territoire de Belfort', regionCode: '27' },

  // Bretagne (53)
  { code: '22', nom: 'Côtes-d\'Armor', regionCode: '53' },
  { code: '29', nom: 'Finistère', regionCode: '53' },
  { code: '35', nom: 'Ille-et-Vilaine', regionCode: '53' },
  { code: '56', nom: 'Morbihan', regionCode: '53' },

  // Centre-Val de Loire (24)
  { code: '18', nom: 'Cher', regionCode: '24' },
  { code: '28', nom: 'Eure-et-Loir', regionCode: '24' },
  { code: '36', nom: 'Indre', regionCode: '24' },
  { code: '37', nom: 'Indre-et-Loire', regionCode: '24' },
  { code: '41', nom: 'Loir-et-Cher', regionCode: '24' },
  { code: '45', nom: 'Loiret', regionCode: '24' },

  // Corse (94)
  { code: '2A', nom: 'Corse-du-Sud', regionCode: '94' },
  { code: '2B', nom: 'Haute-Corse', regionCode: '94' },

  // Grand Est (44)
  { code: '08', nom: 'Ardennes', regionCode: '44' },
  { code: '10', nom: 'Aube', regionCode: '44' },
  { code: '51', nom: 'Marne', regionCode: '44' },
  { code: '52', nom: 'Haute-Marne', regionCode: '44' },
  { code: '54', nom: 'Meurthe-et-Moselle', regionCode: '44' },
  { code: '55', nom: 'Meuse', regionCode: '44' },
  { code: '57', nom: 'Moselle', regionCode: '44' },
  { code: '67', nom: 'Bas-Rhin', regionCode: '44' },
  { code: '68', nom: 'Haut-Rhin', regionCode: '44' },
  { code: '88', nom: 'Vosges', regionCode: '44' },

  // Hauts-de-France (32)
  { code: '02', nom: 'Aisne', regionCode: '32' },
  { code: '59', nom: 'Nord', regionCode: '32' },
  { code: '60', nom: 'Oise', regionCode: '32' },
  { code: '62', nom: 'Pas-de-Calais', regionCode: '32' },
  { code: '80', nom: 'Somme', regionCode: '32' },

  // Île-de-France (11)
  { code: '75', nom: 'Paris', regionCode: '11' },
  { code: '77', nom: 'Seine-et-Marne', regionCode: '11' },
  { code: '78', nom: 'Yvelines', regionCode: '11' },
  { code: '91', nom: 'Essonne', regionCode: '11' },
  { code: '92', nom: 'Hauts-de-Seine', regionCode: '11' },
  { code: '93', nom: 'Seine-Saint-Denis', regionCode: '11' },
  { code: '94', nom: 'Val-de-Marne', regionCode: '11' },
  { code: '95', nom: 'Val-d\'Oise', regionCode: '11' },

  // Normandie (28)
  { code: '14', nom: 'Calvados', regionCode: '28' },
  { code: '27', nom: 'Eure', regionCode: '28' },
  { code: '50', nom: 'Manche', regionCode: '28' },
  { code: '61', nom: 'Orne', regionCode: '28' },
  { code: '76', nom: 'Seine-Maritime', regionCode: '28' },

  // Nouvelle-Aquitaine (75)
  { code: '16', nom: 'Charente', regionCode: '75' },
  { code: '17', nom: 'Charente-Maritime', regionCode: '75' },
  { code: '19', nom: 'Corrèze', regionCode: '75' },
  { code: '23', nom: 'Creuse', regionCode: '75' },
  { code: '24', nom: 'Dordogne', regionCode: '75' },
  { code: '33', nom: 'Gironde', regionCode: '75' },
  { code: '40', nom: 'Landes', regionCode: '75' },
  { code: '47', nom: 'Lot-et-Garonne', regionCode: '75' },
  { code: '64', nom: 'Pyrénées-Atlantiques', regionCode: '75' },
  { code: '79', nom: 'Deux-Sèvres', regionCode: '75' },
  { code: '86', nom: 'Vienne', regionCode: '75' },
  { code: '87', nom: 'Haute-Vienne', regionCode: '75' },

  // Occitanie (76)
  { code: '09', nom: 'Ariège', regionCode: '76' },
  { code: '11', nom: 'Aude', regionCode: '76' },
  { code: '12', nom: 'Aveyron', regionCode: '76' },
  { code: '30', nom: 'Gard', regionCode: '76' },
  { code: '31', nom: 'Haute-Garonne', regionCode: '76' },
  { code: '32', nom: 'Gers', regionCode: '76' },
  { code: '34', nom: 'Hérault', regionCode: '76' },
  { code: '46', nom: 'Lot', regionCode: '76' },
  { code: '48', nom: 'Lozère', regionCode: '76' },
  { code: '65', nom: 'Hautes-Pyrénées', regionCode: '76' },
  { code: '66', nom: 'Pyrénées-Orientales', regionCode: '76' },
  { code: '81', nom: 'Tarn', regionCode: '76' },
  { code: '82', nom: 'Tarn-et-Garonne', regionCode: '76' },

  // Pays de la Loire (52)
  { code: '44', nom: 'Loire-Atlantique', regionCode: '52' },
  { code: '49', nom: 'Maine-et-Loire', regionCode: '52' },
  { code: '53', nom: 'Mayenne', regionCode: '52' },
  { code: '72', nom: 'Sarthe', regionCode: '52' },
  { code: '85', nom: 'Vendée', regionCode: '52' },

  // Provence-Alpes-Côte d'Azur (93)
  { code: '04', nom: 'Alpes-de-Haute-Provence', regionCode: '93' },
  { code: '05', nom: 'Hautes-Alpes', regionCode: '93' },
  { code: '06', nom: 'Alpes-Maritimes', regionCode: '93' },
  { code: '13', nom: 'Bouches-du-Rhône', regionCode: '93' },
  { code: '83', nom: 'Var', regionCode: '93' },
  { code: '84', nom: 'Vaucluse', regionCode: '93' },

];
