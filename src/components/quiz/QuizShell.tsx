import { useEffect } from 'react';
import type { FeatureCollection } from 'geojson';
import type { SessionState } from '../../quiz/types';
import TrouverDeptCarte from './types-questions/TrouverDeptCarte';
import TrouverRegionCarte from './types-questions/TrouverRegionCarte';
import DevinerCodeDept from './types-questions/DevinerCodeDept';
import DevinerNomDept from './types-questions/DevinerNomDept';
import DevinerRegionDept from './types-questions/DevinerRegionDept';

interface QuizShellProps {
  session: SessionState;
  geoData: {
    departements: FeatureCollection | null;
    regions: FeatureCollection | null;
  };
  onAnswer: (code: string) => void;
  onNext: () => void;
  onRestart: () => void;
}

const QCM_MODES = new Set(['DevinerCodeDept', 'DevinerNomDept', 'DevinerRegionDept']);

function getResultMessage(score: number, total: number): string {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.85) return 'Excellent !';
  if (ratio >= 0.6) return 'Bien !';
  return 'Continuez !';
}

function scoreColor(ratio: number): string {
  if (ratio >= 0.85) return 'text-green-600';
  if (ratio >= 0.6) return 'text-yellow-500';
  return 'text-red-500';
}

function progressColor(ratio: number): string {
  if (ratio >= 0.85) return 'bg-green-500';
  if (ratio >= 0.6) return 'bg-yellow-400';
  return 'bg-red-500';
}

export default function QuizShell({
  session,
  geoData,
  onAnswer,
  onNext,
  onRestart,
}: QuizShellProps) {
  const { questions, currentIndex, score, answerState, selectedCode, finished } = session;
  const total = questions.length;
  const answered = answerState !== 'pending';

  // ─── Keyboard navigation ────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const question = questions[currentIndex];
      if (!question) return;

      // Enter / Space → next question when answered
      if ((e.key === 'Enter' || e.key === ' ') && answered) {
        e.preventDefault();
        onNext();
        return;
      }

      // 1–4 → select QCM choice when pending
      if (answerState === 'pending' && QCM_MODES.has(question.mode)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx <= 3 && question.choices?.[idx]) {
          e.preventDefault();
          onAnswer(question.choices[idx].code);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [questions, currentIndex, answered, answerState, onAnswer, onNext]);

  // ─── Écran de fin ────────────────────────────────────────────────────────
  if (finished) {
    const ratio = total > 0 ? score / total : 0;
    const pct = Math.round(ratio * 100);
    const message = getResultMessage(score, total);

    return (
      <div className="flex flex-col items-center gap-6 py-12 px-6">
        <h2 className="text-3xl font-bold text-gray-800">{message}</h2>

        {/* Score */}
        <p className={`text-6xl font-bold ${scoreColor(ratio)}`}>
          {score}
          <span className="text-3xl text-gray-400 font-normal"> / {total}</span>
        </p>

        {/* Barre de progression */}
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all ${progressColor(ratio)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">{pct} % de bonnes réponses</p>

        <button
          type="button"
          onClick={onRestart}
          className="mt-4 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Rejouer
        </button>
      </div>
    );
  }

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === total - 1;
  const isQcm = QCM_MODES.has(question.mode);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Bandeau supérieur */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-sm font-medium text-gray-600">
          Question {currentIndex + 1} / {total}
        </span>
        <span className="text-sm font-medium text-gray-600">
          Score : {score} / {currentIndex + (answered ? 1 : 0)}
        </span>
      </div>

      {/* Hint clavier */}
      {isQcm && !answered && (
        <p className="text-xs text-center text-gray-400">
          Utilisez les touches <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">1</kbd>–<kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">4</kbd> pour répondre
        </p>
      )}

      {/* Zone de question */}
      <div className="w-full">
        {question.mode === 'TrouverDeptCarte' && (
          <TrouverDeptCarte
            question={question}
            geoData={geoData}
            answerState={answerState}
            onAnswer={onAnswer}
          />
        )}
        {question.mode === 'TrouverRegionCarte' && (
          <TrouverRegionCarte
            question={question}
            geoData={geoData}
            answerState={answerState}
            onAnswer={onAnswer}
          />
        )}
        {question.mode === 'DevinerCodeDept' && (
          <DevinerCodeDept
            question={question}
            answerState={answerState}
            selectedCode={selectedCode}
            onAnswer={onAnswer}
          />
        )}
        {question.mode === 'DevinerNomDept' && (
          <DevinerNomDept
            question={question}
            answerState={answerState}
            selectedCode={selectedCode}
            onAnswer={onAnswer}
          />
        )}
        {question.mode === 'DevinerRegionDept' && (
          <DevinerRegionDept
            question={question}
            answerState={answerState}
            selectedCode={selectedCode}
            onAnswer={onAnswer}
          />
        )}
      </div>

      {/* Bouton navigation */}
      {answered && (
        <div className="flex flex-col items-center gap-1 pt-2">
          <button
            type="button"
            onClick={onNext}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isLastQuestion ? 'Voir le résultat' : 'Question suivante'}
          </button>
          <p className="text-xs text-gray-400">
            ou appuyez sur <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Entrée</kbd>
          </p>
        </div>
      )}
    </div>
  );
}
