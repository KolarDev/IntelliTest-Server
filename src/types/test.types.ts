import { QuestionType } from '@prisma/client'; 

// ------------------------------------------------------------------
// 1. Question Option Types
// ------------------------------------------------------------------

/**
 * Data structure for creating a single QuestionOption.
 */
export type CreateOptionRequest = {
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
};


// ------------------------------------------------------------------
// 2. Question Types
// ------------------------------------------------------------------

/**
 * Data structure for creating a single Question, including its options.
 */
export type CreateQuestionRequest = {
  questionText: string;
  questionType: QuestionType; // e.g., MULTIPLE_CHOICE, TRUE_FALSE
  marks: number;
  timeLimitSeconds?: number; // Optional
  orderIndex: number;
  questionOptions: CreateOptionRequest[]; // Array of options
};


// ------------------------------------------------------------------
// 3. Test Types
// ------------------------------------------------------------------

/**
 * Data structure for creating a new Test.
 */
export type CreateTestRequest = {
  title: string;
  description?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  instructions?: string;
  // Note: isPublished, randomizeQuestions, preventTabSwitch
  // will use schema defaults or be updated via separate service methods.
};