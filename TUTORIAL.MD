# Jomble: Developer Setup & Tutorial Guide

This guide walks you through setting up, configuring, and running Jomble on your local machine or preparing it for production.

---

## 🧭 Application Overview

Jomble combines two key workspaces into one cohesive web platform:

1. **Job Application CRM**:
   A visual Kanban pipeline and table tracker to manage all your active job applications, recruiter contacts, interview timelines, and custom red flags.
2. **AI CV Tailor**:
   An intelligent resume companion that extracts requirements from job descriptions, computes match scores, and tailors your resume bullets based strictly on your verified career history.

### Service Architecture

* **Frontend (Next.js 16 + React 19)**: Serves the web dashboard, manages user authentication (Auth.js v5), and interfaces with PostgreSQL via Prisma ORM. Runs on port `3000`.
* **Backend (FastAPI + Python 3.11)**: Handles PDF/DOCX parsing, web scraping, and LLM inference (Google Gemini or Ollama). Runs on port `8000`.

---

## 🔑 Initial Environment Setup

Before starting either service, configure your environment variables:

1. Copy the sample environment file:
   ```powershell
   cp .env.example .env
   ```

2. Open `.env` and fill in your values:
   * `DATABASE_URL`: Your PostgreSQL connection string (such as Supabase or Neon).
   * `AUTH_SECRET`: A secure random string for Auth.js sessions (generate one using `openssl rand -base64 33` or `npx auth secret`).
   * `NEXT_PUBLIC_SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: (Optional) Required if you wish to store raw PDF uploads in Supabase Storage.
   * `GEMINI_API_KEY`: (Optional) Required if you select Google Gemini as your LLM provider.

3. Run Prisma client generation:
   ```powershell
   npx prisma generate
   ```

---

## 🚀 Running the Application

Choose the workflow that matches your development needs:

### Option 1: Docker Compose (Full Stack in One Command) 🐳
Best if you want to run everything with a single command without installing Python dependencies on Windows.

1. Make sure **Docker Desktop** is running.
2. Start both containers:
   ```powershell
   docker compose up --build
   ```
   Or run in detached background mode:
   ```powershell
   docker compose up -d --build
   ```

* Web Application: [http://localhost:3000](http://localhost:3000)
* FastAPI Backend: [http://localhost:8000](http://localhost:8000)
* Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

To stop the containers:
```powershell
docker compose down
```

---

### Option 2: Hybrid Workflow (Recommended for UI Development) ⚡
Best for working on frontend components. This runs the Python backend inside Docker and the Next.js frontend directly on your computer with instant Turbopack Hot Module Reloading (HMR).

```powershell
# Terminal 1: Start only the FastAPI container
docker compose up api

# Terminal 2: Run Next.js locally on your host machine
npm run dev
```

Whenever you save any `.tsx` or `.css` file, changes reflect immediately in your browser without reloading.

---

### Option 3: Manual Local Development (Without Docker) 💻
Best if you prefer running Python directly on your system.

#### Step 1: Start the FastAPI Backend
```powershell
# 1. Navigate to the backend folder
cd backend

# 2. Create and activate a Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Start the FastAPI development server
python -m uvicorn app.main:app --reload --port 8000
```

#### Step 2: Start Next.js (in a separate terminal)
```powershell
# 1. From the root directory, install Node dependencies (first time only)
npm install

# 2. Start the Next.js development server
npm run dev
```

---

### Option 4: Production Deployment Without FastAPI 🌐
If you plan to deploy your Next.js application to a serverless platform (such as Vercel, Railway, or Netlify) and do not wish to host the Python FastAPI backend:

1. Add the following environment variable to your production project settings:
   ```env
   NEXT_PUBLIC_ENABLE_CV_TAILOR="false"
   ```
2. When this variable is `"false"`:
   * The **CV Tailor** and **AI & LLM Engine** tabs are automatically hidden from the sidebar and settings.
   * Direct route access to `/cv-tailor/*` is safely redirected to `/dashboard`.
   * Job application tracking, Kanban boards, contacts, red flags, and URL autofill continue working seamlessly on pure serverless Next.js.

---

## 🧪 Testing Accounts & Verification

* **Demo Account Login**:
  * Email: `demo@jomble.com`
  * Password: `password123`
* **Configuring Your AI Engine**:
  * Navigate to **Settings > AI & LLM Engine** to choose between Google Gemini (cloud inference via your API key) or Ollama (local inference).
  * Use the **Test Connection** button to verify connectivity before tailoring resumes.