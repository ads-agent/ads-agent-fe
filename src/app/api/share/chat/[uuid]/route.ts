import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { sharedChatSchema } from '@/models/Schema';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    const { uuid } = await params;

    const [sharedChat] = await db
      .select({
        messages: sharedChatSchema.messages,
        threadTitle: sharedChatSchema.threadTitle,
        createdAt: sharedChatSchema.createdAt,
      })
      .from(sharedChatSchema)
      .where(eq(sharedChatSchema.id, uuid))
      .limit(1);

    if (!sharedChat) {
      return new Response(JSON.stringify({ error: 'Shared chat not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        messages: sharedChat.messages,
        thread_title: sharedChat.threadTitle,
        created_at: sharedChat.createdAt,
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('[api/share/chat/[uuid]] error', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
