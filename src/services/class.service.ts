import { prisma } from '../lib/prisma';
import { AppError } from '../utils/appError';
import {
  CreateClassRequest,
  EnrollStudentsRequest,
  AssignTestToClassRequest,
  ClassWithStudents,
} from '../types/class.types';

export class ClassService {

  /**
   * Creates a new Class for the organization, linked to the staff member.
   */
  async createClass(organizationId: string, staffId: string, data: CreateClassRequest) {
    // 1. Validate staff member exists and belongs to the organization (Crucial step)
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, organizationId },
    });

    if (!staff) {
      throw new AppError('You are not a valid staff member of this organization.', 403);
    }

    const newClass = await prisma.class.create({
      data: {
        organizationId,
        staffId,
        name: data.name,
        description: data.description,
      },
    });
    return newClass;
  }

  /**
   * Retrieves all Classes for a given Organization.
   */
  async getClassesByOrganization(organizationId: string): Promise<ClassWithStudents[]> {
    const classes = await prisma.class.findMany({
      where: { organizationId },
      include: {
        classStudents: {
          select: {
            student: {
              select: {
                id: true,
                studentId: true,
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
          },
        },
      },
    });

    // Cast the result to the desired type for cleaner controller output
    return classes as unknown as ClassWithStudents[];
  }

  /**
   * Enrolls one or more students into an existing class.
   */
  async enrollStudents(organizationId: string, classId: string, data: EnrollStudentsRequest) {
    // 1. Check if the class exists and belongs to the organization
    const existingClass = await prisma.class.findFirst({
      where: { id: classId, organizationId },
    });

    if (!existingClass) {
      throw new AppError('Class not found or does not belong to your organization.', 404);
    }

    // 2. Prepare the ClassStudent records for creation
    const enrollments = data.studentIds.map(studentId => ({
      classId,
      studentId,
    }));

    // 3. Use createMany for bulk insertion, ignoring duplicates
    const result = await prisma.classStudent.createMany({
      data: enrollments,
      skipDuplicates: true,
    });

    return { 
      count: result.count,
      message: `${result.count} student(s) successfully enrolled.`
    };
  }

  /**
   * Removes a student from a class.
   */
  async removeStudent(classId: string, studentId: string) {
    const result = await prisma.classStudent.deleteMany({
      where: {
        classId,
        studentId,
      },
    });

    if (result.count === 0) {
      throw new AppError('Student was not found in this class.', 404);
    }

    return { message: 'Student successfully removed from class.' };
  }

  /**
   * Assigns a published Test to a Class via the TestAssignment model.
   */
  async assignTestToClass(organizationId: string, data: AssignTestToClassRequest) {
    // 1. Check if Test exists and is published within the organization
    const test = await prisma.test.findFirst({
      where: { id: data.testId, organizationId, isPublished: true },
    });

    if (!test) {
      throw new AppError('Test not found, or it has not been published.', 404);
    }

    // 2. Check if Class exists within the organization
    const existingClass = await prisma.class.findFirst({
      where: { id: data.classId, organizationId },
    });

    if (!existingClass) {
      throw new AppError('Class not found.', 404);
    }

    // 3. Create the assignment
    const assignment = await prisma.testAssignment.create({
      data: {
        testId: data.testId,
        classId: data.classId,
        startTime: data.startTime,
        endTime: data.endTime,
        maxAttempts: data.maxAttempts || 1,
      },
    });

    return assignment;
  }
}
