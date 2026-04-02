export interface Departement {
  code: string;
  nom: string;
  regionCode: string;
  prefecture: string;
  lat: number;
  lon: number;
  /** true si la préfecture de ce département est aussi préfecture de région */
  isPrefectureRegionale?: boolean;
}

export const DEPARTEMENTS: Departement[] = [
  // Auvergne-Rhône-Alpes (84)
  { code: '01', nom: 'Ain',           regionCode: '84', prefecture: 'Bourg-en-Bresse',    lat: 46.2050, lon:  5.2292 },
  { code: '03', nom: 'Allier',        regionCode: '84', prefecture: 'Moulins',             lat: 46.5652, lon:  3.3327 },
  { code: '07', nom: 'Ardèche',       regionCode: '84', prefecture: 'Privas',              lat: 44.7354, lon:  4.5997 },
  { code: '15', nom: 'Cantal',        regionCode: '84', prefecture: 'Aurillac',            lat: 44.9281, lon:  2.4404 },
  { code: '26', nom: 'Drôme',         regionCode: '84', prefecture: 'Valence',             lat: 44.9334, lon:  4.8924 },
  { code: '38', nom: 'Isère',         regionCode: '84', prefecture: 'Grenoble',            lat: 45.1885, lon:  5.7245 },
  { code: '42', nom: 'Loire',         regionCode: '84', prefecture: 'Saint-Étienne',       lat: 45.4342, lon:  4.3900 },
  { code: '43', nom: 'Haute-Loire',   regionCode: '84', prefecture: 'Le Puy-en-Velay',     lat: 45.0434, lon:  3.8847 },
  { code: '63', nom: 'Puy-de-Dôme',  regionCode: '84', prefecture: 'Clermont-Ferrand',    lat: 45.7772, lon:  3.0870 },
  { code: '69', nom: 'Rhône',         regionCode: '84', prefecture: 'Lyon',                lat: 45.7640, lon:  4.8357, isPrefectureRegionale: true },
  { code: '73', nom: 'Savoie',        regionCode: '84', prefecture: 'Chambéry',            lat: 45.5646, lon:  5.9178 },
  { code: '74', nom: 'Haute-Savoie', regionCode: '84', prefecture: 'Annecy',              lat: 45.8992, lon:  6.1294 },

  // Bourgogne-Franche-Comté (27)
  { code: '21', nom: 'Côte-d\'Or',             regionCode: '27', prefecture: 'Dijon',          lat: 47.3220, lon:  5.0415, isPrefectureRegionale: true },
  { code: '25', nom: 'Doubs',                  regionCode: '27', prefecture: 'Besançon',        lat: 47.2378, lon:  6.0241 },
  { code: '39', nom: 'Jura',                   regionCode: '27', prefecture: 'Lons-le-Saunier', lat: 46.6757, lon:  5.5547 },
  { code: '58', nom: 'Nièvre',                 regionCode: '27', prefecture: 'Nevers',          lat: 46.9895, lon:  3.1590 },
  { code: '70', nom: 'Haute-Saône',            regionCode: '27', prefecture: 'Vesoul',          lat: 47.6215, lon:  6.1560 },
  { code: '71', nom: 'Saône-et-Loire',         regionCode: '27', prefecture: 'Mâcon',           lat: 46.3063, lon:  4.8274 },
  { code: '89', nom: 'Yonne',                  regionCode: '27', prefecture: 'Auxerre',         lat: 47.7986, lon:  3.5671 },
  { code: '90', nom: 'Territoire de Belfort',  regionCode: '27', prefecture: 'Belfort',         lat: 47.6380, lon:  6.8633 },

  // Bretagne (53)
  { code: '22', nom: 'Côtes-d\'Armor', regionCode: '53', prefecture: 'Saint-Brieuc', lat: 48.5146, lon: -2.7654 },
  { code: '29', nom: 'Finistère',      regionCode: '53', prefecture: 'Quimper',      lat: 47.9950, lon: -4.0979 },
  { code: '35', nom: 'Ille-et-Vilaine',regionCode: '53', prefecture: 'Rennes',       lat: 48.1173, lon: -1.6778, isPrefectureRegionale: true },
  { code: '56', nom: 'Morbihan',       regionCode: '53', prefecture: 'Vannes',       lat: 47.6580, lon: -2.7604 },

  // Centre-Val de Loire (24)
  { code: '18', nom: 'Cher',          regionCode: '24', prefecture: 'Bourges',      lat: 47.0810, lon:  2.3980 },
  { code: '28', nom: 'Eure-et-Loir',  regionCode: '24', prefecture: 'Chartres',     lat: 48.4469, lon:  1.4871 },
  { code: '36', nom: 'Indre',         regionCode: '24', prefecture: 'Châteauroux',  lat: 46.8131, lon:  1.6919 },
  { code: '37', nom: 'Indre-et-Loire',regionCode: '24', prefecture: 'Tours',        lat: 47.3941, lon:  0.6848 },
  { code: '41', nom: 'Loir-et-Cher',  regionCode: '24', prefecture: 'Blois',        lat: 47.5861, lon:  1.3359 },
  { code: '45', nom: 'Loiret',        regionCode: '24', prefecture: 'Orléans',      lat: 47.9029, lon:  1.9039, isPrefectureRegionale: true },

  // Corse (94)
  { code: '2A', nom: 'Corse-du-Sud', regionCode: '94', prefecture: 'Ajaccio', lat: 41.9192, lon:  8.7386, isPrefectureRegionale: true },
  { code: '2B', nom: 'Haute-Corse',  regionCode: '94', prefecture: 'Bastia',  lat: 42.6977, lon:  9.4500 },

  // Grand Est (44)
  { code: '08', nom: 'Ardennes',          regionCode: '44', prefecture: 'Charleville-Mézières',  lat: 49.7713, lon:  4.7161 },
  { code: '10', nom: 'Aube',              regionCode: '44', prefecture: 'Troyes',                 lat: 48.2973, lon:  4.0744 },
  { code: '51', nom: 'Marne',             regionCode: '44', prefecture: 'Châlons-en-Champagne',   lat: 48.9574, lon:  4.3637 },
  { code: '52', nom: 'Haute-Marne',       regionCode: '44', prefecture: 'Chaumont',               lat: 48.1113, lon:  5.1388 },
  { code: '54', nom: 'Meurthe-et-Moselle',regionCode: '44', prefecture: 'Nancy',                  lat: 48.6921, lon:  6.1844 },
  { code: '55', nom: 'Meuse',             regionCode: '44', prefecture: 'Bar-le-Duc',              lat: 48.7731, lon:  5.1601 },
  { code: '57', nom: 'Moselle',           regionCode: '44', prefecture: 'Metz',                   lat: 49.1193, lon:  6.1757 },
  { code: '67', nom: 'Bas-Rhin',          regionCode: '44', prefecture: 'Strasbourg',              lat: 48.5734, lon:  7.7521, isPrefectureRegionale: true },
  { code: '68', nom: 'Haut-Rhin',         regionCode: '44', prefecture: 'Colmar',                  lat: 48.0793, lon:  7.3585 },
  { code: '88', nom: 'Vosges',            regionCode: '44', prefecture: 'Épinal',                  lat: 48.1741, lon:  6.4515 },

  // Hauts-de-France (32)
  { code: '02', nom: 'Aisne',        regionCode: '32', prefecture: 'Laon',    lat: 49.5638, lon:  3.6245 },
  { code: '59', nom: 'Nord',         regionCode: '32', prefecture: 'Lille',   lat: 50.6292, lon:  3.0573, isPrefectureRegionale: true },
  { code: '60', nom: 'Oise',         regionCode: '32', prefecture: 'Beauvais',lat: 49.4292, lon:  2.0806 },
  { code: '62', nom: 'Pas-de-Calais',regionCode: '32', prefecture: 'Arras',   lat: 50.2929, lon:  2.7793 },
  { code: '80', nom: 'Somme',        regionCode: '32', prefecture: 'Amiens',  lat: 49.8942, lon:  2.2957 },

  // Île-de-France (11)
  { code: '75', nom: 'Paris',              regionCode: '11', prefecture: 'Paris',               lat: 48.8566, lon:  2.3522, isPrefectureRegionale: true },
  { code: '77', nom: 'Seine-et-Marne',    regionCode: '11', prefecture: 'Melun',               lat: 48.5400, lon:  2.6600 },
  { code: '78', nom: 'Yvelines',          regionCode: '11', prefecture: 'Versailles',           lat: 48.8014, lon:  2.1301 },
  { code: '91', nom: 'Essonne',           regionCode: '11', prefecture: 'Évry-Courcouronnes',   lat: 48.6241, lon:  2.4419 },
  { code: '92', nom: 'Hauts-de-Seine',    regionCode: '11', prefecture: 'Nanterre',             lat: 48.8924, lon:  2.2069 },
  { code: '93', nom: 'Seine-Saint-Denis', regionCode: '11', prefecture: 'Bobigny',              lat: 48.9093, lon:  2.4406 },
  { code: '94', nom: 'Val-de-Marne',      regionCode: '11', prefecture: 'Créteil',              lat: 48.7905, lon:  2.4549 },
  { code: '95', nom: 'Val-d\'Oise',        regionCode: '11', prefecture: 'Cergy',                lat: 49.0388, lon:  2.0752 },

  // Normandie (28)
  { code: '14', nom: 'Calvados',      regionCode: '28', prefecture: 'Caen',      lat: 49.1829, lon: -0.3707 },
  { code: '27', nom: 'Eure',          regionCode: '28', prefecture: 'Évreux',    lat: 49.0221, lon:  1.1511 },
  { code: '50', nom: 'Manche',        regionCode: '28', prefecture: 'Saint-Lô',  lat: 49.1167, lon: -1.0900 },
  { code: '61', nom: 'Orne',          regionCode: '28', prefecture: 'Alençon',   lat: 48.4311, lon:  0.0907 },
  { code: '76', nom: 'Seine-Maritime',regionCode: '28', prefecture: 'Rouen',     lat: 49.4431, lon:  1.0993, isPrefectureRegionale: true },

  // Nouvelle-Aquitaine (75)
  { code: '16', nom: 'Charente',              regionCode: '75', prefecture: 'Angoulême',       lat: 45.6490, lon:  0.1560 },
  { code: '17', nom: 'Charente-Maritime',     regionCode: '75', prefecture: 'La Rochelle',     lat: 46.1603, lon: -1.1511 },
  { code: '19', nom: 'Corrèze',               regionCode: '75', prefecture: 'Tulle',           lat: 45.2684, lon:  1.7727 },
  { code: '23', nom: 'Creuse',                regionCode: '75', prefecture: 'Guéret',          lat: 46.1711, lon:  1.8724 },
  { code: '24', nom: 'Dordogne',              regionCode: '75', prefecture: 'Périgueux',        lat: 45.1852, lon:  0.7215 },
  { code: '33', nom: 'Gironde',               regionCode: '75', prefecture: 'Bordeaux',         lat: 44.8378, lon: -0.5792, isPrefectureRegionale: true },
  { code: '40', nom: 'Landes',                regionCode: '75', prefecture: 'Mont-de-Marsan',   lat: 43.8890, lon: -0.5010 },
  { code: '47', nom: 'Lot-et-Garonne',        regionCode: '75', prefecture: 'Agen',             lat: 44.2029, lon:  0.6210 },
  { code: '64', nom: 'Pyrénées-Atlantiques',  regionCode: '75', prefecture: 'Pau',              lat: 43.2951, lon: -0.3708 },
  { code: '79', nom: 'Deux-Sèvres',           regionCode: '75', prefecture: 'Niort',            lat: 46.3239, lon: -0.4565 },
  { code: '86', nom: 'Vienne',                regionCode: '75', prefecture: 'Poitiers',         lat: 46.5802, lon:  0.3404 },
  { code: '87', nom: 'Haute-Vienne',          regionCode: '75', prefecture: 'Limoges',          lat: 45.8336, lon:  1.2611 },

  // Occitanie (76)
  { code: '09', nom: 'Ariège',                regionCode: '76', prefecture: 'Foix',        lat: 42.9651, lon:  1.6077 },
  { code: '11', nom: 'Aude',                  regionCode: '76', prefecture: 'Carcassonne', lat: 43.2130, lon:  2.3491 },
  { code: '12', nom: 'Aveyron',               regionCode: '76', prefecture: 'Rodez',       lat: 44.3512, lon:  2.5735 },
  { code: '30', nom: 'Gard',                  regionCode: '76', prefecture: 'Nîmes',       lat: 43.8367, lon:  4.3601 },
  { code: '31', nom: 'Haute-Garonne',         regionCode: '76', prefecture: 'Toulouse',    lat: 43.6047, lon:  1.4442, isPrefectureRegionale: true },
  { code: '32', nom: 'Gers',                  regionCode: '76', prefecture: 'Auch',        lat: 43.6461, lon:  0.5854 },
  { code: '34', nom: 'Hérault',               regionCode: '76', prefecture: 'Montpellier', lat: 43.6119, lon:  3.8772 },
  { code: '46', nom: 'Lot',                   regionCode: '76', prefecture: 'Cahors',      lat: 44.4481, lon:  1.4426 },
  { code: '48', nom: 'Lozère',                regionCode: '76', prefecture: 'Mende',       lat: 44.5189, lon:  3.5023 },
  { code: '65', nom: 'Hautes-Pyrénées',       regionCode: '76', prefecture: 'Tarbes',      lat: 43.2328, lon:  0.0781 },
  { code: '66', nom: 'Pyrénées-Orientales',   regionCode: '76', prefecture: 'Perpignan',   lat: 42.6987, lon:  2.8954 },
  { code: '81', nom: 'Tarn',                  regionCode: '76', prefecture: 'Albi',        lat: 43.9293, lon:  2.1487 },
  { code: '82', nom: 'Tarn-et-Garonne',       regionCode: '76', prefecture: 'Montauban',   lat: 44.0171, lon:  1.3526 },

  // Pays de la Loire (52)
  { code: '44', nom: 'Loire-Atlantique', regionCode: '52', prefecture: 'Nantes',          lat: 47.2184, lon: -1.5536, isPrefectureRegionale: true },
  { code: '49', nom: 'Maine-et-Loire',   regionCode: '52', prefecture: 'Angers',          lat: 47.4784, lon: -0.5632 },
  { code: '53', nom: 'Mayenne',          regionCode: '52', prefecture: 'Laval',           lat: 48.0731, lon: -0.7653 },
  { code: '72', nom: 'Sarthe',           regionCode: '52', prefecture: 'Le Mans',         lat: 48.0061, lon:  0.1996 },
  { code: '85', nom: 'Vendée',           regionCode: '52', prefecture: 'La Roche-sur-Yon',lat: 46.6700, lon: -1.4260 },

  // Provence-Alpes-Côte d'Azur (93)
  { code: '04', nom: 'Alpes-de-Haute-Provence', regionCode: '93', prefecture: 'Digne-les-Bains', lat: 44.0921, lon:  6.2359 },
  { code: '05', nom: 'Hautes-Alpes',            regionCode: '93', prefecture: 'Gap',              lat: 44.5590, lon:  6.0795 },
  { code: '06', nom: 'Alpes-Maritimes',         regionCode: '93', prefecture: 'Nice',             lat: 43.7102, lon:  7.2620 },
  { code: '13', nom: 'Bouches-du-Rhône',        regionCode: '93', prefecture: 'Marseille',        lat: 43.2965, lon:  5.3698, isPrefectureRegionale: true },
  { code: '83', nom: 'Var',                     regionCode: '93', prefecture: 'Toulon',           lat: 43.1242, lon:  5.9280 },
  { code: '84', nom: 'Vaucluse',                regionCode: '93', prefecture: 'Avignon',          lat: 43.9493, lon:  4.8055 },

];
