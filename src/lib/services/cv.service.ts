import { prisma } from "@/lib/prisma";
import { StructuredCv } from "@/types/cv";

export interface CreateMasterResumeInput {
  title?: string;
  targetRole?: string | null;
  fileName?: string | null;
  rawFileUrl?: string | null;
  rawText?: string | null;
  structuredData: StructuredCv;
  isDefault?: boolean;
  reviewedAt?: Date | null;
}

export interface UpdateMasterResumeInput {
  title?: string;
  targetRole?: string | null;
  structuredData?: StructuredCv;
  reviewedAt?: Date | null;
  isDefault?: boolean;
}

export class CvService {
  /**
   * Retrieves all master resumes belonging to a user, ordered with default first.
   */
  static async getMasterResumes(userId: string) {
    return prisma.masterResume.findMany({
      where: { userId },
      orderBy: [
        { isDefault: "desc" },
        { updatedAt: "desc" },
      ],
    });
  }

  /**
   * Retrieves a specific master resume by ID and owner.
   */
  static async getMasterResumeById(userId: string, id: string) {
    return prisma.masterResume.findFirst({
      where: { id, userId },
    });
  }

  /**
   * Retrieves the user's default active master resume.
   */
  static async getDefaultMasterResume(userId: string) {
    const defaultResume = await prisma.masterResume.findFirst({
      where: { userId, isDefault: true },
    });
    if (defaultResume) return defaultResume;

    // Fallback: return the most recently updated verified resume, or the first resume
    return prisma.masterResume.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  }

  /**
   * Creates a new master resume. If it's the user's first resume, automatically marks it as default.
   */
  static async createMasterResume(userId: string, input: CreateMasterResumeInput) {
    const existingCount = await prisma.masterResume.count({
      where: { userId },
    });

    const isDefault = input.isDefault ?? existingCount === 0;

    if (isDefault && existingCount > 0) {
      // Demote existing default resumes
      await prisma.masterResume.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.masterResume.create({
      data: {
        userId,
        title: input.title || input.fileName || "My Master Resume",
        targetRole: input.targetRole,
        fileName: input.fileName,
        rawFileUrl: input.rawFileUrl,
        rawText: input.rawText,
        structuredData: input.structuredData as any,
        isDefault,
        reviewedAt: input.reviewedAt ?? null,
      },
    });
  }

  /**
   * Updates structured resume data, title, or sets review verification timestamp.
   */
  static async updateMasterResume(userId: string, id: string, input: UpdateMasterResumeInput) {
    const resume = await prisma.masterResume.findFirst({
      where: { id, userId },
    });

    if (!resume) {
      throw new Error("Master resume not found or access denied.");
    }

    if (input.isDefault) {
      await prisma.masterResume.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.masterResume.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.targetRole !== undefined && { targetRole: input.targetRole }),
        ...(input.structuredData !== undefined && { structuredData: input.structuredData as any }),
        ...(input.reviewedAt !== undefined && { reviewedAt: input.reviewedAt }),
        ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
      },
    });
  }

  /**
   * Deletes a master resume and promotes the next available resume to default if needed.
   */
  static async deleteMasterResume(userId: string, id: string) {
    const target = await prisma.masterResume.findFirst({
      where: { id, userId },
    });

    if (!target) {
      throw new Error("Master resume not found.");
    }

    await prisma.masterResume.delete({
      where: { id },
    });

    if (target.isDefault) {
      const nextResume = await prisma.masterResume.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });

      if (nextResume) {
        await prisma.masterResume.update({
          where: { id: nextResume.id },
          data: { isDefault: true },
        });
      }
    }

    return { success: true };
  }

  /**
   * Sets a specific resume as the user's default resume.
   */
  static async setDefaultMasterResume(userId: string, id: string) {
    await prisma.$transaction([
      prisma.masterResume.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      prisma.masterResume.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    return prisma.masterResume.findUnique({
      where: { id },
    });
  }
}
