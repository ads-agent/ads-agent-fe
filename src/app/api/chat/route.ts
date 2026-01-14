// src/app/api/chat/route.ts
import { Buffer } from 'node:buffer';

import { createOpenAI, openai } from '@ai-sdk/openai';
import { auth } from '@clerk/nextjs/server';
import {
  convertToModelMessages,
  streamText,
} from 'ai';
import { v2 as cloudinary } from 'cloudinary';
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

// ==================== Video Processing ====================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

function buildSignedCloudinaryFrameUrl(opts: {
  cloudName: string;
  videoUrl: string;
  so: number | 'auto';
  width?: number; // 可选：给模型用的缩略尺寸，省带宽/更便宜
  quality?: string; // 可选：q_auto 等
}) {
  const { videoUrl, so, width = 768, quality = 'auto' } = opts;

  // Cloudinary transformation 参数名在 SDK 里是 start_offset / quality / width 等
  // format: "jpg" 表示输出图片
  const url = cloudinary.url(videoUrl, {
    resource_type: 'video',
    type: 'fetch',
    sign_url: true,
    format: 'jpg',
    transformation: [
      {
        start_offset: so === 'auto' ? 'auto' : so,
        width,
        crop: 'scale',
        quality,
      },
    ],
  });

  return url;
}

// 1) 生成 Cloudinary “从远程视频 fetch 并截帧输出 jpg” 的 URL
function buildCloudinaryFrameUrl(opts: {
  cloudName: string;
  videoUrl: string;
  // so can be number (seconds) or "auto"
  so: number | 'auto';
  width?: number; // 可选：给模型用的缩略尺寸，省带宽/更便宜
  quality?: string; // 可选：q_auto 等
}): string {
  const { cloudName, videoUrl, so, width = 768, quality = 'q_auto' } = opts;

  // Cloudinary fetch URL 里远程 URL 要 encode
  const encoded = encodeURIComponent(videoUrl);

  // transformations：so_*, w_*, q_auto（可以按需删减）
  const soPart = so === 'auto' ? 'so_auto' : `so_${so}`;
  const tx = `${soPart},w_${width},${quality}`;

  // 注意：这里用 /video/fetch/… 然后以 .jpg 结尾表示输出图片
  return `https://res.cloudinary.com/${cloudName}/video/fetch/${tx}/${encoded}.jpg`;
}
// keep for future use
void buildCloudinaryFrameUrl;

// 2) 改写 messages：video file part => text(original url) + image frames
function rewriteVideoPartsToFrames(messages: any[], cloudName: string) {
  const defaultOffsets = [0, 1, 2, 3, 4, 5, 6]; // 秒
  return messages.map((m) => {
    if (!Array.isArray(m.parts)) {
      return m;
    }

    const newParts: any[] = [];
    for (const p of m.parts) {
      const isVideo
        = p?.type === 'file'
        && typeof p.mediaType === 'string'
        && p.mediaType.startsWith('video/')
        && typeof p.url === 'string';

      if (!isVideo) {
        newParts.push(p);
        continue;
      }

      const videoUrl = p.url;

      // 2.1 保留原始 URL（最稳：text part 不会触发 provider 的 video 限制）
      newParts.push({
        type: 'text',
        text: `VIDEO_URL: ${videoUrl}`,
      });

      // 2.2 生成多张帧图（image/jpeg）
      const frameParts = [
        ...defaultOffsets.map(sec => ({
          type: 'file',
          url: buildSignedCloudinaryFrameUrl({ cloudName, videoUrl, so: sec }),
          filename: `frame_${sec}s.jpg`,
          mediaType: 'image/jpeg',
        })),
        {
          type: 'file',
          url: buildSignedCloudinaryFrameUrl({ cloudName, videoUrl, so: 'auto' }),
          filename: `frame_auto.jpg`,
          mediaType: 'image/jpeg',
        },
      ];

      // 2.3 可选：给模型一个时间戳说明（更容易引用）
      newParts.push({
        type: 'text',
        text:
          `Frame timestamps (approx): ${
            defaultOffsets.map(s => `${s}s`).join(', ')
          }, auto`,
      });

      newParts.push(...frameParts);
    }

    return { ...m, parts: newParts };
  });
}

// ==================== CSV Processing ====================
const MAX_CSV_BYTES = 200_000; // 约 200KB，避免把上下文/带宽炸掉
const MAX_LINES = 300; // 也避免太长

async function fetchTextWithLimit(url: string, maxBytes: number): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV (${res.status})`);
  }

  // 只取前 maxBytes 字节
  const reader = res.body?.getReader();
  if (!reader) {
    const text = await res.text();
    return text.slice(0, maxBytes);
  }

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    if (!value) {
      continue;
    }

    const nextTotal = total + value.byteLength;
    if (nextTotal > maxBytes) {
      chunks.push(value.slice(0, maxBytes - total));
      total = maxBytes;
      break;
    }

    chunks.push(value);
    total = nextTotal;
    if (total >= maxBytes) {
      break;
    }
  }

  const buf = Buffer.concat(chunks.map(c => Buffer.from(c)));
  return buf.toString('utf-8');
}

function clampLines(text: string, maxLines: number) {
  const lines = text.split(/\r?\n/);
  if (lines.length <= maxLines) {
    return text;
  }
  return `${lines.slice(0, maxLines).join('\n')}\n\n[TRUNCATED: ${lines.length - maxLines} more lines]`;
}

async function rewriteCsvPartsToText(messages: any[]) {
  const out = [];

  for (const m of messages) {
    if (!Array.isArray(m.parts)) {
      out.push(m);
      continue;
    }

    const newParts: any[] = [];
    for (const p of m.parts) {
      const isCsv
        = p?.type === 'file'
        && typeof p.mediaType === 'string'
        && p.mediaType.toLowerCase() === 'text/csv'
        && typeof p.url === 'string';

      if (!isCsv) {
        newParts.push(p);
        continue;
      }

      // 1) 保留原始 URL（给 server future flexible）
      newParts.push({ type: 'text', text: `CSV_URL: ${p.url}` });

      // 2) 把 CSV 内容内联进 prompt
      let csvText = await fetchTextWithLimit(p.url, MAX_CSV_BYTES);
      csvText = clampLines(csvText, MAX_LINES);

      const name = p.filename ? ` (${p.filename})` : '';
      newParts.push({
        type: 'text',
        text:
          `Here is the CSV content${name}:\n`
          + `\`\`\`csv\n${
            csvText.replace(/```/g, '``\\`') // 防止意外结束 code fence
          }\n\`\`\``,
      });
    }

    out.push({ ...m, parts: newParts });
  }

  return out;
}

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

    let rewrittenMessages = messages;
    // 先把 CSV 变成 text
    rewrittenMessages = await rewriteCsvPartsToText(rewrittenMessages);
    // 再把 video 变成 image frames（你已有的 rewriteVideoParts...）
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    rewrittenMessages = await rewriteVideoPartsToFrames(rewrittenMessages, cloudName);

    const modelMessages = await convertToModelMessages(rewrittenMessages);

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
