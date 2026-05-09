# AlphaLo — Knowledge Intelligence Platform for University Students

> AI-powered exam preparation: semantic textbook extraction, instructor-style mock exams, and curated learning resources.

**Live Demo:** [https://alpha-lo.vercel.app](https://alpha-lo.vercel.app)  
---

## Overview

AlphaLo is a Retrieval-Augmented Generation (RAG) platform built to tackle the information overload problem that university students face during exam preparation. Instead of manually scanning hundreds of textbook pages or reverse-engineering instructor patterns from raw past papers, AlphaLo does that work automatically.

The platform was built for NUST SEECS (Batch '28, targeting '29 onwards), but the architecture is intentionally general — any university can plug in its own course catalogue, textbooks, and past papers and get the same benefits.

Two user roles exist: **Admin** (manages catalogue and uploads assets) and **Student** (accesses AI-powered study features).

---

## Core Features

### 1. Semantic Textbook Extraction (Book Patterns)

Given an instructor's past paper, AlphaLo identifies the topic patterns that instructor historically examines, then runs a semantic vector search against the uploaded textbook to surface the most relevant exercises — not by keyword, but by meaning.

**How it works:**
1. Admin uploads the course textbook PDF. LangChain chunks it (~500 tokens per chunk) and upserts embeddings into Pinecone using `text-embedding-ada-002`.
2. Admin uploads a past-paper PDF. GPT-4o extracts a structured list of topic patterns from the paper.
3. For each topic, a semantic query runs against Pinecone. The top-k matching textbook chunks are returned to the student as exercise cards.
4. First call: ~10–15 seconds. Repeat calls: <1 second (Redis cache).

### 2. Instructor-Style Mock Exam Generation

Generates a structurally faithful but entirely rewritten mock exam — same question types, same marks distribution, same topic coverage as the original past paper, but with completely new scenarios and zero word overlap. This avoids copyright issues while still capturing the instructor's examination philosophy.

**Two-phase generation:**
- **Phase 1 — Blueprinting:** GPT-4o parses the past paper and extracts a JSON skeleton (question count, marks, topic tags, question types).
- **Phase 2 — Mutation:** GPT-4o receives the skeleton and generates a brand-new paper that matches every structural parameter but uses entirely original content. Paraphrasing is explicitly prohibited in the prompt.

Students choose **Mid Term** or **Final Term** and receive a clean, printable exam layout.

### 3. Curated Learning Resources

Each course has an associated set of YouTube lecture links stored in MongoDB — either manually curated by admins or AI-suggested based on course topics. Rendered as embedded video cards in the Resources tab. No AI processing at read time, so this tab is always instantly available.

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 18 + TypeScript | Component-based UI with static typing |
| Bootstrap 5 | Responsive 12-column grid system |
| TailwindCSS | Utility-first component-level styling |
| Vite | Build tool and dev server |
| `api.ts` (custom) | Centralised HTTP service layer, handles multi-port routing and auth headers |
| Vercel | Hosting and global CDN |

### Backend — Express Gateway (Node.js, Port 5000)

| Technology | Purpose |
|---|---|
| Node.js + Express | REST API for all CRUD operations |
| Mongoose | ODM for MongoDB Atlas |
| jsonwebtoken | JWT verification middleware |
| Multer | Multipart form-data handling for PDF uploads |
| Axios | Forwards AI requests to FastAPI service |
| Render | Deployment platform |

### Backend — FastAPI Brain (Python, Port 8000)

| Technology | Purpose |
|---|---|
| FastAPI + Python | Async REST API for all AI operations |
| LangChain | LLM chain orchestration, PDF loading, text splitting |
| PyPDFLoader | PDF text extraction |
| RecursiveCharacterTextSplitter | Context-preserving document chunking |
| OpenAI Python SDK | `text-embedding-ada-002` embeddings + GPT-4o generation |
| Pinecone Python Client | Vector upsert and similarity search |
| Redis-py / aioredis | Cache read/write for AI responses |
| Motor (async pymongo) | Async MongoDB reads |
| Render | Deployment platform |

### Databases & External Services

| Service | Role |
|---|---|
| MongoDB Atlas | Structured data — universities, courses, instructors, past-paper text, resources |
| Pinecone | Vector store for textbook embeddings (namespace-per-course isolation) |
| Redis (Upstash) | In-memory cache for AI-generated results |
| Supabase | User auth, JWT issuance, Row-Level Security |
| OpenAI API | Embeddings and generation (GPT-4o) |

---

## System Architecture

AlphaLo uses a **polyglot multi-service design** — each service is implemented in the language best suited for its responsibility:

```
Browser (React)
    │
    ▼
Express Gateway (Node.js :5000)
 ├── MongoDB Atlas  ──── structured metadata
 ├── Supabase JWT validation
 └── Proxy AI requests ──▶ FastAPI Brain (Python :8000)
                               ├── Pinecone  ──── vector search
                               ├── MongoDB   ──── past-paper text
                               ├── Redis     ──── response cache
                               └── OpenAI    ──── embeddings + GPT-4o
```

The Express gateway acts as a secure reverse proxy: it validates Supabase JWTs and adds authentication headers before forwarding AI requests to FastAPI. This keeps the AI service private and the authentication logic centralised.

---

## API Reference

### Student Routes — `/api/student`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/universities` | All universities |
| GET | `/courses/:university_id` | Courses for a university |
| GET | `/instructors/:course_id` | Instructors linked to a course |
| GET | `/course-details/:course_id` | Combined course + university metadata |
| GET | `/roadmap/:course_id` | Week-by-week syllabus topics |
| GET | `/correlation/:topic_id` | Exam patterns for a syllabus topic |
| POST | `/displayexam` | Generate mock exam (proxied to FastAPI) |
| GET | `/book-patterns/:course_id/:topic_name` | RAG-retrieved textbook exercises (proxied to FastAPI) |
| GET | `/resources/:courseId` | YouTube resources for a course |

### Admin Routes — `/api/admin` _(JWT required, Admin role)_

| Method | Endpoint | Description |
|---|---|---|
| POST | `/university` | Create a university |
| POST | `/course` | Create a course |
| POST | `/topic` | Create a syllabus topic |
| POST | `/instructor` | Create an instructor |
| POST | `/upload-textbook/:course_id` | Upload textbook PDF → chunked and indexed in Pinecone |
| POST | `/upload-past-paper/:course_id` | Upload past-paper PDF → text extracted, blueprint stored in MongoDB |
| POST | `/resource` | Add a YouTube resource |

### FastAPI Internal Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/admin/upload-textbook/{course_id}` | PDF → chunk → embed → Pinecone upsert (background task) |
| POST | `/api/admin/upload-past-paper/{course_id}` | PDF → extract → GPT-4o blueprint → MongoDB (background task) |
| POST | `/api/student/displayexam` | Fetch blueprint → Redis cache check → GPT-4o mutation |
| GET | `/api/student/book-patterns/{course_id}/{topic_name}` | Past-paper topic extraction → Pinecone similarity search |
| GET | `/` | Health check |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Accounts/API keys for: OpenAI, Pinecone, MongoDB Atlas, Supabase, Redis (Upstash)

### 1. Clone the Repository

```bash
git clone https://github.com/ZainAbid-1/AlphaLo.git
cd AlphaLo
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_EXPRESS_API_URL=http://localhost:5000
```

```bash
npm run dev
```

### 3. Express Gateway Setup

```bash
cd backend/express
npm install
```

Create a `.env` file:

```env
MONGODB_URI=your_mongodb_atlas_uri
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
FASTAPI_URL=http://localhost:8000
PORT=5000
```

```bash
npm start
```

### 4. FastAPI Brain Setup

```bash
cd backend/fastapi
pip install -r requirements.txt
```

Create a `.env` file:

```env
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=your_index_name
MONGODB_URI=your_mongodb_uri
REDIS_URL=your_redis_url
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

```bash
uvicorn main:app --reload --port 8000
```

---

## Deployment

| Layer | Platform | Trigger |
|---|---|---|
| Frontend | Vercel | Auto-deploy on push to `main` |
| Express Gateway | Render (Node.js Web Service) | Auto-deploy on push to `main` |
| FastAPI Brain | Render (Python Web Service) | Auto-deploy on push to `main` |

All secrets are stored as environment variables in Vercel and Render dashboards — never in source code.

Live URL: [https://alpha-lo.vercel.app](https://alpha-lo.vercel.app)

---

## Non-Functional Highlights

| Area | Detail |
|---|---|
| **Performance** | Redis caching cuts repeat AI response time from ~12–15s to <0.5s. Cache keys are composed of `courseId + instructorId + featureType`. |
| **Security** | All write routes require a valid Supabase JWT. Role claims (admin/student) are validated by Express middleware. All API keys stored as environment variables. |
| **Responsiveness** | Bootstrap 5 grid + TailwindCSS responsive prefixes. Tested from 320px (small mobile) to 1920px (large desktop). |
| **Scalability** | MongoDB Atlas and Pinecone are managed cloud services with horizontal scaling. Express and FastAPI are stateless containers on Render. |
| **Copyright Compliance** | Two-phase mock exam generation (Blueprint + Mutation) ensures zero verbatim content from source past papers. |
| **Availability** | Frontend on Vercel's global CDN. Render services have automatic crash-restart policies. |

---

## Future Work

- Multi-instructor comparative analysis per course
- Study-time tracker with progress analytics
- Expanded resource gallery (notes, multi-paper archives)
- Support for additional departments and universities beyond NUST SEECS

---

## Authors

| Name | Roll Number | Programme |
|---|---|---|
| Abdul Wasay | 504773 | BSAI-1 |
| Zain Abid | 507257 | BSCS-14-D |

---
