import { createClient, SupabaseClient } from "@supabase/supabase-js"

function sanitizeSupabaseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  return url
    .trim()
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/storage\/v1\/?$/i, "")
    .replace(/\/+$/, "")
}

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseUrl = sanitizeSupabaseUrl(rawSupabaseUrl)
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let cachedClient: SupabaseClient | null = null

/**
 * Returns true if Supabase Storage environment variables are present.
 */
export function isStorageConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey)
}

/**
 * Returns an authenticated Supabase client for storage operations.
 */
export function getStorageClient(): SupabaseClient | null {
  if (!isStorageConfigured()) {
    return null
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return cachedClient
}

export const RESUMES_BUCKET = "resumes"

/**
 * Normalizes content type to prevent storage MIME rejection from charset suffixes.
 */
function normalizeContentType(contentType: string, fileName: string): string {
  const lower = fileName.toLowerCase()
  if (lower.endsWith(".pdf")) return "application/pdf"
  if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  if (lower.endsWith(".doc")) return "application/msword"
  if (lower.endsWith(".txt")) return "text/plain"

  // Strip charset if present (e.g. "application/pdf; charset=utf-8" -> "application/pdf")
  return contentType.split(";")[0].trim() || "application/pdf"
}

/**
 * Uploads a resume document to the private Supabase 'resumes' bucket.
 * Files are isolated per user in the `{userId}/{timestamp}_{filename}` directory.
 *
 * @returns The relative storage path to be saved in MasterResume.rawFileUrl, or null if storage is not configured.
 */
export async function uploadResumeFile(
  userId: string,
  fileName: string,
  fileBuffer: Buffer | Uint8Array,
  contentType: string = "application/pdf"
): Promise<string | null> {
  const client = getStorageClient()
  if (!client) {
    console.warn(
      "[Supabase Storage] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured. Skipping bucket upload."
    )
    return null
  }

  // Clean userId and filename: remove non-alphanumeric characters, avoid double slashes
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "_")
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
  const filePath = `${safeUserId}/${Date.now()}_${safeName}`
  const cleanContentType = normalizeContentType(contentType, fileName)

  const { error } = await client.storage
    .from(RESUMES_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: cleanContentType,
      upsert: true,
    })

  if (error) {
    console.error("[Supabase Storage] Failed to upload resume file:", error)
    throw new Error(`Storage upload failed: ${error.message}`)
  }

  return filePath
}

/**
 * Generates a short-lived (default 1 hour) secure signed URL for downloading a private resume.
 */
export async function getResumeDownloadUrl(
  filePath: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  const client = getStorageClient()
  if (!client || !filePath) return null

  const { data, error } = await client.storage
    .from(RESUMES_BUCKET)
    .createSignedUrl(filePath, expiresInSeconds)

  if (error) {
    console.error("[Supabase Storage] Failed to create signed URL:", error)
    return null
  }

  return data.signedUrl
}

/**
 * Deletes an uploaded resume file from the storage bucket.
 */
export async function deleteResumeFile(filePath: string): Promise<boolean> {
  const client = getStorageClient()
  if (!client || !filePath) return false

  const { error } = await client.storage.from(RESUMES_BUCKET).remove([filePath])

  if (error) {
    console.error("[Supabase Storage] Failed to delete resume file:", error)
    return false
  }

  return true
}
