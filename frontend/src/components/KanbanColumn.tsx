import React from 'react';
import type { InterviewStep, CandidateData } from '../types/position';
import CandidateCard from './CandidateCard';

interface KanbanColumnProps {
  /** The interview phase this column represents */
  phase: InterviewStep;
  /** Candidates assigned to this phase */
  candidates: CandidateData[];
  /** Optional children rendered after candidates (e.g. skeleton placeholders) */
  children?: React.ReactNode;
}

/**
 * A single column in the kanban board.
 * Presentational component — receives data via props and renders a column
 * with the phase name as the header and candidate cards (or empty message).
 */
const KanbanColumn: React.FC<KanbanColumnProps> = ({ phase, candidates, children }) => {
  return (
    <div className="kanban-column" role="region" aria-label={`Fase: ${phase.name}`}>
      <div className="kanban-column-header">
        <h3 className="kanban-column-title">
          {phase.name}
          {candidates.length > 0 && (
            <span className="badge bg-secondary ms-2">{candidates.length}</span>
          )}
        </h3>
      </div>
      <div className="kanban-column-body">
        {candidates.length === 0 && !children ? (
          <p
            className="text-muted small text-center mb-0"
            data-testid={`empty-column-${phase.id}`}
          >
            No hay candidatos en esta fase
          </p>
        ) : (
          <>
            {candidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
            {children}
          </>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
