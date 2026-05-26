import React from 'react';
import type { InterviewStep } from '../types/position';

interface KanbanColumnProps {
  /** The interview phase this column represents */
  phase: InterviewStep;
}

/**
 * A single column in the kanban board.
 * Presentational component — receives data via props and renders a column
 * with the phase name as the header and a placeholder for candidate cards.
 */
const KanbanColumn: React.FC<KanbanColumnProps> = ({ phase }) => {
  return (
    <div className="kanban-column" role="region" aria-label={`Fase: ${phase.name}`}>
      <div className="kanban-column-header">
        <h3 className="kanban-column-title">{phase.name}</h3>
      </div>
      <div className="kanban-column-body">
        {/* Candidate cards will be rendered here in ticket 002 */}
      </div>
    </div>
  );
};

export default KanbanColumn;
