import React, { useEffect, useReducer, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';
import { getInterviewFlow } from '../services/api';
import KanbanBoard from '../components/KanbanBoard';
import type { PageState, InterviewFlowResponse } from '../types/position';

/**
 * Action types for the reducer that manages PositionPage state.
 */
type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; data: InterviewFlowResponse }
  | { type: 'FETCH_ERROR'; error: string };

/**
 * Reducer for page state — uses discriminated union for type safety.
 */
function pageReducer(
  state: PageState<InterviewFlowResponse>,
  action: Action,
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
 * Smart container for the position detail / kanban page.
 *
 * Orchestrates data fetching via `getInterviewFlow`, manages loading / error /
 * success states, and delegates rendering to the presentational KanbanBoard.
 *
 * Accepts an optional `disableAutoFetch` prop for testing so tests can
 * control when the fetch happens.
 */
interface PositionPageProps {
  /** Used by tests to inject a fetch override */
  fetchInterviewFlow?: typeof getInterviewFlow;
}

const PositionPage: React.FC<PositionPageProps> = ({
  fetchInterviewFlow = getInterviewFlow,
}) => {
  const { id } = useParams<{ id: string }>();
  const [state, dispatch] = useReducer(pageReducer, { status: 'loading' });

  const loadInterviewFlow = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const numericId = Number(id);
      if (Number.isNaN(numericId)) {
        dispatch({
          type: 'FETCH_ERROR',
          error: 'ID de posición no válido.',
        });
        return;
      }
      const data = await fetchInterviewFlow(numericId);
      dispatch({ type: 'FETCH_SUCCESS', data });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar los datos.';
      dispatch({ type: 'FETCH_ERROR', error: message });
    }
  }, [id, fetchInterviewFlow]);

  useEffect(() => {
    loadInterviewFlow();
  }, [loadInterviewFlow]);

  return (
    <Container className="mt-4">
      {state.status === 'loading' && (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </div>
      )}

      {state.status === 'error' && (
        <Alert variant="danger" className="text-center">
          <Alert.Heading>Error</Alert.Heading>
          <p>{state.error}</p>
          <Button variant="outline-danger" onClick={loadInterviewFlow}>
            Reintentar
          </Button>
        </Alert>
      )}

      {state.status === 'success' && (
        <KanbanBoard
          positionName={state.data.positionName}
          interviewSteps={state.data.interviewFlow.interviewSteps}
        />
      )}
    </Container>
  );
};

export default PositionPage;
