/**
 * Type definitions for the Position Management (Kanban) feature.
 *
 * These types correspond to the backend API contracts defined in
 * backend/api-spec.yaml and backend/src/routes/positionRoutes.ts.
 *
 * NOTE: The backend wraps GET /position/{id}/interviewflow response in
 * an extra `{ interviewFlow: ... }` envelope. The API module (api.ts)
 * unwraps this so consumers receive the flat InterviewFlowResponse shape.
 */

export interface InterviewStep {
  id: number;
  interviewFlowId: number;
  interviewTypeId: number;
  name: string;
  orderIndex: number;
}

export interface InterviewFlow {
  id: number;
  description: string;
  interviewSteps: InterviewStep[];
}

/** Shape returned by api.getInterviewFlow() after unwrapping */
export interface InterviewFlowResponse {
  positionName: string;
  interviewFlow: InterviewFlow;
}

/** Shape returned by api.getCandidates() — extended with id for drag-and-drop */
export interface CandidateData {
  id: number;
  applicationId: number;
  fullName: string;
  currentInterviewStep: string;
  averageScore: number;
}

export interface StageUpdatePayload {
  applicationId: number;
  currentInterviewStep: number;
}

export interface ApplicationData {
  id: number;
  positionId: number;
  candidateId: number;
  applicationDate: string;
  currentInterviewStep: number;
  notes: string | null;
  interviews: Array<{
    interviewDate: string;
    interviewStep: string;
    score: number | null;
  }>;
}

export interface StageUpdateResponse {
  message: string;
  data: ApplicationData;
}

/** Discriminated union for the page loading state */
export type PageState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: T };
