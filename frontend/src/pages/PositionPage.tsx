import React, { useEffect, useReducer, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';
import { getInterviewFlow, getCandidates } from '../services/api';
import KanbanBoard from '../components/KanbanBoard';
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
 * Accepts injectable fetch functions for testing.
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
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar candidatos.';
      dispatchCandidates({ type: 'FETCH_ERROR', error: message });
    }
  }, [id, fetchCandidates]);

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
      <KanbanBoard
        positionName={flowState.data.positionName}
        interviewSteps={flowState.data.interviewFlow.interviewSteps}
        candidates={
          candidatesState.status === 'success' ? candidatesState.data : null
        }
        candidatesLoading={candidatesState.status === 'loading'}
        candidatesError={
          candidatesState.status === 'error' ? candidatesState.error : null
        }
        onRetryCandidates={loadCandidates}
      />
    </Container>
  );
};

export default PositionPage;
