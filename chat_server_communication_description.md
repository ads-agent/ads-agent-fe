# Frontend to Backend Chat Communication

This document summarizes how the current frontend application communicates with the backend chat service (or OpenAI directly).

## Overview

The application uses a **Next.js API Route** (`/api/chat`) as a proxy to handle chat requests. The frontend client does not communicate directly with OpenAI or the custom backend; instead, it sends requests to this local API route, which then routes the request to the appropriate provider based on server-side configuration.

## Communication Flow

1.  **Frontend Client**:
    *   The chat interface is built using `assistant-ui`.
    *   It uses `AssistantChatTransport` configured to point to `/api/chat`.
    *   **File**: `src/app/[locale]/(auth)/chat/[threadId]/page.tsx`
    *   **Key Code**:
        ```typescript
        const runtime = useChatRuntime({
          transport: new AssistantChatTransport({
            api: '/api/chat',
            fetch: (input, init) => fetch(input, { ...init, credentials: 'include' }),
          }),
          // ...
        });
        ```

2.  **API Route (The Proxy)**:
    *   The server-side logic resides in `src/app/api/chat/route.ts`.
    *   It handles authentication, request parsing, and provider selection.
    *   **File**: `src/app/api/chat/route.ts`

### Provider Paths

The API route dynamically selects the provider based on the `USE_CUSTOM_CHAT_API` environment variable.

#### Path A: Custom Chat Server (Private Backend)

*   **Trigger**: `Env.USE_CUSTOM_CHAT_API === 'true'` AND `Env.CHAT_API_BASE_URL` is set.
*   **Authentication**: Retrieves the active **Clerk** session token using `auth().getToken()` and sends it as a Bearer token.
*   **Transport**: Uses `createOpenAI` with a custom `fetch` implementation.
*   **Thread Persistence**: Injects the `thread_id` from the request into the body of the upstream request, ensuring the backend can associate the message with the correct conversation history.
*   **Model**: Currently hardcoded to `gemini-2.5-flash-lite`.
*   **Key Code Pointer**:
    ```typescript
    if (Env.USE_CUSTOM_CHAT_API === 'true' && Env.CHAT_API_BASE_URL) {
      const { getToken } = await auth();
      const token = await getToken();
      const customOpenAI = createOpenAI({
        baseURL: Env.CHAT_API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` },
        fetch: async (url, options) => { /* injects thread_id */ }
      });
      // Explicitly use .chat() to force usage of /v1/chat/completions
      // instead of the new default /v1/responses endpoint
      model = customOpenAI.chat('gemini-2.5-flash-lite');
    }
    ```

#### Path B: Direct OpenAI (Public API)

*   **Trigger**: Default behavior when `USE_CUSTOM_CHAT_API` is false or missing.
*   **Authentication**: Uses the standard `OPENAI_API_KEY` (handled implicitly by the AI SDK).
*   **Model**: defaults to `gpt-4o-mini` (configurable via `OPENAI_MODEL`).
*   **Key Code Pointer**:
    ```typescript
    } else {
      const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      model = openai(modelName);
    }
    ```

## Response Streaming

Regardless of the selected path, the response is streamed back to the client using the Vercel AI SDK's `createUIMessageStreamResponse`.

*   **Format**: The stream is normalized to the AI SDK's UI message format.
*   **Error Handling**: Errors during stream execution or setup are caught and returned as JSON 500 responses or logged to the server console.
