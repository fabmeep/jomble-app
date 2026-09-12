# 💼 Jomble: Job Application Tracker & AI Resume Tailor

Jomble is an open-source, modern job application tracker and AI-powered resume tailoring workspace. Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **Prisma**, and a dedicated **FastAPI AI microservice**, Jomble helps software engineers, developers, and tech professionals organize their job search and craft targeted resumes in one unified platform.

---

## 🎯 What Does Jomble Do?

Searching for a job often involves scattered spreadsheets, forgotten application dates, lost recruiter contacts, and the tedious chore of manually tailoring your resume for every single job posting. Jomble solves this end-to-end:

### 1. Complete Job Search CRM & Pipeline Tracking
* **Visual Kanban Board & Table Views**: Drag and drop applications across customizable recruitment stages: *Saved*, *Applied*, *Screening*, *Interview*, *Offer*, *Accepted*, *Rejected*, and *Ghosted*.
* **Smart URL Autofill**: Paste any job posting URL (LinkedIn, Indeed, Glassdoor, Greenhouse, Lever, etc.). Jomble automatically extracts the job title, company name, location, work type (Remote/Hybrid/On-site), salary range, and job description without manual copying and pasting.
* **Recruiter & Contact Management**: Store recruiter names, emails, LinkedIn profiles, and notes directly linked to the specific job application.
* **Chronological Activity Timeline**: Automatically records an audit trail for every status transition, interview note, and recruiter interaction.

### 2. Grounded AI CV Tailoring & Match Scoring
* **Master Resume Management**: Upload your primary CV in PDF or DOCX format once. Jomble parses and structures your entire career history into verified skills, experience bullet points, and education.
* **Deterministic Match Scoring**: Compare your resume against any job description to get an instant 0-100 match score, missing keywords report, and requirement alignment breakdown before you apply.
* **Anti-Hallucination Bullet Tailoring**: Generate targeted, high-impact bullet points customized for the job description. Every bullet is strictly grounded in your actual past accomplishments to prevent fabricated claims.
* **Overleaf & LaTeX Export**: Export your tailored resume directly into clean, ATS-optimized LaTeX code ready for Overleaf compilation or PDF download.
* **Choose Your AI Engine (BYOK or Local)**:
  * **Google Gemini**: Bring Your Own Key (BYOK) for lightning-fast cloud inference (Gemini 2.5 Flash, Gemini 3.7 Flash).
  * **Ollama**: 100% private, zero-cost local inference running on your own machine (e.g. Qwen 2.5, Llama 3).

### 3. Concerns & Custom Red Flags System
* Highlight potential risks before investing time in an interview process.
* Define custom warning badges in Settings (such as "Low Salary", "Micromanagement", or "No Remote Option") and attach them to any application card.

### 4. Advanced Search Analytics
* **Application Velocity**: Track how many jobs you apply to per week over the last 8 weeks.
* **Response & Ghost Rates**: Understand your real interview conversion rates and automatically flag applications that have gone cold after a configurable threshold (e.g. 30 days).
* **Average Response Time**: Measure how long companies take to respond from your application date.
* **Pipeline Funnel**: Visualize where applications drop off in your funnel (Applied ➔ Screening ➔ Interview ➔ Offer).

---

## 🚀 Demo Account

You can explore and test the application with pre-seeded data using these credentials:
* **Email**: `demo@jomble.com`
* **Password**: `password123`

---

## 🛠️ Architecture & Tech Stack

Jomble consists of two services that work together:

```
┌────────────────────────────────────────────────────────┐
│               Jomble Web (Next.js 16)                  │
│   Auth.js v5 • React 19 • Tailwind CSS v4 • Prisma     │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
            ▼                                ▼
┌──────────────────────┐         ┌───────────────────────┐
│ PostgreSQL (Supabase)│         │ FastAPI AI Service    │
│ Users, Apps, Resumes │         │ PDF Extraction & LLM  │
└──────────────────────┘         └───────────────────────┘
```

* **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons, Radix UI, TanStack Table v8.
* **Authentication**: Auth.js v5 (NextAuth) with credentials (bcryptjs) and Google OAuth support.
* **Database**: PostgreSQL with Prisma ORM v6.
* **AI & Document Engine**: Python 3.11, FastAPI, Pypdf, Docx2txt, Google GenAI SDK, Ollama API.

---

## ⚡ Quickstart Guide

### Option A: One-Command Full Stack (Docker Compose)
The easiest way to run the entire stack (Next.js web app + FastAPI backend) is using Docker:

1. Copy the environment configuration:
   ```bash
   cp .env.example .env
   # Add your DATABASE_URL and AUTH_SECRET in .env
   ```

2. Start the full application:
   ```bash
   docker compose up --build
   ```

* Web Application: [http://localhost:3000](http://localhost:3000)
* FastAPI Backend: [http://localhost:8000](http://localhost:8000)
* Interactive API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B: Hybrid Workflow (Recommended for UI Development)
Run the FastAPI backend inside Docker while developing the frontend with local hot-reloading:

```bash
# Terminal 1: Start only the FastAPI container
docker compose up api

# Terminal 2: Run the Next.js dev server with Turbopack
npm run dev
```

Your web app will run at [http://localhost:3000](http://localhost:3000) with instant sub-second hot reloading.

---

## 🌐 Production Deployment (Next.js Only)

If you want to host Jomble on serverless platforms (such as Vercel, Railway, or AWS) without deploying the Python FastAPI backend:

Set this environment variable in your production deployment settings:
```env
NEXT_PUBLIC_ENABLE_CV_TAILOR="false"
```

When set to `"false"`:
* The **CV Tailor** tool and **AI & LLM Engine** tabs are hidden from the interface.
* Direct visits to `/cv-tailor/*` routes automatically redirect to `/dashboard`.
* The Job Application Tracker, Kanban board, notes, contacts, analytics, and URL autofill continue working smoothly on pure serverless Next.js.

---

## 📄 License
This project is open-source.
