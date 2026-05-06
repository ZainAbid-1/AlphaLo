// --- DATA INTERFACES ---

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
  course_id?: string;
  week_number?: number;
  phase: string;      // This will now represent the "Week"
  topic: string;      // The main content/heading
  aiPattern: string | null; 
  ai_pattern_summary?: string | null;
  complexity: 'low' | 'medium' | 'high' | null;
}

export interface PerformanceData {
  score: number;
  attempts: number;
}

export interface Question {
  id: string;
  topic_id?: string;
  topicId?: string;
  text: string;
  type: 'multiple-choice' | 'short-answer' | 'essay' | 'coding';
  difficulty: 'easy' | 'medium' | 'hard';
  options?: string[];
  correctAnswer?: number | string;
  hint?: string;
  section_title?: string | null;
}

// --- SELECTION DATA ---

export const universities: University[] = [];

export const courses: Course[] = [];

export const instructors: Instructor[] = [];

export const topics: Topic[] = [];

export const questions: Question[] = [];

export const bookCorrelation = {}; 

export const performanceData: Record<string, PerformanceData> = {};