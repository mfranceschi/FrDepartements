import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizHistory, relativeTime } from '../storage/useQuizHistory';

// ── relativeTime ──────────────────────────────────────────────────────────────

describe('relativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retourne "à l\'instant" pour moins d\'une minute', () => {
    expect(relativeTime(new Date('2024-06-15T11:59:30Z').toISOString())).toBe("à l'instant");
  });

  it('retourne "il y a Xmin" pour moins d\'une heure', () => {
    expect(relativeTime(new Date('2024-06-15T11:45:00Z').toISOString())).toBe('il y a 15min');
  });

  it('retourne "il y a Xh" pour moins d\'un jour', () => {
    expect(relativeTime(new Date('2024-06-15T09:00:00Z').toISOString())).toBe('il y a 3h');
  });

  it('retourne "il y a 1j" pour exactement 24 heures', () => {
    expect(relativeTime(new Date('2024-06-14T12:00:00Z').toISOString())).toBe('il y a 1j');
  });

  it('retourne "il y a Xj" pour plusieurs jours', () => {
    expect(relativeTime(new Date('2024-06-10T12:00:00Z').toISOString())).toBe('il y a 5j');
  });

  it('frontière 1h : 59 min → "il y a 59min", 60 min → "il y a 1h"', () => {
    expect(relativeTime(new Date('2024-06-15T11:01:00Z').toISOString())).toBe('il y a 59min');
    expect(relativeTime(new Date('2024-06-15T11:00:00Z').toISOString())).toBe('il y a 1h');
  });

  it('frontière 1 min : 59s → "à l\'instant", 60s → "il y a 1min"', () => {
    expect(relativeTime(new Date('2024-06-15T11:59:01Z').toISOString())).toBe("à l'instant");
    expect(relativeTime(new Date('2024-06-15T11:59:00Z').toISOString())).toBe('il y a 1min');
  });
});

// ── useQuizHistory ────────────────────────────────────────────────────────────

describe('useQuizHistory', () => {
  it('retourne un tableau vide au démarrage', () => {
    const { result } = renderHook(() => useQuizHistory());
    expect(result.current[0]).toEqual([]);
  });

  it('addSession préfixe — la plus récente est en tête', () => {
    const { result } = renderHook(() => useQuizHistory());

    act(() => {
      result.current[1]({ date: '2024-01-01T00:00:00Z', sujet: 'depts-carte', score: 8, total: 10 });
    });
    act(() => {
      result.current[1]({ date: '2024-01-02T00:00:00Z', sujet: 'regions-carte', score: 5, total: 13 });
    });

    const [sessions] = result.current;
    expect(sessions).toHaveLength(2);
    expect(sessions[0].sujet).toBe('regions-carte');
    expect(sessions[1].sujet).toBe('depts-carte');
  });

  it('les sessions sont persistées dans localStorage', () => {
    const { result } = renderHook(() => useQuizHistory());

    act(() => {
      result.current[1]({ date: '2024-01-01T00:00:00Z', sujet: 'depts-numeros', score: 10, total: 10 });
    });

    const stored = JSON.parse(localStorage.getItem('frdepts.sessions')!);
    expect(stored).toHaveLength(1);
    expect(stored[0].sujet).toBe('depts-numeros');
  });

  it('tronque à 100 sessions (FIFO — les plus anciennes sont éjectées)', () => {
    const { result } = renderHook(() => useQuizHistory());

    act(() => {
      for (let i = 0; i < 101; i++) {
        result.current[1]({ date: '2024-01-01T00:00:00Z', sujet: 'depts-carte', score: i, total: 101 });
      }
    });

    const [sessions] = result.current;
    expect(sessions).toHaveLength(100);
    // La session avec score=100 (ajoutée en dernier) est en tête
    expect(sessions[0].score).toBe(100);
    // La session avec score=0 (la plus ancienne) a été éjectée
    expect(sessions.some(s => s.score === 0)).toBe(false);
  });
});
