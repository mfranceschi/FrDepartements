import type { Feature } from 'geojson';
import CarteFrance from '../../carte/CarteFrance';
import { useGeoData } from '../../../hooks/useGeoData';
import type { Question, AnswerState } from '../../../quiz/types';
import QcmChoices from '../QcmChoices';

interface QuestionDevinerNomDeptCarteProps {
  question: Question;
  answerState: AnswerState;
  selectedCode: string | null;
  onAnswer: (code: string) => void;
}

export default function QuestionDevinerNomDeptCarte({
  question,
  answerState,
  selectedCode,
  onAnswer,
}: QuestionDevinerNomDeptCarteProps) {
  const geoData = useGeoData();

  if (!geoData.departements || !geoData.regions) {
    return <p className="text-center text-gray-500">Chargement de la carte…</p>;
  }

  const deptFeatures = geoData.departements.features as Feature[];
  const regionFeatures = geoData.regions.features as Feature[];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-lg">Quel est ce département ?</p>

      <CarteFrance
        key={question.id}
        features={{ departements: deptFeatures, regions: regionFeatures }}
        quizMode={true}
        quizLayer="departements"
        highlightCode={question.targetCode}
        highlightType="departement"
      />

      <QcmChoices
        choices={question.choices ?? []}
        answerState={answerState}
        selectedCode={selectedCode}
        onAnswer={onAnswer}
        wrongAnswerLabel={`${question.targetNom} (${question.targetCode})`}
      />
    </div>
  );
}
