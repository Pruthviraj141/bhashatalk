import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, MessageSquare } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthScreen } from './components/AuthScreen'
import { ChatHeader } from './components/ChatHeader'
import { ChatList } from './components/ChatList'
import { MessageBubble } from './components/MessageBubble'
import { MessageInput } from './components/MessageInput'
import { TypingDots } from './components/TypingDots'
import { StatusChip } from './components/ui/StatusChip'
import {
  acceptFriendRequest,
  getPendingFriendRequests,
  getChatMessages,
  getRecentContacts,
  initiateChat,
  login,
  rejectFriendRequest,
  register,
  searchUsers,
  sendFriendRequest,
} from './services/api'
import { ChatSocketClient } from './services/chatSocket'
import type { AuthUser, ChatMessage, ContactItem, Conversation, DiscoverUser, FriendRequest } from './types/chat'

function randomAvatarColor(seed: string) {
  const palette = ['#0ea5e9', '#10b981', '#7c3aed', '#ef4444', '#f59e0b', '#06b6d4']
  const index = seed.charCodeAt(seed.length - 1) % palette.length
  return palette[index]
}

function resolveTranslatedText(
  translatedContent: Record<string, string> | undefined,
  preferredLanguage: string,
  fallbackTranslated?: string,
  fallbackOriginal?: string | null,
) {
  const fromMap = translatedContent?.[preferredLanguage]
  if (fromMap && fromMap.trim()) return fromMap
  if (fallbackTranslated && fallbackTranslated.trim()) return fallbackTranslated
  return fallbackOriginal ?? ''
}

