import { useState } from 'react';
import type { SearchResult } from '../../hooks/useSearch';

const DROPDOWN_BLUR_DELAY_MS = 150;

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  results: SearchResult[];
  showResults: boolean;
  onShowResults: (show: boolean) => void;
  onSelect: (result: SearchResult) => void;
}

export default function SearchBar({
  query,
  onQueryChange,
  results,
  showResults,
  onShowResults,
  onSelect,
}: SearchBarProps) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        onSelect(results[activeIndex]);
        setActiveIndex(-1);
      }
    } else if (e.key === 'Escape') {
      onShowResults(false);
      setActiveIndex(-1);
    }
  };

  const showDropdown = showResults && query.length > 0;

  return (
    <div className="relative">
      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.197 5.197a7.5 7.5 0 0 0 10.606 10.606Z" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher un territoire, une préfecture…"
          value={query}
          onChange={(e) => { onQueryChange(e.target.value); onShowResults(true); setActiveIndex(-1); }}
          onFocus={() => onShowResults(true)}
          onBlur={() => setTimeout(() => onShowResults(false), DROPDOWN_BLUR_DELAY_MS)}
          onKeyDown={handleKeyDown}
          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
        />
        {query && (
          <button
            type="button"
            onClick={() => { onQueryChange(''); onShowResults(false); setActiveIndex(-1); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 overflow-hidden"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400 italic">Aucun résultat</li>
          ) : (
            results.map((r, i) => (
              <li key={`${r.type}-${r.code}`} role="option" aria-selected={i === activeIndex}>
                <button
                  id={`search-result-${i}`}
                  type="button"
                  onMouseDown={() => { onSelect(r); setActiveIndex(-1); }}
                  className={[
                    'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors',
                    i === activeIndex ? 'bg-blue-50' : 'hover:bg-blue-50',
                  ].join(' ')}
                >
                  <span
                    className={`inline-block w-2.5 h-2.5 shrink-0 border ${
                      r.type === 'region'
                        ? 'rounded-sm bg-green-100 border-green-500'
                        : r.type === 'prefecture'
                        ? 'rounded-full bg-amber-100 border-amber-500'
                        : r.type === 'fleuve'
                        ? 'rounded-sm bg-blue-100 border-blue-700'
                        : 'rounded-sm bg-blue-100 border-blue-500'
                    }`}
                  />
                  <span className="font-medium text-gray-800 truncate">{r.nom}</span>
                  <span className="text-gray-400 text-xs shrink-0">
                    {r.type === 'fleuve' ? "cours d'eau" : r.code}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
