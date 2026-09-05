import {
  CvMaster,
  LlmProviderConfig,
  TailoredCv,
  JobDescription,
} from "@/types/cv"

export const MOCK_LLM_CONFIG: LlmProviderConfig = {
  id: "cfg_1",
  userId: "user_1",
  provider: "OLLAMA",
  ollamaBaseUrl: "http://localhost:11434",
  ollamaModel: "qwen3:4b",
  geminiApiKeyEncrypted: "",
  geminiModel: "gemini-2.5-flash-lite",
  isActive: true,
  lastTestedAt: new Date().toISOString(),
  lastTestOk: true,
}

export const MOCK_MASTER_CV: CvMaster = {
  id: "cv_master_1",
  userId: "user_1",
  title: "Fabian Master CV 2026",
  targetRole: "Full Stack Software Engineer",
  rawFileUrl: "/uploads/fabian_resume_master.pdf",
  fileName: "Fabian_Master_CV_2026.pdf",
  fileSize: "245 KB",
  isDefault: true,
  reviewedAt: "2026-08-10T10:00:00.000Z",
  createdAt: "2026-08-10T09:30:00.000Z",
  updatedAt: "2026-08-10T10:00:00.000Z",
  structuredData: {
    contact: {
      name: "Fabian Rosihan",
      email: "fabian@example.com",
      phone: "+62 812-3456-7890",
      location: "Jakarta, Indonesia",
      linkedin: "linkedin.com/in/fabianrosihan",
      github: "github.com/fabianrosihan",
      website: "fabianrosihan.dev",
    },
    summary:
      "Results-driven Senior Full-Stack Engineer with 5+ years of experience crafting scalable web applications using React, Next.js, Node.js, and Python. Passionate about AI integrations, clean architecture, performance optimization, and developer tooling.",
    experience: [
      {
        id: "exp_1",
        company: "TechNova Solutions",
        title: "Senior Software Engineer",
        dates: "2023 - Present",
        location: "Jakarta, ID",
        bullets: [
          {
            id: "b_101",
            text: "Architected micro-frontend architecture using Next.js 15 App Router, improving initial page loads by 42% across 150k active monthly users.",
          },
          {
            id: "b_102",
            text: "Spearheaded integration of LLM-assisted workflows and vector database retrieval (RAG) using FastAPI and Python services.",
          },
          {
            id: "b_103",
            text: "Mentored 4 junior engineers and implemented strict CI/CD quality gates using Playwright E2E testing and GitHub Actions.",
          },
          {
            id: "b_104",
            text: "Optimized SQL queries and Prisma ORM indexing in PostgreSQL, reducing p95 database response latency from 450ms to 65ms.",
          },
        ],
      },
      {
        id: "exp_2",
        company: "PixelCraft Digital",
        title: "Full-Stack Developer",
        dates: "2021 - 2023",
        location: "Bandung, ID",
        bullets: [
          {
            id: "b_201",
            text: "Engineered responsive dashboard interfaces using TypeScript, TailwindCSS, and React Query for enterprise SaaS clients.",
          },
          {
            id: "b_202",
            text: "Built real-time web socket channels for live collaboration metrics, reducing websocket payload overhead by 30%.",
          },
          {
            id: "b_203",
            text: "Collaborated with UX product designers to build a accessible Design System with WCAG 2.1 AA compliance.",
          },
        ],
      },
    ],
    education: [
      {
        id: "edu_1",
        institution: "Institut Teknologi Bandung (ITB)",
        degree: "B.S. in Computer Science",
        dates: "2017 - 2021",
        details: "GPA 3.82 / 4.00. Focus on Distributed Systems & Artificial Intelligence.",
      },
    ],
    skills: [
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "Python",
      "FastAPI",
      "PostgreSQL",
      "Prisma",
      "Docker",
      "TailwindCSS",
      "GraphQL",
      "REST APIs",
      "Redis",
      "Jest / Vitest",
      "Git",
    ],
    projects: [
      {
        id: "proj_1",
        name: "Jomble Job Application Tracker",
        description:
          "Full-featured job tracker and CV tailor app built with Next.js 15, Prisma, and AI pipelines.",
        technologies: ["Next.js", "TypeScript", "Prisma", "TailwindCSS"],
        link: "https://github.com/fabianrosihan/jomble-app",
      },
    ],
    certifications: [
      "AWS Certified Solutions Architect – Associate",
      "Meta Professional Frontend Developer",
    ],
  },
}

export const MOCK_JOB_DESCRIPTIONS: JobDescription[] = [
  {
    id: "jd_1",
    userId: "user_1",
    sourceUrl: "https://careers.shopee.com/job-detail/12345",
    rawText: `We are looking for a Senior Frontend Engineer at Shopee. 
    Requirements:
    - 4+ years of React / Next.js experience with TypeScript
    - Strong performance optimization capabilities (p95 latency, Core Web Vitals)
    - Experience in Micro-frontends & modern design systems
    - Experience with GraphQL, REST APIs, and state management (Zustand/Redux)
    - Knowledge of WebSockets and real-time frontend streaming
    - Great mentoring and leadership skills`,
    scrapeMethod: "URL_SCRAPE",
    createdAt: "2026-08-11T12:00:00.000Z",
    structuredRequirements: {
      companyName: "Shopee",
      jobTitle: "Senior Frontend Engineer",
      required_skills: [
        "React",
        "Next.js",
        "TypeScript",
        "Performance Optimization",
        "Design Systems",
      ],
      preferred_skills: ["Micro-frontends", "GraphQL", "WebSockets", "Zustand"],
      responsibilities: [
        "Architect and maintain high-performing frontend web applications",
        "Collaborate with backend engineers on API contracts and WebSocket protocols",
        "Lead technical reviews and mentor junior developers",
      ],
      keywords: ["Core Web Vitals", "State Management", "CI/CD", "SaaS"],
      seniority: "Senior",
      employment_type: "Full-time",
    },
  },
]

