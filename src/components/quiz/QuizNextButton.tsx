interface QuizNextButtonProps {
  onNext: () => void;
  isLastQuestion?: boolean;
  safeArea?: boolean;
  onMarkReview?: () => void;
  isMarked?: boolean;
}

export default function QuizNextButton({ onNext, isLastQuestion, safeArea, onMarkReview, isMarked }: QuizNextButtonProps) {
  return (
    <div
      className={`flex flex-col items-center gap-2 pt-2${safeArea ? ' pb-[env(safe-area-inset-bottom,0px)]' : ''}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onNext}
          className="min-h-[44px] px-8 py-3 font-semibold rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
        >
          {isLastQuestion ? 'Voir le résultat' : 'Question suivante'}
        </button>
        {onMarkReview && (
          <button
            type="button"
            onClick={onMarkReview}
            title={isMarked ? 'Retirer des révisions' : 'Ajouter aux révisions'}
            className={`min-h-[44px] px-2.5 py-1.5 rounded-md border transition-colors font-medium text-xs ${
              isMarked
                ? 'bg-amber-100 border-amber-400 text-amber-700 hover:bg-amber-200'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {isMarked ? '🔖 Marqué' : '🔖 Réviser'}
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400">
        ou appuyez sur{' '}
        <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Entrée</kbd>
      </p>
    </div>
  );
}
