import { NextRequest } from 'next/server';
import { getDb, media } from '@/db';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api-helpers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return apiUnauthorized();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file) return apiError('No file provided', 400);

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.type)) {
      return apiError('File type not allowed. Supported: JPEG, PNG, WebP, GIF, PDF', 400);
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return apiError('File too large. Maximum size: 10MB', 400);
    }

    const validTypes = [
      'profile_image',
      'listing_image',
      'chat_attachment',
      'identity_document',
      'affiliation_evidence',
      'report_evidence',
    ];
    if (!type || !validTypes.includes(type)) {
      return apiError(`Invalid media type. Must be one of: ${validTypes.join(', ')}`, 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'bin';
    const storedName = `${uuidv4()}.${ext}`;
    const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
    const fs = await import('fs/promises');
    const path = await import('path');

    const dirPath = path.join(uploadDir, type);
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(path.join(dirPath, storedName), buffer);

    const publicUrl = `/uploads/${type}/${storedName}`;

    const db = getDb();
    const [record] = await db
      .insert(media)
      .values({
        userId: user.id,
        type: type as typeof media.$inferInsert.type,
        originalName: file.name,
        storedName,
        mimeType: file.type,
        sizeBytes: file.size,
        url: publicUrl,
        isPublic: type === 'profile_image' || type === 'listing_image',
      })
      .returning();

    return apiSuccess(record, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Upload error:', error);
    return apiError('Failed to upload file', 500);
  }
}
