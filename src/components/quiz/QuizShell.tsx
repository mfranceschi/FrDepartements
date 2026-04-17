import { useEffect, useMemo } from 'react';
import type { SessionState, QuizMode, QuestionProps } from '../../quiz/types';
import { QCM_MODES } from '../../quiz/generateQuestions';
import QuestionTrouverCarte from './types-questions/QuestionTrouverCarte';
import QuestionDevinerNomCarte from './types-questions/QuestionDevinerNomCarte';
import QuestionDevinerDeptQcm from './types-questions/QuestionDevinerDeptQcm';
import QuestionDevinerPrefecture from './types-questions/QuestionDevinerPrefecture';
import QuizResults from './QuizResults';
import QuizNextButton from './QuizNextButton';
import { scoreColor } from '../../utils/scoreTheme';

const QUESTION_COMPONENTS: Record<QuizMode, React.ComponentType<QuestionProps>> = {
  TrouverDeptCarte: QuestionTrouverCarte,
  TrouverRegionCarte: QuestionTrouverCarte,
  DevinerNomRegionCarte: QuestionDevinerNomCarte,
  DevinerNomDeptCarte: QuestionDevinerNomCarte,
  DevinerCodeDept: QuestionDevinerDeptQcm,
  DevinerNomDept: QuestionDevinerDeptQcm,
  DevinerPrefectureDept: QuestionDevinerPrefecture,
  DevinerPrefectureRegion: QuestionDevinerPrefecture,
};

interface QuizShellProps {
  session: SessionState;
  onAnswer: (code: string) => void;
  onNext: () => void;
  onRestart: () => void;
  onReviewErrors: () => void;
}

export default function QuizShell({
  session,
  onAnswer,
  onNext,
  onRestart,
  onReviewErrors,
}: QuizShellProps) {
  const { questions, currentIndex, score, answerState, selectedCode, finished, answerHistory, isReview } = session;
  const total = questions.length;
  const answered = answerState !== 'pending';
  const answeredCount = currentIndex + (answered ? 1 : 0);
  const liveRatio = answeredCount > 0 ? score / answeredCount : 1;

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

  if (finished) {
    return <QuizResults session={session} onRestart={onRestart} onReviewErrors={onReviewErrors} />;
  }

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === total - 1;
  const isQcm = QCM_MODES.has(question.mode);
  const isCarteQuestion = question.mode.endsWith('Carte');
  const QuestionComponent = QUESTION_COMPONENTS[question.mode];

  const showDots = total <= 20;

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Bandeau supérieur avec score bien visible */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        {showDots ? (
          <div className="flex gap-1 px-3 py-2 bg-gray-50 justify-center flex-wrap">
            {questions.map((_, i) => {
              const record = answerHistory[i];
              const isCurrent = i === currentIndex;
              let cls = 'w-3 h-3 rounded-full transition-colors duration-200 ';
              if (record) {
                cls += record.correct ? 'bg-green-400' : 'bg-red-400';
              } else if (isCurrent) {
                cls += answerState === 'correct'
                  ? 'bg-green-400'
                  : answerState === 'wrong'
                  ? 'bg-red-400'
                  : 'bg-blue-400 ring-2 ring-blue-200';
              } else {
                cls += 'bg-gray-200';
              }
              return <span key={i} className={cls} aria-hidden="true" />;
            })}
          </div>
        ) : (
          <div className="relative h-1.5 bg-gray-100">
            <div
              className="absolute inset-0 rounded-r"
              style={{ background: 'linear-gradient(to right, #ef4444, #f59e0b 50%, #22c55e)' }}
            />
            <div
              className="absolute top-0 right-0 bottom-0 bg-gray-100 transition-all duration-300"
              style={{ width: `${100 - progressPct}%` }}
            />
          </div>
        )}
        {/* Score + streak */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-gray-700">
              Question {currentIndex + 1} / {total}
            </span>
            {isReview && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300">
                Révision
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {streak >= 3 && (
              <span className="streak-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300">
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
        <QuizNextButton
          onNext={onNext}
          isLastQuestion={isLastQuestion}
          safeArea
        />
      )}
    </div>
  );
}
