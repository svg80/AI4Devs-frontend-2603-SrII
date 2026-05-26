import { getCandidatesByPositionService } from './positionService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    application: {
      findMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('getCandidatesByPositionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return candidates with their average scores, id and applicationId', async () => {
    const mockApplications = [
      {
        id: 1,
        positionId: 1,
        candidateId: 1,
        applicationDate: new Date(),
        currentInterviewStep: 1,
        notes: null,
        candidate: { id: 1, firstName: 'John', lastName: 'Doe' },
        interviewStep: { name: 'Technical Interview' },
        interviews: [{ score: 5 }, { score: 3 }],
      },
    ];

    jest
      .spyOn(prisma.application, 'findMany')
      .mockResolvedValue(mockApplications);

    const result = await getCandidatesByPositionService(1);
    expect(result).toEqual([
      {
        fullName: 'John Doe',
        currentInterviewStep: 'Technical Interview',
        averageScore: 4,
        id: 1,
        applicationId: 1,
      },
    ]);
    expect(result[0].id).toBeDefined();
    expect(result[0].applicationId).toBeDefined();
    expect(result[0].id).toBe(1);
    expect(result[0].applicationId).toBe(1);
  });

  it('should return id and applicationId for multiple candidates', async () => {
    const mockApplications = [
      {
        id: 10,
        positionId: 1,
        candidateId: 5,
        applicationDate: new Date(),
        currentInterviewStep: 1,
        notes: null,
        candidate: { id: 5, firstName: 'Ana', lastName: 'López' },
        interviewStep: { name: 'Initial Screening' },
        interviews: [{ score: 4 }],
      },
      {
        id: 20,
        positionId: 1,
        candidateId: 8,
        applicationDate: new Date(),
        currentInterviewStep: 2,
        notes: null,
        candidate: { id: 8, firstName: 'Luis', lastName: 'Pérez' },
        interviewStep: { name: 'Technical Interview' },
        interviews: [{ score: 5 }, { score: 3 }],
      },
    ];

    jest
      .spyOn(prisma.application, 'findMany')
      .mockResolvedValue(mockApplications);

    const result = await getCandidatesByPositionService(1);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(5); // candidate.id
    expect(result[0].applicationId).toBe(10); // app.id
    expect(result[1].id).toBe(8);
    expect(result[1].applicationId).toBe(20);
  });

  it('should return id and applicationId as numbers (not strings)', async () => {
    const mockApplications = [
      {
        id: 1,
        positionId: 1,
        candidateId: 1,
        applicationDate: new Date(),
        currentInterviewStep: 1,
        notes: null,
        candidate: { id: 1, firstName: 'John', lastName: 'Doe' },
        interviewStep: { name: 'Technical Interview' },
        interviews: [{ score: 5 }],
      },
    ];

    jest
      .spyOn(prisma.application, 'findMany')
      .mockResolvedValue(mockApplications);

    const result = await getCandidatesByPositionService(1);

    expect(typeof result[0].id).toBe('number');
    expect(typeof result[0].applicationId).toBe('number');
    expect(Number.isInteger(result[0].id)).toBe(true);
    expect(Number.isInteger(result[0].applicationId)).toBe(true);
  });
});
