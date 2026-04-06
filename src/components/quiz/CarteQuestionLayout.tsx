import { useMemo, useState, type ReactNode } from 'react';
import type { Feature } from 'geojson';
import CarteFrance from '../carte/CarteFrance';
import type { CarteFranceProps } from '../carte/CarteFrance';
import { useGeoData } from '../../hooks/useGeoData';

interface CarteQuestionLayoutProps {
  children: ReactNode;
  questionId: string;
  mapProps: Omit<CarteFranceProps, 'features'>;
}

export default function CarteQuestionLayout({ children, questionId, mapProps }: CarteQuestionLayoutProps) {
  const geoData = useGeoData();
  const [questionOpen, setQuestionOpen] = useState(true);

  const features = useMemo(
    () =>
      geoData.departements && geoData.regions
        ? {
            departements: geoData.departements.features as Feature[],
            regions: geoData.regions.features as Feature[],
          }
        : null,
    [geoData.departements, geoData.regions],
  );

  if (!features) {
    return <p className="text-center text-gray-500">Chargement de la carte…</p>;
  }

  // DOM unique — le bouton toggle est visuellement masqué sur desktop (md:hidden),
  // et le contenu question est toujours visible sur desktop (md:flex) même si fermé sur mobile.
  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_2fr] gap-2 md:gap-6 h-full">
      {/* Panel question */}
      <div className="shrink-0 md:shrink md:flex md:flex-col md:gap-4 border border-gray-200 md:border-transparent rounded-lg md:rounded-none overflow-hidden">
        {/* Bouton toggle — mobile uniquement */}
        <button
          type="button"
          onClick={() => setQuestionOpen(v => !v)}
          className="md:hidden w-full flex items-center justify-between px-3 py-2 bg-gray-50 text-sm font-medium text-gray-600"
          aria-expanded={questionOpen}
          data-testid="toggle-question"
        >
          <span>Question</span>
          <span className={`transition-transform duration-200 ${questionOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {/* Contenu : masqué sur mobile quand fermé, toujours visible sur desktop */}
        <div className={`flex flex-col gap-3 p-3 md:p-0 md:gap-4 md:flex ${questionOpen ? 'flex' : 'hidden'}`}>
          {children}
        </div>
      </div>

      {/* Carte : 60vh mobile, pleine hauteur desktop */}
      <div className="border border-gray-300 rounded-lg overflow-hidden h-[60vh] md:h-full">
        <CarteFrance key={questionId} features={features} {...mapProps} />
      </div>
    </div>
  );
}
