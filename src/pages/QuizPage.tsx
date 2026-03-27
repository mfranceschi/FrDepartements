import { useState, useEffect } from 'react';
import { useGeoData } from '../hooks/useGeoData';
import { useQuiz, loadStoredSession } from '../hooks/useQuiz';
import QuizConfig from '../components/quiz/QuizConfig';
import QuizShell from '../components/quiz/QuizShell';
import type { QuizConfig as QuizConfigType, SessionState } from '../quiz/types';

const PHASE_KEY = 'quiz_phase_v1';
const CONFIG_KEY = 'quiz_config_v1';

type QuizPhase = 'config' | 'session';

interface QuizSessionProps {
  config: QuizConfigType;
  initialSession: SessionState | null;
  onRestart: () => void;
}

function QuizSession({ config, initialSession, onRestart }: QuizSessionProps) {
  const geoData = useGeoData();
  const { session, submitAnswer, nextQuestion, restart } = useQuiz(
    config,
    initialSession ?? undefined,
  );

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
  const [phase, setPhase] = useState<QuizPhase>(() => {
    const saved = localStorage.getItem(PHASE_KEY);
    return saved === 'session' ? 'session' : 'config';
  });

  const [config, setConfig] = useState<QuizConfigType | null>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      return saved ? (JSON.parse(saved) as QuizConfigType) : null;
    } catch {
      return null;
    }
  });

  // Restore session only once at mount; after that useQuiz manages it via localStorage
  const [initialSession, setInitialSession] = useState<SessionState | null>(() => {
    if (localStorage.getItem(PHASE_KEY) === 'session') {
      return loadStoredSession();
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem(PHASE_KEY, phase);
  }, [phase]);

  useEffect(() => {
    if (config) {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    }
  }, [config]);

  const handleStart = (cfg: QuizConfigType) => {
    setConfig(cfg);
    setPhase('session');
  };

  const handleRestart = () => {
    localStorage.removeItem('quiz_session_v1');
    setInitialSession(null);
    setPhase('config');
  };

  return (
    <main className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4">
        {phase === 'config' && <QuizConfig onStart={handleStart} />}
        {phase === 'session' && config !== null && (
          <QuizSession
            config={config}
            initialSession={initialSession}
            onRestart={handleRestart}
          />
        )}
      </div>
    </main>
  );
}
