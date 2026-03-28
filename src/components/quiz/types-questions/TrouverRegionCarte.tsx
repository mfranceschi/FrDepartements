import type { Feature, FeatureCollection } from 'geojson';
import CarteFrance from '../../carte/CarteFrance';
import type { Question, AnswerState } from '../../../quiz/types';

interface TrouverRegionCarteProps {
  question: Question;
  geoData: {
    departements: FeatureCollection | null;
    regions: FeatureCollection | null;
  };
  answerState: AnswerState;
  selectedCode: string | null;
  onAnswer: (code: string) => void;
}

export default function TrouverRegionCarte({
  question,
  geoData,
  answerState,
  selectedCode,
  onAnswer,
}: TrouverRegionCarteProps) {
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
        Cliquez sur la région <strong>{question.targetNom}</strong>
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
        quizLayer="regions"
        highlightCode={answerState !== 'pending' ? question.targetCode : undefined}
        highlightType="region"
        wrongCode={answerState === 'wrong' && selectedCode !== question.targetCode ? selectedCode ?? undefined : undefined}
        wrongType="region"
        onFeatureClick={(code) => handleClick(code)}
      />
    </div>
  );
}
