export type LangCode = 'en' | 'hi' | 'mr' | string

export interface Conversation {
  id: string
  userId: string
  username: string
  avatarColor: string
  online: boolean
  senderLang: LangCode
  receiverLang: LangCode
  lastPreview?: string
  lastTime?: string
  unread?: number
}

export interface DiscoverUser {
  user_id: string
  username: string
  preferred_language: string
  avatar?: string | null
  created_at?: string
  relation_status?: 'friends' | 'pending_outgoing' | 'pending_incoming' | 'none'
  request_id?: string | null
}

export interface ContactItem {
  user_id: string
  contact_id: string
  username: string
  preferred_language: string
  avatar?: string | null
  last_interaction: string
  interaction_count: number
}

export interface ChatMessage {
  id: string
  messageId?: string
  clientMessageId?: string
  conversationId: string
  senderId: string
  originalText?: string | null
  translatedText: string
  translatedContent?: Record<LangCode, string>
  timestamp: string
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  isOptimistic?: boolean
}

export interface MessageRead {
  message_id: string
  client_message_id?: string | null
  chat_id: string
  sender_id: string
  receiver_id: string
  original_text?: string | null
  translated_text: string
  translated_content?: Record<LangCode, string> | null
  sender_lang: string
  receiver_lang: string
  timestamp: string
}

export interface AuthUser {
  user_id: string
  username: string
  preferred_language: string
  avatar?: string | null
  created_at?: string
}

export interface AuthResponse {
  user: AuthUser
}

export interface IncomingWsEnvelope {
  event: 'message' | 'typing' | 'ack' | 'error' | 'status_update'
  data: {
    type?: 'message' | 'status_update'
    id?: string
    message_id?: string
    client_message_id?: string
    chat_id?: string
    receiver_id?: string
    content?: string
    language?: string
    translated_content?: Record<LangCode, string>
    translated_text?: string
    original_text?: string
    sender_id?: string
    sender_lang?: string
    receiver_lang?: string
    delivery_status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
    is_typing?: boolean
    timestamp?: string
    message?: string
  }
}

export interface FriendRequest {
  request_id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  sender_username?: string | null
  sender_avatar?: string | null
  sender_preferred_language?: string | null
}

export interface ChatInitiateResponse {
  chat_id: string
  created: boolean
}

export interface UserSearchResponse {
  results: DiscoverUser[]
}

export interface ContactListResponse {
  contacts: ContactItem[]
}

export interface FriendRequestListResponse {
  requests: FriendRequest[]
}
