# 💼 Jomble — Job Application Tracker

Jomble is a sleek, modern, and production-ready job application tracker built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **Prisma**, and **Auth.js v5**. It is designed to help software engineers, developers, and job seekers organize, track, and analyze their job search progress in a central, self-hosted, or cloud-deployed environment.

---

## Key Highlights

*   **📊 Advanced Analytics Dashboard**: Instant insights into your job hunt pipeline:
    *   *Total Applied & Weekly Velocity:* Tracks the numbers of jobs applied to and shows the application velocity chart over the last 8 weeks.
    *   *Response & Ghosted Rates:* Mathematically computed rates based on active, inactive, and silent applications.
    *   *Average Reply Time:* Measures the time lag (in hours/days) between the initial application date and the first response state (Screening, Interview, etc.).
    *   *Pipeline Funnel:* A visual funnel tracking conversion ratios between states (Applied ➔ Screening ➔ Interview ➔ Offer ➔ Accepted).
    *   *Hot Leads:* Dynamic client-side sorting that flags applications with active offers, incoming interviews, and high excitement scores.
*   **⚡ Smart URL Autofill (Scraper)**: Automatically populates application details (Job Title, Company Name, Location, Work Mode, Salary range, and Source) by extracting JSON-LD structured schema blocks and Open Graph metadata directly from job description links (LinkedIn, Glassdoor, Indeed, Greenhouse, Lever, etc.).
*   **🕒 Chronological Activity Timeline**: Generates a timeline event for every status update (`STATUS_CHANGE`), new note (`NOTE_ADDED`), or recruiter context added (`CONTACT_ADDED`), giving you a detailed auditing trail of each job application's progress.
*   **🗂️ Unified Entity Management**: Associate key recruiter contacts (name, email, role, LinkedIn link, custom notes) and multiple markdown-capable notes with any job application.
*   **🔒 Auth.js (NextAuth v5)**: Out-of-the-box Credentials (password hashing with bcryptjs) and Google OAuth login integration using relational PostgreSQL tables, protected routes, and session persistence.

---

## 🛠️ Architecture & Tech Stack

Jomble is built with a modern, type-safe stack designed for reliability, fast load times, and easy hosting.

### Core Stack
*   **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
*   **Database ORM**: [Prisma ORM (v6.x)](https://www.prisma.io/)
*   **Database Engine**: PostgreSQL (Supabase)
*   **Session Management**: [Auth.js v5 (NextAuth)](https://authjs.dev/) with JWT session strategy
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Next Themes](https://github.com/pacocoursey/next-themes)
*   **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) combined with [Zod schemas](https://zod.dev/)
*   **Interactive Components**: [Radix UI](https://www.radix-ui.com/) & [Lucide React](https://lucide.dev/) for premium animations and accessible primitives
*   **Data Presentation**: [TanStack Table v8](https://tanstack.com/table) for tabular views

## 📄 License
This project is open-source

---
*Developed with ❤️ to make job tracking stress-free. Happy hunting!*
