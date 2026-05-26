import {
  getStepIdByName,
  findCandidateById,
} from '../helpers/dragAndDropHelpers';
import type { InterviewStep, CandidateData } from '../types/position';

// ── Fixtures ──────────────────────────────────────────────────────

const mockSteps: InterviewStep[] = [
  { id: 1, interviewFlowId: 1, interviewTypeId: 1, name: 'Initial Review', orderIndex: 1 },
  { id: 2, interviewFlowId: 1, interviewTypeId: 2, name: 'Technical Interview', orderIndex: 2 },
  { id: 3, interviewFlowId: 1, interviewTypeId: 3, name: 'Final Interview', orderIndex: 3 },
];

const mockCandidates: CandidateData[] = [
  { id: 1, applicationId: 10, fullName: 'Alice', currentInterviewStep: 'Initial Review', averageScore: 4 },
  { id: 2, applicationId: 11, fullName: 'Bob', currentInterviewStep: 'Technical Interview', averageScore: 3.5 },
];

const mockCandidatesByStep = new Map<string, CandidateData[]>([
  ['Initial Review', [mockCandidates[0]]],
  ['Technical Interview', [mockCandidates[1]]],
  ['Final Interview', []],
]);

// ── getStepIdByName (T20–T22) ─────────────────────────────────────

describe('getStepIdByName', () => {
  it('returns the numeric id for an existing step name (T20)', () => {
    expect(getStepIdByName('Technical Interview', mockSteps)).toBe(2);
    expect(getStepIdByName('Initial Review', mockSteps)).toBe(1);
    expect(getStepIdByName('Final Interview', mockSteps)).toBe(3);
  });

  it('returns null for a non-existent step name (T21)', () => {
    expect(getStepIdByName('Nonexistent Phase', mockSteps)).toBeNull();
    expect(getStepIdByName('Manager Interview', mockSteps)).toBeNull();
  });

  it('returns null for an empty string (T22)', () => {
    expect(getStepIdByName('', mockSteps)).toBeNull();
    expect(getStepIdByName('  ', mockSteps)).toBeNull();
  });
});

// ── findCandidateById ─────────────────────────────────────────────

describe('findCandidateById', () => {
  it('finds a candidate by ID from the grouped map', () => {
    const found = findCandidateById(mockCandidatesByStep, 1);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(1);
    expect(found!.fullName).toBe('Alice');
  });

  it('finds a candidate in a different step', () => {
    const found = findCandidateById(mockCandidatesByStep, 2);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(2);
    expect(found!.fullName).toBe('Bob');
  });

  it('returns null for a non-existent candidate ID', () => {
    expect(findCandidateById(mockCandidatesByStep, 999)).toBeNull();
  });

  it('returns null when the map is empty', () => {
    expect(findCandidateById(new Map(), 1)).toBeNull();
  });
});
