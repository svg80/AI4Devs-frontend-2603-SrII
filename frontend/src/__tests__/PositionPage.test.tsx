import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PositionPage from '../pages/PositionPage';
import type { InterviewFlowResponse, CandidateData } from '../types/position';

// ── Fixtures ──────────────────────────────────────────────────────

const defaultFlowResponse: InterviewFlowResponse = {
  positionName: 'Senior Backend Engineer',
  interviewFlow: {
    id: 1,
    description: 'Standard process',
    interviewSteps: [
      { id: 1, interviewFlowId: 1, interviewTypeId: 1, name: 'Initial Review', orderIndex: 1 },
      { id: 2, interviewFlowId: 1, interviewTypeId: 2, name: 'Technical Interview', orderIndex: 2 },
      { id: 3, interviewFlowId: 1, interviewTypeId: 3, name: 'Final Interview', orderIndex: 3 },
    ],
  },
};

const defaultCandidates: CandidateData[] = [
  { id: 1, applicationId: 10, fullName: 'Jane Smith', currentInterviewStep: 'Technical Interview', averageScore: 4 },
  { id: 2, applicationId: 11, fullName: 'Carlos García', currentInterviewStep: 'Initial Review', averageScore: 0 },
  { id: 3, applicationId: 12, fullName: 'John Doe', currentInterviewStep: 'Final Interview', averageScore: 5 },
];

// ── Helpers ───────────────────────────────────────────────────────

interface RenderOptions {
  flowMock?: jest.Mock;
  candidatesMock?: jest.Mock;
}

/** Render PositionPage inside a MemoryRouter at /positions/:id */
function renderAt(
  path: string,
  options?: RenderOptions,
) {
  const flowMock =
    options?.flowMock ??
    jest.fn().mockResolvedValue(defaultFlowResponse);

  const candidatesMock =
    options?.candidatesMock ??
    jest.fn().mockResolvedValue(defaultCandidates);

  return {
    flowMock,
    candidatesMock,
    ...render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/positions/:id"
            element={
              <PositionPage
                fetchInterviewFlow={flowMock as any}
                fetchCandidates={candidatesMock as any}
              />
            }
          />
          <Route path="/positions" element={<div>Positions List</div>} />
        </Routes>
      </MemoryRouter>,
    ),
  };
}

// ── Existing tests (T11–T20 from 001) ─────────────────────────────

