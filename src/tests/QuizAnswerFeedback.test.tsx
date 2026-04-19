import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuizAnswerFeedback from '../components/quiz/QuizAnswerFeedback';

describe('QuizAnswerFeedback', () => {
  it('ne rend rien en état pending', () => {
    const { container } = render(<QuizAnswerFeedback answerState="pending" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche la confirmation en état correct', () => {
    render(<QuizAnswerFeedback answerState="correct" />);
    expect(screen.getByText(/Bonne réponse/)).toBeInTheDocument();
  });

  it('affiche l\'erreur en état wrong', () => {
    render(<QuizAnswerFeedback answerState="wrong" />);
    expect(screen.getByText(/Mauvaise réponse/)).toBeInTheDocument();
  });

  it('applique les classes vertes en état correct', () => {
    const { container } = render(<QuizAnswerFeedback answerState="correct" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('green');
  });

  it('applique les classes rouges en état wrong', () => {
    const { container } = render(<QuizAnswerFeedback answerState="wrong" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('red');
  });
});
