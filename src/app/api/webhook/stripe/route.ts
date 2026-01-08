import { sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { userSchema } from '@/models/Schema';

const stripe = new Stripe(Env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === 'checkout.session.completed') {
    const userId = session.metadata?.userId;

    if (!userId) {
      return new NextResponse('User ID is required', { status: 400 });
    }

    // Determine how many tokens to add.
    // For now, let's assume 100 tokens per item quantity as a placeholder.
    // In a real scenario, you might map priceId to token amount.
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    let totalTokensToAdd = 0;

    for (const item of lineItems.data) {
      // Simple logic: 100 tokens per unit purchased
      // You can customize this based on item.price.id
      const quantity = item.quantity || 1;
      totalTokensToAdd += quantity * 100;
    }

    try {
      // Upsert user and update balance
      await db.insert(userSchema)
        .values({
          id: userId,
          stripeCustomerId: session.customer as string,
          tokenBalance: totalTokensToAdd,
        })
        .onConflictDoUpdate({
          target: userSchema.id,
          set: {
            tokenBalance: sql`${userSchema.tokenBalance} + ${totalTokensToAdd}`,
            stripeCustomerId: session.customer as string,
          },
        });

      /* eslint-disable no-console */
      console.log(`Successfully added ${totalTokensToAdd} tokens to user ${userId}`);
      /* eslint-enable no-console */
    } catch (error) {
      console.error('Error updating user token balance:', error);
      return new NextResponse('Error updating database', { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}
