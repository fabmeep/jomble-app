import { prisma } from "@/lib/prisma";
import { jobApplicationSchema } from "@/shared/schemas/jobApplication";

export class ApplicationsService {
  /**
   * Get all job applications for a specific user.
   */
  static async getUserApplications(userId: string) {
    return prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { lastActivityAt: "desc" },
      include: {
        notes: true,
        contacts: true,
        redFlags: {
          include: {
            redFlag: true,
          },
        },
      },
    });
  }

  /**
   * Get a single job application by ID for a specific user.
   */
  static async getApplicationById(id: string, userId: string) {
    return prisma.jobApplication.findFirst({
      where: { id, userId },
      include: {
        notes: {
          orderBy: { createdAt: "desc" },
        },
        contacts: {
          orderBy: { createdAt: "asc" },
        },
        timelineEvents: {
          orderBy: { occurredAt: "asc" },
        },
        redFlags: {
          include: {
            redFlag: true,
          },
        },
      },
    });
  }

  /**
   * Create a new job application with transactional creation of relations and timeline events.
   */
  static async createApplication(userId: string, input: unknown) {
    const validatedData = jobApplicationSchema.parse(input);
    const { notes, contacts, redFlags, jobDescription, ...applicationData } = validatedData;

    return prisma.jobApplication.create({
      data: {
        userId,
        ...applicationData,
        isOutsource: applicationData.isOutsource ?? false,
        agencyName: applicationData.isOutsource && applicationData.agencyName ? applicationData.agencyName.trim() : null,
        benefits: applicationData.benefits || [],
        salaryMin: applicationData.salaryMin ?? null,
        salaryMax: applicationData.salaryMax ?? null,
        excitementScore: applicationData.excitementScore ?? 3,
        ...(notes && notes.trim().length > 0
          ? { notes: { create: { content: notes.trim() } } }
          : {}),
        ...(redFlags && redFlags.length > 0
          ? {
              redFlags: {
                create: redFlags.map((flagId: string) => ({ flagId })),
              },
            }
          : {}),
        ...(jobDescription && jobDescription.trim().length > 0
          ? {
              jobDescriptions: {
                create: {
                  userId,
                  companyName: applicationData.companyName,
                  jobTitle: applicationData.jobTitle,
                  sourceUrl: applicationData.jobUrl || null,
                  rawText: jobDescription.trim(),
                  scrapeMethod: "MANUAL_PASTE",
                },
              },
            }
          : {}),
        ...(contacts && contacts.length > 0
          ? {
              contacts: {
                create: contacts
                  .filter((c) => c.name && c.name.trim().length > 0)
                  .map((c) => ({
                    name: c.name!.trim(),
                    role: c.role?.trim() || null,
                    email: c.email?.trim() || null,
                    linkedinUrl: c.linkedinUrl?.trim() || null,
                    notes: c.notes?.trim() || null,
                  })),
              },
            }
          : {}),
        timelineEvents: {
          create: [
            {
              eventType: "STATUS_CHANGE",
              newStatus: applicationData.status,
              description: "Created application",
              occurredAt: new Date(),
            },
            ...(notes && notes.trim().length > 0
              ? [
                  {
                    eventType: "NOTE_ADDED" as const,
                    description:
                      notes.trim().length > 60
                        ? notes.trim().substring(0, 57) + "..."
                        : notes.trim(),
                    occurredAt: new Date(),
                  },
                ]
              : []),
            ...(contacts && contacts.length > 0
              ? contacts
                  .filter((c) => c.name && c.name.trim().length > 0)
                  .map((c) => ({
                    eventType: "CONTACT_ADDED" as const,
                    description: `${c.name}${c.role ? `, ${c.role}` : ""}`,
                    occurredAt: new Date(),
                  }))
              : []),
          ],
        },
      },
    });
  }

  /**
   * Update an existing job application cleanly using Prisma transaction.
   */
  static async updateApplication(id: string, userId: string, input: unknown) {
    // 1. Verify ownership
    const currentApp = await prisma.jobApplication.findFirst({
      where: { id, userId },
      select: { status: true },
    });

    if (!currentApp) {
      return null;
    }

    // 2. Validate input
    const validatedData = jobApplicationSchema.parse(input);
    const { notes, contacts, redFlags, jobDescription, ...applicationData } = validatedData;

    return prisma.$transaction(async (tx) => {
      // Create status change timeline event if status changed
      const statusChanged =
        applicationData.status && currentApp.status !== applicationData.status;

      const updatedApplication = await tx.jobApplication.update({
        where: { id },
        data: {
          ...applicationData,
          isOutsource: applicationData.isOutsource ?? false,
          agencyName: applicationData.isOutsource && applicationData.agencyName ? applicationData.agencyName.trim() : null,
          benefits: applicationData.benefits || [],
          salaryMin: applicationData.salaryMin ?? null,
          salaryMax: applicationData.salaryMax ?? null,
          lastActivityAt: new Date(),
          ...(statusChanged
            ? {
                timelineEvents: {
                  create: {
                    eventType: "STATUS_CHANGE",
                    oldStatus: currentApp.status,
                    newStatus: applicationData.status,
                    occurredAt: new Date(),
                  },
                },
              }
            : {}),
        },
      });

      // Sync notes
      if (notes !== undefined) {
        const firstNote = await tx.note.findFirst({
          where: { jobAppId: id },
          orderBy: { createdAt: "asc" },
        });

        if (firstNote) {
          if (!notes || notes.trim() === "") {
            await tx.note.delete({ where: { id: firstNote.id } });
          } else {
            await tx.note.update({
              where: { id: firstNote.id },
              data: { content: notes.trim() },
            });
          }
        } else if (notes && notes.trim() !== "") {
          await tx.note.create({
            data: { jobAppId: id, content: notes.trim() },
          });
          await tx.timelineEvent.create({
            data: {
              jobAppId: id,
              eventType: "NOTE_ADDED",
              description:
                notes.trim().length > 60
                  ? notes.trim().substring(0, 57) + "..."
                  : notes.trim(),
              occurredAt: new Date(),
            },
          });
        }
      }

      // Sync contacts
      if (contacts !== undefined) {
        await tx.contact.deleteMany({ where: { jobAppId: id } });
        const validContacts = contacts.filter(
          (c) => c.name && c.name.trim().length > 0
        );
        if (validContacts.length > 0) {
          await tx.contact.createMany({
            data: validContacts.map((c) => ({
              jobAppId: id,
              name: c.name!.trim(),
              role: c.role?.trim() || null,
              email: c.email?.trim() || null,
              linkedinUrl: c.linkedinUrl?.trim() || null,
              notes: c.notes?.trim() || null,
            })),
          });
        }
      }

      // Sync red flags
      if (redFlags !== undefined) {
        await tx.jobApplicationRedFlag.deleteMany({ where: { jobAppId: id } });
        if (redFlags.length > 0) {
          await tx.jobApplicationRedFlag.createMany({
            data: redFlags.map((flagId: string) => ({
              jobAppId: id,
              flagId,
            })),
          });
        }
      }

      // Sync job description
      if (jobDescription !== undefined) {
        const existingJd = await tx.jobDescription.findFirst({
          where: { jobAppId: id },
          orderBy: { createdAt: "desc" },
        });

        if (existingJd) {
          if (jobDescription && jobDescription.trim().length > 0) {
            await tx.jobDescription.update({
              where: { id: existingJd.id },
              data: {
                rawText: jobDescription.trim(),
                companyName: applicationData.companyName,
                jobTitle: applicationData.jobTitle,
                sourceUrl: applicationData.jobUrl || null,
              },
            });
          } else {
            await tx.jobDescription.delete({ where: { id: existingJd.id } });
          }
        } else if (jobDescription && jobDescription.trim().length > 0) {
          await tx.jobDescription.create({
            data: {
              userId,
              jobAppId: id,
              companyName: applicationData.companyName,
              jobTitle: applicationData.jobTitle,
              sourceUrl: applicationData.jobUrl || null,
              rawText: jobDescription.trim(),
              scrapeMethod: "MANUAL_PASTE",
            },
          });
        }
      }

      return updatedApplication;
    });
  }

  /**
   * Delete a job application by ID for a specific user.
   */
  static async deleteApplication(id: string, userId: string) {
    const currentApp = await prisma.jobApplication.findFirst({
      where: { id, userId },
    });

    if (!currentApp) {
      return null;
    }

    return prisma.jobApplication.delete({
      where: { id },
    });
  }
}
