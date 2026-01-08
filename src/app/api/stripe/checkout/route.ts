import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { Env } from '@/libs/Env';
import { getBaseUrl } from '@/utils/Helpers';

const stripe = new Stripe(Env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(req: Request) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { priceId, quantity } = body;

    if (!priceId) {
      return new NextResponse('Price ID is required', { status: 400 });
    }

    const baseUrl = getBaseUrl();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: quantity || 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/dashboard?payment=success`,
      cancel_url: `${baseUrl}/dashboard?payment=cancelled`,
      metadata: {
        userId,
      },
      customer_email: user.emailAddresses[0]?.emailAddress,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[STRIPE_CHECKOUT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
