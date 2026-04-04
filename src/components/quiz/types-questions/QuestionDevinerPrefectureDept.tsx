import type { QuestionProps } from '../../../quiz/types';
import QcmChoices from '../QcmChoices';

export default function QuestionDevinerPrefectureDept({
  question,
  answerState,
  selectedCode,
  onAnswer,
}: QuestionProps) {
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
