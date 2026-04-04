import type { Feature } from 'geojson';
import CarteFrance from '../../carte/CarteFrance';
import { useGeoData } from '../../../hooks/useGeoData';
import type { QuestionProps } from '../../../quiz/types';
import QcmChoices from '../QcmChoices';

export default function QuestionDevinerNomRegionCarte({
  question,
  answerState,
  selectedCode,
  onAnswer,
}: QuestionProps) {
  const geoData = useGeoData();

  if (!geoData.departements || !geoData.regions) {
    return <p className="text-center text-gray-500">Chargement de la carte…</p>;
  }

  const deptFeatures = geoData.departements.features as Feature[];
  const regionFeatures = geoData.regions.features as Feature[];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-lg">Quelle est cette région ?</p>

      <CarteFrance
        key={question.id}
        features={{ departements: deptFeatures, regions: regionFeatures }}
        quizMode={true}
        quizLayer="regions"
        highlightCode={question.targetCode}
        highlightType="region"
        highlightVariant="target"
      />

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
