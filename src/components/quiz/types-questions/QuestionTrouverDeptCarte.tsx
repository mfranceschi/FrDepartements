import type { Feature } from 'geojson';
import CarteFrance from '../../carte/CarteFrance';
import { useGeoData } from '../../../hooks/useGeoData';
import type { QuestionProps } from '../../../quiz/types';

export default function QuestionTrouverDeptCarte({
  question,
  answerState,
  selectedCode,
  onAnswer,
  onNext,
  isLastQuestion,
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
    <div className="flex flex-col md:grid md:grid-cols-[1fr_2fr] gap-6 items-start">
      {/* Colonne gauche : énoncé + feedback + bouton */}
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

        {answerState !== 'pending' && onNext && (
          <div className="flex flex-col items-center gap-1 pt-2">
            <button
              type="button"
              onClick={onNext}
              className="px-8 py-3 font-semibold rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
            >
              {isLastQuestion ? 'Voir le résultat' : 'Question suivante'}
            </button>
            <p className="text-xs text-gray-400">
              ou appuyez sur{' '}
              <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Entrée</kbd>
            </p>
          </div>
        )}
      </div>

      {/* Colonne droite : carte */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
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
    </div>
  );
}
