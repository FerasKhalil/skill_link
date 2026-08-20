import { NextRequest } from 'next/server';
import {
  getDb,
  conversations,
  users,
  providerProfiles,
  blockedUsers,
  messages,
} from '@/db';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  parseJsonBody,
  getPaginationParams,
  paginatedResponse,
} from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const db = getDb();
    const { page, limit, offset } = getPaginationParams(request);

    const conditions = or(
      eq(conversations.participant1Id, user.id),
      eq(conversations.participant2Id, user.id),
    );

    const results = await db
      .select({
        id: conversations.id,
        listingId: conversations.listingId,
        lastMessageAt: conversations.lastMessageAt,
        lastMessagePreview: conversations.lastMessagePreview,
        isArchived: conversations.isArchived,
        createdAt: conversations.createdAt,
        participant1Id: conversations.participant1Id,
        participant2Id: conversations.participant2Id,
      })
      .from(conversations)
      .where(and(conditions, eq(conversations.isArchived, false)))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversations)
      .where(and(conditions, eq(conversations.isArchived, false)));

    const enriched = await Promise.all(
      results.map(async (conv) => {
        const otherUserId =
          conv.participant1Id === user.id ? conv.participant2Id : conv.participant1Id;

        const [otherUser] = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(eq(users.id, otherUserId))
          .limit(1);

        const [providerProfile] = await db
          .select({
            id: providerProfiles.id,
            profession: providerProfiles.profession,
          })
          .from(providerProfiles)
          .where(eq(providerProfiles.userId, otherUserId))
          .limit(1);

        const [{ unreadCount }] = await db
          .select({ unreadCount: sql<number>`count(*)::int` })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              eq(messages.isRead, false),
              sql`${messages.senderId} != ${user.id}`,
            ),
          );

        return {
          ...conv,
          otherUser: {
            ...otherUser,
            providerProfile: providerProfile || null,
          },
          unreadCount,
        };
      }),
    );

    return paginatedResponse(enriched, count, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('List conversations error:', error);
    return apiError('Failed to list conversations', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const { providerId, listingId, participantId } = body as { providerId?: string; listingId?: string; participantId?: string };

    let otherUserId: string;

    if (participantId) {
      otherUserId = participantId;
    } else if (providerId) {
      const db = getDb();
      const [providerProfile] = await db
        .select()
        .from(providerProfiles)
        .where(eq(providerProfiles.id, providerId))
        .limit(1);
      if (!providerProfile) return apiNotFound('Provider not found');
      otherUserId = providerProfile.userId;
    } else {
      return apiError('providerId or participantId is required');
    }

    if (otherUserId === user.id) return apiError('Cannot create conversation with yourself');

    const db = getDb();

    const isBlocked = await db
      .select()
      .from(blockedUsers)
      .where(
        or(
          and(eq(blockedUsers.blockerId, user.id), eq(blockedUsers.blockedId, otherUserId)),
          and(eq(blockedUsers.blockerId, otherUserId), eq(blockedUsers.blockedId, user.id)),
        ),
      )
      .limit(1);
    if (isBlocked.length > 0) return apiError('Cannot create conversation with this user');

    const [minId, maxId] = [user.id, otherUserId].sort();
    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.participant1Id, minId),
          eq(conversations.participant2Id, maxId),
        ),
      )
      .limit(1);

    if (existing) {
      return apiSuccess(existing);
    }

    const [conversation] = await db
      .insert(conversations)
      .values({
        participant1Id: minId,
        participant2Id: maxId,
        listingId: listingId || null,
        lastMessageAt: new Date(),
      })
      .returning();

    return apiSuccess(conversation, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Create conversation error:', error);
    return apiError('Failed to create conversation', 500);
  }
}
