import axios from 'axios';
import { getInterviewFlow, getCandidates, updateCandidateStage, client } from '../services/api';
import type { InterviewFlowResponse, CandidateData, StageUpdateResponse } from '../types/position';

// ── Mock setup ─────────────────────────────────────────────────────

// Mock axios.create so it returns a mocked client with get/put
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    put: jest.fn(),
    defaults: { headers: { common: {} } },
  };
  return {
    create: jest.fn(() => mockAxiosInstance),
    default: mockAxiosInstance,
  };
});

// Retrieve the mock instance that axios.create() returned
const mockedClient = (axios.create as jest.Mock)() as jest.Mocked<typeof client>;

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getInterviewFlow ─────────────────────────────────────────────

describe('getInterviewFlow', () => {
  const mockResponse: InterviewFlowResponse = {
    positionName: 'Senior Backend Engineer',
    interviewFlow: {
      id: 1,
      description: 'Standard interview process',
      interviewSteps: [
        { id: 1, interviewFlowId: 1, interviewTypeId: 1, name: 'Initial Review', orderIndex: 1 },
        { id: 2, interviewFlowId: 1, interviewTypeId: 2, name: 'Technical Interview', orderIndex: 2 },
      ],
    },
  };

  it('calls GET /position/{id}/interviewflow (T1)', async () => {
    mockedClient.get.mockResolvedValueOnce({ data: { interviewFlow: mockResponse } });

    await getInterviewFlow(1);

    expect(mockedClient.get).toHaveBeenCalledWith('/position/1/interviewflow');
  });

  it('returns typed data on success (T2)', async () => {
    mockedClient.get.mockResolvedValueOnce({ data: { interviewFlow: mockResponse } });

    const result = await getInterviewFlow(1);

    expect(result).toEqual(mockResponse);
    expect(result.positionName).toBe('Senior Backend Engineer');
    expect(result.interviewFlow.interviewSteps).toHaveLength(2);
  });

  it('throws when the server responds with 404 (T3)', async () => {
    mockedClient.get.mockRejectedValueOnce(new Error('Request failed with status code 404'));

    await expect(getInterviewFlow(999)).rejects.toThrow('Request failed with status code 404');
  });

  it('throws on network failure (T4)', async () => {
    mockedClient.get.mockRejectedValueOnce(new Error('Network Error'));

    await expect(getInterviewFlow(1)).rejects.toThrow('Network Error');
  });
});

// ─── getCandidates ────────────────────────────────────────────────

describe('getCandidates', () => {
  const mockCandidates: CandidateData[] = [
    { id: 1, applicationId: 10, fullName: 'Alice Wonder', currentInterviewStep: 'Technical Interview', averageScore: 8.5 },
    { id: 2, applicationId: 11, fullName: 'Bob Builder', currentInterviewStep: 'Initial Review', averageScore: 6.0 },
  ];

  it('calls GET /position/{id}/candidates (T5)', async () => {
    mockedClient.get.mockResolvedValueOnce({ data: mockCandidates });

    await getCandidates(1);

    expect(mockedClient.get).toHaveBeenCalledWith('/position/1/candidates');
  });

  it('returns empty array when there are no candidates (T6)', async () => {
    mockedClient.get.mockResolvedValueOnce({ data: [] });

    const result = await getCandidates(1);

    expect(result).toEqual([]);
  });

  it('throws on server error 500 (T7)', async () => {
    mockedClient.get.mockRejectedValueOnce(new Error('Request failed with status code 500'));

    await expect(getCandidates(1)).rejects.toThrow('Request failed with status code 500');
  });
});

// ─── updateCandidateStage ─────────────────────────────────────────

describe('updateCandidateStage', () => {
  const mockResponse: StageUpdateResponse = {
    message: 'Stage updated successfully',
    data: {
      id: 1,
      positionId: 1,
      candidateId: 1,
      applicationDate: '2024-01-15T00:00:00.000Z',
      currentInterviewStep: 2,
      notes: null,
      interviews: [],
    },
  };

  it('sends PUT /candidates/{id} with correct payload (T8)', async () => {
    mockedClient.put.mockResolvedValueOnce({ data: mockResponse });

    await updateCandidateStage(1, { applicationId: 10, currentInterviewStep: 2 });

    expect(mockedClient.put).toHaveBeenCalledWith('/candidates/1', {
      applicationId: 10,
      currentInterviewStep: 2,
    });
  });

  it('returns typed success response (T9)', async () => {
    mockedClient.put.mockResolvedValueOnce({ data: mockResponse });

    const result = await updateCandidateStage(1, { applicationId: 10, currentInterviewStep: 2 });

    expect(result).toEqual(mockResponse);
    expect(result.message).toBe('Stage updated successfully');
  });

  it('throws on 400 bad request (T10)', async () => {
    mockedClient.put.mockRejectedValueOnce(new Error('Request failed with status code 400'));

    await expect(
      updateCandidateStage(1, { applicationId: 999, currentInterviewStep: -1 }),
    ).rejects.toThrow('Request failed with status code 400');
  });
});
