import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../storage/useLocalStorage';

// localStorage est vidé avant chaque test via src/tests/setup.ts

describe('useLocalStorage – initialisation', () => {
  it('retourne la valeur par défaut si la clé est absente', () => {
    const { result } = renderHook(() => useLocalStorage('k', 42));
    expect(result.current[0]).toBe(42);
  });

  it('lit la valeur stockée si la clé existe', () => {
    localStorage.setItem('k', JSON.stringify(99));
    const { result } = renderHook(() => useLocalStorage('k', 0));
    expect(result.current[0]).toBe(99);
  });

  it('retourne la valeur par défaut si le JSON stocké est invalide', () => {
    localStorage.setItem('k', 'not-json{{{');
    const { result } = renderHook(() => useLocalStorage('k', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('retourne la valeur par défaut si localStorage.getItem lance une exception', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('SecurityError');
    });
    const { result } = renderHook(() => useLocalStorage('k', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('fonctionne avec des objets imbriqués', () => {
    localStorage.setItem('k', JSON.stringify({ x: 1, y: [2, 3] }));
    const { result } = renderHook(() => useLocalStorage<{ x: number; y: number[] }>('k', { x: 0, y: [] }));
    expect(result.current[0]).toEqual({ x: 1, y: [2, 3] });
  });
});

describe('useLocalStorage – mise à jour', () => {
  it('met à jour l\'état React et persiste dans localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('k', 0));
    act(() => { result.current[1](7); });
    expect(result.current[0]).toBe(7);
    expect(JSON.parse(localStorage.getItem('k')!)).toBe(7);
  });

  it('accepte un updater fonctionnel', () => {
    const { result } = renderHook(() => useLocalStorage('k', 10));
    act(() => { result.current[1](prev => prev + 5); });
    expect(result.current[0]).toBe(15);
    expect(JSON.parse(localStorage.getItem('k')!)).toBe(15);
  });

  it('conserve l\'état React même si localStorage.setItem lance une exception (quota dépassé)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });
    const { result } = renderHook(() => useLocalStorage('k', 'initial'));
    act(() => { result.current[1]('updated'); });
    expect(result.current[0]).toBe('updated');
  });

  it('les appels successifs accumulent correctement via l\'updater fonctionnel', () => {
    const { result } = renderHook(() => useLocalStorage('k', 0));
    act(() => {
      result.current[1](prev => prev + 1);
      result.current[1](prev => prev + 1);
      result.current[1](prev => prev + 1);
    });
    expect(result.current[0]).toBe(3);
  });
});
