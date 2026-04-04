import { useState, useEffect, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import QuizConfig from '../components/quiz/QuizConfig';
import QuizShell from '../components/quiz/QuizShell';
import type { QuizConfig as QuizConfigType } from '../quiz/types';

type QuizPhase = 'config' | 'session';

interface QuizSessionProps {
  config: QuizConfigType;
  onRestart: () => void;
  onFinished: (finished: boolean) => void;
}

function QuizSession({ config, onRestart, onFinished }: QuizSessionProps) {
  const { session, submitAnswer, nextQuestion, restartWithErrors } = useQuiz(config);

  // Remonte l'état "terminé" vers QuizPage pour le blocker
  useEffect(() => {
    onFinished(session.finished);
  }, [session.finished, onFinished]);

  const handleRestart = () => {
    onRestart();
  };

  const handleReviewErrors = () => {
    restartWithErrors();
    onFinished(false);
  };

  return (
    <QuizShell
      session={session}
      onAnswer={submitAnswer}
      onNext={nextQuestion}
      onRestart={handleRestart}
      onReviewErrors={handleReviewErrors}
    />
  );
}

function NavigationBlockerModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <h2 className="text-lg font-bold text-gray-800">Quiz en cours</h2>
        <p className="text-sm text-gray-600">
          Vous avez un quiz en cours. Si vous quittez maintenant, votre progression sera perdue.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Rester
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            Quitter quand même
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  const [phase, setPhase] = useState<QuizPhase>('config');
  const [config, setConfig] = useState<QuizConfigType | null>(null);
  const [sessionFinished, setSessionFinished] = useState(false);

  const isSessionActive = phase === 'session' && !sessionFinished;

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return (
      isSessionActive &&
      currentLocation.pathname === '/quiz' &&
      nextLocation.pathname !== '/quiz'
    );
  });

  const handleStart = (cfg: QuizConfigType) => {
    setConfig(cfg);
    setSessionFinished(false);
    setPhase('session');
  };

  const handleRestart = () => {
    setSessionFinished(false);
    setPhase('config');
  };

  const handleFinished = useCallback((finished: boolean) => {
    setSessionFinished(finished);
  }, []);

  return (
    <>
      {blocker.state === 'blocked' && (
        <NavigationBlockerModal
          onConfirm={() => { handleRestart(); blocker.proceed(); }}
          onCancel={() => blocker.reset()}
        />
      )}

      <main className="flex-1 min-h-0 flex flex-col">
        {phase === 'config' && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="max-w-3xl mx-auto p-4">
              <QuizConfig onStart={handleStart} />
            </div>
          </div>
        )}
        {phase === 'session' && config !== null && (
          <div className="flex-1 min-h-0 flex flex-col max-w-7xl mx-auto w-full px-4 py-4">
            <QuizSession
              config={config}
              onRestart={handleRestart}
              onFinished={handleFinished}
            />
          </div>
        )}
      </main>
    </>
  );
}
