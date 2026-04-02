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

  it('conserve les départements de base', async () => {
    const { result } = renderHook(() => useGeoData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const codes = result.current.departements!.features.map((f) => f.properties?.code as string);
    expect(codes).toContain('01');
    expect(codes).toContain('75');
  });
});
