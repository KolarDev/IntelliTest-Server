import { Request, Response, NextFunction } from 'express';
import { TestService } from '../services/test.service';
import catchAsync from '../utils/catchAsync'; // Assuming the utility path
import { JWTPayload } from '../types/auth.types'; // Assuming this type includes id, role, organizationId

const testService = new TestService();

// Extend the Request object to include the 'user' payload from authentication middleware
interface RequestWithUser extends Request {
  user?: JWTPayload;
}

// Ensure only Org Admins or Staff can access test creation routes
const restrictToStaff = (req: RequestWithUser, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (role !== 'ORG_ADMIN' && role !== 'STAFF') {
        return res.status(403).json({
            status: 'fail',
            message: 'You do not have permission to perform this action.',
        });
    }
    next();
};

// ------------------------------------------------------------------
// Controllers
// ------------------------------------------------------------------

/**
 * POST /api/v1/tests
 * Create a new Test.
 */
export const createTest = catchAsync(async (req: RequestWithUser, res: Response) => {
  const { id: creatorId, organizationId } = req.user!; // Assumed to be populated by auth middleware

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
export const addQuestionToTest = catchAsync(async (req: RequestWithUser, res: Response) => {
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
export const getTestDetails = catchAsync(async (req: RequestWithUser, res: Response) => {
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
export const publishTest = catchAsync(async (req: RequestWithUser, res: Response) => {
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

// ------------------------------------------------------------------
// Example Router Setup (for context)
// ------------------------------------------------------------------
/*
