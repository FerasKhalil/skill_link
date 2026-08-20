import { NextRequest } from 'next/server';
import {
  getDb,
  messages,
  conversations,
  notifications,
} from '@/db';
import { eq, and, desc, sql, lt } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiNotFound,
  parseJsonBody,
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

  if (!conversation) return { conversation: null, otherUserId: null };
  if (
    conversation.participant1Id !== userId &&
    conversation.participant2Id !== userId
  ) {
    return { conversation: null, otherUserId: null };
  }

  const otherUserId =
    conversation.participant1Id === userId
      ? conversation.participant2Id
      : conversation.participant1Id;

  return { conversation, otherUserId };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const { conversation } = await getConversation(id, user.id);

    if (!conversation) return apiNotFound('Conversation not found or access denied');

    const { searchParams } = new URL(request.url);
    const before = searchParams.get('before');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    const db = getDb();
    const conditions = [eq(messages.conversationId, id), eq(messages.isDeleted, false)];
    if (before) {
      const [cursorMsg] = await db
        .select({ createdAt: messages.createdAt })
        .from(messages)
        .where(eq(messages.id, before))
        .limit(1);
      if (cursorMsg) {
        conditions.push(lt(messages.createdAt, cursorMsg.createdAt));
      }
    }
    const results = await db
      .select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, id),
          eq(messages.isRead, false),
          sql`${messages.senderId} != ${user.id}`,
        ),
      );

    return apiSuccess(results);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('List messages error:', error);
    return apiError('Failed to list messages', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const { conversation, otherUserId } = await getConversation(id, user.id);

    if (!conversation) return apiNotFound('Conversation not found or access denied');

    const body = await parseJsonBody(request);
    if (!body) return apiError('Invalid request body');

    const { content } = body as { content?: string };
    if (!content || !content.trim()) return apiError('content is required');

    const db = getDb();

    const [message] = await db
      .insert(messages)
      .values({
        conversationId: id,
        senderId: user.id,
        content: content.trim(),
      })
      .returning();

    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        lastMessagePreview: content.trim().substring(0, 200),
      })
      .where(eq(conversations.id, id));

    await db.insert(notifications).values({
      userId: otherUserId,
      type: 'message',
      title: 'New message',
      body: content.trim().substring(0, 200),
      link: `/conversations/${id}`,
      metadata: { conversationId: id, messageId: message.id },
    });

    return apiSuccess(message, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiUnauthorized();
    console.error('Send message error:', error);
    return apiError('Failed to send message', 500);
  }
}
