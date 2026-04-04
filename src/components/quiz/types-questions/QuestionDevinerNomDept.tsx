import type { Question, AnswerState } from '../../../quiz/types';
import QcmChoices from '../QcmChoices';

interface DevinerNomDeptProps {
  question: Question;
  answerState: AnswerState;
  selectedCode: string | null;
  onAnswer: (code: string) => void;
}

export default function QuestionDevinerNomDept({
  question,
  answerState,
  selectedCode,
  onAnswer,
}: DevinerNomDeptProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-lg">
        Quel département porte le numéro <strong>{question.targetCode}</strong> ?
      </p>

      <QcmChoices
        choices={question.choices ?? []}
        answerState={answerState}
        selectedCode={selectedCode}
        onAnswer={onAnswer}
        wrongAnswerLabel={question.targetNom}
      />
    </div>
  );
}
