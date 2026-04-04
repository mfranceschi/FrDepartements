import type { QuestionProps } from '../../../quiz/types';
import CarteQuestionLayout from '../CarteQuestionLayout';
import QuizNextButton from '../QuizNextButton';
import QcmChoices from '../QcmChoices';

export default function QuestionDevinerNomDeptCarte({
  question,
  answerState,
  selectedCode,
  onAnswer,
  onNext,
  isLastQuestion,
}: QuestionProps) {
  return (
    <CarteQuestionLayout
      questionId={question.id}
      mapProps={{
        quizMode: true,
        quizLayer: 'departements',
        highlightCode: question.targetCode,
        highlightType: 'departement',
        highlightVariant: 'target',
      }}
    >
      <p className="text-center text-lg">Quel est ce département ?</p>
      <QcmChoices
        choices={question.choices ?? []}
        answerState={answerState}
        selectedCode={selectedCode}
        onAnswer={onAnswer}
        wrongAnswerLabel={`${question.targetNom} (${question.targetCode})`}
      />
      {answerState !== 'pending' && onNext && (
        <QuizNextButton onNext={onNext} isLastQuestion={isLastQuestion} />
      )}
    </CarteQuestionLayout>
  );
}
