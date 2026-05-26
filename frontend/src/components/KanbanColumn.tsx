import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import type { InterviewStep, CandidateData } from '../types/position';
import CandidateCard from './CandidateCard';

interface KanbanColumnProps {
  /** The interview phase this column represents */
  phase: InterviewStep;
  /** Candidates assigned to this phase */
  candidates: CandidateData[];
  /** Set of candidate IDs currently being updated */
  updatingIds: Set<number>;
  /** Optional children rendered after candidates (e.g. skeleton placeholders) */
  children?: React.ReactNode;
}

/**
 * A single column in the kanban board.
 *
 * Wrapped in a `<Droppable>` for drag-and-drop support.
 * Applies visual highlight (`kanban-column--drag-over`) when a card
 * is dragged over it.
 */
const KanbanColumn: React.FC<KanbanColumnProps> = ({
  phase,
  candidates,
  updatingIds,
  children,
}) => {
  return (
    <Droppable droppableId={phase.name} direction="vertical">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            kanban-column
            w-100
            flex-shrink-0
            ${snapshot.isDraggingOver ? 'kanban-column--drag-over' : ''}
          `}
          style={{ minWidth: '280px' }}
          role="region"
          aria-label={`Fase: ${phase.name}`}
          data-testid={`kanban-column-${phase.id}`}
        >
          <div className="kanban-column-header">
            <h3 className="kanban-column-title">
              {phase.name}
              {candidates.length > 0 && (
                <span className="badge bg-secondary ms-2">
                  {candidates.length}
                </span>
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
                {candidates.map((candidate, index) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    index={index}
                    isUpdating={updatingIds.has(candidate.id)}
                  />
                ))}
                {children}
              </>
            )}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
};

export default KanbanColumn;
