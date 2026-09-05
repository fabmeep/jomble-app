export type LlmProviderType = "OLLAMA" | "GEMINI"

export interface LlmProviderConfig {
  id?: string
  userId?: string
  provider: LlmProviderType
  ollamaBaseUrl?: string
  ollamaModel?: string
  geminiApiKeyEncrypted?: string
  geminiModel?: string
  isActive: boolean
  lastTestedAt?: string | null
  lastTestOk?: boolean | null
}

export interface CvBullet {
  id: string
  text: string
}

export interface ExperienceEntry {
  id: string
  company: string
  title: string
  dates: string
  location?: string
  bullets: CvBullet[]
}

export interface EducationEntry {
  id: string
  institution: string
  degree: string
  dates: string
  details?: string
}

export interface ProjectEntry {
  id: string
  name: string
  description: string
  technologies?: string[]
  link?: string
}

export interface ContactInfo {
  name: string
  email: string
  phone?: string
  location?: string
  linkedin?: string
  github?: string
  website?: string
}

export interface StructuredCv {
  contact: ContactInfo
  summary: string
  experience: ExperienceEntry[]
  education: EducationEntry[]
  skills: string[]
  projects?: ProjectEntry[]
  certifications?: string[]
}

export interface MasterResume {
  id: string
  userId: string
  title: string
  targetRole?: string | null
  rawFileUrl?: string | null
  fileName?: string | null
  fileSize?: string | null
  rawText?: string | null
  structuredData: StructuredCv
  isDefault: boolean
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CvMaster = MasterResume


export type ScrapeMethod = "URL_SCRAPE" | "MANUAL_PASTE"

export interface JdRequirements {
  required_skills: string[]
  preferred_skills: string[]
  responsibilities: string[]
  keywords: string[]
  seniority?: string
  employment_type?: string
  companyName?: string
  jobTitle?: string
}

export interface JobDescription {
  id: string
  userId: string
  sourceUrl?: string | null
  rawText: string
  structuredRequirements: JdRequirements
  scrapeMethod: ScrapeMethod
  createdAt: string
}

export interface ScoreBreakdown {
  requiredSkillsScore: number // weight 35%
  preferredSkillsScore: number // weight 15%
  semanticSimilarityScore: number // weight 20%
  keywordOverlapScore: number // weight 15%
  experienceFitScore: number // weight 15%
}

export interface ScoreReport {
  id: string
  userId: string
  cvMasterId: string
  jobDescriptionId: string
  overallScore: number // 0-100
  breakdown: ScoreBreakdown
  gaps: string[]
  createdAt: string
}

export type GroundingStatus = "pass" | "flagged" | "rejected"
export type UserResolution = "approved" | "kept_original" | "discarded"

export interface GroundingBulletResult {
  id: string
  source_bullet_id: string
  original_text: string
  rewritten_text: string
  target_experience_id: string
  similarity_score: number // 0.0 to 1.0
  status: GroundingStatus
  user_resolution?: UserResolution
}

export interface TailoredCvContent {
  contact: ContactInfo
  summary: string
  experience: ExperienceEntry[]
  education: EducationEntry[]
  skills: string[]
  projects?: ProjectEntry[]
  certifications?: string[]
}

export type TailoredCvStatus = "DRAFT" | "VERIFIED" | "EXPORTED"

export interface TailoredCv {
  id: string
  userId: string
  cvMasterId: string
  jobDescriptionId: string
  scoreReportId?: string
  jobTitle: string
  companyName: string
  generatedContent: TailoredCvContent
  groundingReport: GroundingBulletResult[]
  renderedFileUrl?: string | null
  status: TailoredCvStatus
  createdAt: string
  updatedAt: string
}
