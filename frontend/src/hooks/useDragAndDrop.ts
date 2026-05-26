import { useState, useCallback } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { updateCandidateStage } from '../services/api';
import { getStepIdByName, findCandidateById } from '../helpers/dragAndDropHelpers';
import { showSuccessToast, showErrorToast } from '../helpers/notifications';
import type { CandidateData, InterviewStep } from '../types/position';

interface UseDragAndDropProps {
  candidatesByStep: Map<string, CandidateData[]>;
  interviewSteps: InterviewStep[];
  onMoveOptimistic: (candidateId: number, fromStep: string, toStep: string) => void;
  onRollback: (candidateId: number, fromStep: string) => void;
}

interface UseDragAndDropReturn {
  onDragEnd: (result: DropResult) => Promise<void>;
  updatingIds: Set<number>;
}

/**
 * Custom hook that encapsulates the drag-and-drop logic for the kanban board.
 *
 * Handles:
 * - Detecting same-column drops (no-op)
 * - Detecting outside-zone drops (no-op)
 * - Optimistic UI update (move card immediately)
 * - API call via `updateCandidateStage`
 * - Rollback on API failure
 * - Toast notifications for success/error
 * - Per-card loading state (`updatingIds`)
 */
export function useDragAndDrop({
  candidatesByStep,
  interviewSteps,
  onMoveOptimistic,
  onRollback,
}: UseDragAndDropProps): UseDragAndDropReturn {
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  const onDragEnd = useCallback(
    async (result: DropResult): Promise<void> => {
      const { source, destination, draggableId } = result;

      // T1: Dropped outside any droppable — no-op
      if (!destination) return;

      // T2: Same column — no-op
      if (source.droppableId === destination.droppableId) return;

      const candidateId = parseInt(draggableId, 10);
      const destinationStepId = getStepIdByName(
        destination.droppableId,
        interviewSteps,
      );
      const candidate = findCandidateById(candidatesByStep, candidateId);

      // Safety check: if candidate not found or step not found, bail out
      if (!candidate || destinationStepId === null) return;

      // ── Optimistic update: move immediately in UI ──────────────
      setUpdatingIds((prev) => new Set(prev).add(candidateId));
      onMoveOptimistic(candidateId, source.droppableId, destination.droppableId);

      try {
        // ── API call ────────────────────────────────────────────
        await updateCandidateStage(candidateId, {
          applicationId: candidate.applicationId,
          currentInterviewStep: destinationStepId,
        });

        // Success: optimistic update is already in place, just notify
        showSuccessToast(
          `Candidato movido a ${destination.droppableId}`,
        );
      } catch (error: unknown) {
        // ── Error: rollback ─────────────────────────────────────
        onRollback(candidateId, source.droppableId);

        const message =
          error instanceof Error
            ? // Try to extract a more specific message if it's a known error
              error.message.includes('not found')
              ? 'El candidato ya no está en este proceso'
              : error.message.includes('timeout') || error.message.includes('Network')
                ? 'Error de conexión'
                : error.message
            : 'Error al mover candidato';

        showErrorToast(`Error al mover candidato: ${message}`);
      } finally {
        // Always clean up the updating state
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(candidateId);
          return next;
        });
      }

      // TODO MVP-2: Implementar arrastre con teclado (onDragStart/onDragEnd vía teclado)
    },
    [candidatesByStep, interviewSteps, onMoveOptimistic, onRollback],
  );

  return { onDragEnd, updatingIds };
}
