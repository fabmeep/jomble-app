import { z } from "zod";

export const contactSchema = z.object({
  jobAppId: z.string().min(1, "Job application ID is required").optional(), // Optional if handled separately by route params
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  role: z.string().max(100, "Role must be at most 100 characters").optional().nullable(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")).nullable(),
  linkedinUrl: z
    .string()
    .url("Invalid LinkedIn URL")
    .refine((val) => !val || val.includes("linkedin.com"), {
      message: "URL must be a valid LinkedIn address",
    })
    .optional()
    .or(z.literal(""))
    .nullable(),
  notes: z.string().max(1000, "Notes must be at most 1000 characters").optional().nullable(),
});

export type ContactInput = z.infer<typeof contactSchema>;