export const MOCK_TAILORED_CVS: TailoredCv[] = [
  {
    id: "tailored_1",
    userId: "user_1",
    cvMasterId: "cv_master_1",
    jobDescriptionId: "jd_1",
    scoreReportId: "score_1",
    jobTitle: "Senior Frontend Engineer",
    companyName: "Shopee",
    status: "DRAFT",
    createdAt: "2026-08-11T14:20:00.000Z",
    updatedAt: "2026-08-11T14:20:00.000Z",
    generatedContent: {
      contact: MOCK_MASTER_CV.structuredData.contact,
      summary:
        "Senior Frontend Specialist with 5+ years of experience building high-scale Web applications in React, Next.js, and TypeScript. Proven track record in micro-frontend architectures, p95 performance optimization, and responsive design systems.",
      experience: [
        {
          id: "exp_1",
          company: "TechNova Solutions",
          title: "Senior Software Engineer (Frontend Lead)",
          dates: "2023 - Present",
          location: "Jakarta, ID",
          bullets: [
            {
              id: "b_101",
              text: "Architected micro-frontend architecture using Next.js 15 App Router, boosting page load speeds by 42% for 150k monthly active users.",
            },
            {
              id: "b_104",
              text: "Engineered database query optimizations and caching strategies, reducing p95 latency from 450ms to 65ms.",
            },
            {
              id: "b_103",
              text: "Mentored 4 junior engineers and instituted rigorous E2E test suites with Playwright across production releases.",
            },
          ],
        },
        {
          id: "exp_2",
          company: "PixelCraft Digital",
          title: "Full-Stack Developer",
          dates: "2021 - 2023",
          location: "Bandung, ID",
          bullets: [
            {
              id: "b_201",
              text: "Engineered high-performance dashboard web interfaces using TypeScript, TailwindCSS, and React Query for enterprise SaaS products.",
            },
            {
              id: "b_202",
              text: "Developed low-latency WebSocket connection modules for live metrics tracking, reducing stream payload overhead by 30%.",
            },
            {
              id: "b_203",
              text: "Co-authored an accessible design system component library achieving full WCAG 2.1 AA accessibility compliance.",
            },
          ],
        },
      ],
      education: MOCK_MASTER_CV.structuredData.education,
      skills: [
        "React",
        "Next.js",
        "TypeScript",
        "TailwindCSS",
        "Performance Optimization",
        "Design Systems",
        "WebSockets",
        "GraphQL",
        "REST APIs",
        "Node.js",
        "Python",
        "Docker",
      ],
      projects: MOCK_MASTER_CV.structuredData.projects,
      certifications: MOCK_MASTER_CV.structuredData.certifications,
    },
    groundingReport: [
      {
        id: "g_1",
        source_bullet_id: "b_101",
        original_text:
          "Architected micro-frontend architecture using Next.js 15 App Router, improving initial page loads by 42% across 150k active monthly users.",
        rewritten_text:
          "Architected micro-frontend architecture using Next.js 15 App Router, boosting page load speeds by 42% for 150k monthly active users.",
        target_experience_id: "exp_1",
        similarity_score: 0.94,
        status: "pass",
        user_resolution: "approved",
      },
      {
        id: "g_2",
        source_bullet_id: "b_102",
        original_text:
          "Spearheaded integration of LLM-assisted workflows and vector database retrieval (RAG) using FastAPI and Python services.",
        rewritten_text:
          "Directed LLM artificial intelligence capabilities and vector search pipelines using Python microservices.",
        target_experience_id: "exp_1",
        similarity_score: 0.68,
        status: "flagged",
      },
      {
        id: "g_3",
        source_bullet_id: "b_202",
        original_text:
          "Built real-time web socket channels for live collaboration metrics, reducing websocket payload overhead by 30%.",
        rewritten_text:
          "Developed low-latency WebSocket connection modules for live metrics tracking, reducing stream payload overhead by 30%.",
        target_experience_id: "exp_2",
        similarity_score: 0.88,
        status: "pass",
        user_resolution: "approved",
      },
      {
        id: "g_4",
        source_bullet_id: "b_104",
        original_text:
          "Optimized SQL queries and Prisma ORM indexing in PostgreSQL, reducing p95 database response latency from 450ms to 65ms.",
        rewritten_text:
          "Optimized database performance to achieve high-throughput response speeds.",
        target_experience_id: "exp_1",
        similarity_score: 0.61,
        status: "flagged",
      },
    ],
  },
]
