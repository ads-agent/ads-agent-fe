'use client';

import { ExportedMessageRepository, useAssistantApi } from '@assistant-ui/react';
import { useEffect } from 'react';

const KEY_PREFIX = 'chat_thread_repo_v1:';
const key = (threadId: string) => `${KEY_PREFIX}${threadId}`;
let glob: ExportedMessageRepository = { messages: [] };

function safeParse<T>(s: string | null): T | null {
  if (!s) {
    return null;
  }
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

/* eslint-disable no-console */
export function saveThreadRepo(threadId: string, repo: any) {
  glob = repo;
  console.log('[zhengc][10] ', threadId, '|', key(threadId), '|', JSON.stringify(repo));
  localStorage.setItem(key(threadId), JSON.stringify(repo));
}

function reviveRepoDates(repo: ExportedMessageRepository): ExportedMessageRepository {
  if (!repo?.messages?.length) {
    return repo;
  }

  return {
    ...repo,
    messages: repo.messages.map(m => ({
      ...m,
      message: {
        ...m.message,
        // ✅ 核心：createdAt string -> Date
        createdAt:
          typeof m.message.createdAt === 'string'
            ? new Date(m.message.createdAt)
            : m.message.createdAt,
      },
    })),
  };
}

export function ThreadPersistence({ threadId }: { threadId: string }) {
  const api = useAssistantApi();

  useEffect(() => {
    // 隔离：切换 threadId 先清空
    api.thread().reset();

    const repoJson = safeParse<ExportedMessageRepository>(localStorage.getItem(key(threadId)));
    if (repoJson) {
      try {
        const revived = reviveRepoDates(repoJson);

        // ✅ 关键：import revived（带 Date），而不是原始 JSON（带 string）
        console.log('[zhengc][5]', JSON.stringify(glob) === JSON.stringify(repoJson));
        console.log('[zhengc][6]', JSON.stringify(glob));
        console.log('[zhengc][7]', JSON.stringify(repoJson));
        console.log('[zhengc][8]', glob.headId === revived.headId);
        console.log('[zhengc][9]', glob.messages[0] === revived.messages[0]);
        console.log(revived);
        console.log(glob);
        // api.thread().import(revived);
        // glob.messages[0].message.role = revived.messages[0].message.role;
        // api.thread().import(glob);
        console.log(repoJson.messages.map(m => m.message));
        console.log(repoJson.messages.map(m => m.message) ?? []);
        const aa = repoJson.messages.map(m => m.message);
        const bb = ExportedMessageRepository.fromArray(repoJson.messages.map(m => m.message) ?? []);
        console.log(aa);
        api.thread().import(bb);
        // thread.import(repoJson);

        console.log('[chat] repoJson:', repoJson);
        // 你可以先留着验证，确认 OK 后删除
        console.log('[chat] restored messages:', api.thread().getState().messages?.length);
      } catch (e) {
        console.error('[chat] import failed', { threadId, e });
        api.thread().reset();
      }
    } else {
      console.log('[chat] no repo for thread', threadId);
    }

    // 刷新/关闭兜底保存
    const onBeforeUnload = () => {
      try {
        saveThreadRepo(threadId, api.thread().export());
      } catch (e) {
        console.error('[chat] export failed (beforeunload)', { threadId, e });
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [threadId, api]);

  return null;
}
/* eslint-enable no-console */
