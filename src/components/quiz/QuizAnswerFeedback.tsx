import type { AnswerState } from '../../quiz/types';

interface QuizAnswerFeedbackProps {
  answerState: AnswerState;
}

export default function QuizAnswerFeedback({ answerState }: QuizAnswerFeedbackProps) {
  if (answerState === 'pending') return null;
  return (
    <div
      className={`text-center font-semibold text-base py-2 rounded ${
        answerState === 'correct'
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'
      }`}
    >
      {answerState === 'correct' ? '✓ Bonne réponse !' : '✗ Mauvaise réponse.'}
    </div>
  );
}
