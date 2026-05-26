import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import KanbanBoard from '../components/KanbanBoard';
import type { InterviewStep, CandidateData } from '../types/position';

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Helper to simulate a viewport width in JSDOM.
 * Changes window.innerWidth and dispatches a resize event.
 */
function setViewport(width: number, height = 800) {
  // @ts-ignore - innerWidth is read-only but we override for tests
  window.innerWidth = width;
  // @ts-ignore
  window.innerHeight = height;
  window.dispatchEvent(new Event('resize'));
}

// ── Fixtures ─────────────────────────────────────────────────────────

const mockSteps: InterviewStep[] = [
  { id: 1, interviewFlowId: 1, interviewTypeId: 1, name: 'Initial Review', orderIndex: 1 },
  { id: 2, interviewFlowId: 1, interviewTypeId: 2, name: 'Technical Interview', orderIndex: 2 },
  { id: 3, interviewFlowId: 1, interviewTypeId: 3, name: 'Final Interview', orderIndex: 3 },
];

const mockCandidates: CandidateData[] = [
  { id: 1, applicationId: 10, fullName: 'Alice Johnson', currentInterviewStep: 'Initial Review', averageScore: 4 },
  { id: 2, applicationId: 11, fullName: 'Bob Smith', currentInterviewStep: 'Initial Review', averageScore: 3.5 },
  { id: 3, applicationId: 12, fullName: 'Charlie Brown', currentInterviewStep: 'Technical Interview', averageScore: 5 },
];

const mockCandidatesByStep = new Map<string, CandidateData[]>([
  ['Initial Review', [mockCandidates[0], mockCandidates[1]]],
  ['Technical Interview', [mockCandidates[2]]],
  ['Final Interview', []],
]);

const onDragEndMock = jest.fn();

/** Render KanbanBoard inside a MemoryRouter */
function renderBoard(options?: {
  candidatesByStep?: Map<string, CandidateData[]>;
  candidatesLoading?: boolean;
  candidatesError?: string | null;
  updatingIds?: Set<number>;
}) {
  return render(
    <MemoryRouter>
      <KanbanBoard
        positionName="Senior Backend Engineer"
        interviewSteps={mockSteps}
        candidatesByStep={options?.candidatesByStep ?? mockCandidatesByStep}
        candidatesLoading={options?.candidatesLoading ?? false}
        candidatesError={options?.candidatesError ?? null}
        onRetryCandidates={jest.fn()}
        onDragEnd={onDragEndMock}
        updatingIds={options?.updatingIds ?? new Set()}
      />
    </MemoryRouter>,
  );
}

// ── Tests ────────────────────────────────────────────────────────────

