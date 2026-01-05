// src/app/api/chat/route.ts
import { createOpenAI, openai } from '@ai-sdk/openai';
import { auth } from '@clerk/nextjs/server';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from 'ai';
import { z } from 'zod';

import { Env } from '@/libs/Env';

export const runtime = 'nodejs';

const BodySchema = z.object({
  messages: z.array(z.any()),
  system: z.string().optional(),
  threadId: z.string().optional(),
});

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);

    if (!parsed.success) {
      console.error('[api/chat] invalid body', { requestId, details: parsed.error.flatten() });
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      );
    }

    const { messages, system, threadId } = parsed.data;

    // Determine which provider to use based on environment configuration
    let model;

    if (Env.USE_CUSTOM_CHAT_API === 'true' && Env.CHAT_API_BASE_URL) {
      // Use the custom Chat Server
      const { getToken } = await auth();
      const token = await getToken();

      const customOpenAI = createOpenAI({
        baseURL: Env.CHAT_API_BASE_URL,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Custom fetch to inject thread_id into the body for persistence
        fetch: async (url, options) => {
          let body;
          try {
            body = options?.body ? JSON.parse(options.body as string) : {};
          } catch {
            body = {};
          }

          if (threadId) {
            body.thread_id = threadId;
          }

          return fetch(url, {
            ...options,
            body: JSON.stringify(body),
          });
        },
      });

      // Use the specific model for the custom server
      model = customOpenAI.chat('gemini-2.5-flash-lite');
    } else {
      // Fallback to direct OpenAI API usage
      const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      model = openai(modelName);
    }

    const modelMessages = await convertToModelMessages(messages);

    const stream = createUIMessageStream({
      async execute({ writer }) {
        try {
          const result = streamText({
            model,
            system: system ?? 'You are a helpful assistant. Be concise unless the user asks for details.',
            messages: modelMessages,
            temperature: 0.2,
          });

          writer.merge(result.toUIMessageStream());
          await result.consumeStream();
        } catch (err) {
          console.error('[api/chat] execute error', { requestId, threadId, err });
          throw err;
        }
      },

      onError: (err) => {
        console.error('[api/chat] stream error', { requestId, threadId, err });
        return `Server error: ${err instanceof Error ? err.message : String(err)}`;
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (err) {
    console.error('[api/chat] fatal', { requestId, err });
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
}
