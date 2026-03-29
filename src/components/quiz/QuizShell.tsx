import { useEffect } from 'react';
import type { SessionState, QuizMode } from '../../quiz/types';
import QuestionTrouverDeptCarte from './types-questions/QuestionTrouverDeptCarte';
import QuestionTrouverRegionCarte from './types-questions/QuestionTrouverRegionCarte';
import QuestionDevinerNomRegionCarte from './types-questions/QuestionDevinerNomRegionCarte';
import QuestionDevinerNomDeptCarte from './types-questions/QuestionDevinerNomDeptCarte';
import QuestionDevinerCodeDept from './types-questions/QuestionDevinerCodeDept';
import QuestionDevinerNomDept from './types-questions/QuestionDevinerNomDept';
import QuestionDevinerRegionDept from './types-questions/QuestionDevinerRegionDept';

interface QuizShellProps {
  session: SessionState;
  onAnswer: (code: string) => void;
  onNext: () => void;
  onRestart: () => void;
  onReviewErrors: () => void;
}

const QCM_MODES = new Set(['DevinerNomRegionCarte', 'DevinerNomDeptCarte', 'DevinerCodeDept', 'DevinerNomDept', 'DevinerRegionDept']);

const MODE_LABELS: Record<QuizMode, string> = {
  TrouverDeptCarte: 'Dept. sur carte',
  TrouverRegionCarte: 'Région sur carte',
  DevinerNomRegionCarte: 'Nom de région',
  DevinerNomDeptCarte: 'Nom de dept. (carte)',
  DevinerCodeDept: 'Numéro de dept.',
  DevinerNomDept: 'Nom de dept.',
  DevinerRegionDept: "Région d'un dept.",
};

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

function getResultMessage(score: number, total: number): string {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.85) return 'Excellent !';
  if (ratio >= 0.6) return 'Bien !';
  return 'Continuez !';
}

function CategoryStats({ history }: { history: SessionState['answerHistory'] }) {
  if (history.length === 0) return null;

  const byMode = new Map<QuizMode, { correct: number; total: number }>();
  for (const record of history) {
    const existing = byMode.get(record.mode) ?? { correct: 0, total: 0 };
    byMode.set(record.mode, {
      correct: existing.correct + (record.correct ? 1 : 0),
      total: existing.total + 1,
    });
  }

  if (byMode.size < 2) return null;

  const entries = Array.from(byMode.entries())
    .map(([mode, stats]) => ({
      mode,
      ratio: stats.total > 0 ? stats.correct / stats.total : 0,
      correct: stats.correct,
      total: stats.total,
    }))
    .sort((a, b) => b.ratio - a.ratio);

  const best = entries[0];
  const worst = entries[entries.length - 1];

  return (
    <div className="w-full max-w-xs space-y-2 text-sm">
      <p className="text-xs text-gray-500 text-center uppercase tracking-wide font-medium">Par catégorie</p>
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        <span className="text-green-600 font-bold text-lg">↑</span>
        <div>
          <p className="font-semibold text-green-800">{MODE_LABELS[best.mode]}</p>
          <p className="text-green-600 text-xs">
            {best.correct}/{best.total} — {Math.round(best.ratio * 100)} %
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        <span className="text-red-500 font-bold text-lg">↓</span>
        <div>
          <p className="font-semibold text-red-800">{MODE_LABELS[worst.mode]}</p>
          <p className="text-red-500 text-xs">
            {worst.correct}/{worst.total} — {Math.round(worst.ratio * 100)} %
          </p>
        </div>
      </div>
    </div>
  );
}

