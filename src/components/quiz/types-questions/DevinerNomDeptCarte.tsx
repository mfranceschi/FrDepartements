import { useEffect, useState } from 'react';
import type { Feature, FeatureCollection } from 'geojson';
import CarteFrance from '../../carte/CarteFrance';
import type { Question, AnswerState } from '../../../quiz/types';

interface DevinerNomDeptCarteProps {
  question: Question;
  geoData: {
    departements: FeatureCollection | null;
    regions: FeatureCollection | null;
  };
  answerState: AnswerState;
  selectedCode: string | null;
  onAnswer: (code: string) => void;
}

export default function DevinerNomDeptCarte({
  question,
  geoData,
  answerState,
  selectedCode,
  onAnswer,
}: DevinerNomDeptCarteProps) {
  const choices = question.choices ?? [];
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (answerState !== 'pending') {
      const t1 = setTimeout(() => setFlashing(true), 0);
      const t2 = setTimeout(() => setFlashing(false), 500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [answerState]);

  if (!geoData.departements || !geoData.regions) {
    return <p className="text-center text-gray-500">Chargement de la carte…</p>;
  }

  const deptFeatures = geoData.departements.features as Feature[];
  const regionFeatures = geoData.regions.features as Feature[];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-lg">Quel est ce département ?</p>

      <CarteFrance
        key={question.id}
        features={{ departements: deptFeatures, regions: regionFeatures }}
        quizMode={true}
        quizLayer="departements"
        highlightCode={question.targetCode}
        highlightType="departement"
      />

      <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto w-full">
        {choices.map((choice, idx) => {
          const isSelected = selectedCode === choice.code;
          const isAnswered = answerState !== 'pending';

          let colorClass = 'bg-white text-gray-800 border-gray-300 hover:border-blue-400 hover:bg-blue-50';
          let flashClass = '';
          if (isAnswered && choice.correct) {
            colorClass = 'bg-green-100 text-green-800 border-green-400';
            if (flashing) flashClass = 'flash-correct';
          } else if (isAnswered && isSelected && !choice.correct) {
            colorClass = 'bg-red-100 text-red-800 border-red-400';
            if (flashing) flashClass = 'flash-wrong';
          } else if (isAnswered) {
            colorClass = 'bg-white text-gray-400 border-gray-200';
          }

          return (
            <button
              key={choice.code}
              type="button"
              disabled={isAnswered}
              onClick={() => onAnswer(choice.code)}
              className={`relative py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${colorClass} ${flashClass} disabled:cursor-not-allowed text-left`}
            >
              <span className="inline-block w-5 text-xs text-gray-400 font-mono shrink-0">{idx + 1}.</span>
              {choice.label}
            </button>
          );
        })}
      </div>

      {answerState !== 'pending' && (
        <p className={`text-center font-semibold ${answerState === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
          {answerState === 'correct'
            ? '✓ Bonne réponse !'
            : `✗ La bonne réponse était : ${question.targetNom} (${question.targetCode})`}
        </p>
      )}
    </div>
  );
}
