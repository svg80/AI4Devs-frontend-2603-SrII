import { getCandidatesByPosition } from './positionController';
import { Request, Response } from 'express';
import { getCandidatesByPositionService } from '../../application/services/positionService';

jest.mock('../../application/services/positionService');

describe('getCandidatesByPosition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and candidates data with id and applicationId', async () => {
    const req = { params: { id: '1' } } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const mockCandidates = [
      {
        fullName: 'John Doe',
        currentInterviewStep: 'Technical Interview',
        averageScore: 4,
        id: 1,
        applicationId: 1,
      },
    ];

    (getCandidatesByPositionService as jest.Mock).mockResolvedValue(
      mockCandidates,
    );

    await getCandidatesByPosition(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          fullName: 'John Doe',
          currentInterviewStep: 'Technical Interview',
          averageScore: 4,
          id: 1,
          applicationId: 1,
        }),
      ]),
    );
  });

  it('should return 500 when service throws an error', async () => {
    const req = { params: { id: '1' } } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    (getCandidatesByPositionService as jest.Mock).mockRejectedValue(
      new Error('DB connection error'),
    );

    await getCandidatesByPosition(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Error retrieving candidates',
      }),
    );
  });
});
