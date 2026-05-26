import React from 'react';
import { Card } from 'react-bootstrap';
import type { CandidateData } from '../types/position';

/**
 * Format a candidate's average score for display.
 *
 * Rules:
 * - `null` / `undefined` → "N/A"
 * - `0` → "0"
 * - Integer (e.g. 4) → "4" (no decimals)
 * - Decimal (e.g. 3.666) → "3.7" (1 decimal, rounded)
 */
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A';
  if (score === 0) return '0';
  if (Number.isInteger(score)) return String(score);
  return score.toFixed(1);
}

/** Fallback label when the candidate has no name */
const FALLBACK_NAME = 'Candidato sin nombre';

interface CandidateCardProps {
  candidate: CandidateData;
}

/**
 * Presentational card for a single candidate.
 *
 * Renders within a kanban column with:
 * - Full name (or fallback)
 * - Average score (formatted via formatScore)
 * - `data-candidate-id` for drag-and-drop future use
 * - `data-testid` for testing
 * - `role="article"` for semantics
 * - `tabIndex={0}` and Enter key handler for keyboard accessibility
 */
const CandidateCard: React.FC<CandidateCardProps> = ({ candidate }) => {
  const displayName = candidate.fullName.trim() || FALLBACK_NAME;
  const scoreLabel = formatScore(candidate.averageScore);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter') {
      // Future: trigger the same handler as onClick for drag-to-select
      e.preventDefault();
    }
  };

  return (
    <Card
      className="shadow-sm mb-2 candidate-card"
      data-candidate-id={candidate.id}
      data-testid={`candidate-card-${candidate.id}`}
      role="article"
      tabIndex={0}
      aria-label={`Candidato: ${displayName}, puntuación: ${scoreLabel}`}
      onKeyDown={handleKeyDown}
    >
      <Card.Body className="py-2 px-3">
        <Card.Title className="fs-6 mb-0 text-dark">
          {displayName}
        </Card.Title>
        <Card.Text className="mb-0 text-muted small">
          Puntuación: <span data-testid={`score-${candidate.id}`}>{scoreLabel}</span>
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default CandidateCard;
