import React from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { Draggable } from '@hello-pangea/dnd';
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
  /** Index within the droppable list (required by @hello-pangea/dnd) */
  index: number;
  /** Whether this card is currently being updated (shows spinner) */
  isUpdating?: boolean;
}

/**
 * Presentational card for a single candidate.
 *
 * Wrapped in a `<Draggable>` for drag-and-drop support.
 * Shows a spinner overlay when `isUpdating` is true.
 * Drag is disabled while updating.
 */
const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  index,
  isUpdating = false,
}) => {
  const displayName = candidate.fullName.trim() || FALLBACK_NAME;
  const scoreLabel = formatScore(candidate.averageScore);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter') {
      // Future: trigger the same handler as onClick for drag-to-select
      e.preventDefault();
    }
  };

  return (
    <Draggable
      draggableId={String(candidate.id)}
      index={index}
      isDragDisabled={isUpdating}
    >
      {(provided, snapshot) => (
        <article
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`candidate-card card shadow-sm mb-2 ${
            snapshot.isDragging ? 'candidate-card--dragging' : ''
          }`}
          style={{
            ...provided.draggableProps.style,
            opacity: isUpdating ? 0.6 : 1,
            minHeight: '44px',
          }}
          data-candidate-id={candidate.id}
          data-testid={`candidate-card-${candidate.id}`}
          role="article"
          tabIndex={0}
          aria-label={`Candidato: ${displayName}, puntuación: ${scoreLabel}`}
          aria-roledescription="draggable candidate card"
          onKeyDown={handleKeyDown}
        >
          <Card.Body className="d-flex justify-content-between align-items-center py-2 px-3">
            <div>
              <Card.Title className="fs-6 mb-0 text-dark">
                {displayName}
              </Card.Title>
              <Card.Text className="mb-0 text-muted small">
                Puntuación:{' '}
                <span data-testid={`score-${candidate.id}`}>
                  {scoreLabel}
                </span>
              </Card.Text>
            </div>
            {isUpdating && (
              <Spinner
                animation="border"
                size="sm"
                className="ms-2"
                role="status"
                data-testid={`spinner-${candidate.id}`}
              >
                <span className="visually-hidden">
                  Actualizando candidato...
                </span>
              </Spinner>
            )}
          </Card.Body>
        </article>
      )}
    </Draggable>
  );
};

export default CandidateCard;