function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem('chat-auth-user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthUser
    } catch {
      return null
    }
  })
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState('')
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({})
  const [visibleCountByConversation, setVisibleCountByConversation] = useState<Record<string, number>>({})
  const [loadedHistoryByConversation, setLoadedHistoryByConversation] = useState<Record<string, boolean>>({})
  const [connected, setConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [showMobileList, setShowMobileList] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('chat-theme')
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DiscoverUser[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [recentContacts, setRecentContacts] = useState<ContactItem[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])

  const socketRef = useRef<ChatSocketClient | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const selectedConversationRef = useRef<Conversation | null>(null)
  const conversationsRef = useRef<Conversation[]>([])
  const recentContactsRef = useRef<ContactItem[]>([])
  const typingTimeoutRef = useRef<number | null>(null)
  const seenMessageIdsRef = useRef<Set<string>>(new Set())
  const lastContactsRefreshRef = useRef(0)
  const currentUserId = authUser?.user_id ?? ''
  const currentUserLanguage = authUser?.preferred_language ?? 'en'

  const orderedConversations = useMemo(
    () =>
      [...conversations].sort((a, b) => {
        const at = a.lastTime ? new Date(a.lastTime).getTime() : 0
        const bt = b.lastTime ? new Date(b.lastTime).getTime() : 0
        return bt - at
      }),
    [conversations],
  )

  const selectedConversation = useMemo(
    () => orderedConversations.find((item) => item.id === selectedConversationId) ?? orderedConversations[0],
    [orderedConversations, selectedConversationId],
  )

  const activeMessages = selectedConversation ? (messagesByConversation[selectedConversation.id] ?? []) : []
  const hasSendingInActiveConversation = useMemo(
    () => activeMessages.some((message) => message.senderId === currentUserId && message.deliveryStatus === 'sending'),
    [activeMessages, currentUserId],
  )
  const visibleCount = selectedConversation ? (visibleCountByConversation[selectedConversation.id] ?? 24) : 24
  const visibleMessages = useMemo(
    () => activeMessages.slice(Math.max(0, activeMessages.length - visibleCount)),
    [activeMessages, visibleCount],
  )

  useEffect(() => {
    selectedConversationRef.current = selectedConversation
  }, [selectedConversation])

  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  useEffect(() => {
    recentContactsRef.current = recentContacts
  }, [recentContacts])

  const updateConversationPreview = useCallback((conversationId: string, preview: string, timestamp: string) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              lastPreview: preview,
              lastTime: timestamp,
            }
          : conversation,
      ),
    )
  }, [])

  const appendMessage = useCallback((conversationId: string, message: ChatMessage) => {
    setMessagesByConversation((prev) => {
      const existing = prev[conversationId] ?? []
      const byMessageId = message.messageId
        ? existing.findIndex((row) => row.messageId && row.messageId === message.messageId)
        : -1
      const byClientMessageId = message.clientMessageId
        ? existing.findIndex((row) => row.clientMessageId && row.clientMessageId === message.clientMessageId)
        : -1
      const byId = existing.findIndex((row) => row.id === message.id)
      const targetIndex = [byMessageId, byClientMessageId, byId].find((index) => index >= 0) ?? -1

      const next = [...existing]
      if (targetIndex >= 0) {
        next[targetIndex] = {
          ...next[targetIndex],
          ...message,
          isOptimistic: false,
        }
      } else {
        next.push(message)
      }

      next.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      return {
        ...prev,
        [conversationId]: next,
      }
    })
  }, [])

  const updateMessageDeliveryStatus = useCallback(
    (conversationId: string, opts: { messageId?: string; clientMessageId?: string; status: ChatMessage['deliveryStatus'] }) => {
      setMessagesByConversation((prev) => {
        const current = prev[conversationId]
        if (!current?.length) return prev

        const next = current.map((message) => {
          const matchByMessageId = Boolean(opts.messageId && message.messageId === opts.messageId)
          const matchByClientMessageId = Boolean(
            opts.clientMessageId && message.clientMessageId === opts.clientMessageId,
          )
          if (!matchByMessageId && !matchByClientMessageId) return message
          return {
            ...message,
            deliveryStatus: opts.status,
            isOptimistic: opts.status === 'sending',
          }
        })

        return {
          ...prev,
          [conversationId]: next,
        }
      })
    },
    [],
  )

  const ensureConversation = useCallback((chatId: string, userId: string, username?: string, preferredLanguage?: string) => {
    setConversations((prev) => {
      const fallbackName = `User ${userId.slice(-3)}`
      const existing = prev.find((item) => item.id === chatId)
      if (existing) {
        const shouldReplaceName =
          Boolean(username?.trim()) &&
          (existing.username === fallbackName || existing.username.startsWith('User '))
        const shouldReplaceLanguage =
          Boolean(preferredLanguage?.trim()) &&
          (!existing.receiverLang || existing.receiverLang.toLowerCase() === 'en')

        if (!shouldReplaceName && !shouldReplaceLanguage) return prev

        return prev.map((item) =>
          item.id === chatId
            ? {
                ...item,
                username: shouldReplaceName ? username!.trim() : item.username,
                receiverLang: shouldReplaceLanguage ? preferredLanguage!.trim() : item.receiverLang,
              }
            : item,
        )
      }

      return [
        {
          id: chatId,
          userId,
          username: username?.trim() || fallbackName,
          avatarColor: randomAvatarColor(userId),
          online: true,
          senderLang: currentUserLanguage,
          receiverLang: preferredLanguage?.trim() || 'en',
        },
        ...prev,
      ]
    })
  }, [currentUserLanguage])

  useEffect(() => {
    if (!recentContacts.length) return

    setConversations((prev) =>
      prev.map((conversation) => {
        const matched = recentContacts.find((contact) => contact.contact_id === conversation.userId)
        if (!matched) return conversation

        return {
          ...conversation,
          username: matched.username || conversation.username,
          receiverLang: matched.preferred_language || conversation.receiverLang,
        }
      }),
    )
  }, [recentContacts])

  const loadChatHistory = useCallback(
    async (chatId: string) => {
      if (!currentUserId) return
      if (loadedHistoryByConversation[chatId]) return
      try {
        const history = await getChatMessages(chatId, 100)
        const mapped: ChatMessage[] = history
          .map((item) => ({
            id: item.message_id,
            messageId: item.message_id,
            clientMessageId: item.client_message_id ?? undefined,
            conversationId: item.chat_id,
            senderId: item.sender_id,
            originalText: item.original_text,
            translatedContent: item.translated_content ?? undefined,
            translatedText: resolveTranslatedText(
              item.translated_content ?? undefined,
              currentUserLanguage,
              item.translated_text,
              item.original_text,
            ),
            timestamp: item.timestamp,
            deliveryStatus: item.sender_id === currentUserId ? ('delivered' as const) : undefined,
          }))
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

        for (const item of mapped) {
          if (item.messageId) seenMessageIdsRef.current.add(item.messageId)
        }

        setMessagesByConversation((prev) => ({
          ...prev,
          [chatId]: mapped,
        }))
        setLoadedHistoryByConversation((prev) => ({ ...prev, [chatId]: true }))
      } catch {
        // Keep UI stable when history loading fails.
      }
    },
    [currentUserId, currentUserLanguage, loadedHistoryByConversation],
  )

  const refreshRecentContacts = useCallback(async (force = false) => {
    if (!currentUserId) return
    const now = Date.now()
    if (!force && now - lastContactsRefreshRef.current < 3000) return
    lastContactsRefreshRef.current = now

    try {
      const data = await getRecentContacts(currentUserId)
      setRecentContacts(data.contacts)
    } catch {
      // Ignore transient contact refresh errors.
    }
  }, [currentUserId])

  const refreshPendingRequests = useCallback(async () => {
    if (!currentUserId) return
    try {
      const data = await getPendingFriendRequests(currentUserId)
      setPendingRequests(data.requests)
    } catch {
      setPendingRequests([])
    }
  }, [currentUserId])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('chat-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    if (!authUser) return
    localStorage.setItem('chat-auth-user', JSON.stringify(authUser))
    refreshRecentContacts(true)
    refreshPendingRequests()
  }, [authUser, refreshPendingRequests, refreshRecentContacts])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 350)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!debouncedSearchQuery || !currentUserId) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    let active = true
    setSearchLoading(true)
    searchUsers(debouncedSearchQuery, currentUserId)
      .then((response) => {
        if (!active) return
        setSearchResults(response.results)
      })
      .catch(() => {
        if (!active) return
        setSearchResults([])
      })
      .finally(() => {
        if (!active) return
        setSearchLoading(false)
      })

    return () => {
      active = false
    }
  }, [currentUserId, debouncedSearchQuery])

  useEffect(() => {
    if (!currentUserId) return

    const client = new ChatSocketClient()
    socketRef.current = client

    client.connect(currentUserId, {
      onOpen: () => {
        setConnected(true)
        setConnectionError(null)
      },
      onClose: () => {
        setConnected(false)
      },
      onError: (message) => setConnectionError(message),
      onMessage: (event) => {
        if (event.event === 'status_update') {
          const chatId = event.data.chat_id
          const status = event.data.status ?? event.data.delivery_status
          if (!chatId || !status) return

          updateMessageDeliveryStatus(chatId, {
            messageId: event.data.message_id,
            clientMessageId: event.data.client_message_id,
            status,
          })
          return
        }

        if (event.event === 'typing') {
          const incomingChatId = event.data.chat_id
          const incomingSenderId = event.data.sender_id
          const isTypingIncoming = Boolean(event.data.is_typing)
          if (!incomingChatId || !incomingSenderId) return
          if (incomingSenderId === currentUserId) return

          const activeConversation = selectedConversationRef.current
          if (!activeConversation || activeConversation.id !== incomingChatId) return

          setIsTyping(isTypingIncoming)

          if (typingTimeoutRef.current !== null) {
            window.clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = null
          }

          if (isTypingIncoming) {
            typingTimeoutRef.current = window.setTimeout(() => {
              setIsTyping(false)
            }, 1400)
          }
          return
        }

        if (event.event !== 'message') return

        const messageId = event.data.message_id
        if (messageId && seenMessageIdsRef.current.has(messageId)) {
          return
        }

        const senderId = event.data.sender_id
        const receiverId = event.data.receiver_id
        const chatId = event.data.chat_id
        if (!senderId || !chatId) return

        const translatedContent = event.data.translated_content
        const translatedText = resolveTranslatedText(
          translatedContent,
          currentUserLanguage,
          event.data.translated_text,
          event.data.original_text,
        )
        const originalText = event.data.original_text ?? null
        const clientMessageId = event.data.client_message_id
        const timestamp = event.data.timestamp ?? new Date().toISOString()
        const deliveryStatus = event.data.delivery_status ?? ('delivered' as const)

        const counterpartId =
          senderId === currentUserId
            ? receiverId ?? selectedConversationRef.current?.userId ?? senderId
            : senderId
        const knownConversation = conversationsRef.current.find((item) => item.userId === counterpartId)
        const knownContact = recentContactsRef.current.find((item) => item.contact_id === counterpartId)
        const resolvedUsername = knownConversation?.username ?? knownContact?.username
        const resolvedLanguage = knownConversation?.receiverLang ?? knownContact?.preferred_language

        ensureConversation(chatId, counterpartId, resolvedUsername, resolvedLanguage)

        appendMessage(chatId, {
          id: messageId ?? crypto.randomUUID(),
          messageId,
          clientMessageId,
          conversationId: chatId,
          senderId,
          translatedText,
          translatedContent,
          originalText,
          timestamp,
          deliveryStatus,
          isOptimistic: false,
        })

        updateConversationPreview(chatId, translatedText, timestamp)
        if (messageId) seenMessageIdsRef.current.add(messageId)
        refreshRecentContacts()
      },
    })

    return () => {
      client.disconnect()
      setConnected(false)
      if (typingTimeoutRef.current !== null) {
        window.clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    }
  }, [
    appendMessage,
    currentUserId,
    currentUserLanguage,
    ensureConversation,
    refreshRecentContacts,
    updateConversationPreview,
    updateMessageDeliveryStatus,
  ])

  useEffect(() => {
    if (!selectedConversation?.id) return
    setIsTyping(false)
    loadChatHistory(selectedConversation.id)
  }, [loadChatHistory, selectedConversation?.id])

  useEffect(() => {
    if (!listRef.current) return

    const container = listRef.current
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    const nearBottom = distanceFromBottom < 100
    if (nearBottom) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    }
  }, [visibleMessages])

  const openConversation = useCallback(
    async (target: { userId: string; username: string; preferredLanguage: string }) => {
      if (!currentUserId) return
      try {
        const initiated = await initiateChat(currentUserId, target.userId)
        ensureConversation(initiated.chat_id, target.userId, target.username, target.preferredLanguage)
        setSelectedConversationId(initiated.chat_id)
        setShowMobileList(false)
        await loadChatHistory(initiated.chat_id)
        await refreshRecentContacts(true)
      } catch {
        // Ignore navigation failure to keep UI stable.
      }
    },
    [currentUserId, ensureConversation, loadChatHistory, refreshRecentContacts],
  )

  const sendMessage = useCallback(
    (text: string) => {
      if (!currentUserId) return
      const socket = socketRef.current
      if (!socket) return

      const activeConversation = selectedConversationRef.current
      if (!activeConversation) return

      const clientMessageId = crypto.randomUUID()
      const optimisticId = `temp-${Date.now()}`
      const timestamp = new Date().toISOString()

      appendMessage(activeConversation.id, {
        id: optimisticId,
        clientMessageId,
        conversationId: activeConversation.id,
        senderId: currentUserId,
        originalText: text,
        translatedText: text,
        translatedContent: {
          [activeConversation.senderLang]: text,
        },
        timestamp,
        deliveryStatus: 'sending',
        isOptimistic: true,
      })
      updateConversationPreview(activeConversation.id, text, timestamp)

      socket.sendMessage({
        chat_id: activeConversation.id,
        client_message_id: clientMessageId,
        sender_id: currentUserId,
        receiver_id: activeConversation.userId,
        message: text,
        sender_lang: activeConversation.senderLang,
        receiver_lang: activeConversation.receiverLang,
      })
    },
    [appendMessage, currentUserId, updateConversationPreview],
  )

  const loadOlderMessages = useCallback(() => {
    if (!selectedConversation) return
    setVisibleCountByConversation((prev) => ({
      ...prev,
      [selectedConversation.id]: (prev[selectedConversation.id] ?? 24) + 24,
    }))
  }, [selectedConversation])

  const handleLogin = useCallback(async (payload: { username: string; password: string }) => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      const response = await login(payload)
      setAuthUser(response.user)
      setConversations([])
      setMessagesByConversation({})
      setLoadedHistoryByConversation({})
      setSelectedConversationId('')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setAuthLoading(false)
    }
  }, [])

  const handleRegister = useCallback(
    async (payload: { username: string; password: string; preferred_language: string }) => {
      setAuthLoading(true)
      setAuthError(null)
      try {
        const response = await register(payload)
        setAuthUser(response.user)
        setConversations([])
        setMessagesByConversation({})
        setLoadedHistoryByConversation({})
        setSelectedConversationId('')
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Registration failed')
      } finally {
        setAuthLoading(false)
      }
    },
    [],
  )

  const handleSendFriendRequest = useCallback(
    async (user: DiscoverUser) => {
      if (!currentUserId) return
      try {
        const created = await sendFriendRequest(currentUserId, user.user_id)
        setSearchResults((prev) =>
          prev.map((row) =>
            row.user_id === user.user_id
              ? {
                  ...row,
                  relation_status: 'pending_outgoing',
                  request_id: created.request_id,
                }
              : row,
          ),
        )
      } catch {
        // ignore transient conflicts in UI
      }
    },
    [currentUserId],
  )

  const handleAcceptRequest = useCallback(
    async (request: FriendRequest) => {
      if (!currentUserId) return
      try {
        await acceptFriendRequest(request.request_id, currentUserId)
        setPendingRequests((prev) => prev.filter((item) => item.request_id !== request.request_id))
        await refreshRecentContacts(true)
        await openConversation({
          userId: request.sender_id,
          username: request.sender_username ?? `User ${request.sender_id.slice(-3)}`,
          preferredLanguage: request.sender_preferred_language ?? 'en',
        })
        if (debouncedSearchQuery) {
          const updated = await searchUsers(debouncedSearchQuery, currentUserId)
          setSearchResults(updated.results)
        }
      } catch {
        // Keep UI stable.
      }
    },
    [currentUserId, debouncedSearchQuery, openConversation, refreshRecentContacts],
  )

  const handleRejectRequest = useCallback(
    async (requestId: string) => {
      if (!currentUserId) return
      try {
        await rejectFriendRequest(requestId, currentUserId)
        setPendingRequests((prev) => prev.filter((item) => item.request_id !== requestId))
      } catch {
        // Keep UI stable.
      }
    },
    [currentUserId],
  )

  const handleTyping = useCallback(
    (typing: boolean) => {
      const socket = socketRef.current
      const activeConversation = selectedConversationRef.current
      if (!socket || !activeConversation || !currentUserId || !connected) return

      socket.sendTyping({
        chat_id: activeConversation.id,
        sender_id: currentUserId,
        receiver_id: activeConversation.userId,
        is_typing: typing,
      })
    },
    [connected, currentUserId],
  )

  const handleLogout = useCallback(() => {
    socketRef.current?.disconnect()
    setAuthUser(null)
    setConversations([])
    setMessagesByConversation({})
    setLoadedHistoryByConversation({})
    setSelectedConversationId('')
    setSearchQuery('')
    setSearchResults([])
    setRecentContacts([])
    setPendingRequests([])
    setConnected(false)
    setConnectionError(null)
    setIsTyping(false)
    seenMessageIdsRef.current.clear()
    localStorage.removeItem('chat-auth-user')
  }, [])

  if (!authUser) {
    return <AuthScreen loading={authLoading} error={authError} onLogin={handleLogin} onRegister={handleRegister} />
  }

  return (
    <main className="mx-auto flex h-[100svh] max-w-[1600px] p-3 transition-colors md:p-5">
      <section
        className={[
          'app-shell h-full w-full overflow-hidden rounded-3xl transition-colors md:flex md:max-w-[390px]',
          showMobileList ? 'flex' : 'hidden md:flex',
        ].join(' ')}
      >
        <ChatList
          currentUsername={authUser.username}
          onLogout={handleLogout}
          conversations={orderedConversations}
          selectedId={selectedConversationId}
          onSelect={(id) => {
            setSelectedConversationId(id)
            setShowMobileList(false)
          }}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          searchResults={searchResults}
          searchLoading={searchLoading}
          onSelectSearchUser={(user) => {
            if (user.relation_status !== 'friends') return
            setSearchQuery('')
            setSearchResults([])
            openConversation({
              userId: user.user_id,
              username: user.username,
              preferredLanguage: user.preferred_language,
            })
          }}
          onSendFriendRequest={handleSendFriendRequest}
          pendingRequests={pendingRequests}
          onAcceptRequest={handleAcceptRequest}
          onRejectRequest={handleRejectRequest}
          recentContacts={recentContacts}
          onSelectRecentContact={(contact) =>
            openConversation({
              userId: contact.contact_id,
              username: contact.username,
              preferredLanguage: contact.preferred_language,
            })
          }
        />
      </section>

      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={showMobileList ? 'mobile-list-open' : 'mobile-chat-open'}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={[
            'app-shell h-full w-full flex-col overflow-hidden transition-colors md:ml-4 md:flex md:rounded-3xl',
            showMobileList ? 'hidden md:flex' : 'flex',
          ].join(' ')}
        >
          <div className="flex items-center border-b border-slate-200/80 px-3 py-2 dark:border-slate-800/80 md:hidden">
            <button
              type="button"
              onClick={() => setShowMobileList(true)}
              className="mr-2 grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Back to chats"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setShowMobileList(true)}
              className="ml-auto grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Open chat list"
            >
              <MessageSquare size={17} />
            </button>
          </div>

          <ChatHeader
            conversation={selectedConversation}
            connected={connected}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((value) => !value)}
          />

          {!connected && (
            <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50/80 px-4 py-2 text-xs dark:border-amber-500/30 dark:bg-amber-500/10">
              <span className="text-amber-700 dark:text-amber-300">{connectionError ?? 'Connecting to real-time server...'}</span>
              <StatusChip tone="reconnecting" label="Reconnecting" compact />
            </div>
          )}

          <div ref={listRef} className="flex-1 overflow-y-auto bg-transparent px-4 py-4 transition-colors md:px-6 md:py-5">
            {selectedConversation && activeMessages.length > visibleCount && (
              <div className="mb-3 flex justify-center">
                <button
                  type="button"
                  onClick={loadOlderMessages}
                  className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Load older messages
                </button>
              </div>
            )}

            {activeMessages.length === 0 ? (
              <div className="grid h-full place-items-center">
                <div className="panel-soft max-w-md rounded-3xl px-8 py-9 text-center">
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {selectedConversation ? 'Start the conversation' : 'Your workspace is ready'}
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {selectedConversation
                      ? 'Send your first message. Translation and delivery updates will appear instantly.'
                      : 'Search users, send a friend request, and open a chat to begin.'}
                  </p>
                </div>
              </div>
            ) : (
              visibleMessages.map((item) => (
                <MessageBubble key={item.id} item={item} mine={item.senderId === currentUserId} />
              ))
            )}

            {isTyping && <TypingDots />}
          </div>

          <MessageInput
            onSend={sendMessage}
            onTyping={handleTyping}
            disabled={!selectedConversation}
            sending={connected && hasSendingInActiveConversation}
          />
        </motion.section>
      </AnimatePresence>
    </main>
  )
}

export default App
