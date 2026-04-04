import { useMemo, type ReactNode } from 'react';
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

  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_2fr] gap-6 md:h-full">
      <div className="flex flex-col gap-4">
        {children}
      </div>
      <div className="h-full border border-gray-300 rounded-lg overflow-hidden">
        <CarteFrance
          key={questionId}
          features={features}
          {...mapProps}
        />
      </div>
    </div>
  );
}
