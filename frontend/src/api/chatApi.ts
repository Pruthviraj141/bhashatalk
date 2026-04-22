import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

interface ChatListItem {
  id: string;
  participants: string[];
  updated_at?: string;
}

interface SendMessagePayload {
  chatId: string;
  content: string;
  language: string;
}

interface SendMessageResponse {
  message_id?: string;
  status?: string;
}

async function handleJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return (await response.json()) as T;
}

export function useChatsQuery(userId: string) {
  return useQuery({
    queryKey: ['chats', userId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/chats?user_id=${encodeURIComponent(userId)}`);
      return handleJsonResponse<ChatListItem[]>(response);
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useSendMessageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      const response = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleJsonResponse<SendMessageResponse>(response);
    },
    onSettled: (_data, _error, vars) =>
      qc.invalidateQueries({ queryKey: ['chats', vars.chatId] }),
  });
}
