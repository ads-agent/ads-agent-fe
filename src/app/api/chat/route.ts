// src/app/api/chat/route.ts
import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from 'ai';
import { z } from 'zod';

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

    const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const modelMessages = await convertToModelMessages(messages);

    const stream = createUIMessageStream({
      async execute({ writer }) {
        try {
          const result = streamText({
            model: openai(modelName),
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
