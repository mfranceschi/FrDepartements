import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSearch } from '../hooks/useSearch';

describe('useSearch', () => {
  it('retourne un tableau vide pour une requête vide', () => {
    const { result } = renderHook(() => useSearch(''));
    expect(result.current).toHaveLength(0);
  });

  it('retourne un tableau vide pour une requête d\'un seul espace', () => {
    const { result } = renderHook(() => useSearch(' '));
    expect(result.current).toHaveLength(0);
  });

  it('trouve un département par son nom (insensible à la casse)', () => {
    const { result } = renderHook(() => useSearch('paris'));
    const depts = result.current.filter((r) => r.type === 'departement');
    expect(depts.some((r) => r.code === '75')).toBe(true);
  });

  it('trouve un département par son code numérique', () => {
    const { result } = renderHook(() => useSearch('75'));
    const dept = result.current.find((r) => r.type === 'departement' && r.code === '75');
    expect(dept).toBeDefined();
  });

  it('trouve une région par son nom', () => {
    const { result } = renderHook(() => useSearch('bretagne'));
    const region = result.current.find((r) => r.type === 'region' && r.code === '53');
    expect(region).toBeDefined();
  });

  it('trouve une préfecture par son nom', () => {
    const { result } = renderHook(() => useSearch('strasbourg'));
    const pref = result.current.find((r) => r.type === 'prefecture');
    expect(pref).toBeDefined();
    expect(pref!.nom.toLowerCase()).toContain('strasbourg');
  });

  it('trouve un fleuve par son nom', () => {
    // 'adour' ne correspond à aucun département ni région, uniquement au fleuve
    const { result } = renderHook(() => useSearch('adour'));
    const fleuve = result.current.find((r) => r.type === 'fleuve');
    expect(fleuve).toBeDefined();
  });

  it('limite les résultats à 8 maximum', () => {
    // 'e' est contenu dans une grande majorité des noms
    const { result } = renderHook(() => useSearch('e'));
    expect(result.current.length).toBeLessThanOrEqual(8);
  });

  it('inclut la région dans le subtitle d\'un département', () => {
    const { result } = renderHook(() => useSearch('ain'));
    const dept = result.current.find((r) => r.type === 'departement' && r.code === '01');
    expect(dept).toBeDefined();
    expect(dept!.subtitle).toBeTruthy();
  });

  it('le subtitle d\'une région est "Région"', () => {
    const { result } = renderHook(() => useSearch('normandie'));
    const region = result.current.find((r) => r.type === 'region');
    expect(region).toBeDefined();
    expect(region!.subtitle).toBe('Région');
  });

  it('le subtitle d\'un fleuve est "Cours d\'eau"', () => {
    const { result } = renderHook(() => useSearch('rhône'));
    const fleuve = result.current.find((r) => r.type === 'fleuve');
    if (fleuve) expect(fleuve.subtitle).toBe("Cours d'eau");
  });

  it('préfixe numérique "0" trouve les départements commençant par 0', () => {
    const { result } = renderHook(() => useSearch('0'));
    const depts = result.current.filter((r) => r.type === 'departement');
    depts.forEach((r) => expect(r.code.startsWith('0')).toBe(true));
  });

  it('résultat vide pour une requête sans correspondance', () => {
    const { result } = renderHook(() => useSearch('xyzzy_inconnu_123'));
    expect(result.current).toHaveLength(0);
  });
});
