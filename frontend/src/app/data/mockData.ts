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
  phase: string;      // This will now represent the "Week"
  topic: string;      // The main content/heading
  aiPattern: string | null; 
  complexity: 'low' | 'medium' | 'high' | null;
}

export interface PerformanceData {
  score: number;
  attempts: number;
}

export interface Question {
  id: string;
  topicId: string;
  text: string;
  type: 'multiple-choice' | 'short-answer' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  options?: string[];
  correctAnswer?: number | string;
  hint?: string;
}

// --- SELECTION DATA ---

export const universities: University[] = [
  { id: 'nust-pk', name: 'NUST', logo: 'N' }
];

export const courses: Course[] = [
  { id: 'cs-oop-java', universityId: 'nust-pk', code: 'CS212', name: 'Object Oriented Programming' }
];

export const instructors: Instructor[] = [
  { id: 'inst-jaudat', courseId: 'cs-oop-java', name: 'Mr. Jaudat Mamoon', title: 'Assistant Professor', avatar: 'JM' }
];

// --- THE 17-WEEK ROADMAP (STRICTLY FOLLOWING YOUR IMAGES) ---

export const topics: Topic[] = [
  { id: 'w1', phase: 'Week 1', topic: 'OOP & Java Basics', aiPattern: null, complexity: null },
  { id: 'w2', phase: 'Week 2', topic: 'Functions, Arrays & Strings', aiPattern: null, complexity: null },
  { id: 'w3', phase: 'Week 3', topic: 'Classes and Objects', aiPattern: null, complexity: null },
  { id: 'w4', phase: 'Week 4', topic: 'Encapsulation & Constructors', aiPattern: null, complexity: null },
  { id: 'w5', phase: 'Week 5', topic: 'Inheritance In Java', aiPattern: null, complexity: null },
  { id: 'w6', phase: 'Week 6', topic: 'Overriding & Constructor Chaining', aiPattern: null, complexity: null },
  { id: 'w7', phase: 'Week 7', topic: 'Polymorphism & Dynamic Dispatch', aiPattern: null, complexity: null },
  { id: 'w8', phase: 'Week 8', topic: 'Abstraction & Interfaces', aiPattern: null, complexity: null },
  { id: 'w9', phase: 'Week 9', topic: 'Mid-Semester Break', aiPattern: null, complexity: null },
  { id: 'w10', phase: 'Week 10', topic: 'Composition vs. Inheritance', aiPattern: null, complexity: null },
  { id: 'w11', phase: 'Week 11', topic: 'Object Relationships & UML', aiPattern: null, complexity: null },
  { id: 'w12', phase: 'Week 12', topic: 'Exception Handling', aiPattern: null, complexity: null },
  { id: 'w13', phase: 'Week 13', topic: 'The SOLID Principles', aiPattern: null, complexity: null },
  { id: 'w14', phase: 'Week 14', topic: 'File Handling & Serialization', aiPattern: null, complexity: null },
  { id: 'w15', phase: 'Week 15', topic: 'OOP Case Study - Mini Project', aiPattern: null, complexity: null },
  { id: 'w16', phase: 'Week 16', topic: 'Code Review & Optimization', aiPattern: null, complexity: null },
  { id: 'w17', phase: 'Week 17', topic: 'Project Presentations', aiPattern: null, complexity: null }
];

// --- FEATURE PLACEHOLDERS ---

export const questions: Question[] = [
  // Week 1 - OOP & Java Basics
  {
    id: 'q1-1',
    topicId: 'w1',
    text: 'What does OOP stand for?',
    type: 'multiple-choice',
    difficulty: 'easy',
    options: ['Object Oriented Programming', 'Object Oriented Protocol', 'Organized Object Pattern', 'Online Object Program'],
    correctAnswer: 0,
    hint: 'Hint: It is a programming paradigm...'
  },
  {
    id: 'q1-2',
    topicId: 'w1',
    text: 'Explain the concept of encapsulation in your own words.',
    type: 'short-answer',
    difficulty: 'medium',
    hint: 'Think about hiding internal details...'
  },
  // Week 2 - Functions, Arrays & Strings
  {
    id: 'q2-1',
    topicId: 'w2',
    text: 'What is the time complexity of accessing an array element by index?',
    type: 'multiple-choice',
    difficulty: 'easy',
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
    correctAnswer: 0
  },
  {
    id: 'q2-2',
    topicId: 'w2',
    text: 'Write a function to reverse a string in Java.',
    type: 'essay',
    difficulty: 'medium',
    hint: 'You can use StringBuilder or recursion...'
  },
  // Week 3 - Classes and Objects
  {
    id: 'q3-1',
    topicId: 'w3',
    text: 'What is the difference between a class and an object?',
    type: 'short-answer',
    difficulty: 'easy',
    hint: 'A class is a blueprint...'
  },
  // Week 4 - Encapsulation & Constructors
  {
    id: 'q4-1',
    topicId: 'w4',
    text: 'What is the purpose of a constructor?',
    type: 'multiple-choice',
    difficulty: 'easy',
    options: ['To initialize object state', 'To destroy objects', 'To return values', 'To define methods'],
    correctAnswer: 0
  },
  // Week 5 - Inheritance In Java
  {
    id: 'q5-1',
    topicId: 'w5',
    text: 'Which keyword is used for inheritance in Java?',
    type: 'multiple-choice',
    difficulty: 'easy',
    options: ['extends', 'implements', 'inherits', 'super'],
    correctAnswer: 0
  },
  // Add more questions for other weeks...
  {
    id: 'q6-1',
    topicId: 'w6',
    text: 'What is method overriding?',
    type: 'short-answer',
    difficulty: 'medium'
  },
  {
    id: 'q7-1',
    topicId: 'w7',
    text: 'Explain polymorphism with an example.',
    type: 'essay',
    difficulty: 'hard'
  },
  {
    id: 'q8-1',
    topicId: 'w8',
    text: 'What is an interface in Java?',
    type: 'multiple-choice',
    difficulty: 'medium',
    options: ['A contract for classes', 'A type of class', 'A loop structure', 'A variable type'],
    correctAnswer: 0
  }
];

export const bookCorrelation = {}; // Student B will fill this from ChromaDB/Gemini later

export const performanceData: Record<string, PerformanceData> = {
  'w1': { score: 85, attempts: 5 },
  'w2': { score: 78, attempts: 4 },
  'w3': { score: 92, attempts: 6 },
  'w4': { score: 65, attempts: 3 },
  'w5': { score: 88, attempts: 5 },
  'w6': { score: 75, attempts: 4 },
  'w7': { score: 82, attempts: 5 },
  'w8': { score: 70, attempts: 3 },
  'w9': { score: 0, attempts: 0 },
  'w10': { score: 80, attempts: 4 },
  'w11': { score: 72, attempts: 3 },
  'w12': { score: 68, attempts: 2 },
  'w13': { score: 0, attempts: 0 },
  'w14': { score: 0, attempts: 0 },
  'w15': { score: 0, attempts: 0 },
  'w16': { score: 0, attempts: 0 },
  'w17': { score: 0, attempts: 0 }
};