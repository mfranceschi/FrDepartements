import type { Question, AnswerState } from '../../../quiz/types';
import QcmChoices from '../QcmChoices';

interface DevinerPrefectureDeptProps {
  question: Question;
  answerState: AnswerState;
  selectedCode: string | null;
  onAnswer: (code: string) => void;
}

export default function QuestionDevinerPrefectureDept({
  question,
  answerState,
  selectedCode,
  onAnswer,
}: DevinerPrefectureDeptProps) {
  const choices = question.choices ?? [];
  const correctChoice = choices.find((c) => c.correct);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-lg">
        Quelle est la préfecture du département{' '}
        <strong>{question.targetNom} ({question.targetCode})</strong> ?
      </p>

      <QcmChoices
        choices={choices}
        answerState={answerState}
        selectedCode={selectedCode}
        onAnswer={onAnswer}
        wrongAnswerLabel={correctChoice?.label ?? ''}
      />
    </div>
  );
}
