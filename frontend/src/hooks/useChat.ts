import { useCallback, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useChatStore, type Language, type MessageStatus } from '@/store/chatStore';

const WS_HOST = import.meta.env.VITE_WS_HOST ?? 'ws://localhost:8000';
const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

type WsStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

interface MessageEventPayload {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  translated_content?: Partial<Record<Language, string>>;
  language: Language;
  timestamp: number;
}

interface StatusUpdatePayload {
  chat_id: string;
  message_id: string;
  status: WsStatus;
}

type WsEvent =
  | { type: 'message' } & MessageEventPayload
  | { type: 'status_update' } & StatusUpdatePayload
  | { type: 'pong' }
  | { type: 'error'; detail?: string };

function isLanguage(value: string): value is Language {
  return value === 'en' || value === 'hi' || value === 'mr';
}

function toStatus(status: WsStatus): MessageStatus {
  if (status === 'sending' || status === 'sent' || status === 'delivered' || status === 'read' || status === 'failed') {
    return status;
  }
  return 'delivered';
}

function parseWsEvent(input: unknown): WsEvent | null {
  if (typeof input !== 'object' || input === null) return null;
  const record = input as Record<string, unknown>;
  if (typeof record.type !== 'string') return null;

  if (record.type === 'message') {
    if (
      typeof record.id === 'string' &&
      typeof record.chat_id === 'string' &&
      typeof record.sender_id === 'string' &&
      typeof record.content === 'string' &&
      typeof record.timestamp === 'number' &&
      typeof record.language === 'string' &&
      isLanguage(record.language)
    ) {
      return {
        type: 'message',
        id: record.id,
        chat_id: record.chat_id,
        sender_id: record.sender_id,
        content: record.content,
        translated_content:
          typeof record.translated_content === 'object' && record.translated_content !== null
            ? (record.translated_content as Partial<Record<Language, string>>)
            : undefined,
        language: record.language,
        timestamp: record.timestamp,
      };
    }
    return null;
  }

  if (record.type === 'status_update') {
    if (
      typeof record.chat_id === 'string' &&
      typeof record.message_id === 'string' &&
      typeof record.status === 'string'
    ) {
      return {
        type: 'status_update',
        chat_id: record.chat_id,
        message_id: record.message_id,
        status: record.status as WsStatus,
      };
    }
    return null;
  }

  if (record.type === 'pong') {
    return { type: 'pong' };
  }

  if (record.type === 'error') {
    return {
      type: 'error',
      detail: typeof record.detail === 'string' ? record.detail : undefined,
    };
  }

  return null;
}

export function useChat(userId: string) {
  const { addMessage, setConnectionStatus, preferredLanguage, updateMessageStatus } = useChatStore();
  const reconnectCount = useRef(0);

  const wsUrl = userId ? `${WS_HOST}/ws/${encodeURIComponent(userId)}` : null;

  const { sendJsonMessage, readyState, lastJsonMessage } = useWebSocket(wsUrl, {
    shouldReconnect: () => {
      reconnectCount.current += 1;
      return reconnectCount.current <= MAX_RECONNECT_ATTEMPTS;
    },
    reconnectInterval: RECONNECT_INTERVAL,
    reconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    onOpen: () => {
      reconnectCount.current = 0;
      setConnectionStatus('connected');
    },
    onClose: () => setConnectionStatus('disconnected'),
    onError: () => setConnectionStatus('disconnected'),
    heartbeat: {
      message: JSON.stringify({ type: 'ping' }),
      returnMessage: '{"type":"pong"}',
      timeout: 30000,
      interval: 25000,
    },
  });

  useEffect(() => {
    if (readyState === ReadyState.CONNECTING) setConnectionStatus('connecting');
  }, [readyState, setConnectionStatus]);

  useEffect(() => {
    const event = parseWsEvent(lastJsonMessage);
    if (!event) return;

    if (event.type === 'message') {
      addMessage({
        id: event.id,
        chatId: event.chat_id,
        senderId: event.sender_id,
        content: event.content,
        translatedContent: event.translated_content
          ? {
              en: event.translated_content.en ?? event.content,
              hi: event.translated_content.hi ?? event.content,
              mr: event.translated_content.mr ?? event.content,
            }
          : undefined,
        language: event.language,
        timestamp: event.timestamp,
        status: 'delivered',
      });
      return;
    }

    if (event.type === 'status_update') {
      updateMessageStatus(event.chat_id, event.message_id, toStatus(event.status));
    }
  }, [lastJsonMessage, addMessage, updateMessageStatus]);

  const sendMessage = useCallback(
    (chatId: string, content: string, language: Language) => {
      const tempId = `optimistic-${Date.now()}`;
      addMessage({
        id: tempId,
        chatId,
        senderId: userId,
        content,
        language,
        timestamp: Date.now(),
        status: 'sending',
        isOptimistic: true,
      });

      sendJsonMessage({
        type: 'message',
        chat_id: chatId,
        content,
        language,
        target_language: preferredLanguage,
      });

      return tempId;
    },
    [sendJsonMessage, addMessage, userId, preferredLanguage],
  );

  return {
    sendMessage,
    isConnected: readyState === ReadyState.OPEN,
    isConnecting: readyState === ReadyState.CONNECTING,
  };
}