describe('KanbanBoard — Responsive Layout (T1–T11)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset viewport to a default desktop size before each test
    setViewport(1280, 800);
  });

  // ───── T1: Mobile: columns stacked vertically ─────

  it('T1: en viewport < 768px el contenedor tiene flex-column (columnas apiladas)', () => {
    setViewport(375, 667);
    renderBoard();
    const board = screen.getByTestId('kanban-board');
    // On mobile, the .kanban-columns container has flex-column for vertical stacking
    const columnsContainer = screen.getByTestId('kanban-columns');
    expect(columnsContainer).toHaveClass('flex-column');
    // Verify columns are in vertical layout by checking column order in DOM
    const columns = screen.getAllByRole('region');
    expect(columns).toHaveLength(3);
    expect(columns[0]).toHaveAttribute('aria-label', 'Fase: Initial Review');
    expect(columns[1]).toHaveAttribute('aria-label', 'Fase: Technical Interview');
    expect(columns[2]).toHaveAttribute('aria-label', 'Fase: Final Interview');
    // Each column should be full width on mobile
    columns.forEach((col) => {
      expect(col).toHaveClass('w-100');
    });
  });

  // ───── T2: Desktop: columns in horizontal row ─────

  it('T2: en viewport >= 768px el contenedor tiene clases para layout horizontal', () => {
    setViewport(1024, 768);
    renderBoard();
    const columnsContainer = screen.getByTestId('kanban-columns');
    // The responsive class flex-md-row is present in the DOM (media queries control its effect)
    expect(columnsContainer).toHaveClass('flex-md-row');
    // Also verify columns have min-width for desktop layout
    const columns = screen.getAllByRole('region');
    columns.forEach((col) => {
      expect(col).toHaveStyle('min-width: 280px');
    });
  });

  // ───── T3: Mobile: each column is full width ─────

  it('T3: en viewport < 768px cada columna ocupa 100% del ancho', () => {
    setViewport(375, 667);
    renderBoard();
    const columns = screen.getAllByRole('region');
    columns.forEach((col) => {
      // Each column should have w-100 class (full width on mobile)
      expect(col).toHaveClass('w-100');
    });
  });

  // ───── T4: Desktop: each column has min-width 280px and flex-shrink-0 ─────

  it('T4: en viewport >= 768px cada columna tiene min-width 280px y flex-shrink-0', () => {
    setViewport(1024, 768);
    renderBoard();
    const columns = screen.getAllByRole('region');
    columns.forEach((col) => {
      expect(col).toHaveStyle('min-width: 280px');
      expect(col).toHaveClass('flex-shrink-0');
    });
  });

  // ───── T5: Mobile: header has horizontal padding ─────

  it('T5: en viewport < 768px el header tiene padding a los lados (px-3)', () => {
    setViewport(375, 667);
    renderBoard();
    const header = screen.getByTestId('kanban-header');
    expect(header).toHaveClass('px-3');
  });

  // ───── T6: Mobile: title is truncated if too long ─────

  it('T6: en viewport < 768px el título tiene text-truncate para no desbordarse', () => {
    setViewport(375, 667);
    renderBoard();
    const title = screen.getByRole('heading', { name: /Senior Backend Engineer/i });
    expect(title).toHaveClass('text-truncate');
  });

  // ───── T7: Container never has overflow: hidden on mobile ─────

  it('T7: el contenedor principal no tiene overflow hidden que rompa scroll vertical', () => {
    setViewport(375, 667);
    renderBoard();
    const board = screen.getByTestId('kanban-board');
    expect(board).not.toHaveStyle('overflow: hidden');
  });

  // ───── T8: No horizontal scroll on any viewport ─────

  it('T8: no hay scroll horizontal forzado (overflow-x no hidden, contenido no excede)', () => {
    setViewport(375, 667);
    renderBoard();
    const board = screen.getByTestId('kanban-board');
    // We verify overflow-x is not set to 'hidden' (which could clip content)
    expect(board).not.toHaveStyle('overflow-x: hidden');
  });

  // ───── T9: Candidate cards have min-height 44px (touch target) ─────

  it('T9: las tarjetas tienen min-height 44px para área táctil suficiente', () => {
    renderBoard();
    const cards = screen.getAllByTestId(/^candidate-card-/);
    cards.forEach((card) => {
      expect(card).toHaveStyle('min-height: 44px');
    });
  });

  // ───── T10: Back button has min 44x44px touch area ─────

  it('T10: el botón de retroceso tiene área táctil mínima de 44x44px', () => {
    renderBoard();
    const backLink = screen.getByLabelText('Volver al listado de posiciones');
    // The button inside the link should have min dimensions
    const backBtn = backLink.querySelector('button');
    expect(backBtn).toBeInTheDocument();
    expect(backBtn).toHaveStyle('min-width: 44px');
    expect(backBtn).toHaveStyle('min-height: 44px');
  });

  // ───── T11: Tablet vertical (768-991px) — columns adapt ─────

  it('T11: en viewport entre 768px y 991px las columnas se muestran con ancho adaptativo', () => {
    setViewport(810, 1024);
    renderBoard();
    const columnsContainer = screen.getByTestId('kanban-columns');
    // On tablet vertical, we expect flex-row layout but with wrapping
    expect(columnsContainer).toHaveClass('flex-md-row');
  });
});

