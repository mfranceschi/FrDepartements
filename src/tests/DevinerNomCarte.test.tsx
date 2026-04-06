/**
 * Tests des composants QCM avec carte intégrée :
 *   - DevinerNomDeptCarte   — quel est ce département ? (map highlight + QCM)
 *   - DevinerNomRegionCarte — quelle est cette région ? (map highlight + QCM)
 *
 * La carte est un stub : on vérifie que le composant lui passe le bon
 * highlightCode, mais on ne teste pas le rendu D3 lui-même.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CarteFranceProps } from '../components/carte/CarteFrance';
import type { Question } from '../quiz/types';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Référence mutable : les tests de l'état de chargement peuvent substituer
// une réponse sans données.
const geoStubRef = vi.hoisted(() => ({
  value: {
    departements: { type: 'FeatureCollection' as const, features: [] },
    regions: { type: 'FeatureCollection' as const, features: [] },
    loading: false,
  },
}));

vi.mock('../hooks/useGeoData', () => ({
  useGeoData: () => geoStubRef.value,
}));

vi.mock('../components/carte/CarteFrance', () => ({
  default: ({ highlightCode }: CarteFranceProps) => (
    <div data-testid="carte-france">
      {highlightCode && <span data-testid="highlight-code">{highlightCode}</span>}
    </div>
  ),
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

const qNomDept: Question = {
  id: 'q-nom-dept-carte',
  mode: 'DevinerNomDeptCarte',
  targetCode: '29',
  targetNom: 'Finistère',
  choices: [
    { code: '29', label: 'Finistère', correct: true },
    { code: '22', label: "Côtes-d'Armor", correct: false },
    { code: '35', label: 'Ille-et-Vilaine', correct: false },
    { code: '56', label: 'Morbihan', correct: false },
  ],
};

const qNomRegion: Question = {
  id: 'q-nom-region-carte',
  mode: 'DevinerNomRegionCarte',
  targetCode: '53',
  targetNom: 'Bretagne',
  choices: [
    { code: '53', label: 'Bretagne', correct: true },
    { code: '52', label: 'Pays de la Loire', correct: false },
    { code: '11', label: 'Île-de-France', correct: false },
    { code: '28', label: 'Normandie', correct: false },
  ],
};

// ── DevinerNomDeptCarte ───────────────────────────────────────────────────────

describe('DevinerNomDeptCarte', () => {
  // Lazy import to respect the hoisted mock
  let DevinerNomDeptCarte: typeof import('../components/quiz/types-questions/QuestionDevinerNomDeptCarte').default;

  beforeEach(async () => {
    geoStubRef.value = {
      departements: { type: 'FeatureCollection', features: [] },
      regions: { type: 'FeatureCollection', features: [] },
      loading: false,
    };
    DevinerNomDeptCarte = (await import('../components/quiz/types-questions/QuestionDevinerNomDeptCarte')).default;
  });

  it('affiche la consigne "Quel est ce département ?"', () => {
    render(<DevinerNomDeptCarte question={qNomDept} answerState="pending" selectedCode={null} onAnswer={vi.fn()} />);
    expect(screen.getByText(/Quel est ce département/i)).toBeInTheDocument();
  });

  it('affiche les 4 choix de noms de département', () => {
    render(<DevinerNomDeptCarte question={qNomDept} answerState="pending" selectedCode={null} onAnswer={vi.fn()} />);
    const qcmButtons = screen.getAllByRole('button').filter(b => !b.dataset.testid?.includes('toggle'));
    expect(qcmButtons).toHaveLength(4);
    expect(screen.getByText('Finistère')).toBeInTheDocument();
    expect(screen.getByText("Côtes-d'Armor")).toBeInTheDocument();
  });

  it('appelle onAnswer avec le code du choix cliqué', () => {
    const onAnswer = vi.fn();
    render(<DevinerNomDeptCarte question={qNomDept} answerState="pending" selectedCode={null} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText('Finistère'));
    expect(onAnswer).toHaveBeenCalledOnce();
    expect(onAnswer).toHaveBeenCalledWith('29');
  });

  it('affiche "Bonne réponse !" quand correct', () => {
    render(<DevinerNomDeptCarte question={qNomDept} answerState="correct" selectedCode="29" onAnswer={vi.fn()} />);
    expect(screen.getByText(/Bonne réponse/i)).toBeInTheDocument();
  });

  it('affiche la correction avec nom + code quand wrong', () => {
    render(<DevinerNomDeptCarte question={qNomDept} answerState="wrong" selectedCode="22" onAnswer={vi.fn()} />);
    expect(screen.getByText(/La bonne réponse était : Finistère \(29\)/)).toBeInTheDocument();
  });

  it('désactive les boutons après réponse', () => {
    const onAnswer = vi.fn();
    render(<DevinerNomDeptCarte question={qNomDept} answerState="wrong" selectedCode="22" onAnswer={onAnswer} />);
    // Seuls les 4 boutons QCM doivent être désactivés (pas le bouton suivant ni le toggle)
    const qcmButtons = screen.getAllByRole('button').filter((b) => !b.textContent?.includes('suivante') && !b.textContent?.includes('résultat') && !b.dataset.testid?.includes('toggle'));
    qcmButtons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('bouton suivant masqué tant qu\'aucune réponse n\'est donnée', () => {
    render(<DevinerNomDeptCarte question={qNomDept} answerState="pending" selectedCode={null} onAnswer={vi.fn()} onNext={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /suivante|résultat/i })).not.toBeInTheDocument();
  });

  it('bouton "Question suivante" visible et fonctionnel après réponse', () => {
    const onNext = vi.fn();
    render(<DevinerNomDeptCarte question={qNomDept} answerState="correct" selectedCode="29" onAnswer={vi.fn()} onNext={onNext} />);
    const nextBtn = screen.getByRole('button', { name: /Question suivante/i });
    expect(nextBtn).toBeInTheDocument();
    fireEvent.click(nextBtn);
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('bouton "Voir le résultat" sur la dernière question', () => {
    render(<DevinerNomDeptCarte question={qNomDept} answerState="correct" selectedCode="29" onAnswer={vi.fn()} onNext={vi.fn()} isLastQuestion={true} />);
    expect(screen.getByRole('button', { name: /Voir le résultat/i })).toBeInTheDocument();
  });

  it('passe le highlightCode du département cible à CarteFrance', () => {
    render(<DevinerNomDeptCarte question={qNomDept} answerState="pending" selectedCode={null} onAnswer={vi.fn()} />);
    expect(screen.getByTestId('highlight-code')).toHaveTextContent('29');
  });

  it('affiche le message de chargement quand les données géo ne sont pas prêtes', () => {
    geoStubRef.value = { departements: null as never, regions: null as never, loading: true };
    render(<DevinerNomDeptCarte question={qNomDept} answerState="pending" selectedCode={null} onAnswer={vi.fn()} />);
    expect(screen.getByText(/Chargement de la carte/i)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

// ── DevinerNomRegionCarte ─────────────────────────────────────────────────────

describe('DevinerNomRegionCarte', () => {
  let DevinerNomRegionCarte: typeof import('../components/quiz/types-questions/QuestionDevinerNomRegionCarte').default;

  beforeEach(async () => {
    geoStubRef.value = {
      departements: { type: 'FeatureCollection', features: [] },
      regions: { type: 'FeatureCollection', features: [] },
      loading: false,
    };
    DevinerNomRegionCarte = (await import('../components/quiz/types-questions/QuestionDevinerNomRegionCarte')).default;
  });

  it('affiche la consigne "Quelle est cette région ?"', () => {
    render(<DevinerNomRegionCarte question={qNomRegion} answerState="pending" selectedCode={null} onAnswer={vi.fn()} />);
    expect(screen.getByText(/Quelle est cette région/i)).toBeInTheDocument();
  });

  it('affiche les 4 choix de noms de région', () => {
    render(<DevinerNomRegionCarte question={qNomRegion} answerState="pending" selectedCode={null} onAnswer={vi.fn()} />);
    const qcmButtons = screen.getAllByRole('button').filter(b => !b.dataset.testid?.includes('toggle'));
    expect(qcmButtons).toHaveLength(4);
    expect(screen.getByText('Bretagne')).toBeInTheDocument();
    expect(screen.getByText('Pays de la Loire')).toBeInTheDocument();
  });

  it('appelle onAnswer avec le code de la région du choix cliqué', () => {
    const onAnswer = vi.fn();
    render(<DevinerNomRegionCarte question={qNomRegion} answerState="pending" selectedCode={null} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText('Bretagne'));
    expect(onAnswer).toHaveBeenCalledOnce();
    expect(onAnswer).toHaveBeenCalledWith('53');
  });

  it('affiche "Bonne réponse !" quand correct', () => {
    render(<DevinerNomRegionCarte question={qNomRegion} answerState="correct" selectedCode="53" onAnswer={vi.fn()} />);
    expect(screen.getByText(/Bonne réponse/i)).toBeInTheDocument();
  });

  it('affiche la correction avec le nom de la région quand wrong', () => {
    render(<DevinerNomRegionCarte question={qNomRegion} answerState="wrong" selectedCode="52" onAnswer={vi.fn()} />);
    expect(screen.getByText(/La bonne réponse était : Bretagne/)).toBeInTheDocument();
  });

  it('désactive les boutons après réponse', () => {
    render(<DevinerNomRegionCarte question={qNomRegion} answerState="correct" selectedCode="53" onAnswer={vi.fn()} />);
    const qcmButtons = screen.getAllByRole('button').filter((b) => !b.textContent?.includes('suivante') && !b.textContent?.includes('résultat') && !b.dataset.testid?.includes('toggle'));
    qcmButtons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('bouton suivant masqué tant qu\'aucune réponse n\'est donnée', () => {
    render(<DevinerNomRegionCarte question={qNomRegion} answerState="pending" selectedCode={null} onAnswer={vi.fn()} onNext={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /suivante|résultat/i })).not.toBeInTheDocument();
  });

  it('bouton "Question suivante" visible et fonctionnel après réponse', () => {
    const onNext = vi.fn();
    render(<DevinerNomRegionCarte question={qNomRegion} answerState="wrong" selectedCode="52" onAnswer={vi.fn()} onNext={onNext} />);
    const nextBtn = screen.getByRole('button', { name: /Question suivante/i });
    expect(nextBtn).toBeInTheDocument();
    fireEvent.click(nextBtn);
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('passe le highlightCode de la région cible à CarteFrance', () => {
    render(<DevinerNomRegionCarte question={qNomRegion} answerState="pending" selectedCode={null} onAnswer={vi.fn()} />);
    expect(screen.getByTestId('highlight-code')).toHaveTextContent('53');
  });

  it('affiche le message de chargement quand les données géo ne sont pas prêtes', () => {
    geoStubRef.value = { departements: null as never, regions: null as never, loading: true };
    render(<DevinerNomRegionCarte question={qNomRegion} answerState="pending" selectedCode={null} onAnswer={vi.fn()} />);
    expect(screen.getByText(/Chargement de la carte/i)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
