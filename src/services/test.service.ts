import { prisma } from '../lib/prisma';
import { AppError } from '../utils/appError';
import {
  CreateTestRequest,
  CreateQuestionRequest,
  CreateOptionRequest,
} from '../types/test.types'; // Assuming you define these types

export class TestService {
  /**
   * Creates a new Test for a specific organization and staff creator.
   */
  async createTest(organizationId: string, creatorId: string, data: CreateTestRequest) {
    // Basic validation to ensure the creator is staff
    const staff = await prisma.staff.findUnique({
      where: { userId: creatorId },
    });

    if (!staff || staff.organizationId !== organizationId) {
      throw new AppError('Test creator must be a staff member of the organization.', 403);
    }

    const test = await prisma.test.create({
      data: {
        organization: { connect: { id: organizationId } },
        creator: { connect: { id: staff.id } },
        title: data.title,
        description: data.description,
        durationMinutes: data.durationMinutes,
        totalMarks: data.totalMarks,
        passingMarks: data.passingMarks,
        instructions: data.instructions,
        // Default values for proctoring settings are handled by the schema defaults
      },
    });

    return test;
  }

  /**
   * Creates a new Question and its options for an existing Test.
   */
  async createQuestionWithOptions(testId: string, data: CreateQuestionRequest) {
    const { questionOptions, ...questionData } = data;

    const question = await prisma.question.create({
      data: {
        testId,
        questionText: questionData.questionText,
        questionType: questionData.questionType,
        marks: questionData.marks,
        timeLimitSeconds: questionData.timeLimitSeconds,
        orderIndex: questionData.orderIndex,
        questionOptions: {
          createMany: {
            data: questionOptions.map((opt: CreateOptionRequest) => ({
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              orderIndex: opt.orderIndex,
            })),
          },
        },
      },
      include: {
        questionOptions: true,
      },
    });

    return question;
  }

  /**
   * Retrieves a full Test with its Questions and Options.
   */
  async getTestWithDetails(testId: string, organizationId: string) {
    const test = await prisma.test.findUnique({
      where: { id: testId, organizationId },
      include: {
        questions: {
          include: {
            questionOptions: {
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!test) {
      throw new AppError('Test not found in this organization.', 404);
    }

    return test;
  }

  /**
   * Publishes a Test, making it available for assignment.
   */
  async publishTest(testId: string, organizationId: string) {
    const test = await prisma.test.updateMany({
      where: { id: testId, organizationId },
      data: { isPublished: true },
    });

    if (test.count === 0) {
      throw new AppError('Test not found or already published.', 404);
    }

    return { message: 'Test published successfully.' };
  }
}