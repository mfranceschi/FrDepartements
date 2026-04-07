/**
 * Tests de useFleuveData.
 * Le hook utilise fetch() vers /fleuves.json (public/).
 * On mock fetch globalement.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const STUB: unknown = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'Loire', scalerank: 2 }, geometry: null },
    { type: 'Feature', properties: { name: 'Rhône', scalerank: 2 }, geometry: null },
  ],
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(STUB),
  }));
});

import { useFleuveData } from '../hooks/useFleuveData';

describe('useFleuveData', () => {
  it('ne charge pas les données si enabled=false', () => {
    const { result } = renderHook(() => useFleuveData(false));
    expect(result.current.loading).toBe(false);
    expect(result.current.fleuves).toBeNull();
  });

  it('charge les données et passe loading à false si enabled=true', async () => {
    const { result } = renderHook(() => useFleuveData(true));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });
    expect(result.current.error).toBeNull();
  });

  it('expose une FeatureCollection non-nulle avec les bons noms', async () => {
    const { result } = renderHook(() => useFleuveData(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.fleuves).not.toBeNull();
    expect(result.current.fleuves!.type).toBe('FeatureCollection');
    const names = result.current.fleuves!.features.map((f) => f.properties?.name as string);
    expect(names).toContain('Loire');
    expect(names).toContain('Rhône');
  });
});
