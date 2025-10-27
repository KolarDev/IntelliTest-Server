import { Class, Student } from '@prisma/client';

/**
 * Data structure for creating a new Class.
 */
export type CreateClassRequest = {
  name: string;
  description?: string;
};

/**
 * Data structure for enrolling one or more students into a class.
 */
export type EnrollStudentsRequest = {
  // Array of Student IDs (from the Student model's 'id' field)
  studentIds: string[];
};

/**
 * Data structure for assigning a Test to a Class (TestAssignment model).
 */
export type AssignTestToClassRequest = {
  testId: string;
  classId: string;
  startTime: Date;
  endTime: Date;
  maxAttempts?: number; // Defaults to 1 if not provided
};

/**
 * Type to represent a class with its enrolled students.
 */
export type ClassWithStudents = Class & {
  classStudents: {
    student: Student;
  }[];
};
