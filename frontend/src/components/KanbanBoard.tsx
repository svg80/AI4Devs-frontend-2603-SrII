import React, { useMemo } from 'react';
import { Alert } from 'react-bootstrap';
import BackButton from './BackButton';
import KanbanColumn from './KanbanColumn';
import type { InterviewStep } from '../types/position';

interface KanbanBoardProps {
  /** Name of the position displayed in the header */
  positionName: string;
  /** Interview phases (columns) — will be sorted by orderIndex */
  interviewSteps: InterviewStep[];
}

/**
 * Kanban board that renders a horizontal scrollable set of columns,
 * one per interview phase.
 *
 * Container/presentational hybrid: receives all data as props and
 * handles empty-state messaging inline.
 */
const KanbanBoard: React.FC<KanbanBoardProps> = ({
  positionName,
  interviewSteps,
}) => {
  // Sort phases by orderIndex to guarantee consistent display order
  // Must be called before any early return (React hooks rule)
  const sortedSteps = useMemo(
    () => [...interviewSteps].sort((a, b) => a.orderIndex - b.orderIndex),
    [interviewSteps],
  );

  if (sortedSteps.length === 0) {
    return (
      <div className="kanban-board">
        <div className="kanban-header">
          <BackButton />
          <h1 className="kanban-title">{positionName}</h1>
        </div>
        <Alert variant="info">
          No hay fases definidas para este proceso.
        </Alert>
      </div>
    );
  }

  return (
    <div className="kanban-board">
      <div className="kanban-header">
        <BackButton />
        <h1 className="kanban-title">{positionName}</h1>
      </div>
      <div className="kanban-columns" role="list" aria-label="Fases del proceso">
        {sortedSteps.map((step) => (
          <KanbanColumn key={step.id} phase={step} />
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;
