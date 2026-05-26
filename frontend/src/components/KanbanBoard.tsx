import React, { useMemo } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import BackButton from './BackButton';
import KanbanColumn from './KanbanColumn';
import SkeletonCard from './SkeletonCard';
import type { InterviewStep, CandidateData } from '../types/position';

interface KanbanBoardProps {
  /** Name of the position displayed in the header */
  positionName: string;
  /** Interview phases (columns) — will be sorted by orderIndex */
  interviewSteps: InterviewStep[];
  /** Candidates grouped by step name (mutable map for optimistic updates) */
  candidatesByStep: Map<string, CandidateData[]>;
  /** Current loading status for candidates */
  candidatesLoading: boolean;
  /** Error message if candidates fetch failed */
  candidatesError: string | null;
  /** Callback to retry fetching candidates */
  onRetryCandidates: () => void;
  /** Drag-end handler (from useDragAndDrop hook) */
  onDragEnd: (result: DropResult) => Promise<void>;
  /** Set of candidate IDs currently being updated */
  updatingIds: Set<number>;
}

/**
 * Group candidates by their current interview step name.
 *
 * Candidates whose step does not match any known step name are discarded
 * and a warning is logged. All known steps are initialized with empty
 * arrays so columns without candidates still render the empty message.
 *
 * Exported for testing.
 */
export function groupCandidatesByStep(
  candidates: CandidateData[],
  steps: InterviewStep[],
): Map<string, CandidateData[]> {
  const stepNames = new Set(steps.map((s) => s.name));
  const grouped = new Map<string, CandidateData[]>();

  // Initialize all steps with empty arrays
  steps.forEach((s) => grouped.set(s.name, []));

  // Assign candidates to their matching step
  candidates.forEach((c) => {
    if (stepNames.has(c.currentInterviewStep)) {
      grouped.get(c.currentInterviewStep)!.push(c);
    } else {
      console.warn(
        `Candidato "${c.fullName}" tiene fase desconocida: "${c.currentInterviewStep}"`,
      );
    }
  });

  return grouped;
}

/**
 * Kanban board that renders a horizontal scrollable set of columns,
 * one per interview phase, with candidate cards inside each column.
 *
 * Wraps the columns in a DragDropContext for drag-and-drop support.
 */
const KanbanBoard: React.FC<KanbanBoardProps> = ({
  positionName,
  interviewSteps,
  candidatesByStep,
  candidatesLoading,
  candidatesError,
  onRetryCandidates,
  onDragEnd,
  updatingIds,
}) => {
  // Sort phases by orderIndex to guarantee consistent display order
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

      {/* Candidates error: independent alert that does not hide columns */}
      {candidatesError && (
        <Alert
          variant="danger"
          dismissible
          className="mb-3"
          data-testid="candidates-error-alert"
        >
          <Alert.Heading>Error al cargar candidatos</Alert.Heading>
          <p className="mb-2">{candidatesError}</p>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={onRetryCandidates}
          >
            Reintentar
          </Button>
        </Alert>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-columns" role="listbox" aria-label="Fases del proceso">
          {sortedSteps.map((step) => (
            <KanbanColumn
              key={step.id}
              phase={step}
              candidates={candidatesByStep.get(step.name) ?? []}
              updatingIds={updatingIds}
            >
              {/* Show skeleton cards in each column while loading */}
              {candidatesLoading && (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              )}
            </KanbanColumn>
          ))}
        </div>
      </DragDropContext>

      {/* Full-area loading overlay when candidates are loading */}
      {candidatesLoading && sortedSteps.length > 0 && (
        <div className="text-center mt-3" data-testid="candidates-loading">
          <Spinner animation="border" role="status" size="sm">
            <span className="visually-hidden">Cargando candidatos...</span>
          </Spinner>
          <span className="ms-2 text-muted small">Cargando candidatos...</span>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
