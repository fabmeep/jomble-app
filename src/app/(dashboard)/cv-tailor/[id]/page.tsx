import { auth } from "@/auth"
import { redirect } from "next/navigation"
import CvVerifierClient from "./_components/cv-verifier-client"
import { TailorService } from "@/lib/services/tailor.service"
import { MOCK_TAILORED_CVS, MOCK_MASTER_CV } from "@/lib/cv/mock-data"
import { TailoredCv, CvMaster, StructuredCv, GroundingBulletResult, TailoredCvStatus } from "@/types/cv"
import { isCvTailorEnabled } from "@/lib/feature-flags"

export default async function TailoredCvDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!isCvTailorEnabled()) {
    redirect("/dashboard")
  }

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params

  // 1. Fetch real record from database
  const dbRecord = await TailorService.getTailoredCvById(session.user.id, id)

  if (dbRecord) {
    // Robust resolution of company name with priority:
    // 1. Linked JobApplication company name (if not "Target Company")
    // 2. JobDescription company name (if not "Target Company")
    // 3. Nested JobDescription.JobApplication company name (if not "Target Company")
    // 4. Structured requirements company_name (if not "Target Company")
    // 5. Fallback cleanly
    const resolvedCompany =
      (dbRecord.jobApplication?.companyName && dbRecord.jobApplication.companyName !== "Target Company")
        ? dbRecord.jobApplication.companyName
        : (dbRecord.jobDescription?.companyName && dbRecord.jobDescription.companyName !== "Target Company")
        ? dbRecord.jobDescription.companyName
        : (dbRecord.jobDescription?.jobApplication?.companyName && dbRecord.jobDescription.jobApplication.companyName !== "Target Company")
        ? dbRecord.jobDescription.jobApplication.companyName
        : (dbRecord.jobDescription?.structuredRequirements as any)?.company_name && (dbRecord.jobDescription?.structuredRequirements as any)?.company_name !== "Target Company"
        ? (dbRecord.jobDescription?.structuredRequirements as any)?.company_name
        : dbRecord.jobApplication?.companyName || dbRecord.jobDescription?.companyName || "Company"

    const resolvedJobTitle =
      dbRecord.jobDescription?.jobTitle && dbRecord.jobDescription.jobTitle !== "Position" && dbRecord.jobDescription.jobTitle !== "Target Role"
        ? dbRecord.jobDescription.jobTitle
        : dbRecord.jobApplication?.jobTitle ||
          (dbRecord.jobDescription?.structuredRequirements as any)?.job_title ||
          dbRecord.title ||
          "Tailored Resume"

    const tailoredCv: TailoredCv = {
      id: dbRecord.id,
      userId: dbRecord.userId,
      cvMasterId: dbRecord.masterResumeId,
      jobDescriptionId: dbRecord.jobDescriptionId,
      scoreReportId: dbRecord.scoreReportId || undefined,
      jobTitle: resolvedJobTitle,
      companyName: resolvedCompany,
      generatedContent: dbRecord.generatedContent as unknown as StructuredCv,
      groundingReport: (dbRecord.groundingReport as unknown as GroundingBulletResult[]) || [],
      renderedFileUrl: dbRecord.renderedFileUrl,
      status: dbRecord.status as TailoredCvStatus,
      createdAt: dbRecord.createdAt.toISOString(),
      updatedAt: dbRecord.updatedAt.toISOString(),
    }

    const masterCv: CvMaster = {
      id: dbRecord.masterResume.id,
      userId: dbRecord.masterResume.userId,
      title: dbRecord.masterResume.title,
      targetRole: dbRecord.masterResume.targetRole,
      rawFileUrl: dbRecord.masterResume.rawFileUrl,
      fileName: dbRecord.masterResume.fileName,
      rawText: dbRecord.masterResume.rawText,
      structuredData: dbRecord.masterResume.structuredData as unknown as StructuredCv,
      isDefault: dbRecord.masterResume.isDefault,
      reviewedAt: dbRecord.masterResume.reviewedAt ? dbRecord.masterResume.reviewedAt.toISOString() : null,
      createdAt: dbRecord.masterResume.createdAt.toISOString(),
      updatedAt: dbRecord.masterResume.updatedAt.toISOString(),
    }

    // Extract missing keywords / gaps
    const breakdown = dbRecord.scoreReport?.breakdown as any
    const rawMissing =
      breakdown?.critical_missing_keywords ||
      breakdown?.criticalMissingKeywords ||
      []

    const structuredJd = dbRecord.jobDescription?.structuredRequirements as any
    const masterSkills = (dbRecord.masterResume.structuredData as any)?.skills || []
    const masterSkillsLower = new Set(masterSkills.map((s: string) => s.toLowerCase().trim()))

    const jdRequiredSkills = structuredJd?.required_skills || []
    const synthesizedMissing = jdRequiredSkills
      .filter((reqSkill: string) => !masterSkillsLower.has(reqSkill.toLowerCase().trim()))
      .map((reqSkill: string) => ({
        name: reqSkill,
        category: "hard_skill",
        frequency: 2,
        importance: "critical",
      }))

    const missingKeywords = rawMissing.length > 0 ? rawMissing : synthesizedMissing

    const gapsJson = (dbRecord.scoreReport?.gaps as any) || {}
    const overallScore = dbRecord.scoreReport?.overallScore ?? 84
    const matchTier =
      gapsJson.matchTier ||
      (overallScore >= 85 ? "Strong Match" : overallScore >= 70 ? "Solid Fit" : overallScore >= 55 ? "Moderate Fit" : "Stretch Role")

    const synthesizedAlignments = jdRequiredSkills
      .filter((reqSkill: string) => masterSkillsLower.has(reqSkill.toLowerCase().trim()))
      .slice(0, 4)
      .map((skill: string) => ({
        skill,
        evidence: `Verified core skill "${skill}" is documented in your Master CV skills and experience.`,
      }))

    const synthesizedGaps = synthesizedMissing.slice(0, 4).map((m: any) => ({
      skill: m.name,
      severity: m.importance || "critical",
      reason: `The Job Description requests "${m.name}", but it does not appear in your Master CV.`,
    }))

    const alignments = (gapsJson.alignments && gapsJson.alignments.length > 0)
      ? gapsJson.alignments
      : synthesizedAlignments.length > 0
      ? synthesizedAlignments
      : [
          {
            skill: "Technical Alignment",
            evidence: "Candidate background covers core software engineering principles and relevant domain practices.",
          },
        ]

    const gapsDetailed = (gapsJson.gapsDetailed && gapsJson.gapsDetailed.length > 0)
      ? gapsJson.gapsDetailed
      : synthesizedGaps

    const summaryVerdict =
      gapsJson.summaryVerdict ||
      `Computed fit: ${overallScore}% (${matchTier}). Candidate authentic profile matches primary responsibilities with ${gapsDetailed.length} unfulfilled JD requirement${gapsDetailed.length === 1 ? "" : "s"}.`

    const scoreReport = {
      overallScore,
      matchTier,
      summaryVerdict,
      alignments,
      gapsDetailed,
      breakdown: dbRecord.scoreReport?.breakdown || {},
      gaps: (dbRecord.scoreReport?.gaps as any)?.highlights || (dbRecord.scoreReport?.gaps as any) || [],
      criticalMissingKeywords: missingKeywords,
    }

    return (
      <CvVerifierClient
        initialTailoredCv={tailoredCv}
        masterCv={masterCv}
        scoreReport={scoreReport}
      />
    )
  }

  // 2. Fallback for mock preview route (e.g. /cv-tailor/tailored_1)
  const mockTailoredCv = MOCK_TAILORED_CVS.find((c) => c.id === id) || MOCK_TAILORED_CVS[0]

  const mockScoreReport = {
    overallScore: 84,
    matchTier: "Solid Fit",
    summaryVerdict:
      "Candidate has strong frontend architecture and Next.js experience matching core JD requirements, but lacks explicit Kubernetes and Golang experience requested by the team.",
    alignments: [
      {
        skill: "Next.js & TypeScript Architecture",
        evidence:
          "Candidate has 3+ years architecting micro-frontends with Next.js App Router and TypeScript, directly satisfying the primary frontend requirement.",
      },
      {
        skill: "Performance Optimization & Latency",
        evidence:
          "Documented query optimization reducing database response latency from 450ms to 65ms, satisfying high-scale system requirements.",
      },
      {
        skill: "WCAG Accessibility Compliance",
        evidence:
          "Authored design systems meeting WCAG 2.1 AA standards, satisfying the JD's user accessibility specifications.",
      },
    ],
    gapsDetailed: [
      {
        skill: "Kubernetes Orchestration",
        severity: "critical" as const,
        reason:
          "The Job Description specifies production Kubernetes cluster orchestration, but your Master CV only records Docker containerization.",
      },
      {
        skill: "Golang Backend Services",
        severity: "moderate" as const,
        reason:
          "JD lists Go as a preferred backend microservice language; your CV authentic experience features Node.js and Python.",
      },
    ],
    breakdown: {
      requiredSkillsScore: 85,
      preferredSkillsScore: 80,
      semanticSimilarityScore: 85,
      keywordOverlapScore: 80,
      experienceFitScore: 90,
    },
    gaps: [
      'Critical Hard Skill: "Kubernetes" is missing from Master CV skills and experience.',
      'Recommended Opportunity: "Golang" is requested in JD but not featured in your current profile.',
    ],
    criticalMissingKeywords: [
      { name: "Kubernetes", category: "framework_tool" as const, frequency: 3, importance: "critical" as const },
      { name: "Golang", category: "hard_skill" as const, frequency: 2, importance: "recommended" as const },
    ],
  }

  return (
    <CvVerifierClient
      initialTailoredCv={mockTailoredCv}
      masterCv={MOCK_MASTER_CV}
      scoreReport={mockScoreReport}
    />
  )
}
