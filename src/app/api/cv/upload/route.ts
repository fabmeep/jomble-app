import { NextRequest } from "next/server";
import { getUserId } from "@/lib/session";
import { CvService } from "@/lib/services/cv.service";
import { apiSuccess, apiUnauthorized, apiError, apiBadRequest } from "@/lib/api-response";
import { uploadResumeFile } from "@/lib/storage";
import { getFastApiBaseUrl } from "@/lib/fastapi";
import { isCvTailorEnabled } from "@/lib/feature-flags";

const FASTAPI_BASE_URL = getFastApiBaseUrl();

export async function POST(req: NextRequest) {
  if (!isCvTailorEnabled()) {
    return apiError("CV upload and AI parsing are disabled on this deployment.", 503);
  }

  try {
    const userId = await getUserId();
    const formData = await req.formData();
    
    const file = formData.get("file") as File | null;
    const rawText = formData.get("raw_text") as string | null;
    const title = formData.get("title") as string | null;
    const targetRole = formData.get("target_role") as string | null;

    if (!file && (!rawText || !rawText.trim())) {
      return apiBadRequest("Please provide either a PDF/DOCX file or paste raw resume text.");
    }

    // 1. If a binary file was uploaded, store it in Supabase Storage (if configured)
    let rawFileUrl: string | null = null;
    if (file) {
      try {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        rawFileUrl = await uploadResumeFile(
          userId,
          file.name,
          fileBuffer,
          file.type || "application/pdf"
        );
      } catch (storageErr) {
        console.warn("[Storage Warning] Could not persist raw file to bucket, continuing extraction:", storageErr);
      }
    }

    // 2. Fetch user's active LLM configuration (if present)
    const { prisma } = await import("@/lib/prisma");
    const llmConfig = await prisma.llmProviderConfig.findFirst({
      where: { userId, isActive: true },
    });

    const headers: Record<string, string> = {};
    if (llmConfig) {
      headers["X-Llm-Provider"] = llmConfig.provider;
      if (llmConfig.geminiApiKeyEncrypted) {
        headers["X-Gemini-Api-Key"] = llmConfig.geminiApiKeyEncrypted;
      }
      if (llmConfig.geminiModel) {
        headers["X-Gemini-Model"] = llmConfig.geminiModel;
      }
      if (llmConfig.ollamaBaseUrl) {
        headers["X-Ollama-Url"] = llmConfig.ollamaBaseUrl;
      }
      if (llmConfig.ollamaModel) {
        headers["X-Ollama-Model"] = llmConfig.ollamaModel;
      }
    }

    // 3. Forward to FastAPI backend for extraction & structuring
    const backendFormData = new FormData();
    if (file) {
      backendFormData.append("file", file, file.name);
    }
    if (rawText) {
      backendFormData.append("raw_text", rawText);
    }

    let extractResponse;
    try {
      const response = await fetch(`${FASTAPI_BASE_URL}/cv/extract`, {
        method: "POST",
        headers,
        body: backendFormData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.detail || `FastAPI extraction failed with status ${response.status}`;
        return apiBadRequest(message);
      }

      extractResponse = await response.json();
    } catch (err: any) {
      console.error("Failed to connect to FastAPI backend:", err);
      return apiError(
        "Could not connect to the local Python backend server on http://localhost:8000. Please ensure the backend is running (`uvicorn app.main:app --port 8000`).",
        503
      );
    }

    const { raw_text, structured_data, file_name } = extractResponse;

    // 3. Create a new MasterResume in Postgres
    const masterResume = await CvService.createMasterResume(userId, {
      title: title || file_name || (structured_data.contact?.name ? `${structured_data.contact.name}'s Resume` : "My Master Resume"),
      targetRole: targetRole || null,
      fileName: file_name || (file ? file.name : "Pasted Resume"),
      rawFileUrl: rawFileUrl,
      rawText: raw_text,
      structuredData: structured_data,
      reviewedAt: null, // explicitly unverified until user review
    });

    return apiSuccess({
      masterResume,
      structuredData: structured_data,
      rawText: raw_text,
    }, 201);
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return apiUnauthorized(error.message);
    }
    console.error("Error in CV upload route:", error);
    return apiError(error.message || "Failed to process resume upload");
  }
}
