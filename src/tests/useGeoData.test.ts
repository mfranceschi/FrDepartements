/**
 * Tests de useGeoData.
 *
 * Le hook utilise un cache module-level et des dynamic imports JSON.
 * vi.mock est hoisted avant tout import, donc les mocks JSON s'appliquent
 * bien aux dynamic imports à l'intérieur du hook.
 *
 * Attention : le cache est partagé entre les tests du même fichier —
 * le premier test le remplit, les suivants le trouvent déjà chaud.
 * On utilise waitFor pour gérer les deux cas.
 */
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// ── Données factices ─────────────────────────────────────────────────────────
// Attention : vi.mock est hoisted avant tout code du module → pas de références
// à des variables locales dans les factories, uniquement des littéraux.

vi.mock('../geo/departements.json', () => ({
  default: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { code: '01', nom: 'Ain' }, geometry: null },
      { type: 'Feature', properties: { code: '75', nom: 'Paris' }, geometry: null },
    ],
  },
}));

vi.mock('../geo/regions.json', () => ({
  default: { type: 'FeatureCollection', features: [] },
}));

vi.mock('../geo/drom/dept-971.json', () => ({
  default: { type: 'Feature', properties: { code: '971', nom: 'Guadeloupe' }, geometry: null },
}));
vi.mock('../geo/drom/dept-972.json', () => ({
  default: { type: 'Feature', properties: { code: '972', nom: 'Martinique' }, geometry: null },
}));
vi.mock('../geo/drom/dept-973.json', () => ({
  default: { type: 'Feature', properties: { code: '973', nom: 'Guyane' }, geometry: null },
}));
vi.mock('../geo/drom/dept-974.json', () => ({
  default: { type: 'Feature', properties: { code: '974', nom: 'La Réunion' }, geometry: null },
}));
vi.mock('../geo/drom/dept-976.json', () => ({
  default: { type: 'Feature', properties: { code: '976', nom: 'Mayotte' }, geometry: null },
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

import { useGeoData } from '../hooks/useGeoData';

describe('useGeoData – chargement des données', () => {
  it('finit par passer loading à false', async () => {
    const { result } = renderHook(() => useGeoData());
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });
  });

  it('expose des FeatureCollections non-nulles après chargement', async () => {
    const { result } = renderHook(() => useGeoData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.departements).not.toBeNull();
    expect(result.current.regions).not.toBeNull();
    expect(result.current.departements!.type).toBe('FeatureCollection');
    expect(result.current.regions!.type).toBe('FeatureCollection');
  });
});

describe('useGeoData – enrichissement DROM', () => {
  it('ajoute les 5 features DROM dans la collection departements', async () => {
    const { result } = renderHook(() => useGeoData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const codes = result.current.departements!.features.map((f) => f.properties?.code as string);
    expect(codes).toContain('971');
    expect(codes).toContain('972');
    expect(codes).toContain('973');
    expect(codes).toContain('974');
    expect(codes).toContain('976');
  });

  it('conserve les départements métropolitains de base', async () => {
    const { result } = renderHook(() => useGeoData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const codes = result.current.departements!.features.map((f) => f.properties?.code as string);
    expect(codes).toContain('01');
    expect(codes).toContain('75');
  });

  it('crée une région pour chaque DROM dans la collection regions', async () => {
    const { result } = renderHook(() => useGeoData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const regionCodes = result.current.regions!.features.map((f) => f.properties?.code as string);
    // Guadeloupe→01, Martinique→02, Guyane→03, La Réunion→04, Mayotte→06
    expect(regionCodes).toContain('01');
    expect(regionCodes).toContain('02');
    expect(regionCodes).toContain('06');
  });

  it('attache le bon nom à chaque région DROM', async () => {
    const { result } = renderHook(() => useGeoData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const regions = result.current.regions!.features;
    const guadeloupe = regions.find((f) => f.properties?.code === '01');
    expect(guadeloupe?.properties?.nom).toBe('Guadeloupe');

    const mayotte = regions.find((f) => f.properties?.code === '06');
    expect(mayotte?.properties?.nom).toBe('Mayotte');
  });
});
