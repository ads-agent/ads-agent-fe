// src/app/api/chat/route.ts
import { createOpenAI, openai } from '@ai-sdk/openai';
import { auth } from '@clerk/nextjs/server';
import {
  convertToModelMessages,
  streamText,
} from 'ai';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { tokenUsageSchema, userSchema } from '@/models/Schema';

export const runtime = 'nodejs';

const BodySchema = z.object({
  messages: z.array(z.any()),
  system: z.string().optional(),
  threadId: z.string().optional(),
  model: z.string().optional(),
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

    const { messages, system, threadId: reqThreadId, model: requestedModel } = parsed.data;

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

          if (reqThreadId) {
            body.thread_id = reqThreadId;
          }

          return fetch(url, {
            ...options,
            body: JSON.stringify(body),
          });
        },
      });

      // Use the requested model or fallback
      model = customOpenAI.chat(requestedModel || 'gemini-2.5-flash-lite');
    } else {
      // Fallback to direct OpenAI API usage
      const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      model = openai(modelName);
    }

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model,
      system: system ?? 'You are a helpful assistant. Be concise unless the user asks for details.',
      messages: modelMessages,
      temperature: 0.2,
      includeRawChunks: true, // Enable raw chunks to capture provider-specific data
      onChunk: ({ chunk }) => {
        if (chunk.type === 'raw') {
          // console.log('[api/chat] Raw chunk from backend:', chunk.rawValue);
        }
      },
      onFinish: async ({ usage, text }) => {
        const { userId } = await auth();
        if (!userId || !usage) {
          return;
        }

        try {
          // Record token usage
          await db.insert(tokenUsageSchema).values({
            userId,
            threadId: reqThreadId,
            promptTokens: usage.inputTokens ?? 0,
            completionTokens: usage.outputTokens ?? 0,
            totalTokens: usage.totalTokens ?? 0,
            model: model.modelId,
            description: text.slice(0, 100), // Store a snippet as description
          });

          // Reduce user token balance
          await db
            .update(userSchema)
            .set({
              tokenBalance: sql`${userSchema.tokenBalance} - ${usage.totalTokens ?? 0}`,
            })
            .where(eq(userSchema.id, userId));
        } catch (dbErr) {
          console.error('[api/chat] failed to record usage', { requestId, dbErr });
        }
      },
    });

    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        // Extract thread_id / run_id from raw provider chunks if available
        if (part.type === 'raw') {
          const raw = part.rawValue as any;
          if (typeof raw === 'object' && (raw?.thread_id || raw?.run_id)) {
            return {
              thread_id: raw?.thread_id,
              run_id: raw?.run_id,
            };
          }
        }
        // Fallback: Send a threadId in 'start' part to ensure there will always be one.
        // NOTE: AI-SDK would merge all messageMetadata automatically and use latest result to overwrite
        // previous results, so if server returns thread_id later, it would get prioritized.
        if (part.type === 'start') {
          return {
            thread_id: reqThreadId || crypto.randomUUID(),
          };
        }

        return {};
      },
    });
  } catch (err) {
    console.error('[api/chat] fatal', { requestId, err });
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
}