export default function QuizShell({
  session,
  onAnswer,
  onNext,
  onRestart,
  onReviewErrors,
}: QuizShellProps) {
  const { questions, currentIndex, score, answerState, selectedCode, finished, answerHistory } = session;
  const total = questions.length;
  const answered = answerState !== 'pending';
  const answeredCount = currentIndex + (answered ? 1 : 0);
  const liveRatio = answeredCount > 0 ? score / answeredCount : 1;

  const nextEnabled = true;

  // ─── Keyboard navigation ────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const question = questions[currentIndex];
      if (!question) return;

      if ((e.key === 'Enter' || e.key === ' ') && answered && nextEnabled) {
        e.preventDefault();
        onNext();
        return;
      }

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
  }, [questions, currentIndex, answered, answerState, onAnswer, onNext, nextEnabled]);

  // ─── Écran de fin ────────────────────────────────────────────────────────
  if (finished) {
    const ratio = total > 0 ? score / total : 0;
    const pct = Math.round(ratio * 100);
    const message = getResultMessage(score, total);

    const wrongCount = answerHistory.filter((r) => !r.correct).length;

    return (
      <div className="flex flex-col items-center gap-6 py-12 px-6">
        <h2 className="text-3xl font-bold text-gray-800">{message}</h2>

        <p className={`text-6xl font-bold ${scoreColor(ratio)}`}>
          {score}
          <span className="text-3xl text-gray-400 font-normal"> / {total}</span>
        </p>

        <div className="w-full max-w-xs bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all ${progressColor(ratio)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">{pct} % de bonnes réponses</p>

        <CategoryStats history={answerHistory} />

        <div className="flex flex-col items-center gap-3 mt-4">
          {wrongCount > 0 && (
            <button
              type="button"
              onClick={onReviewErrors}
              className="px-8 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
            >
              Revoir mes erreurs ({wrongCount})
            </button>
          )}
          <button
            type="button"
            onClick={onRestart}
            className={`px-8 py-3 font-semibold rounded-lg transition-colors ${
              wrongCount > 0
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Rejouer
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === total - 1;
  const isQcm = QCM_MODES.has(question.mode);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Bandeau supérieur avec score bien visible */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-sm font-medium text-gray-600">
          Question {currentIndex + 1} / {total}
        </span>
        <span className={`text-2xl font-bold tabular-nums ${scoreColor(liveRatio)}`}>
          {score}
          <span className="text-base font-normal text-gray-400"> / {answeredCount}</span>
        </span>
      </div>

      {isQcm && !answered && (
        <p className="text-xs text-center text-gray-400">
          Utilisez les touches{' '}
          <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">1</kbd>–
          <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">4</kbd>{' '}
          pour répondre
        </p>
      )}

      <div className="w-full">
        {question.mode === 'TrouverDeptCarte' && (
          <QuestionTrouverDeptCarte
            question={question}
            answerState={answerState}
            selectedCode={selectedCode}
            onAnswer={onAnswer}
          />
        )}
        {question.mode === 'TrouverRegionCarte' && (
          <QuestionTrouverRegionCarte
            question={question}
            answerState={answerState}
            selectedCode={selectedCode}
            onAnswer={onAnswer}
          />
        )}
        {question.mode === 'DevinerNomRegionCarte' && (
          <QuestionDevinerNomRegionCarte
            question={question}
            answerState={answerState}
            selectedCode={selectedCode}
            onAnswer={onAnswer}
          />
        )}
        {question.mode === 'DevinerNomDeptCarte' && (
          <QuestionDevinerNomDeptCarte
            question={question}
            answerState={answerState}
            selectedCode={selectedCode}
            onAnswer={onAnswer}
          />
        )}
        {question.mode === 'DevinerCodeDept' && (
          <QuestionDevinerCodeDept
            question={question}
            answerState={answerState}
            selectedCode={selectedCode}
            onAnswer={onAnswer}
          />
        )}
        {question.mode === 'DevinerNomDept' && (
          <QuestionDevinerNomDept
            question={question}
            answerState={answerState}
            selectedCode={selectedCode}
            onAnswer={onAnswer}
          />
        )}
        {question.mode === 'DevinerRegionDept' && (
          <QuestionDevinerRegionDept
            question={question}
            answerState={answerState}
            selectedCode={selectedCode}
            onAnswer={onAnswer}
          />
        )}
      </div>

      {answered && (
        <div className="flex flex-col items-center gap-1 pt-2">
          <button
            type="button"
            onClick={nextEnabled ? onNext : undefined}
            disabled={!nextEnabled}
            className={`px-8 py-3 font-semibold rounded-lg transition-colors ${
              nextEnabled
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLastQuestion ? 'Voir le résultat' : 'Question suivante'}
          </button>
          {nextEnabled && (
            <p className="text-xs text-gray-400">
              ou appuyez sur{' '}
              <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Entrée</kbd>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
