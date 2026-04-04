import type { QuestionProps } from '../../../quiz/types';
import CarteQuestionLayout from '../CarteQuestionLayout';
import QuizNextButton from '../QuizNextButton';
import QcmChoices from '../QcmChoices';

export default function QuestionDevinerNomRegionCarte({
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
        quizLayer: 'regions',
        highlightCode: question.targetCode,
        highlightType: 'region',
        highlightVariant: 'target',
      }}
    >
      <p className="text-center text-lg">Quelle est cette région ?</p>
      <QcmChoices
        choices={question.choices ?? []}
        answerState={answerState}
        selectedCode={selectedCode}
        onAnswer={onAnswer}
        wrongAnswerLabel={question.targetNom}
      />
      {answerState !== 'pending' && onNext && (
        <QuizNextButton onNext={onNext} isLastQuestion={isLastQuestion} />
      )}
    </CarteQuestionLayout>
  );
}
