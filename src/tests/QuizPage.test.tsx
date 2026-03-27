import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import QuizPage from '../pages/QuizPage';

// useGeoData en état "chargement" : évite d'avoir à mocker CarteFrance
vi.mock('../hooks/useGeoData', () => ({
  useGeoData: () => ({ departements: null, regions: null, loading: true }),
}));

function makeRouter() {
  return createMemoryRouter(
    [
      { path: '/quiz', element: <QuizPage /> },
      { path: '/carte', element: <div>Page Carte</div> },
    ],
    { initialEntries: ['/quiz'] },
  );
}

async function startQuiz(router: ReturnType<typeof makeRouter>) {
  render(<RouterProvider router={router} />);
  fireEvent.click(screen.getByRole('button', { name: /Commencer/i }));
  // Déclencher la navigation pour que le blocker s'active
  await act(async () => { await router.navigate('/carte'); });
}

describe('QuizPage – blocker de navigation', () => {
  it('navigue librement si aucun quiz n\'est en cours', async () => {
    const router = makeRouter();
    render(<RouterProvider router={router} />);

    await act(async () => { await router.navigate('/carte'); });

    expect(screen.getByText('Page Carte')).toBeInTheDocument();
    expect(screen.queryByText(/Quiz en cours/i)).not.toBeInTheDocument();
  });

  it('affiche la modale quand on quitte pendant un quiz actif', async () => {
    const router = makeRouter();
    await startQuiz(router);

    expect(screen.getByRole('heading', { name: /Quiz en cours/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rester/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quitter quand même/i })).toBeInTheDocument();
  });

  it('"Rester" ferme la modale et annule la navigation', async () => {
    const router = makeRouter();
    await startQuiz(router);

    fireEvent.click(screen.getByRole('button', { name: /Rester/i }));

    expect(screen.queryByText(/Quiz en cours/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Page Carte')).not.toBeInTheDocument();
  });

  it('"Quitter quand même" laisse passer la navigation', async () => {
    const router = makeRouter();
    await startQuiz(router);

    fireEvent.click(screen.getByRole('button', { name: /Quitter quand même/i }));

    expect(screen.getByText('Page Carte')).toBeInTheDocument();
    expect(screen.queryByText(/Quiz en cours/i)).not.toBeInTheDocument();
  });
});
