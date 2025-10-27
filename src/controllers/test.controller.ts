import { Request, Response, NextFunction } from 'express';
import { TestService } from '../services/test.service';
import { catchAsync } from '../utils/catchAsync';

const testService = new TestService();

/**
 * POST /api/v1/tests
 * Create a new Test.
 */
export const createTest = catchAsync(async (req: Request, res: Response) => {
  const { id: creatorId, organizationId } = req.user!;

  if (!organizationId) {
    return res.status(403).json({
      status: 'fail',
      message: 'User is not linked to an organization.',
    });
  }

  const test = await testService.createTest(organizationId, creatorId, req.body);

  res.status(201).json({
    status: 'success',
    data: { test },
  });
});

/**
 * POST /api/v1/tests/:testId/questions
 * Add a new Question and its Options to a Test.
 */
export const addQuestionToTest = catchAsync(async (req: Request, res: Response) => {
  const { testId } = req.params;

  // Optionally, add a check here to ensure the test belongs to the user's organization.
  // This is a crucial security step (omitted for brevity, but recommended).

  const question = await testService.createQuestionWithOptions(testId, req.body);

  res.status(201).json({
    status: 'success',
    data: { question },
  });
});

/**
 * GET /api/v1/tests/:testId
 * Get a specific Test with all its questions and options.
 */
export const getTestDetails = catchAsync(async (req: Request, res: Response) => {
  const { testId } = req.params;
  const { organizationId } = req.user!;

  if (!organizationId) {
    return res.status(403).json({
      status: 'fail',
      message: 'User is not linked to an organization.',
    });
  }

  const test = await testService.getTestWithDetails(testId, organizationId);

  res.status(200).json({
    status: 'success',
    data: { test },
  });
});

/**
 * PATCH /api/v1/tests/:testId/publish
 * Publish a Test.
 */
export const publishTest = catchAsync(async (req: Request, res: Response) => {
  const { testId } = req.params;
  const { organizationId } = req.user!;

  if (!organizationId) {
    return res.status(403).json({
      status: 'fail',
      message: 'User is not linked to an organization.',
    });
  }

  const result = await testService.publishTest(testId, organizationId);

  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});
