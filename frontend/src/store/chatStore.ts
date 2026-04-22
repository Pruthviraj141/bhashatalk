import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type Language = 'en' | 'hi' | 'mr';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  translatedContent?: Record<Language, string>;
  language: Language;
  timestamp: number;
  status: MessageStatus;
  isOptimistic?: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: number;
}

export interface User {
  id: string;
  displayName: string;
  preferredLanguage: Language;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen?: number;
}

interface ChatState {
  currentUser: User | null;
  chats: Record<string, Chat>;
  messages: Record<string, Message[]>;
  users: Record<string, User>;

  activeChatId: string | null;
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  preferredLanguage: Language;
  searchQuery: string;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';

  setCurrentUser: (user: User) => void;
  setActiveChat: (chatId: string | null) => void;
  addMessage: (msg: Message) => void;
  updateMessageStatus: (chatId: string, msgId: string, status: MessageStatus) => void;
  removeOptimisticMessage: (chatId: string, tempId: string) => void;
  setConnectionStatus: (s: ChatState['connectionStatus']) => void;
  setPreferredLanguage: (lang: Language) => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  setSearchQuery: (q: string) => void;
  upsertChat: (chat: Chat) => void;
  upsertUser: (user: User) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set) => ({
        currentUser: null,
        chats: {},
        messages: {},
        users: {},
        activeChatId: null,
        sidebarOpen: true,
        theme: 'system',
        preferredLanguage: 'en',
        searchQuery: '',
        connectionStatus: 'disconnected',

        setCurrentUser: (user) => set({ currentUser: user }),
        setActiveChat: (chatId) => set({ activeChatId: chatId }),

        addMessage: (msg) =>
          set((state) => {
            const existing = state.messages[msg.chatId] ?? [];
            const deduplicated = existing.filter(
              (m) => m.id !== msg.id && !(m.isOptimistic && m.content === msg.content),
            );
            const existingChat = state.chats[msg.chatId];
            const updatedChat: Chat = {
              id: existingChat?.id ?? msg.chatId,
              participants: existingChat?.participants ?? [msg.senderId],
              unreadCount: existingChat?.unreadCount ?? 0,
              updatedAt: msg.timestamp,
              lastMessage: msg,
            };

            return {
              messages: {
                ...state.messages,
                [msg.chatId]: [...deduplicated, msg].sort((a, b) => a.timestamp - b.timestamp),
              },
              chats: {
                ...state.chats,
                [msg.chatId]: updatedChat,
              },
            };
          }),

        updateMessageStatus: (chatId, msgId, status) =>
          set((state) => ({
            messages: {
              ...state.messages,
              [chatId]: (state.messages[chatId] ?? []).map((m) =>
                m.id === msgId ? { ...m, status } : m,
              ),
            },
          })),

        removeOptimisticMessage: (chatId, tempId) =>
          set((state) => ({
            messages: {
              ...state.messages,
              [chatId]: (state.messages[chatId] ?? []).filter((m) => m.id !== tempId),
            },
          })),

        setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
        setPreferredLanguage: (preferredLanguage) => set({ preferredLanguage }),
        toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
        toggleTheme: () =>
          set((s) => ({
            theme: s.theme === 'light' ? 'dark' : s.theme === 'dark' ? 'system' : 'light',
          })),
        setSearchQuery: (searchQuery) => set({ searchQuery }),
        upsertChat: (chat) => set((s) => ({ chats: { ...s.chats, [chat.id]: chat } })),
        upsertUser: (user) => set((s) => ({ users: { ...s.users, [user.id]: user } })),
      }),
      {
        name: 'chat-store',
        partialize: (s) => ({ preferredLanguage: s.preferredLanguage, theme: s.theme }),
      },
    ),
  ),
);
