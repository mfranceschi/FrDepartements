import { useState, useCallback } from 'react';

/**
 * Persiste une valeur dans le localStorage et l'expose comme un useState.
 * Lit le localStorage uniquement à l'initialisation (pas de sync cross-onglets).
 * Silencieux en cas d'erreur (quota, mode navigation privée).
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue(prev => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Quota dépassé ou navigation privée — on garde quand même l'état React
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, set] as const;
}
