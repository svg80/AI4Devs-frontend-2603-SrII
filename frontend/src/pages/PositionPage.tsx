import React, { useEffect, useReducer, useCallback, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';
import { Toaster } from 'react-hot-toast';
import { getInterviewFlow, getCandidates } from '../services/api';
import KanbanBoard, { groupCandidatesByStep } from '../components/KanbanBoard';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import type { PageState, InterviewFlowResponse, CandidateData } from '../types/position';

/**
 * Action types for the reducer that manages the interview flow state.
 */
type FlowAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; data: InterviewFlowResponse }
  | { type: 'FETCH_ERROR'; error: string };

/**
 * Action types for the reducer that manages the candidates state (independent).
 */
type CandidatesAction =
  | { type: 'FETCH_IDLE' }
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; data: CandidateData[] }
  | { type: 'FETCH_ERROR'; error: string };

/**
 * Reducer for interview flow state — uses discriminated union for type safety.
 */
function flowReducer(
  state: PageState<InterviewFlowResponse>,
  action: FlowAction,
): PageState<InterviewFlowResponse> {
  switch (action.type) {
    case 'FETCH_START':
      return { status: 'loading' };
    case 'FETCH_SUCCESS':
      return { status: 'success', data: action.data };
    case 'FETCH_ERROR':
      return { status: 'error', error: action.error };
    default:
      return state;
  }
}

/**
 * Reducer for candidates state — independent from flow state.
 */
function candidatesReducer(
  state: PageState<CandidateData[]>,
  action: CandidatesAction,
): PageState<CandidateData[]> {
  switch (action.type) {
    case 'FETCH_IDLE':
      return { status: 'idle' };
    case 'FETCH_START':
      return { status: 'loading' };
    case 'FETCH_SUCCESS':
      return { status: 'success', data: action.data };
    case 'FETCH_ERROR':
      return { status: 'error', error: action.error };
    default:
      return state;
  }
}

/**
 * Smart container for the position detail / kanban page.
 *
 * Orchestrates data fetching: first gets the interview flow (phases), then
 * gets the candidates. Each fetch has independent loading/error states so that
 * a candidate error does not hide the already-rendered columns.
 *
 * Manages a `candidatesByStep` map for drag-and-drop optimistic updates.
 */
interface PositionPageProps {
  /** Used by tests to inject a fetch override for interview flow */
  fetchInterviewFlow?: typeof getInterviewFlow;
  /** Used by tests to inject a fetch override for candidates */
  fetchCandidates?: typeof getCandidates;
}

