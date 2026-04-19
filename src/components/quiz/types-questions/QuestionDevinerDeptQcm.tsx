import type { QuestionProps, QcmQuestion } from '../../../quiz/types';
import QcmChoices from '../QcmChoices';

export default function QuestionDevinerDeptQcm({
  question,
  answerState,
  selectedCode,
  onAnswer,
}: QuestionProps) {
  const { choices } = question as QcmQuestion;
  const isCode = question.mode === 'DevinerCodeDept';

  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-lg">
        {isCode
          ? <>Quel est le numéro du département <strong>{question.targetNom}</strong> ?</>
          : <>Quel département porte le numéro <strong>{question.targetCode}</strong> ?</>
        }
      </p>
      <QcmChoices
        choices={choices}
        answerState={answerState}
        selectedCode={selectedCode}
        onAnswer={onAnswer}
        wrongAnswerLabel={isCode ? question.targetCode : question.targetNom}
        gridCols={isCode ? 2 : undefined}
        buttonLayout={isCode ? 'code' : undefined}
      />
    </div>
  );
}
