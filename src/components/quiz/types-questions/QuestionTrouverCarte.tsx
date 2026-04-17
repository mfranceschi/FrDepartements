import type { QuestionProps } from '../../../quiz/types';
import CarteQuestionLayout from '../CarteQuestionLayout';
import QuizAnswerFeedback from '../QuizAnswerFeedback';
import QuizNextButton from '../QuizNextButton';

export default function QuestionTrouverCarte({
  question,
  answerState,
  selectedCode,
  onAnswer,
  onNext,
  isLastQuestion,
}: QuestionProps) {
  const isRegion = question.mode === 'TrouverRegionCarte';
  const layer = isRegion ? 'regions' : 'departements' as const;
  const entityType = isRegion ? 'region' : 'departement' as const;

  return (
    <CarteQuestionLayout
      questionId={question.id}
      mapProps={{
        quizMode: true,
        quizLayer: layer,
        highlightCode: answerState !== 'pending' ? question.targetCode : undefined,
        highlightType: entityType,
        wrongCode: answerState === 'wrong' && selectedCode !== question.targetCode ? selectedCode ?? undefined : undefined,
        wrongType: entityType,
        onFeatureClick: (code) => { if (answerState === 'pending') onAnswer(code); },
      }}
    >
      <p className="text-center text-lg">
        {isRegion
          ? <>Cliquez sur la région <strong>{question.targetNom}</strong></>
          : <>Cliquez sur le département <strong>{question.targetNom}</strong>{' '}<span className="text-gray-500">({question.targetCode})</span></>
        }
      </p>
      <QuizAnswerFeedback answerState={answerState} />
      {answerState !== 'pending' && onNext && (
        <QuizNextButton onNext={onNext} isLastQuestion={isLastQuestion} />
      )}
    </CarteQuestionLayout>
  );
}
