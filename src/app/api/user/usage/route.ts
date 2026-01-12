import { auth } from '@clerk/nextjs/server';
import { desc, eq, max, sql, sum } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { tokenUsageSchema } from '@/models/Schema';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const usage = await db
      .select({
        threadId: tokenUsageSchema.threadId,
        totalTokens: sum(tokenUsageSchema.totalTokens).mapWith(Number),
        lastUsedAt: max(tokenUsageSchema.createdAt),
        title: sql<string>`MAX(${tokenUsageSchema.description})`, // Using a simple fallback for title
      })
      .from(tokenUsageSchema)
      .where(eq(tokenUsageSchema.userId, userId))
      .groupBy(tokenUsageSchema.threadId)
      .orderBy(desc(max(tokenUsageSchema.createdAt)))
      .limit(500);

    return NextResponse.json(usage);
  } catch (error) {
    console.error('[USER_USAGE_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
