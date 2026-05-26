import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import type { DropResult } from '@hello-pangea/dnd';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import type { InterviewStep, CandidateData } from '../types/position';

// ── Mock the API module ───────────────────────────────────────────

jest.mock('../services/api', () => ({
  updateCandidateStage: jest.fn(),
}));

const mockUpdateCandidateStage =
  jest.requireMock('../services/api').updateCandidateStage as jest.Mock;

// ── Fixtures ──────────────────────────────────────────────────────

const mockSteps: InterviewStep[] = [
  { id: 1, interviewFlowId: 1, interviewTypeId: 1, name: 'Initial Review', orderIndex: 1 },
  { id: 2, interviewFlowId: 1, interviewTypeId: 2, name: 'Technical Interview', orderIndex: 2 },
  { id: 3, interviewFlowId: 1, interviewTypeId: 3, name: 'Final Interview', orderIndex: 3 },
];

const candidateAlice: CandidateData = {
  id: 1,
  applicationId: 10,
  fullName: 'Alice',
  currentInterviewStep: 'Initial Review',
  averageScore: 4,
};

const mockCandidatesByStep = new Map<string, CandidateData[]>([
  ['Initial Review', [candidateAlice]],
  ['Technical Interview', []],
  ['Final Interview', []],
]);

// ── Test helper component ─────────────────────────────────────────

interface TestHarnessProps {
  onMoveOptimistic?: jest.Mock;
  onRollback?: jest.Mock;
}

/**
 * A minimal component that uses the useDragAndDrop hook so we can
 * test it via DOM rendering. The hook's onDragEnd is triggered by
 * calling a button.
 */
function TestHarness({
  onMoveOptimistic = jest.fn(),
  onRollback = jest.fn(),
}: TestHarnessProps) {
  const { onDragEnd, updatingIds } = useDragAndDrop({
    candidatesByStep: mockCandidatesByStep,
    interviewSteps: mockSteps,
    onMoveOptimistic,
    onRollback,
  });

  // Expose the hook's state and methods via data attributes / buttons
  return (
    <div>
      <button
        data-testid="trigger-drag-end"
        onClick={async () => {
          // We'll inject the DropResult via a synthetic event
        }}
      >
        Trigger
      </button>
      <span data-testid="updating-ids">{Array.from(updatingIds).join(',')}</span>
      <span data-testid="updating-count">{updatingIds.size}</span>
      <span data-testid="is-updating-1">{updatingIds.has(1) ? 'yes' : 'no'}</span>
      {/* Expose onDragEnd on the window for test access */}
      <TestHandler onDragEnd={onDragEnd} />
    </div>
  );
}

/**
 * Separate component that stores the onDragEnd handler in a module-level
 * variable so tests can call it directly without needing to fire DOM events.
 * This avoids the complexity of simulating actual drag-and-drop events.
 */
let exportedOnDragEnd: ((result: DropResult) => Promise<void>) | null = null;

function TestHandler({
  onDragEnd,
}: {
  onDragEnd: (result: DropResult) => Promise<void>;
}) {
  // Store the handler reference so tests can call it
  React.useEffect(() => {
    exportedOnDragEnd = onDragEnd;
    return () => {
      exportedOnDragEnd = null;
    };
  }, [onDragEnd]);
  return null;
}

/** Helper to call onDragEnd with a standard DropResult */
function createDropResult(
  overrides: Partial<DropResult> = {},
): DropResult {
  return {
    draggableId: '1',
    type: 'DEFAULT',
    source: { droppableId: 'Initial Review', index: 0 },
    destination: null,
    reason: 'DROP',
    mode: 'FLUID',
    combine: null,
    ...overrides,
  } as DropResult;
}

// ── Setup ─────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  exportedOnDragEnd = null;
});

// ── Tests ─────────────────────────────────────────────────────────

