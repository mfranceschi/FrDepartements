import type { QuestionProps } from '../../../quiz/types';
import CarteQuestionLayout from '../CarteQuestionLayout';
import QuizAnswerFeedback from '../QuizAnswerFeedback';
import QuizNextButton from '../QuizNextButton';

export default function QuestionTrouverRegionCarte({
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
        highlightCode: answerState !== 'pending' ? question.targetCode : undefined,
        highlightType: 'region',
        wrongCode: answerState === 'wrong' && selectedCode !== question.targetCode ? selectedCode ?? undefined : undefined,
        wrongType: 'region',
        onFeatureClick: (code) => { if (answerState === 'pending') onAnswer(code); },
      }}
    >
      <p className="text-center text-lg">
        Cliquez sur la région <strong>{question.targetNom}</strong>
      </p>
      <QuizAnswerFeedback answerState={answerState} />
      {answerState !== 'pending' && onNext && (
        <QuizNextButton onNext={onNext} isLastQuestion={isLastQuestion} />
      )}
    </CarteQuestionLayout>
  );
}
