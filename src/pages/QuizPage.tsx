import { useState } from 'react';
import { useGeoData } from '../hooks/useGeoData';
import { useQuiz } from '../hooks/useQuiz';
import QuizConfig from '../components/quiz/QuizConfig';
import QuizShell from '../components/quiz/QuizShell';
import type { QuizConfig as QuizConfigType } from '../quiz/types';

type QuizPhase = 'config' | 'session';

// Sub-component so useQuiz is only mounted during the session phase
interface QuizSessionProps {
  config: QuizConfigType;
  onRestart: () => void;
}

function QuizSession({ config, onRestart }: QuizSessionProps) {
  const geoData = useGeoData();
  const { session, submitAnswer, nextQuestion, restart } = useQuiz(config);

  const handleRestart = () => {
    restart();
    onRestart();
  };

  if (geoData.loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-500">Chargement des données géographiques…</p>
      </div>
    );
  }

  return (
    <QuizShell
      session={session}
      geoData={{ departements: geoData.departements, regions: geoData.regions }}
      onAnswer={submitAnswer}
      onNext={nextQuestion}
      onRestart={handleRestart}
    />
  );
}

export default function QuizPage() {
  const [phase, setPhase] = useState<QuizPhase>('config');
  const [config, setConfig] = useState<QuizConfigType | null>(null);

  const handleStart = (cfg: QuizConfigType) => {
    setConfig(cfg);
    setPhase('session');
  };

  const handleRestart = () => {
    setPhase('config');
  };

  return (
    <main className="max-w-3xl mx-auto p-4">
      {phase === 'config' && <QuizConfig onStart={handleStart} />}
      {phase === 'session' && config !== null && (
        <QuizSession config={config} onRestart={handleRestart} />
      )}
    </main>
  );
}