describe('PositionPage', () => {
  it('renders PositionPage at /positions/1 (T11)', async () => {
    renderAt('/positions/1');

    expect(await screen.findByText('Senior Backend Engineer')).toBeInTheDocument();
  });

  it('renders PositionPage at /positions/abc (valid string ID) (T11b)', async () => {
    const flowMock = jest.fn();
    renderAt('/positions/abc', { flowMock });

    expect(await screen.findByText(/ID de posición no válido/i)).toBeInTheDocument();
    expect(flowMock).not.toHaveBeenCalled();
  });

  it('shows spinner while loading (T12)', async () => {
    const flowMock = jest.fn().mockReturnValue(new Promise<never>(() => {}));
    renderAt('/positions/1', { flowMock });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('renders columns for each phase on success (T13)', async () => {
    renderAt('/positions/1');

    expect(await screen.findByText('Initial Review')).toBeInTheDocument();
    expect(await screen.findByText('Technical Interview')).toBeInTheDocument();
    expect(await screen.findByText('Final Interview')).toBeInTheDocument();
  });

  it('displays position title in the header (T14)', async () => {
    renderAt('/positions/1');

    expect(
      await screen.findByRole('heading', { name: /Senior Backend Engineer/i }),
    ).toBeInTheDocument();
  });

  it('shows a back link with arrow that navigates to /positions (T15)', async () => {
    renderAt('/positions/1');

    const backLink = await screen.findByLabelText('Volver al listado de posiciones');
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/positions');
  });

  it('shows error alert and retry button on interview flow API failure (T16)', async () => {
    const flowMock = jest.fn().mockRejectedValue(new Error('Network Error'));
    renderAt('/positions/1', { flowMock });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(await screen.findByText(/Network Error/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
  });

  it('calls fetch again when retry button is clicked (T17)', async () => {
    const flowMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('Server Error'))
      .mockResolvedValueOnce({
        positionName: 'Retried Position',
        interviewFlow: { id: 1, description: '', interviewSteps: [] },
      } as InterviewFlowResponse);

    renderAt('/positions/1', { flowMock });

    const retryButton = await screen.findByRole('button', { name: /Reintentar/i });
    expect(retryButton).toBeInTheDocument();

    await userEvent.click(retryButton);

    expect(await screen.findByText('Retried Position')).toBeInTheDocument();
    expect(flowMock).toHaveBeenCalledTimes(2);
  });

  it('sorts columns by orderIndex (T18)', async () => {
    const flowMock = jest.fn().mockResolvedValue({
      positionName: 'Test',
      interviewFlow: {
        id: 1,
        description: '',
        interviewSteps: [
          { id: 3, interviewFlowId: 1, interviewTypeId: 3, name: 'Last Step', orderIndex: 3 },
          { id: 1, interviewFlowId: 1, interviewTypeId: 1, name: 'First Step', orderIndex: 1 },
          { id: 2, interviewFlowId: 1, interviewTypeId: 2, name: 'Middle Step', orderIndex: 2 },
        ],
      },
    } as InterviewFlowResponse);

    renderAt('/positions/1', { flowMock });

    await screen.findByLabelText('Fase: First Step');
    const columns = screen.getAllByRole('region');
    expect(columns[0]).toHaveAttribute('aria-label', 'Fase: First Step');
    expect(columns[1]).toHaveAttribute('aria-label', 'Fase: Middle Step');
    expect(columns[2]).toHaveAttribute('aria-label', 'Fase: Last Step');
  });

  it('shows empty-state message when interviewSteps is empty (T19)', async () => {
    const flowMock = jest.fn().mockResolvedValue({
      positionName: 'Empty Process',
      interviewFlow: {
        id: 1,
        description: '',
        interviewSteps: [],
      },
    } as InterviewFlowResponse);

    renderAt('/positions/1', { flowMock });

    expect(
      await screen.findByText('No hay fases definidas para este proceso.'),
    ).toBeInTheDocument();
  });

  it('works with direct navigation (no prior state) (T20)', async () => {
    const flowMock = jest.fn().mockResolvedValue({
      positionName: 'Direct Navigation',
      interviewFlow: { id: 1, description: '', interviewSteps: [] },
    } as InterviewFlowResponse);

    renderAt('/positions/42', { flowMock });

    expect(await screen.findByText('Direct Navigation')).toBeInTheDocument();
    expect(flowMock).toHaveBeenCalledWith(42);
  });
});

// ── Candidate integration tests (T13–T19 from 002) ────────────────

describe('PositionPage — Candidate Integration', () => {
  it('fetches candidates immediately after flow loads (T13)', async () => {
    const candidatesMock = jest.fn().mockResolvedValue(defaultCandidates);
    renderAt('/positions/1', { candidatesMock });

    // Wait until candidates fetch is called (confirms flow loaded + effect fired)
    await waitFor(() => {
      expect(candidatesMock).toHaveBeenCalledWith(1);
    });
  });

  it('does NOT fetch candidates when interview flow fails (T13b)', async () => {
    const flowMock = jest.fn().mockRejectedValue(new Error('Flow Error'));
    const candidatesMock = jest.fn();

    renderAt('/positions/1', { flowMock, candidatesMock });

    await screen.findByRole('alert');
    expect(candidatesMock).not.toHaveBeenCalled();
  });

  it('renders candidate cards in the correct column by step (T9)', async () => {
    const candidatesMock = jest.fn().mockResolvedValue([
      { id: 1, applicationId: 10, fullName: 'Jane Smith', currentInterviewStep: 'Technical Interview', averageScore: 4 },
    ]);

    renderAt('/positions/1', { candidatesMock });

    // Wait for columns and card to render
    const card = await screen.findByRole('article');
    expect(card).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // The card should be inside the "Technical Interview" column
    const techColumn = screen.getByLabelText('Fase: Technical Interview');
    expect(techColumn).toContainElement(card);
  });

  it('renders multiple candidates in the same column (T10)', async () => {
    const candidatesMock = jest.fn().mockResolvedValue([
      { id: 1, applicationId: 10, fullName: 'Alice', currentInterviewStep: 'Initial Review', averageScore: 3 },
      { id: 2, applicationId: 11, fullName: 'Bob', currentInterviewStep: 'Initial Review', averageScore: 4 },
    ]);

    renderAt('/positions/1', { candidatesMock });

    // Wait for both cards to appear
    const alice = await screen.findByText('Alice');
    const bob = await screen.findByText('Bob');

    const initialColumn = screen.getByLabelText('Fase: Initial Review');
    expect(initialColumn).toContainElement(alice);
    expect(initialColumn).toContainElement(bob);
  });

  it('discards candidate with unknown step and does not break rendering (T11)', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const candidatesMock = jest.fn().mockResolvedValue([
      { id: 1, applicationId: 10, fullName: 'Visible', currentInterviewStep: 'Initial Review', averageScore: 3 },
      { id: 2, applicationId: 11, fullName: 'Ghost', currentInterviewStep: 'Nonexistent Step', averageScore: 5 },
    ]);

    renderAt('/positions/1', { candidatesMock });

    // Wait for the visible candidate to appear
    expect(await screen.findByText('Visible')).toBeInTheDocument();
    // The ghost candidate should NOT be rendered
    expect(screen.queryByText('Ghost')).not.toBeInTheDocument();
    // A warning should be logged with a single string containing both pieces
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Ghost.*Nonexistent Step/),
    );

    warnSpy.mockRestore();
  });

  it('shows empty-column message when column has no candidates (T12)', async () => {
    const candidatesMock = jest.fn().mockResolvedValue([
      { id: 1, applicationId: 10, fullName: 'Only One', currentInterviewStep: 'Initial Review', averageScore: 3 },
    ]);

    renderAt('/positions/1', { candidatesMock });

    // The "Technical Interview" and "Final Interview" columns should show empty message
    const emptyMsg1 = await screen.findByTestId('empty-column-2');
    const emptyMsg2 = await screen.findByTestId('empty-column-3');
    expect(emptyMsg1).toHaveTextContent('No hay candidatos en esta fase');
    expect(emptyMsg2).toHaveTextContent('No hay candidatos en esta fase');
  });

  it('shows spinner while candidates are loading (T14)', async () => {
    // Keep candidates pending indefinitely
    const candidatesMock = jest.fn().mockReturnValue(new Promise<never>(() => {}));

    renderAt('/positions/1', { candidatesMock });

    // Wait for flow to load (columns visible)
    await screen.findByText('Initial Review');

    // Then check candidates loading indicator
    expect(await screen.findByTestId('candidates-loading')).toBeInTheDocument();
  });

  it('shows error alert with retry button when candidates fail (T15)', async () => {
    const candidatesMock = jest.fn().mockRejectedValue(new Error('Failed to load candidates'));

    renderAt('/positions/1', { candidatesMock });

    // Wait for the error alert
    const alert = await screen.findByTestId('candidates-error-alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Failed to load candidates');

    // Retry button should be present
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();

    // Columns should still be visible (error is independent)
    expect(screen.getByText('Initial Review')).toBeInTheDocument();
  });

  it('calls getCandidates again when retry is clicked (T16)', async () => {
    const candidatesMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValueOnce([{ id: 1, applicationId: 10, fullName: 'Retried!', currentInterviewStep: 'Initial Review', averageScore: 5 }]);

    renderAt('/positions/1', { candidatesMock });

    // Wait for error alert and click retry
    const retryButton = await screen.findByRole('button', { name: /Reintentar/i });
    await userEvent.click(retryButton);

    // After retry, the candidate should appear
    expect(await screen.findByText('Retried!')).toBeInTheDocument();
    // candidatesMock should have been called twice (first fail, then retry)
    expect(candidatesMock).toHaveBeenCalledTimes(2);
  });

  it('full flow: columns and candidate cards render together (T17)', async () => {
    renderAt('/positions/1');

    // Flow columns
    expect(await screen.findByText('Initial Review')).toBeInTheDocument();
    expect(await screen.findByText('Technical Interview')).toBeInTheDocument();
    expect(await screen.findByText('Final Interview')).toBeInTheDocument();

    // Candidate cards
    expect(await screen.findByText('Jane Smith')).toBeInTheDocument();
    expect(await screen.findByText('Carlos García')).toBeInTheDocument();
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
  });

  it('shows score badge count next to column title', async () => {
    renderAt('/positions/1');

    // Wait for candidate cards to render (confirm candidates loaded)
    await screen.findByText('Jane Smith');

    // Badges should show count of candidates per column
    const initialColumn = screen.getByLabelText('Fase: Initial Review');
    expect(initialColumn.textContent).toMatch(/Initial Review\s*1/);

    const techColumn = screen.getByLabelText('Fase: Technical Interview');
    expect(techColumn.textContent).toMatch(/Technical Interview\s*1/);

    const finalColumn = screen.getByLabelText('Fase: Final Interview');
    expect(finalColumn.textContent).toMatch(/Final Interview\s*1/);
  });
});
