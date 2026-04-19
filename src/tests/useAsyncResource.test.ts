import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAsyncResource, assertFeatureCollection } from '../hooks/useAsyncResource';

type Cache<T> = { data: T | null; promise: Promise<void> | null };

function makeCache<T>(initial: T | null = null): Cache<T> {
  return { data: initial, promise: null };
}

const DUMMY_DATA = { type: 'FeatureCollection', features: [] };

describe('useAsyncResource', () => {

  it('état initial : loading=true, data=null si enabled et cache vide', () => {
    const cache = makeCache<unknown>();
    const load = vi.fn().mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAsyncResource(cache, load));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('état initial : loading=false si enabled=false', () => {
    const cache = makeCache<unknown>();
    const load = vi.fn();
    const { result } = renderHook(() => useAsyncResource(cache, load, { enabled: false }));
    expect(result.current.loading).toBe(false);
    expect(load).not.toHaveBeenCalled();
  });

  it('état initial : data pré-chargé depuis le cache', () => {
    const cache = makeCache(DUMMY_DATA);
    const load = vi.fn();
    const { result } = renderHook(() => useAsyncResource(cache, load));
    expect(result.current.data).toBe(DUMMY_DATA);
    expect(result.current.loading).toBe(false);
  });

  it('passe en data après résolution réussie', async () => {
    const cache = makeCache<unknown>();
    const load = vi.fn().mockResolvedValue(DUMMY_DATA);
    const { result } = renderHook(() => useAsyncResource(cache, load));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe(DUMMY_DATA);
    expect(result.current.error).toBeNull();
  });

  it('passe en error après rejet du chargement', async () => {
    const cache = makeCache<unknown>();
    const load = vi.fn().mockRejectedValue(new Error('Échec réseau'));
    const { result } = renderHook(() => useAsyncResource(cache, load));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error!.message).toBe('Échec réseau');
  });

  it('passe en error après timeout', async () => {
    const cache = makeCache<unknown>();
    const load = vi.fn().mockReturnValue(new Promise(() => {})); // ne résout jamais
    const { result } = renderHook(() =>
      useAsyncResource(cache, load, { timeoutMs: 100 }),
    );

    await waitFor(() => expect(result.current.error).not.toBeNull(), { timeout: 2000 });
    expect(result.current.error!.message).toContain('Délai');
  });

  it('le cache hit évite un second appel à load', async () => {
    const cache = makeCache<unknown>();
    const load = vi.fn().mockResolvedValue(DUMMY_DATA);
    const { result, rerender } = renderHook(() => useAsyncResource(cache, load));

    await waitFor(() => expect(result.current.data).not.toBeNull());
    const callCount = load.mock.calls.length;

    rerender();
    expect(load.mock.calls.length).toBe(callCount); // pas de second appel
  });

  it('le changement de enabled de false à true déclenche le chargement', async () => {
    const cache = makeCache<unknown>();
    const load = vi.fn().mockResolvedValue(DUMMY_DATA);
    let enabled = false;
    const { result, rerender } = renderHook(() =>
      useAsyncResource(cache, load, { enabled }),
    );

    expect(result.current.loading).toBe(false);
    expect(load).not.toHaveBeenCalled();

    enabled = true;
    rerender();

    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(load).toHaveBeenCalledOnce();
  });
});

describe('assertFeatureCollection', () => {
  it('ne lance pas d\'erreur pour un FeatureCollection valide', () => {
    const valid = { type: 'FeatureCollection', features: [] };
    expect(() => assertFeatureCollection(valid, 'test')).not.toThrow();
  });

  it('lance une erreur pour un objet sans type FeatureCollection', () => {
    expect(() => assertFeatureCollection({ type: 'Feature' }, 'test')).toThrow('test is not a valid GeoJSON FeatureCollection');
  });

  it('lance une erreur pour null', () => {
    expect(() => assertFeatureCollection(null, 'test')).toThrow();
  });

  it('lance une erreur si features n\'est pas un tableau', () => {
    expect(() => assertFeatureCollection({ type: 'FeatureCollection', features: {} }, 'test')).toThrow();
  });
});
