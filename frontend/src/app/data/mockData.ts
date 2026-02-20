// Mock data for AlphaLo application

export interface University {
  id: string;
  name: string;
  logo: string;
}

export interface Course {
  id: string;
  universityId: string;
  code: string;
  name: string;
}

export interface Instructor {
  id: string;
  courseId: string;
  name: string;
  title: string;
  avatar: string;
}

export interface Topic {
  id: string;
  phase: string;
  topic: string;
  aiPattern: string;
  complexity: 'low' | 'medium' | 'high';
}

export interface Question {
  id: string;
  topicId: string;
  text: string;
  type: 'multiple-choice' | 'short-answer' | 'essay';
  options?: string[];
  correctAnswer?: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const universities: University[] = [];

export const courses: Course[] = [];

export const instructors: Instructor[] = [];

export const topics: Topic[] = [];

export const questions: Question[] = [];

export const performanceData: Record<string, { score: number; attempts: number; lastAttempt: string | null }> = {};

export const bookCorrelation: Record<string, {
  textbook: string;
  chapter: string;
  sections: string[];
  instructorTwist: {
    question: string;
    frequency: string;
    notes: string;
  };
  textbookVersion: string;
  instructorVersion: string;
}> = {};
