import { useEffect, useMemo } from 'react';
import type { SessionState, QuizMode, QuestionProps } from '../../quiz/types';
import { QCM_MODES } from '../../quiz/generateQuestions';
import QuestionTrouverDeptCarte from './types-questions/QuestionTrouverDeptCarte';
import QuestionTrouverRegionCarte from './types-questions/QuestionTrouverRegionCarte';
import QuestionDevinerNomRegionCarte from './types-questions/QuestionDevinerNomRegionCarte';
import QuestionDevinerNomDeptCarte from './types-questions/QuestionDevinerNomDeptCarte';
import QuestionDevinerCodeDept from './types-questions/QuestionDevinerCodeDept';
import QuestionDevinerNomDept from './types-questions/QuestionDevinerNomDept';
import QuestionDevinerPrefectureDept from './types-questions/QuestionDevinerPrefectureDept';
import QuestionDevinerPrefectureRegion from './types-questions/QuestionDevinerPrefectureRegion';

const QUESTION_COMPONENTS: Record<QuizMode, React.ComponentType<QuestionProps>> = {
  TrouverDeptCarte: QuestionTrouverDeptCarte,
  TrouverRegionCarte: QuestionTrouverRegionCarte,
  DevinerNomRegionCarte: QuestionDevinerNomRegionCarte,
  DevinerNomDeptCarte: QuestionDevinerNomDeptCarte,
  DevinerCodeDept: QuestionDevinerCodeDept,
  DevinerNomDept: QuestionDevinerNomDept,
  DevinerPrefectureDept: QuestionDevinerPrefectureDept,
  DevinerPrefectureRegion: QuestionDevinerPrefectureRegion,
};

interface QuizShellProps {
  session: SessionState;
  onAnswer: (code: string) => void;
  onNext: () => void;
  onRestart: () => void;
  onReviewErrors: () => void;
}


function scoreColor(ratio: number): string {
  if (ratio >= 0.85) return 'text-green-600';
  if (ratio >= 0.6) return 'text-yellow-500';
  return 'text-red-500';
}

function getResultMessage(score: number, total: number): string {
  const ratio = total > 0 ? score / total : 0;
  if (ratio >= 0.85) return 'Excellent !';
  if (ratio >= 0.6) return 'Bien !';
  return 'Continuez !';
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

  // Calcul du streak (bonnes réponses consécutives)
  const streak = useMemo(() => {
    let count = 0;
    for (let i = answerHistory.length - 1; i >= 0; i--) {
      if (answerHistory[i].correct) count++;
      else break;
    }
    return count;
  }, [answerHistory]);

  const progressPct = Math.round((answeredCount / total) * 100);

  // ─── Keyboard navigation ────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const question = questions[currentIndex];
      if (!question) return;

      if ((e.key === 'Enter' || e.key === ' ') && answered) {
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
  }, [questions, currentIndex, answered, answerState, onAnswer, onNext]);

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

        <div className="relative w-full max-w-xs h-3 rounded-full overflow-hidden bg-gray-200">
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(to right, #ef4444, #f59e0b 50%, #22c55e)' }}
          />
          <div
            className="absolute top-0 right-0 bottom-0 bg-gray-200 transition-all duration-700"
            style={{ width: `${100 - pct}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">{pct} % de bonnes réponses</p>

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
  const isCarteQuestion = question.mode.endsWith('Carte');
  const QuestionComponent = QUESTION_COMPONENTS[question.mode];

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Bandeau supérieur avec score bien visible */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        {/* Barre de progression fine */}
        <div className="relative h-1.5 bg-gray-100">
          <div
            className="absolute inset-0 rounded-r"
            style={{
              background: 'linear-gradient(to right, #ef4444, #f59e0b 50%, #22c55e)',
            }}
          />
          <div
            className="absolute top-0 right-0 bottom-0 bg-gray-100 transition-all duration-300"
            style={{ width: `${100 - progressPct}%` }}
          />
        </div>
        {/* Score + streak */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
          <span className="text-base font-semibold text-gray-700">
            Question {currentIndex + 1} / {total}
          </span>
          <div className="flex items-center gap-2">
            {streak >= 3 && (
              <span
                className="streak-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300"
              >
                🔥 Combo ×{streak}
              </span>
            )}
            <span className={`text-2xl font-bold tabular-nums ${scoreColor(liveRatio)}`}>
              <span className="text-sm font-medium text-gray-500 mr-1">Score :</span>
              {score}
            </span>
          </div>
        </div>
      </div>

      {isQcm && !answered && (
        <p className="text-xs text-center text-gray-400">
          Utilisez les touches{' '}
          <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">1</kbd>–
          <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">4</kbd>{' '}
          pour répondre
        </p>
      )}

      <div className="flex-1 min-h-0">
        <QuestionComponent
          question={question}
          answerState={answerState}
          selectedCode={selectedCode}
          onAnswer={onAnswer}
          onNext={isCarteQuestion ? onNext : undefined}
          isLastQuestion={isLastQuestion}
        />
      </div>

      {answered && !isCarteQuestion && (
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
  );
}
