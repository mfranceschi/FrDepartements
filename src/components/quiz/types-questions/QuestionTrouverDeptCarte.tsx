import type { QuestionProps } from '../../../quiz/types';
import CarteQuestionLayout from '../CarteQuestionLayout';
import QuizAnswerFeedback from '../QuizAnswerFeedback';
import QuizNextButton from '../QuizNextButton';

export default function QuestionTrouverDeptCarte({
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
        highlightCode: answerState !== 'pending' ? question.targetCode : undefined,
        highlightType: 'departement',
        wrongCode: answerState === 'wrong' && selectedCode !== question.targetCode ? selectedCode ?? undefined : undefined,
        wrongType: 'departement',
        onFeatureClick: (code) => { if (answerState === 'pending') onAnswer(code); },
      }}
    >
      <p className="text-center text-lg">
        Cliquez sur le département{' '}
        <strong>{question.targetNom}</strong>{' '}
        <span className="text-gray-500">({question.targetCode})</span>
      </p>
      <QuizAnswerFeedback answerState={answerState} />
      {answerState !== 'pending' && onNext && (
        <QuizNextButton onNext={onNext} isLastQuestion={isLastQuestion} />
      )}
    </CarteQuestionLayout>
  );
}
