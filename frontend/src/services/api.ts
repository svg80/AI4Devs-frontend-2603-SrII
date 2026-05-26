import axios, { AxiosInstance } from 'axios';
import type {
  InterviewFlowResponse,
  CandidateData,
  StageUpdatePayload,
  StageUpdateResponse,
} from '../types/position';

/**
 * Shared axios instance pointing at the backend.
 *
 * Base URL matches the existing candidateService.js convention
 * (localhost:3010). In production this should come from an env variable.
 *
 * NOTE: Exporting the client allows tests to mock it via
 * `jest.spyOn(api, 'client')` or by mocking axios.create().
 */
export const client: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3010',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Fetch the interview flow (phases) for a given position.
 *
 * The backend returns `{ interviewFlow: { positionName, interviewFlow } }`,
 * so we unwrap the outer envelope to return the flat InterviewFlowResponse.
 */
export async function getInterviewFlow(
  positionId: number,
): Promise<InterviewFlowResponse> {
  const response = await client.get<{ interviewFlow: InterviewFlowResponse }>(
    `/position/${positionId}/interviewflow`,
  );
  return response.data.interviewFlow;
}

/**
 * Fetch all candidates (with scores) for a given position.
 */
export async function getCandidates(
  positionId: number,
): Promise<CandidateData[]> {
  const response = await client.get<CandidateData[]>(
    `/position/${positionId}/candidates`,
  );
  return response.data;
}

/**
 * Move a candidate to a different interview stage (drag & drop).
 */
export async function updateCandidateStage(
  candidateId: number,
  payload: StageUpdatePayload,
): Promise<StageUpdateResponse> {
  const response = await client.put<StageUpdateResponse>(
    `/candidates/${candidateId}`,
    payload,
  );
  return response.data;
}
