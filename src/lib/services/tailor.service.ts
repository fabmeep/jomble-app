import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { StructuredCv, GroundingBulletResult, TailoredCvStatus, UserResolution } from "@/types/cv";

interface ExperienceBulletItem {
  id?: string;
  text: string;
  [key: string]: unknown;
}

interface ExperienceEntry {
  bullets: ExperienceBulletItem[];
  [key: string]: unknown;
}

interface TailoredCvGeneratedContent {
  experience?: ExperienceEntry[];
  [key: string]: unknown;
}

export interface CreateTailoredCvInput {
  masterResumeId: string;
  jobDescriptionId: string;
  scoreReportId?: string | null;
  jobAppId?: string | null;
  title?: string | null;
  generatedContent: StructuredCv;
  groundingReport: GroundingBulletResult[];
  status?: TailoredCvStatus;
}

export class TailorService {
  /**
   * Retrieves all tailored CVs for a specific user, ordered with newest first.
   */
  static async getTailoredCvs(userId: string) {
    return prisma.tailoredCv.findMany({
      where: { userId },
      include: {
        masterResume: {
          select: { id: true, title: true, fileName: true },
        },
        jobDescription: {
          select: {
            id: true,
            companyName: true,
            jobTitle: true,
            sourceUrl: true,
            structuredRequirements: true,
            jobApplication: {
              select: { id: true, companyName: true, jobTitle: true },
            },
          },
        },
        scoreReport: {
          select: { id: true, overallScore: true, breakdown: true },
        },
        jobApplication: {
          select: { id: true, companyName: true, jobTitle: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  /**
   * Retrieves a single tailored CV by ID, including its parent MasterResume and JobDescription.
   */
  static async getTailoredCvById(userId: string, id: string) {
    return prisma.tailoredCv.findFirst({
      where: { id, userId },
      include: {
        masterResume: true,
        jobDescription: {
          include: {
            jobApplication: true,
          },
        },
        scoreReport: true,
        jobApplication: true,
      },
    });
  }

  /**
   * Creates a new TailoredCv in the database.
   */
  static async createTailoredCv(userId: string, input: CreateTailoredCvInput) {
    return prisma.tailoredCv.create({
      data: {
        userId,
        masterResumeId: input.masterResumeId,
        jobDescriptionId: input.jobDescriptionId,
        scoreReportId: input.scoreReportId || null,
        jobAppId: input.jobAppId || null,
        title: input.title || "Tailored Resume",
        generatedContent: input.generatedContent as unknown as Prisma.InputJsonValue,
        groundingReport: input.groundingReport as unknown as Prisma.InputJsonValue,
        status: input.status || "DRAFT",
      },
      include: {
        masterResume: true,
        jobDescription: true,
      },
    });
  }

  /**
   * Resolves a flagged bullet in the grounding audit and updates generatedContent accordingly.
   */
  static async updateGroundingResolution(
    userId: string,
    tailoredCvId: string,
    bulletId: string,
    resolution: UserResolution
  ) {
    const tailoredCv = await prisma.tailoredCv.findFirst({
      where: { id: tailoredCvId, userId },
      include: { masterResume: true },
    });

    if (!tailoredCv) {
      throw new Error("Tailored CV not found or access denied.");
    }

    const currentReport = (tailoredCv.groundingReport as unknown as GroundingBulletResult[]) || [];
    const currentContent = tailoredCv.generatedContent as unknown as TailoredCvGeneratedContent;

    const targetBulletInfo = currentReport.find(
      (b) => b.id === bulletId || b.source_bullet_id === bulletId
    );

    const updatedReport = currentReport.map((b) => {
      if (b.id === bulletId || b.source_bullet_id === bulletId) {
        return { ...b, user_resolution: resolution };
      }
      return b;
    });

    // If resolution is "approved", ensure bullet in generatedContent has the rewritten text
    if (resolution === "approved" && targetBulletInfo && currentContent?.experience) {
      currentContent.experience = currentContent.experience.map((exp) => ({
        ...exp,
        bullets: exp.bullets.map((b) => {
          if (
            b.id === targetBulletInfo.source_bullet_id ||
            b.text === targetBulletInfo.original_text
          ) {
            return { ...b, text: targetBulletInfo.rewritten_text || b.text };
          }
          return b;
        }),
      }));
    }

    // If resolution is "kept_original", revert bullet in generatedContent to original Master CV text
    if (resolution === "kept_original" && targetBulletInfo && currentContent?.experience) {
      currentContent.experience = currentContent.experience.map((exp) => ({
        ...exp,
        bullets: exp.bullets.map((b) => {
          if (
            b.id === targetBulletInfo.source_bullet_id ||
            b.text === targetBulletInfo.rewritten_text
          ) {
            return { ...b, text: targetBulletInfo.original_text || b.text };
          }
          return b;
        }),
      }));
    }

    // If resolution is "discarded" and bullet found, remove bullet from generatedContent
    if (resolution === "discarded" && targetBulletInfo && currentContent?.experience) {
      currentContent.experience = currentContent.experience.map((exp) => ({
        ...exp,
        bullets: exp.bullets.filter(
          (b) =>
            b.id !== targetBulletInfo.source_bullet_id &&
            b.text !== targetBulletInfo.rewritten_text &&
            b.text !== targetBulletInfo.original_text
        ),
      }));
    }

    // Check if all flagged bullets are now resolved
    const unresolved = updatedReport.filter((b) => b.status === "flagged" && !b.user_resolution);
    const newStatus: TailoredCvStatus = unresolved.length === 0 ? "VERIFIED" : tailoredCv.status;

    return prisma.tailoredCv.update({
      where: { id: tailoredCvId },
      data: {
        groundingReport: updatedReport as unknown as Prisma.InputJsonValue,
        generatedContent: currentContent as unknown as Prisma.InputJsonValue,
        status: newStatus,
      },
    });
  }

  /**
   * Promotes the tailored CV status to VERIFIED or EXPORTED.
   */
  static async updateStatus(userId: string, id: string, status: TailoredCvStatus) {
    const tailoredCv = await prisma.tailoredCv.findFirst({
      where: { id, userId },
    });

    if (!tailoredCv) {
      throw new Error("Tailored CV not found.");
    }

    return prisma.tailoredCv.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Deletes a tailored CV.
   */
  static async deleteTailoredCv(userId: string, id: string) {
    const target = await prisma.tailoredCv.findFirst({
      where: { id, userId },
    });

    if (!target) {
      throw new Error("Tailored CV not found.");
    }

    await prisma.tailoredCv.delete({
      where: { id },
    });

    return { success: true };
  }
}