const PositionPage: React.FC<PositionPageProps> = ({
  fetchInterviewFlow = getInterviewFlow,
  fetchCandidates = getCandidates,
}) => {
  const { id } = useParams<{ id: string }>();

  const [flowState, dispatchFlow] = useReducer(flowReducer, {
    status: 'loading',
  });
  const [candidatesState, dispatchCandidates] = useReducer(candidatesReducer, {
    status: 'idle',
  });

  // Mutable map of candidates grouped by step name, used for optimistic DnD updates
  const [candidatesByStep, setCandidatesByStep] = useState<
    Map<string, CandidateData[]>
  >(new Map());

  // ── Interview flow fetching ──────────────────────────────────────

  const loadInterviewFlow = useCallback(async () => {
    dispatchFlow({ type: 'FETCH_START' });
    try {
      const numericId = Number(id);
      if (Number.isNaN(numericId)) {
        dispatchFlow({
          type: 'FETCH_ERROR',
          error: 'ID de posición no válido.',
        });
        return;
      }
      const data = await fetchInterviewFlow(numericId);
      dispatchFlow({ type: 'FETCH_SUCCESS', data });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar los datos.';
      dispatchFlow({ type: 'FETCH_ERROR', error: message });
    }
  }, [id, fetchInterviewFlow]);

  // ── Candidates fetching (independent, after flow loads) ──────────

  const loadCandidates = useCallback(async () => {
    dispatchCandidates({ type: 'FETCH_START' });
    try {
      const numericId = Number(id);
      if (Number.isNaN(numericId)) {
        dispatchCandidates({
          type: 'FETCH_ERROR',
          error: 'ID de posición no válido.',
        });
        return;
      }
      const data = await fetchCandidates(numericId);
      dispatchCandidates({ type: 'FETCH_SUCCESS', data });

      // Build the grouped map for DnD optimistic updates
      if (flowState.status === 'success') {
        const grouped = groupCandidatesByStep(
          data,
          flowState.data.interviewFlow.interviewSteps,
        );
        setCandidatesByStep(grouped);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar candidatos.';
      dispatchCandidates({ type: 'FETCH_ERROR', error: message });
    }
  }, [id, fetchCandidates, flowState]);

  // Fetch interview flow on mount
  useEffect(() => {
    loadInterviewFlow();
  }, [loadInterviewFlow]);

  // Once flow is loaded, fetch candidates
  useEffect(() => {
    if (flowState.status === 'success') {
      loadCandidates();
    }
  }, [flowState.status, loadCandidates]);

  // ── Optimistic move / rollback handlers ──────────────────────────

  const handleMoveOptimistic = useCallback(
    (candidateId: number, fromStep: string, toStep: string) => {
      setCandidatesByStep((prev) => {
        const next = new Map(prev);
        const candidate = prev.get(fromStep)?.find((c) => c.id === candidateId);

        if (!candidate) return prev; // safety: candidate not found

        const fromList = (prev.get(fromStep) ?? []).filter(
          (c) => c.id !== candidateId,
        );
        const toList = prev.get(toStep) ?? [];

        next.set(fromStep, fromList);
        next.set(toStep, [...toList, candidate]);
        return next;
      });
    },
    [],
  );

  const handleRollback = useCallback(
    (_candidateId: number, _fromStep: string) => {
      // Simplest approach: refetch the full candidate list from the API
      // This guarantees consistency even after rapid multiple drops.
      loadCandidates();
    },
    [loadCandidates],
  );

  // ── Sorted steps (memoized) ──────────────────────────────────────

  const sortedSteps = useMemo(() => {
    if (flowState.status !== 'success') return [];
    return [...flowState.data.interviewFlow.interviewSteps].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    );
  }, [flowState]);

  // ── Drag-and-drop hook (uses sorted steps + map) ─────────────────

  const { onDragEnd, updatingIds } = useDragAndDrop({
    candidatesByStep,
    interviewSteps: sortedSteps,
    onMoveOptimistic: handleMoveOptimistic,
    onRollback: handleRollback,
  });

  // ── Render ──────────────────────────────────────────────────────

  // Loading state (flow not yet loaded)
  if (flowState.status === 'loading') {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  // Error state (flow failed — dominates, no columns to show)
  if (flowState.status === 'error') {
    return (
      <Container className="mt-4">
        <Alert variant="danger" className="text-center">
          <Alert.Heading>Error</Alert.Heading>
          <p>{flowState.error}</p>
          <Button variant="outline-danger" onClick={loadInterviewFlow}>
            Reintentar
          </Button>
        </Alert>
      </Container>
    );
  }

  // Idle state — should not happen (initial state is 'loading'),
  // but we need to narrow the union for TypeScript.
  if (flowState.status === 'idle') {
    return null;
  }

  // Success state — flow loaded, render board with candidates
  return (
    <Container className="mt-4">
      {/* react-hot-toast Toaster for notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            background: '#333',
            color: '#fff',
          },
        }}
      />

      <KanbanBoard
        positionName={flowState.data.positionName}
        interviewSteps={flowState.data.interviewFlow.interviewSteps}
        candidatesByStep={candidatesByStep}
        candidatesLoading={candidatesState.status === 'loading'}
        candidatesError={
          candidatesState.status === 'error' ? candidatesState.error : null
        }
        onRetryCandidates={loadCandidates}
        onDragEnd={onDragEnd}
        updatingIds={updatingIds}
      />
    </Container>
  );
};

export default PositionPage;
