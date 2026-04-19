import type { SessionState, AnswerRecord } from '../../quiz/types';
import { MODE_LABELS, isQcmQuestion } from '../../quiz/types';
import { scoreColor } from '../../utils/scoreTheme';

interface QuizResultsProps {
  session: SessionState;
  onRestart: () => void;
  onReviewErrors: () => void;
}

function getResultMessage(score: number, total: number, isReview: boolean): string {
  if (isReview && score === total) return 'Toutes vos erreurs sont corrigées !';
  const ratio = total > 0 ? score / total : 0;
  if (ratio === 1) return 'Parfait !';
  if (ratio >= 0.85) return 'Excellent !';
  if (ratio >= 0.6) return 'Bien !';
  return 'Continuez !';
}

function getStars(ratio: number): number {
  if (ratio >= 0.85) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

function getAnsweredLabel(record: AnswerRecord): string | null {
  if (!isQcmQuestion(record.question)) return null;
  return record.question.choices.find((c) => c.code === record.answeredCode)?.label ?? null;
}

function getCorrectLabel(record: AnswerRecord): string | null {
  if (!isQcmQuestion(record.question)) return null;
  return record.question.choices.find((c) => c.correct)?.label ?? null;
}

export default function QuizResults({ session, onRestart, onReviewErrors }: QuizResultsProps) {
  const { questions, score, answerHistory, isReview } = session;
  const total = questions.length;
  const ratio = total > 0 ? score / total : 0;
  const pct = Math.round(ratio * 100);
  const isPerfect = ratio === 1;
  const message = getResultMessage(score, total, isReview);
  const stars = getStars(ratio);

  const wrongRecords = answerHistory.filter((r) => !r.correct);
  const wrongCount = wrongRecords.length;
  const allCorrected = isReview && wrongCount === 0;

  return (
    <div className="flex flex-col items-center gap-6 py-12 px-6">
      {isReview && (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300">
          Mode révision
        </span>
      )}

      <div className="flex gap-1 text-3xl" aria-label={`${stars} étoile${stars > 1 ? 's' : ''} sur 3`}>
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={n <= stars ? 'text-yellow-400' : 'text-gray-200'}
            style={{ animationDelay: `${(n - 1) * 120}ms` }}
          >
            ★
          </span>
        ))}
      </div>

      <h2 className={`text-3xl font-bold ${isPerfect || allCorrected ? 'text-green-600' : 'text-gray-800'}`}>
        {isPerfect && !isReview ? '🎉 ' : ''}{message}
      </h2>

      <p className={`text-6xl font-bold score-pop ${scoreColor(ratio)}`}>
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

      {wrongCount > 0 && (
        <details className="w-full max-w-sm" open={wrongCount <= 10}>
          <summary className="cursor-pointer select-none text-sm font-medium text-gray-600 hover:text-gray-800">
            {wrongCount} erreur{wrongCount > 1 ? 's' : ''} — voir le détail
          </summary>
          <ul className="mt-3 flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
            {wrongRecords.map((r, i) => {
              const correctLabel = getCorrectLabel(r);
              const answeredLabel = getAnsweredLabel(r);
              return (
                <li key={i} className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs">
                  <span className="shrink-0 text-red-400 mt-0.5">✕</span>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-semibold text-gray-800 truncate">{r.question.targetNom}</span>
                    <span className="text-gray-400">{MODE_LABELS[r.mode]}</span>
                    {correctLabel && (
                      <span className="text-gray-600">
                        Bonne réponse : <span className="font-medium text-green-700">{correctLabel}</span>
                        {answeredLabel && answeredLabel !== correctLabel && (
                          <span className="text-red-500"> · vous : {answeredLabel}</span>
                        )}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </details>
      )}

      <div className="flex flex-col items-center gap-3 mt-2">
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
