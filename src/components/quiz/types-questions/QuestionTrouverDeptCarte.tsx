import type { Feature } from 'geojson';
import CarteFrance from '../../carte/CarteFrance';
import { useGeoData } from '../../../hooks/useGeoData';
import type { QuestionProps } from '../../../quiz/types';

export default function QuestionTrouverDeptCarte({
  question,
  answerState,
  selectedCode,
  onAnswer,
}: QuestionProps) {
  const geoData = useGeoData();

  if (!geoData.departements || !geoData.regions) {
    return <p className="text-center text-gray-500">Chargement de la carte…</p>;
  }

  const deptFeatures = geoData.departements.features as Feature[];
  const regionFeatures = geoData.regions.features as Feature[];

  const handleClick = (code: string) => {
    if (answerState === 'pending') {
      onAnswer(code);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-lg">
        Cliquez sur le département{' '}
        <strong>{question.targetNom}</strong>{' '}
        <span className="text-gray-500">({question.targetCode})</span>
      </p>

      {answerState !== 'pending' && (
        <div
          className={`text-center font-semibold text-base py-2 rounded ${
            answerState === 'correct'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {answerState === 'correct' ? '✓ Bonne réponse !' : '✗ Mauvaise réponse.'}
        </div>
      )}

      <CarteFrance
        key={question.id}
        features={{ departements: deptFeatures, regions: regionFeatures }}
        quizMode={true}
        quizLayer="departements"
        highlightCode={answerState !== 'pending' ? question.targetCode : undefined}
        highlightType="departement"
        wrongCode={answerState === 'wrong' && selectedCode !== question.targetCode ? selectedCode ?? undefined : undefined}
        wrongType="departement"
        onFeatureClick={(code) => handleClick(code)}
      />
    </div>
  );
}
