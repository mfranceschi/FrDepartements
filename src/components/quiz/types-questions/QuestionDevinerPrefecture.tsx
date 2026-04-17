import type { QuestionProps } from '../../../quiz/types';
import QcmChoices from '../QcmChoices';

export default function QuestionDevinerPrefecture({
  question,
  answerState,
  selectedCode,
  onAnswer,
}: QuestionProps) {
  const isRegion = question.mode === 'DevinerPrefectureRegion';
  const choices = question.choices ?? [];
  const correctChoice = choices.find((c) => c.correct);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-lg">
        {isRegion
          ? <>Quelle est la préfecture de la région <strong>{question.targetNom}</strong> ?</>
          : <>Quelle est la préfecture du département <strong>{question.targetNom} ({question.targetCode})</strong> ?</>
        }
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
