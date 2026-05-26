import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PositionPage from '../pages/PositionPage';
import type { InterviewFlowResponse } from '../types/position';

// ── Helpers ───────────────────────────────────────────────────────

/** Render PositionPage inside a MemoryRouter at /positions/:id */
function renderAt(path: string, fetchMock?: typeof jest.fn) {
  const fetchFn =
    fetchMock ??
    jest.fn().mockResolvedValue({
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
    } as InterviewFlowResponse);

  return {
    fetchFn,
    ...render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/positions/:id" element={<PositionPage fetchInterviewFlow={fetchFn as any} />} />
          <Route path="/positions" element={<div>Positions List</div>} />
        </Routes>
      </MemoryRouter>,
    ),
  };
}

// ── Tests ─────────────────────────────────────────────────────────

describe('PositionPage', () => {
  it('renders PositionPage at /positions/1 (T11)', async () => {
    renderAt('/positions/1');

    expect(await screen.findByText('Senior Backend Engineer')).toBeInTheDocument();
  });

  it('renders PositionPage at /positions/abc (valid string ID) (T11b)', async () => {
    const fetchFn = jest.fn();
    renderAt('/positions/abc', fetchFn);

    expect(await screen.findByText(/ID de posición no válido/i)).toBeInTheDocument();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('shows spinner while loading (T12)', async () => {
    const fetchFn = jest.fn().mockReturnValue(new Promise<never>(() => {}));
    renderAt('/positions/1', fetchFn);

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

  it('shows error alert and retry button on API failure (T16)', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('Network Error'));
    renderAt('/positions/1', fetchFn);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(await screen.findByText(/Network Error/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
  });

  it('calls fetch again when retry button is clicked (T17)', async () => {
    const fetchFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Server Error'))
      .mockResolvedValueOnce({
        positionName: 'Retried Position',
        interviewFlow: { id: 1, description: '', interviewSteps: [] },
      } as InterviewFlowResponse);

    renderAt('/positions/1', fetchFn);

    // Wait for the error state — single assertion per waitFor
    const retryButton = await screen.findByRole('button', { name: /Reintentar/i });
    expect(retryButton).toBeInTheDocument();

    // Click retry
    await userEvent.click(retryButton);

    expect(await screen.findByText('Retried Position')).toBeInTheDocument();
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('sorts columns by orderIndex (T18)', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
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

    renderAt('/positions/1', fetchFn);

    // Wait for the region elements to appear, then assert order
    await screen.findByLabelText('Fase: First Step');
    const columns = screen.getAllByRole('region');
    expect(columns[0]).toHaveAttribute('aria-label', 'Fase: First Step');
    expect(columns[1]).toHaveAttribute('aria-label', 'Fase: Middle Step');
    expect(columns[2]).toHaveAttribute('aria-label', 'Fase: Last Step');
  });

  it('shows empty-state message when interviewSteps is empty (T19)', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      positionName: 'Empty Process',
      interviewFlow: {
        id: 1,
        description: '',
        interviewSteps: [],
      },
    } as InterviewFlowResponse);

    renderAt('/positions/1', fetchFn);

    expect(
      await screen.findByText('No hay fases definidas para este proceso.'),
    ).toBeInTheDocument();
  });

  it('works with direct navigation (no prior state) (T20)', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      positionName: 'Direct Navigation',
      interviewFlow: { id: 1, description: '', interviewSteps: [] },
    } as InterviewFlowResponse);

    renderAt('/positions/42', fetchFn);

    expect(await screen.findByText('Direct Navigation')).toBeInTheDocument();
    expect(fetchFn).toHaveBeenCalledWith(42);
  });
});
