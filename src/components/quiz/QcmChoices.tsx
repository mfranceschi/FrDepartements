import { useEffect, useState } from 'react';
import type { Choice, AnswerState } from '../../quiz/types';

interface QcmChoicesProps {
  choices: Choice[];
  answerState: AnswerState;
  selectedCode: string | null;
  onAnswer: (code: string) => void;
  wrongAnswerLabel: string;
  gridCols?: 1 | 2;
  /** 'list' — inline index with dot, text-left (default); 'code' — absolute index, centered */
  buttonLayout?: 'list' | 'code';
}

export default function QcmChoices({
  choices,
  answerState,
  selectedCode,
  onAnswer,
  wrongAnswerLabel,
  gridCols = 1,
  buttonLayout = 'list',
}: QcmChoicesProps) {
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (answerState !== 'pending') {
      const t1 = setTimeout(() => setFlashing(true), 0);
      const t2 = setTimeout(() => setFlashing(false), 500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [answerState]);

  const isAnswered = answerState !== 'pending';
  const gridClass = gridCols === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <>
      <div className={`grid ${gridClass} gap-3 max-w-sm mx-auto w-full`}>
        {choices.map((choice, idx) => {
          const isSelected = selectedCode === choice.code;

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

          if (buttonLayout === 'code') {
            return (
              <button
                key={choice.code}
                type="button"
                disabled={isAnswered}
                onClick={() => onAnswer(choice.code)}
                className={`relative py-3 px-4 rounded-lg border-2 text-base font-medium transition-colors ${colorClass} ${flashClass} disabled:cursor-not-allowed`}
              >
                <span className="absolute top-1 left-2 text-xs text-gray-400 font-mono">{idx + 1}</span>
                {choice.label}
              </button>
            );
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

      {isAnswered && (
        <p className={`text-center font-semibold ${answerState === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
          {answerState === 'correct'
            ? '✓ Bonne réponse !'
            : `✗ La bonne réponse était : ${wrongAnswerLabel}`}
        </p>
      )}
    </>
  );
}
