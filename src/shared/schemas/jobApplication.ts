import { z } from "zod";

export const JobSourceEnum = z.enum([
  "LINKEDIN",
  "DEALLS",
  "KALIBRR",
  "INDEED",
  "GLASSDOOR",
  "COMPANY_WEBSITE",
  "REFERRAL",
  "RECRUITER",
  "JOB_FAIR",
  "GITHUB_JOBS",
  "OTHER",
]);

export const WorkModeEnum = z.enum(["REMOTE", "HYBRID", "ON_SITE"]);

export const ApplicationStatusEnum = z.enum([
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "GHOSTED",
]);

export const jobApplicationSchema = z
  .object({
    companyName: z
      .string()
      .min(1, "Company name is required")
      .max(100, "Company name must be at most 100 characters"),
    jobTitle: z
      .string()
      .min(1, "Job title is required")
      .max(100, "Job title must be at most 100 characters"),
    location: z
      .string()
      .max(100, "Location must be at most 100 characters")
      .optional()
      .nullable()
      .or(z.literal("")),
    jobUrl: z
      .string()
      .url("Invalid URL format")
      .optional()
      .nullable()
      .or(z.literal("")),
    source: JobSourceEnum.default("OTHER"),
    workMode: WorkModeEnum.default("ON_SITE"),
    salaryMin: z
      .coerce
      .number()
      .int()
      .nonnegative("Salary must be a non-negative number")
      .optional()
      .nullable(),
    salaryMax: z
      .coerce
      .number()
      .int()
      .nonnegative("Salary must be a non-negative number")
      .optional()
      .nullable(),
    currency: z.string().max(10).default("IDR"),
    excitementScore: z
      .coerce
      .number()
      .int()
      .min(1, "Excitement score must be at least 1")
      .max(5, "Excitement score must be at most 5")
      .optional()
      .nullable(),
    status: ApplicationStatusEnum.default("APPLIED"),
    appliedAt: z
      .coerce
      .date()
      .optional()
      .default(() => new Date()),

    // Optional field to capture application notes during creation
    notes: z
      .string()
      .max(2000, "Notes must be at most 2000 characters")
      .optional()
      .nullable()
      .or(z.literal("")),

    contacts: z.array(
      z.object({
        name: z.string().optional().or(z.literal("")),
        role: z.string().nullable().optional(),
        email: z.string().email().nullable().or(z.literal("")).optional(),
        linkedinUrl: z.string().url().nullable().or(z.literal("")).optional(),
        notes: z.string().nullable().optional(),
      }).superRefine((val, ctx) => {
        const hasAnyField = (val.role && val.role.trim() !== "") ||
                            (val.email && val.email.trim() !== "") ||
                            (val.linkedinUrl && val.linkedinUrl.trim() !== "") ||
                            (val.notes && val.notes.trim() !== "");
        const hasName = val.name && val.name.trim() !== "";
        if (hasAnyField && !hasName) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Contact name is required if other fields are filled",
            path: ["name"],
          });
        }
      })
    ).optional(),
    redFlags: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.salaryMin !== undefined && data.salaryMin !== null && data.salaryMax !== undefined && data.salaryMax !== null) {
        return data.salaryMax >= data.salaryMin;
      }
      return true;
    },
    {
      message: "Maximum salary must be greater than or equal to minimum salary",
      path: ["salaryMax"],
    }
  );

export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