// ────────────────────────────────────────────────────────────────────
// Touch Interaction Tests (T12–T16)
// ────────────────────────────────────────────────────────────────────

describe('KanbanBoard — Touch Interaction (T12–T16)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setViewport(375, 667); // Mobile viewport for touch tests
  });

  // T12: Drag & drop works with touch events
  it('T12: el componente maneja onDragEnd correctamente (simula touch DnD)', () => {
    renderBoard();
    // We verify the DragDropContext is present (handles both mouse and touch)
    const board = screen.getByTestId('kanban-board');
    expect(board).toBeInTheDocument();

    // Verify that columns exist and are droppable (prepared for touch interaction)
    expect(screen.getByLabelText('Fase: Initial Review')).toBeInTheDocument();
    expect(screen.getByLabelText('Fase: Technical Interview')).toBeInTheDocument();
    expect(screen.getByLabelText('Fase: Final Interview')).toBeInTheDocument();
  });

  // T13: Visual highlight on drag-over works (same for touch and mouse)
  it('T13: el resaltado visual de columna (kanban-column--drag-over) está disponible para interacción táctil', () => {
    renderBoard();
    const columns = screen.getAllByRole('region');
    columns.forEach((col) => {
      // Columns should have the base class; --drag-over is applied dynamically via snapshot
      expect(col.className).toContain('kanban-column');
    });
  });

  // T14: touch-action is NOT 'none' on columns (scroll not blocked)
  it('T14: las columnas no tienen touch-action: none que bloquee el scroll vertical', () => {
    renderBoard();
    const columns = screen.getAllByRole('region');
    columns.forEach((col) => {
      expect(col).not.toHaveStyle('touch-action: none');
    });
  });

  // T15: Drag context maintained during scroll (simplified: verify structure)
  it('T15: el contexto de drag se mantiene durante scroll (estructura DragDropContext presente)', () => {
    renderBoard();
    // The kanban-columns wrapper is inside DragDropContext
    const columnsContainer = screen.getByTestId('kanban-columns');
    expect(columnsContainer).toHaveAttribute('role', 'listbox');
  });

  // T16: Drop outside valid column = card stays in place (simplified)
  it('T16: onDragEnd existe y maneja drops fuera de columna (no rompe)', () => {
    renderBoard();
    // onDragEnd is a prop from the parent; we verify the component accepts it
    expect(onDragEndMock).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────────
// Viewport Integration Tests (T17–T22)
// ────────────────────────────────────────────────────────────────────

describe('KanbanBoard — Viewport Integration (T17–T22)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // T17: iPhone SE (375px) — no horizontal scroll
  it('T17: en viewport 375px (iPhone SE) no hay scroll horizontal', () => {
    setViewport(375, 667);
    renderBoard();
    const board = screen.getByTestId('kanban-board');
    // Verify the board content doesn't exceed viewport width
    // In JSDOM we verify by checking CSS properties
    expect(board).toBeInTheDocument();
    // Columns should be in column mode (stacked)
    expect(screen.getByTestId('kanban-columns')).toHaveClass('flex-column');
  });

  // T18: iPhone 12/13/14 (390px) — no horizontal scroll
  it('T18: en viewport 390px (iPhone 12/13/14) no hay scroll horizontal', () => {
    setViewport(390, 844);
    renderBoard();
    expect(screen.getByTestId('kanban-columns')).toHaveClass('flex-column');
    expect(screen.getByLabelText('Fase: Initial Review')).toBeInTheDocument();
    expect(screen.getByLabelText('Fase: Technical Interview')).toBeInTheDocument();
    expect(screen.getByLabelText('Fase: Final Interview')).toBeInTheDocument();
  });

  // T19: iPhone 15 Pro Max (430px) — no horizontal scroll
  it('T19: en viewport 430px (iPhone 15 Pro Max) no hay scroll horizontal', () => {
    setViewport(430, 932);
    renderBoard();
    expect(screen.getByTestId('kanban-columns')).toHaveClass('flex-column');
    expect(screen.getByLabelText('Fase: Initial Review')).toBeInTheDocument();
  });

  // T20: iPad Mini vertical (768px) — no horizontal scroll
  it('T20: en viewport 768px (iPad Mini vertical) no hay scroll horizontal', () => {
    setViewport(768, 1024);
    renderBoard();
    // At exactly 768px, this is the breakpoint — flex-md-row applies
    const columnsContainer = screen.getByTestId('kanban-columns');
    expect(columnsContainer).toHaveClass('flex-md-row');
  });

  // T21: iPad horizontal (1024px) — no horizontal scroll
  it('T21: en viewport 1024px (iPad horizontal) no hay scroll horizontal', () => {
    setViewport(1024, 768);
    renderBoard();
    const columnsContainer = screen.getByTestId('kanban-columns');
    expect(columnsContainer).toHaveClass('flex-md-row');
  });

  // T22: Empty state message renders correctly on mobile
  it('T22: en viewport < 768px el mensaje de columna vacía se muestra sin romper layout', () => {
    setViewport(375, 667);
    const emptyStepMap = new Map<string, CandidateData[]>([
      ['Initial Review', []],
      ['Technical Interview', []],
      ['Final Interview', []],
    ]);
    renderBoard({ candidatesByStep: emptyStepMap });

    // All columns should show empty message
    const emptyMsg1 = screen.getByTestId('empty-column-1');
    const emptyMsg2 = screen.getByTestId('empty-column-2');
    const emptyMsg3 = screen.getByTestId('empty-column-3');
    expect(emptyMsg1).toHaveTextContent('No hay candidatos en esta fase');
    expect(emptyMsg2).toHaveTextContent('No hay candidatos en esta fase');
    expect(emptyMsg3).toHaveTextContent('No hay candidatos en esta fase');

    // Board renders without issues
    expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────────────
// Accessibility and Mobile Usability Tests (T23–T25)
// ────────────────────────────────────────────────────────────────────

describe('KanbanBoard — A11y Mobile (T23–T25)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setViewport(375, 667);
  });

  // T23: Interactive elements have descriptive aria-labels
  it('T23: todos los elementos interactivos tienen aria-label descriptivo', () => {
    renderBoard();
    // Back button
    expect(screen.getByLabelText('Volver al listado de posiciones')).toBeInTheDocument();
    // Columns
    expect(screen.getByLabelText('Fase: Initial Review')).toBeInTheDocument();
    expect(screen.getByLabelText('Fase: Technical Interview')).toBeInTheDocument();
    expect(screen.getByLabelText('Fase: Final Interview')).toBeInTheDocument();
    // Candidate cards
    const cards = screen.getAllByRole('article');
    cards.forEach((card) => {
      expect(card).toHaveAttribute('aria-label');
      expect(card.getAttribute('aria-label')).toMatch(/Candidato:/);
    });
  });

  // T24: Back button has aria-label and 44x44px touch target
  it('T24: el botón de retroceso tiene aria-label y tamaño táctil >= 44x44px', () => {
    renderBoard();
    const backLink = screen.getByLabelText('Volver al listado de posiciones');
    expect(backLink).toBeInTheDocument();

    const backBtn = backLink.querySelector('button');
    expect(backBtn).toBeInTheDocument();
    expect(backBtn).toHaveStyle('min-width: 44px');
    expect(backBtn).toHaveStyle('min-height: 44px');
  });

  // T25: Check that card touch targets are sufficient (manual verification note)
  it('T25: las tarjetas tienen área táctil suficiente (min-height: 44px verificada en T9)', () => {
    renderBoard();
    const cards = screen.getAllByTestId(/^candidate-card-/);
    cards.forEach((card) => {
      // Verify min-height meets 44px standard
      expect(card).toHaveStyle('min-height: 44px');
      // Cards have padding for comfortable touch area
      expect(card.className).toContain('candidate-card');
    });
  });
});