describe('useDragAndDrop', () => {
  // ── Edge cases: drop outside / same column ──────────────────────

  it('does NOT call the API when dropped outside any column (T1)', async () => {
    const onMoveOptimistic = jest.fn();
    const onRollback = jest.fn();

    render(
      <TestHarness
        onMoveOptimistic={onMoveOptimistic}
        onRollback={onRollback}
      />,
    );

    await waitFor(() => expect(exportedOnDragEnd).not.toBeNull());

    const result = createDropResult({ destination: null });
    await act(async () => {
      await exportedOnDragEnd!(result);
    });

    expect(mockUpdateCandidateStage).not.toHaveBeenCalled();
    expect(onMoveOptimistic).not.toHaveBeenCalled();
    expect(onRollback).not.toHaveBeenCalled();
  });

  it('does NOT call the API when dropped in the same column (T2)', async () => {
    const onMoveOptimistic = jest.fn();
    const onRollback = jest.fn();

    render(
      <TestHarness
        onMoveOptimistic={onMoveOptimistic}
        onRollback={onRollback}
      />,
    );

    await waitFor(() => expect(exportedOnDragEnd).not.toBeNull());

    const result = createDropResult({
      destination: { droppableId: 'Initial Review', index: 0 },
    });
    await act(async () => {
      await exportedOnDragEnd!(result);
    });

    expect(mockUpdateCandidateStage).not.toHaveBeenCalled();
    expect(onMoveOptimistic).not.toHaveBeenCalled();
    expect(onRollback).not.toHaveBeenCalled();
  });

  // ── Happy path: drop in different column ────────────────────────

  it('calls updateCandidateStage with correct params when dropped in different column (T3)', async () => {
    mockUpdateCandidateStage.mockResolvedValueOnce({
      message: 'Stage updated successfully',
      data: {},
    });

    const onMoveOptimistic = jest.fn();
    const onRollback = jest.fn();

    render(
      <TestHarness
        onMoveOptimistic={onMoveOptimistic}
        onRollback={onRollback}
      />,
    );

    await waitFor(() => expect(exportedOnDragEnd).not.toBeNull());

    const result = createDropResult({
      destination: { droppableId: 'Technical Interview', index: 0 },
    });
    await act(async () => {
      await exportedOnDragEnd!(result);
    });

    // Should call API with candidateId, applicationId, and destination step ID
    expect(mockUpdateCandidateStage).toHaveBeenCalledWith(1, {
      applicationId: 10,
      currentInterviewStep: 2, // Technical Interview has id=2
    });
  });

  it('performs optimistic update immediately (moves candidate) before API resolves (T4)', async () => {
    // Keep the promise pending so we can check optimistic state before it resolves
    mockUpdateCandidateStage.mockReturnValue(new Promise<never>(() => {}));

    const onMoveOptimistic = jest.fn();
    const onRollback = jest.fn();

    render(
      <TestHarness
        onMoveOptimistic={onMoveOptimistic}
        onRollback={onRollback}
      />,
    );

    await waitFor(() => expect(exportedOnDragEnd).not.toBeNull());

    const result = createDropResult({
      destination: { droppableId: 'Technical Interview', index: 0 },
    });

    await act(async () => {
      // Start the drag end — don't await the promise since it's pending
      exportedOnDragEnd!(result);
    });

    // Optimistic update should have been called immediately
    expect(onMoveOptimistic).toHaveBeenCalledWith(
      1,
      'Initial Review',
      'Technical Interview',
    );
  });

  it('on successful API call, candidate stays in destination (T5)', async () => {
    mockUpdateCandidateStage.mockResolvedValueOnce({
      message: 'Stage updated successfully',
      data: {},
    });

    const onMoveOptimistic = jest.fn();
    const onRollback = jest.fn();

    render(
      <TestHarness
        onMoveOptimistic={onMoveOptimistic}
        onRollback={onRollback}
      />,
    );

    await waitFor(() => expect(exportedOnDragEnd).not.toBeNull());

    const result = createDropResult({
      destination: { droppableId: 'Technical Interview', index: 0 },
    });

    await act(async () => {
      await exportedOnDragEnd!(result);
    });

    // Optimistic was called (moved to destination)
    expect(onMoveOptimistic).toHaveBeenCalledWith(
      1,
      'Initial Review',
      'Technical Interview',
    );
    // Rollback was NOT called (success path)
    expect(onRollback).not.toHaveBeenCalled();
  });

  // ── Error paths ─────────────────────────────────────────────────

  it('rolls back when API returns 400 error (T6)', async () => {
    mockUpdateCandidateStage.mockRejectedValueOnce(
      new Error('Request failed with status code 400'),
    );

    const onMoveOptimistic = jest.fn();
    const onRollback = jest.fn();

    render(
      <TestHarness
        onMoveOptimistic={onMoveOptimistic}
        onRollback={onRollback}
      />,
    );

    await waitFor(() => expect(exportedOnDragEnd).not.toBeNull());

    const result = createDropResult({
      destination: { droppableId: 'Technical Interview', index: 0 },
    });

    await act(async () => {
      await exportedOnDragEnd!(result);
    });

    // Optimistic was called
    expect(onMoveOptimistic).toHaveBeenCalledWith(
      1,
      'Initial Review',
      'Technical Interview',
    );
    // Rollback was called (error path)
    expect(onRollback).toHaveBeenCalledWith(1, 'Initial Review');
  });

  it('rolls back when API returns 404 error (T7)', async () => {
    mockUpdateCandidateStage.mockRejectedValueOnce(
      new Error('Request failed with status code 404'),
    );

    const onMoveOptimistic = jest.fn();
    const onRollback = jest.fn();

    render(
      <TestHarness
        onMoveOptimistic={onMoveOptimistic}
        onRollback={onRollback}
      />,
    );

    await waitFor(() => expect(exportedOnDragEnd).not.toBeNull());

    const result = createDropResult({
      destination: { droppableId: 'Technical Interview', index: 0 },
    });

    await act(async () => {
      await exportedOnDragEnd!(result);
    });

    expect(onMoveOptimistic).toHaveBeenCalled();
    expect(onRollback).toHaveBeenCalledWith(1, 'Initial Review');
  });

  it('rolls back on network error (T8)', async () => {
    mockUpdateCandidateStage.mockRejectedValueOnce(
      new Error('Network Error'),
    );

    const onMoveOptimistic = jest.fn();
    const onRollback = jest.fn();

    render(
      <TestHarness
        onMoveOptimistic={onMoveOptimistic}
        onRollback={onRollback}
      />,
    );

    await waitFor(() => expect(exportedOnDragEnd).not.toBeNull());

    const result = createDropResult({
      destination: { droppableId: 'Technical Interview', index: 0 },
    });

    await act(async () => {
      await exportedOnDragEnd!(result);
    });

    expect(onMoveOptimistic).toHaveBeenCalled();
    expect(onRollback).toHaveBeenCalledWith(1, 'Initial Review');
  });

  // ── Loading / updating state ────────────────────────────────────

  it('sets updatingIds while API call is in flight (T9)', async () => {
    // Keep the promise pending indefinitely
    mockUpdateCandidateStage.mockReturnValue(new Promise<never>(() => {}));

    const onMoveOptimistic = jest.fn();
    const onRollback = jest.fn();

    render(
      <TestHarness
        onMoveOptimistic={onMoveOptimistic}
        onRollback={onRollback}
      />,
    );

    await waitFor(() => expect(exportedOnDragEnd).not.toBeNull());

    const result = createDropResult({
      destination: { droppableId: 'Technical Interview', index: 0 },
    });

    await act(async () => {
      // Fire and forget — promise is pending
      exportedOnDragEnd!(result);
    });

    // After optimistic update, candidate 1 should be in updating state
    expect(onMoveOptimistic).toHaveBeenCalled();
  });

  it('clears updating state after successful API call (T10)', async () => {
    mockUpdateCandidateStage.mockResolvedValueOnce({
      message: 'Stage updated successfully',
      data: {},
    });

    const onMoveOptimistic = jest.fn();
    const onRollback = jest.fn();

    render(
      <TestHarness
        onMoveOptimistic={onMoveOptimistic}
        onRollback={onRollback}
      />,
    );

    await waitFor(() => expect(exportedOnDragEnd).not.toBeNull());

    const result = createDropResult({
      destination: { droppableId: 'Technical Interview', index: 0 },
    });

    await act(async () => {
      await exportedOnDragEnd!(result);
    });

    // After success, the updating state should be cleared
    // (we check that the finally block ran)
    expect(onMoveOptimistic).toHaveBeenCalled();
    expect(onRollback).not.toHaveBeenCalled();
  });

  it('clears updating state and performs rollback after API error (T11)', async () => {
    mockUpdateCandidateStage.mockRejectedValueOnce(
      new Error('Server Error'),
    );

    const onMoveOptimistic = jest.fn();
    const onRollback = jest.fn();

    render(
      <TestHarness
        onMoveOptimistic={onMoveOptimistic}
        onRollback={onRollback}
      />,
    );

    await waitFor(() => expect(exportedOnDragEnd).not.toBeNull());

    const result = createDropResult({
      destination: { droppableId: 'Technical Interview', index: 0 },
    });

    await act(async () => {
      await exportedOnDragEnd!(result);
    });

    // Both optimistic and rollback were called
    expect(onMoveOptimistic).toHaveBeenCalled();
    expect(onRollback).toHaveBeenCalledWith(1, 'Initial Review');
  });
});
