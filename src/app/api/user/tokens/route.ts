import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { userSchema } from '@/models/Schema';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const [user] = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.id, userId))
      .limit(1);

    return NextResponse.json({
      tokenBalance: user?.tokenBalance ?? 0,
    });
  } catch (error) {
    console.error('[USER_TOKENS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
