import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/libs/DB';
import { sharedChatSchema } from '@/models/Schema';

export const runtime = 'nodejs';

const BodySchema = z.object({
  messages: z.array(z.any()),
  thread_id: z.string(),
  thread_title: z.string().optional(),
  md5: z.string(),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const { messages, thread_id, thread_title, md5 } = parsed.data;

    const [existing] = await db
      .select({ id: sharedChatSchema.id })
      .from(sharedChatSchema)
      .where(
        and(
          eq(sharedChatSchema.userId, userId),
          eq(sharedChatSchema.threadId, thread_id),
          eq(sharedChatSchema.md5, md5),
        ),
      )
      .limit(1);

    if (existing) {
      return new Response(
        JSON.stringify({ url: `/share/${existing.id}` }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    }

    const result = await db
      .insert(sharedChatSchema)
      .values({
        userId,
        threadId: thread_id,
        md5,
        threadTitle: thread_title,
        messages,
      })
      .returning();

    const inserted = result[0];
    if (!inserted) {
      throw new Error('Failed to insert shared chat');
    }

    return new Response(JSON.stringify({ url: `/share/${inserted.id}` }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('[api/share/chat] error', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
