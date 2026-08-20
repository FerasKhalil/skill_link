import { NextResponse, NextRequest } from 'next/server';

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: message, details },
    { status }
  );
}

export function apiUnauthorized(message = 'Authentication required') {
  return apiError(message, 401);
}

export function apiForbidden(message = 'Insufficient permissions') {
  return apiError(message, 403);
}

export function apiNotFound(message = 'Resource not found') {
  return apiError(message, 404);
}

export function apiConflict(message = 'Resource already exists') {
  return apiError(message, 409);
}

export function apiTooMany(message = 'Too many requests') {
  return apiError(message, 429);
}

export function apiInternal(message = 'Internal server error') {
  return apiError(message, 500);
}

export function getSearchParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

export function getPaginationParams(request: NextRequest) {
  const params = getSearchParams(request);
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.limit || '20', 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function paginatedResponse(data: unknown[], total: number, page: number, limit: number) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}

export async function parseJsonBody(request: NextRequest) {
  try {
    const body = await request.json();
    return body;
  } catch {
    return null;
  }
}
