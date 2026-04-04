import type { Question, AnswerState } from '../../../quiz/types';
import QcmChoices from '../QcmChoices';

interface DevinerPrefectureRegionProps {
  question: Question;
  answerState: AnswerState;
  selectedCode: string | null;
  onAnswer: (code: string) => void;
}

export default function QuestionDevinerPrefectureRegion({
  question,
  answerState,
  selectedCode,
  onAnswer,
}: DevinerPrefectureRegionProps) {
  const choices = question.choices ?? [];
  const correctChoice = choices.find((c) => c.correct);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-lg">
        Quelle est la préfecture de la région <strong>{question.targetNom}</strong> ?
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
