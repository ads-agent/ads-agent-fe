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
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid request body', details: parsed.error.flatten() }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  const { messages, system } = parsed.data;

  const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const modelMessages = await convertToModelMessages(messages);

  const stream = createUIMessageStream({
    async execute({ writer }) {
      // ✅ 关键：先写一个“确定能显示”的 chunk
      const messageId = `m_${crypto.randomUUID()}`;
      const textId = `t_${crypto.randomUUID()}`;

      writer.write({ type: 'start', messageId });
      writer.write({ type: 'text-start', id: textId });
      writer.write({ type: 'text-delta', id: textId, delta: '[debug] server connected. ' });

      // 然后再接模型输出
      const result = streamText({
        model: openai(modelName),
        system: system ?? 'You are a helpful assistant. Be concise unless the user asks for details.',
        messages: modelMessages,
        temperature: 0.2,
      });

      writer.merge(result.toUIMessageStream());

      // 如果模型流完了，补上 text-end（严格一些）
      writer.write({ type: 'text-end', id: textId });

      // ✅ 让 execute 生命周期等到模型流结束（避免某些环境“提前结束”）
      await result.consumeStream();
    },

    // ✅ 如果 execute 里抛错，把错误写进消息流（否则前端只看到“没回复”）
    onError: err => `Server error: ${err instanceof Error ? err.message : String(err)}`,
  });

  return createUIMessageStreamResponse({ stream });
}
