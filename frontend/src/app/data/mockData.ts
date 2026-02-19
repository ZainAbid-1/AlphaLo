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

export const universities: University[] = [
  { id: 'mit', name: 'Massachusetts Institute of Technology', logo: 'M' },
  { id: 'stanford', name: 'Stanford University', logo: 'S' },
  { id: 'berkeley', name: 'UC Berkeley', logo: 'B' },
  { id: 'cmu', name: 'Carnegie Mellon University', logo: 'C' },
  { id: 'harvard', name: 'Harvard University', logo: 'H' },
  { id: 'oxford', name: 'University of Oxford', logo: 'O' },
];

export const courses: Course[] = [
  { id: 'cs101', universityId: 'mit', code: 'CS 101', name: 'Introduction to Databases' },
  { id: 'cs201', universityId: 'mit', code: 'CS 201', name: 'Data Structures & Algorithms' },
  { id: 'ee200', universityId: 'mit', code: 'EE 200', name: 'Digital Logic Design' },
  { id: 'cs301', universityId: 'mit', code: 'CS 301', name: 'Operating Systems' },
  { id: 'cs102', universityId: 'stanford', code: 'CS 102', name: 'Database Systems' },
  { id: 'cs202', universityId: 'stanford', code: 'CS 202', name: 'Advanced Algorithms' },
];

export const instructors: Instructor[] = [
  { id: 'inst1', courseId: 'cs101', name: 'Dr. Sarah Mitchell', title: 'Professor of Computer Science', avatar: 'SM' },
  { id: 'inst2', courseId: 'cs101', name: 'Dr. James Chen', title: 'Associate Professor', avatar: 'JC' },
  { id: 'inst3', courseId: 'cs201', name: 'Dr. Emily Rodriguez', title: 'Professor', avatar: 'ER' },
  { id: 'inst4', courseId: 'ee200', name: 'Dr. Michael Thompson', title: 'Senior Lecturer', avatar: 'MT' },
];

export const topics: Topic[] = [
  {
    id: 'topic1',
    phase: 'Midterm 1',
    topic: 'Relational Model & SQL Basics',
    aiPattern: 'Frequently tested by Dr. Mitchell',
    complexity: 'medium',
  },
  {
    id: 'topic2',
    phase: 'Midterm 1',
    topic: 'Entity-Relationship Diagrams',
    aiPattern: 'High Complexity Area',
    complexity: 'high',
  },
  {
    id: 'topic3',
    phase: 'Midterm 1',
    topic: 'Normalization (1NF, 2NF, 3NF)',
    aiPattern: 'Appears in 80% of exams',
    complexity: 'high',
  },
  {
    id: 'topic4',
    phase: 'Midterm 2',
    topic: 'Transaction Management',
    aiPattern: 'Frequently tested by Dr. Mitchell',
    complexity: 'high',
  },
  {
    id: 'topic5',
    phase: 'Midterm 2',
    topic: 'Concurrency Control',
    aiPattern: 'Scenario-based questions common',
    complexity: 'medium',
  },
  {
    id: 'topic6',
    phase: 'Midterm 2',
    topic: 'Query Optimization',
    aiPattern: 'High Complexity Area',
    complexity: 'high',
  },
  {
    id: 'topic7',
    phase: 'Finals',
    topic: 'Database Recovery',
    aiPattern: 'Frequently tested by Dr. Mitchell',
    complexity: 'medium',
  },
  {
    id: 'topic8',
    phase: 'Finals',
    topic: 'NoSQL & Distributed Databases',
    aiPattern: 'Trending Topic - New Addition',
    complexity: 'medium',
  },
  {
    id: 'topic9',
    phase: 'Finals',
    topic: 'Security & Authorization',
    aiPattern: 'Always includes real-world scenario',
    complexity: 'low',
  },
];

export const questions: Question[] = [
  {
    id: 'q1',
    topicId: 'topic1',
    text: 'Which of the following is NOT a property of a relation in the relational model?',
    type: 'multiple-choice',
    options: [
      'Each tuple is unique',
      'The order of tuples matters',
      'Each attribute has a domain',
      'Column values are atomic'
    ],
    correctAnswer: 1,
    difficulty: 'easy',
  },
  {
    id: 'q2',
    topicId: 'topic1',
    text: 'Write a SQL query to find all students who have enrolled in more than 3 courses and have a GPA above 3.5.',
    type: 'short-answer',
    difficulty: 'medium',
  },
  {
    id: 'q3',
    topicId: 'topic4',
    text: 'A banking system processes two concurrent transactions: Transaction A transfers $500 from Account X to Account Y, and Transaction B calculates the total balance of both accounts. Explain what could go wrong without proper transaction isolation, and identify which isolation level would prevent this issue.',
    type: 'essay',
    difficulty: 'hard',
  },
  {
    id: 'q4',
    topicId: 'topic4',
    text: 'What does the ACID property "Isolation" guarantee?',
    type: 'multiple-choice',
    options: [
      'Transactions are processed one at a time',
      'Concurrent transactions do not interfere with each other',
      'Data is never lost after a commit',
      'All operations in a transaction succeed or fail together'
    ],
    correctAnswer: 1,
    difficulty: 'medium',
  },
];

export const performanceData = {
  topic1: { score: 85, attempts: 5, lastAttempt: '2026-02-15' },
  topic2: { score: 72, attempts: 3, lastAttempt: '2026-02-14' },
  topic3: { score: 68, attempts: 4, lastAttempt: '2026-02-13' },
  topic4: { score: 45, attempts: 2, lastAttempt: '2026-02-12' },
  topic5: { score: 78, attempts: 3, lastAttempt: '2026-02-11' },
  topic6: { score: 55, attempts: 2, lastAttempt: '2026-02-10' },
  topic7: { score: 0, attempts: 0, lastAttempt: null },
  topic8: { score: 0, attempts: 0, lastAttempt: null },
  topic9: { score: 0, attempts: 0, lastAttempt: null },
};

export const bookCorrelation = {
  topic4: {
    textbook: 'Database System Concepts (7th Edition)',
    chapter: 'Chapter 14: Transactions',
    sections: ['14.1 Transaction Concept', '14.2 A Simple Transaction Model', '14.3 Storage Structure'],
    instructorTwist: {
      question: 'In a real-world e-commerce scenario, explain how you would handle a situation where multiple users are trying to purchase the last item in stock simultaneously.',
      frequency: '3 out of 5 past papers',
      notes: 'Dr. Mitchell always includes a scenario-based question that goes beyond textbook examples.',
    },
    textbookVersion: 'Explain the ACID properties of transactions.',
    instructorVersion: 'Design a transaction system for an online ticketing platform during a flash sale. Address how you would ensure ACID properties when 10,000 users simultaneously attempt to purchase 100 available tickets.',
  },
};
