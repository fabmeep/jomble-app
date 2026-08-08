import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 500, details?: any) {
  return NextResponse.json(
    { error: message, ...(details ? { details } : {}) },
    { status }
  );
}

export function apiBadRequest(message = "Invalid request payload", details?: any) {
  return apiError(message, 400, details);
}

export function apiUnauthorized(message = "Unauthorized access") {
  return apiError(message, 401);
}

export function apiNotFound(message = "Resource not found") {
  return apiError(message, 404);
}
