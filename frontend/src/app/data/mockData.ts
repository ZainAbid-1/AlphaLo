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

export const questions = []; // Student A will fill this from Gemini later

export const bookCorrelation = {}; // Student B will fill this from ChromaDB/Gemini later

export const performanceData = {};