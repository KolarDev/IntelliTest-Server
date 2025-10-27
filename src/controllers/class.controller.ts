import { Request, Response, NextFunction } from 'express';
import { ClassService } from '../services/class.service';
import { catchAsync } from '../utils/catchAsync'; 
import { JWTPayload } from '../types/auth.types'; 

const classService = new ClassService();

/**
 * POST /api/v1/classes
 * Create a new Class. Requires Staff/ORG_ADMIN role.
 */
export const createClass = catchAsync(async (req: Request, res: Response) => {
  // Use non-null assertion (!) since the restrictToStaff middleware guarantees 'req.user' exists.
  const { id: staffId, organizationId } = req.user!;

  if (!organizationId) {
    return res.status(403).json({
      status: 'fail',
      message: 'User is not linked to an organization.',
    });
  }

  // Assuming the user ID will map to a staff record for class creation
  const newClass = await classService.createClass(organizationId, staffId, req.body);

  res.status(201).json({
    status: 'success',
    data: { class: newClass },
  });
});

/**
 * GET /api/v1/classes
 * Retrieve all Classes in the Organization.
 */
export const getClasses = catchAsync(async (req: Request, res: Response) => {
  const { organizationId } = req.user!;

  if (!organizationId) {
    return res.status(403).json({
      status: 'fail',
      message: 'User is not linked to an organization.',
    });
  }

  const classes = await classService.getClassesByOrganization(organizationId);

  res.status(200).json({
    status: 'success',
    results: classes.length,
    data: { classes },
  });
});

/**
 * POST /api/v1/classes/:classId/enroll
 * Enroll one or more students into a class.
 */
export const enrollStudents = catchAsync(async (req: Request, res: Response) => {
  const { classId } = req.params;
  const { organizationId } = req.user!;

  if (!organizationId) {
    return res.status(403).json({
      status: 'fail',
      message: 'User is not linked to an organization.',
    });
  }

  const result = await classService.enrollStudents(organizationId, classId, req.body);

  res.status(200).json({
    status: 'success',
    message: result.message,
    enrolledCount: result.count
  });
});

/**
 * DELETE /api/v1/classes/:classId/students/:studentId
 * Remove a single student from a class.
 */
export const removeStudentFromClass = catchAsync(async (req: Request, res: Response) => {
  const { classId, studentId } = req.params;

  const result = await classService.removeStudent(classId, studentId);

  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});


/**
 * POST /api/v1/classes/assignments
 * Assign a Test to a specific Class. Requires Staff/ORG_ADMIN role.
 */
export const assignTest = catchAsync(async (req: Request, res: Response) => {
  const { organizationId } = req.user!;

  if (!organizationId) {
    return res.status(403).json({
      status: 'fail',
      message: 'User is not linked to an organization.',
    });
  }

  // Parse dates from strings in the request body
  const assignmentData = {
    ...req.body,
    startTime: new Date(req.body.startTime),
    endTime: new Date(req.body.endTime),
  };
  
  const assignment = await classService.assignTestToClass(organizationId, assignmentData);

  res.status(201).json({
    status: 'success',
    message: 'Test successfully assigned to class.',
    data: { assignment },
  });
});