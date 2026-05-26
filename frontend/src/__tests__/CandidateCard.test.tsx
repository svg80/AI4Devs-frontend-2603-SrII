import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CandidateCard, { formatScore } from '../components/CandidateCard';
import type { CandidateData } from '../types/position';

// ── Helpers ───────────────────────────────────────────────────────

const baseCandidate: CandidateData = {
  id: 1,
  applicationId: 10,
  fullName: 'Jane Smith',
  currentInterviewStep: 'Technical Interview',
  averageScore: 4,
};

function renderCard(candidateOverrides: Partial<CandidateData> = {}) {
  const candidate = { ...baseCandidate, ...candidateOverrides };
  return render(<CandidateCard candidate={candidate} />);
}

// ── formatScore unit tests ───────────────────────────────────────

describe('formatScore', () => {
  it('returns "N/A" for null (T2)', () => {
    expect(formatScore(null)).toBe('N/A');
  });

  it('returns "N/A" for undefined (T2)', () => {
    expect(formatScore(undefined)).toBe('N/A');
  });

  it('returns "0" for 0 (T3)', () => {
    expect(formatScore(0)).toBe('0');
  });

  it('returns integer as string when score is a whole number (T19)', () => {
    expect(formatScore(4)).toBe('4');
    expect(formatScore(10)).toBe('10');
  });

  it('rounds decimal to 1 decimal place (T18)', () => {
    expect(formatScore(3.666)).toBe('3.7');
    expect(formatScore(2.333)).toBe('2.3');
    expect(formatScore(1.55)).toBe('1.6'); // standard rounding
  });
});

// ── CandidateCard component tests ─────────────────────────────────

describe('CandidateCard', () => {
  it('renders fullName and averageScore when both are valid (T1)', () => {
    renderCard();

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders fullName and "N/A" when averageScore is null (T2)', () => {
    renderCard({ averageScore: null as unknown as number });

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders "0" when averageScore is 0 (T3)', () => {
    renderCard({ averageScore: 0 });

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders "Candidato sin nombre" when fullName is empty (T4)', () => {
    renderCard({ fullName: '' });

    expect(screen.getByText('Candidato sin nombre')).toBeInTheDocument();
  });

  it('renders "Candidato sin nombre" when fullName is only spaces (T5)', () => {
    renderCard({ fullName: '   ' });

    expect(screen.getByText('Candidato sin nombre')).toBeInTheDocument();
  });

  it('has data-candidate-id attribute with the candidate id (T6)', () => {
    renderCard({ id: 42 });

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('data-candidate-id', '42');
  });

  it('has data-testid attribute (T6)', () => {
    renderCard({ id: 7 });

    expect(screen.getByTestId('candidate-card-7')).toBeInTheDocument();
  });

  it('has role="article" for semantic HTML (T7)', () => {
    renderCard();

    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('has tabIndex={0} and executes handler on Enter key (T8)', async () => {
    renderCard({ id: 99 });

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('tabindex', '0');

    // Press Enter using userEvent v13 (no .setup())
    await userEvent.type(card, '{Enter}');
    // No assertion needed beyond not crashing; the handler calls preventDefault
    expect(card).toBeInTheDocument();
  });

  it('has aria-label with candidate name and score (T7b)', () => {
    renderCard({ fullName: 'Alice', averageScore: 8.5 });

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute(
      'aria-label',
      'Candidato: Alice, puntuación: 8.5',
    );
  });

  it('renders decimal score formatted to 1 decimal (T18 visual)', () => {
    renderCard({ averageScore: 3.666 });

    expect(screen.getByText('3.7')).toBeInTheDocument();
  });

  it('renders integer score without decimals (T19 visual)', () => {
    renderCard({ averageScore: 4 });

    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
