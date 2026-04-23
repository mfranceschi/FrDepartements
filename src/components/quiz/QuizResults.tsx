import { useNavigate } from 'react-router-dom';
import type { SessionState, AnswerRecord } from '../../quiz/types';
import { MODE_LABELS, isQcmQuestion } from '../../quiz/types';
import { scoreColor } from '../../utils/scoreTheme';
import { DEPT_MAP, REGION_MAP } from '../../data/maps';

interface QuizResultsProps {
  session: SessionState;
  onRestart: () => void;
  onReview: () => void;
}

function getResultMessage(score: number, total: number, allReviewed: boolean): string {
  if (allReviewed) return 'Toutes les questions révisées !';
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
  if (isQcmQuestion(record.question)) {
    return record.question.choices.find((c) => c.code === record.answeredCode)?.label ?? null;
  }
  if (record.mode === 'TrouverDeptCarte') {
    return DEPT_MAP.get(record.answeredCode)?.nom ?? record.answeredCode;
  }
  if (record.mode === 'TrouverRegionCarte') {
    return REGION_MAP.get(record.answeredCode)?.nom ?? record.answeredCode;
  }
  return null;
}

function getCorrectLabel(record: AnswerRecord): string | null {
  if (!isQcmQuestion(record.question)) return null;
  return record.question.choices.find((c) => c.correct)?.label ?? null;
}

export default function QuizResults({ session, onRestart, onReview }: QuizResultsProps) {
  const navigate = useNavigate();
  const { questions, score, answerHistory, isReview, markedQuestionIds } = session;
  const total = questions.length;
  const ratio = total > 0 ? score / total : 0;
  const pct = Math.round(ratio * 100);
  const isPerfect = ratio === 1;
  const wrongRecords = answerHistory.filter((r) => !r.correct);
  const wrongCount = wrongRecords.length;
  const markedCount = markedQuestionIds.length;
  const reviewCount = wrongCount + markedCount;
  const allReviewed = isReview && wrongCount === 0;
  const message = getResultMessage(score, total, allReviewed);
  const stars = getStars(ratio);

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

      <h2 className={`text-3xl font-bold ${isPerfect || allReviewed ? 'text-green-600' : 'text-gray-800'}`}>
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
                    {isQcmQuestion(r.question) ? (
                      correctLabel && (
                        <span className="text-gray-600">
                          Bonne réponse : <span className="font-medium text-green-700">{correctLabel}</span>
                          {answeredLabel && answeredLabel !== correctLabel && (
                            <span className="text-red-500"> · vous : {answeredLabel}</span>
                          )}
                        </span>
                      )
                    ) : (
                      answeredLabel && (
                        <span className="text-gray-500">
                          Vous avez cliqué : <span className="font-medium text-red-500">{answeredLabel}</span>
                        </span>
                      )
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </details>
      )}

      <div className="flex flex-col items-center gap-3 mt-2">
        {reviewCount > 0 && (
          <button
            type="button"
            onClick={onReview}
            className="px-8 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
          >
            🔖 Réviser ({reviewCount} question{reviewCount > 1 ? 's' : ''})
          </button>
        )}
        <button
          type="button"
          onClick={onRestart}
          className={`px-8 py-3 font-semibold rounded-lg transition-colors ${
            reviewCount > 0
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Rejouer
        </button>
        <button
          type="button"
          onClick={() => navigate('/stats')}
          className="text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
        >
          Voir mes statistiques →
        </button>
      </div>
    </div>
  );
}
