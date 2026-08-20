import { NextRequest } from 'next/server';
import {
  getDb,
  conversations,
  blockedUsers,
} from '@/db';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
} from '@/lib/api-helpers';

async function getConversation(
  conversationId: string,
  userId: string,
) {
  const db = getDb();
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation) return null;
  if (
    conversation.participant1Id !== userId &&
    conversation.participant2Id !== userId
  ) {
    return null;
  }

  return conversation;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const conversation = await getConversation(id, user.id);

    if (!conversation) return apiNotFound('Conversation not found or access denied');

    const otherUserId =
      conversation.participant1Id === user.id
        ? conversation.participant2Id
        : conversation.participant1Id;

    const db = getDb();

    const [existing] = await db
      .select()
      .from(blockedUsers)
      .where(
        and(
          eq(blockedUsers.blockerId, user.id),
          eq(blockedUsers.blockedId, otherUserId),
        ),
      )
      .limit(1);

    if (existing) return apiSuccess({ message: 'User already blocked' });

    await db.insert(blockedUsers).values({
      blockerId: user.id,
      blockedId: otherUserId,
    });

    return apiSuccess({ message: 'User blocked successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Block user error:', error);
    return apiError('Failed to block user', 500);
  }
}
