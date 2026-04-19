import type { QuestionProps, QcmQuestion } from '../../../quiz/types';
import CarteQuestionLayout from '../CarteQuestionLayout';
import QuizNextButton from '../QuizNextButton';
import QcmChoices from '../QcmChoices';

export default function QuestionDevinerNomCarte({
  question,
  answerState,
  selectedCode,
  onAnswer,
  onNext,
  isLastQuestion,
}: QuestionProps) {
  const { choices } = question as QcmQuestion;
  const isRegion = question.mode === 'DevinerNomRegionCarte';
  const layer = isRegion ? 'regions' : 'departements' as const;
  const entityType = isRegion ? 'region' : 'departement' as const;
  const label = isRegion ? 'Quelle est cette région ?' : 'Quel est ce département ?';
  const wrongAnswerLabel = isRegion ? question.targetNom : `${question.targetNom} (${question.targetCode})`;

  return (
    <CarteQuestionLayout
      questionId={question.id}
      mapProps={{
        quizMode: true,
        quizLayer: layer,
        highlightCode: question.targetCode,
        highlightType: entityType,
        highlightVariant: 'target',
      }}
    >
      <p className="text-center text-lg">{label}</p>
      <QcmChoices
        choices={choices}
        answerState={answerState}
        selectedCode={selectedCode}
        onAnswer={onAnswer}
        wrongAnswerLabel={wrongAnswerLabel}
      />
      {answerState !== 'pending' && onNext && (
        <QuizNextButton onNext={onNext} isLastQuestion={isLastQuestion} />
      )}
    </CarteQuestionLayout>
  );
}
