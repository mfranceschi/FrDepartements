/**
 * Adjacence géographique des régions métropolitaines françaises.
 * Utilisée en mode difficile pour proposer des régions voisines comme distractors.
 */
export const REGION_ADJACENCY: Record<string, string[]> = {
  '11': ['28', '32', '44', '27', '24'],              // Île-de-France
  '24': ['11', '28', '52', '53', '75', '84', '27'],  // Centre-Val de Loire
  '27': ['11', '44', '84', '24'],                    // Bourgogne-Franche-Comté
  '28': ['11', '32', '53', '52', '24'],              // Normandie
  '32': ['11', '28', '44'],                          // Hauts-de-France
  '44': ['11', '32', '27'],                          // Grand Est
  '52': ['28', '53', '75', '24'],                    // Pays de la Loire
  '53': ['28', '52'],                                // Bretagne
  '75': ['24', '52', '84', '76'],                    // Nouvelle-Aquitaine
  '76': ['75', '84', '93'],                          // Occitanie
  '84': ['24', '27', '75', '76', '93'],              // Auvergne-Rhône-Alpes
  '93': ['84', '76', '94'],                          // Provence-Alpes-Côte d'Azur
  '94': ['93'],                                      // Corse
};
