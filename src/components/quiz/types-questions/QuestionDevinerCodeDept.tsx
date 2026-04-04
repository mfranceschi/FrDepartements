import type { QuestionProps } from '../../../quiz/types';
import QcmChoices from '../QcmChoices';

export default function QuestionDevinerCodeDept({
  question,
  answerState,
  selectedCode,
  onAnswer,
}: QuestionProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-lg">
        Quel est le numéro du département <strong>{question.targetNom}</strong> ?
      </p>

      <QcmChoices
        choices={question.choices ?? []}
        answerState={answerState}
        selectedCode={selectedCode}
        onAnswer={onAnswer}
        wrongAnswerLabel={question.targetCode}
        gridCols={2}
        buttonLayout="code"
      />
    </div>
  );
}
