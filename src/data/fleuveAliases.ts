/** Noms Natural Earth → noms français pour les cours d'eau transfrontaliers. */
export const FLEUVE_ALIASES: Readonly<Record<string, string>> = {
  Mosel: 'Moselle',
  Maas: 'Meuse',
  Schelde: 'Escaut',
};

export function normalizeFleuveName(name: string): string {
  return FLEUVE_ALIASES[name] ?? name;
}
