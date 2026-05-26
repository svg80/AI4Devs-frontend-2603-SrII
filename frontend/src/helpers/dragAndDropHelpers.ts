import type { InterviewStep, CandidateData } from '../types/position';

/**
 * Find the numeric ID of an interview step by its name.
 *
 * Returns `null` if the step name is not found (edge case:
 * droppableId could reference a non-existent step).
 */
export function getStepIdByName(
  stepName: string,
  steps: InterviewStep[],
): number | null {
  const step = steps.find((s) => s.name === stepName);
  return step ? step.id : null;
}

/**
 * Find a candidate by ID across all steps in a grouped map.
 *
 * Returns `null` if the candidate is not found anywhere.
 *
 * Uses Array.from() for ES5/ES6 compatibility without downlevelIteration.
 */
export function findCandidateById(
  candidatesByStep: Map<string, CandidateData[]>,
  candidateId: number,
): CandidateData | null {
  const steps = Array.from(candidatesByStep.values());
  for (let i = 0; i < steps.length; i++) {
    const found = steps[i].find((c: CandidateData) => c.id === candidateId);
    if (found) return found;
  }
  return null;
}

/**
 * Build the rollback info needed when a drag fails.
 *
 * Captures source/destination step names and candidate metadata
 * so the rollback handler can restore the UI state.
 */
export function buildRollbackInfo(
  candidateId: number,
  sourceStepName: string,
  destinationStepName: string,
): { candidateId: number; sourceStepName: string; destinationStepName: string } {
  return { candidateId, sourceStepName, destinationStepName };
}
