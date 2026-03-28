export interface GroupTerritoryConfig {
  code: string;
  nom: string;
  /** Si fourni, le territoire est rendu agrandi à cette taille (px) centré sur son centroïde */
  targetSizePx?: number;
}

export interface GroupInsetConfig {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** [lng_west, lat_south, lng_east, lat_north] */
  geoBounds: [number, number, number, number];
  territories: GroupTerritoryConfig[];
}
