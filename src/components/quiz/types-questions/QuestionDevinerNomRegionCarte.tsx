import type { Feature } from 'geojson';
import CarteFrance from '../../carte/CarteFrance';
import { useGeoData } from '../../../hooks/useGeoData';
import type { QuestionProps } from '../../../quiz/types';
import QcmChoices from '../QcmChoices';

export default function QuestionDevinerNomRegionCarte({
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

  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_2fr] gap-6 items-start">
      {/* Colonne gauche : énoncé + choix QCM + bouton */}
      <div className="flex flex-col gap-4">
        <p className="text-center text-lg">Quelle est cette région ?</p>

        <QcmChoices
          choices={question.choices ?? []}
          answerState={answerState}
          selectedCode={selectedCode}
          onAnswer={onAnswer}
          wrongAnswerLabel={question.targetNom}
        />

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
          quizLayer="regions"
          highlightCode={question.targetCode}
          highlightType="region"
          highlightVariant="target"
        />
      </div>
    </div>
  );
}
