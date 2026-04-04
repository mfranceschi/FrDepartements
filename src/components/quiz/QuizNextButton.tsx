interface QuizNextButtonProps {
  onNext: () => void;
  isLastQuestion?: boolean;
}

export default function QuizNextButton({ onNext, isLastQuestion }: QuizNextButtonProps) {
  return (
    <div className="flex flex-col items-center gap-1 pt-2">
      <button
        type="button"
        onClick={onNext}
        className="px-8 py-3 font-semibold rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
      >
        {isLastQuestion ? 'Voir le résultat' : 'Question suivante'}
      </button>
      <p className="text-xs text-gray-400">
        ou appuyez sur{' '}
        <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Entrée</kbd>
      </p>
    </div>
  );
}
