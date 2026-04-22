import type {
  AuthResponse,
  ChatInitiateResponse,
  ContactListResponse,
  FriendRequest,
  FriendRequestListResponse,
  MessageRead,
  UserSearchResponse,
} from '../types/chat'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'API request failed')
  }

  return (await response.json()) as T
}

export async function upsertUser(payload: {
  user_id: string
  username: string
  preferred_language: string
  avatar?: string | null
}): Promise<void> {
  await request('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function register(payload: {
  username: string
  password: string
  preferred_language: string
  avatar?: string | null
}): Promise<AuthResponse> {
  return request<AuthResponse>('/api/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function login(payload: { username: string; password: string }): Promise<AuthResponse> {
  return request<AuthResponse>('/api/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function searchUsers(query: string, currentUserId: string): Promise<UserSearchResponse> {
  const params = new URLSearchParams({ query, current_user_id: currentUserId, limit: '12' })
  return request<UserSearchResponse>(`/api/users/search?${params.toString()}`)
}

export async function getRecentContacts(userId: string): Promise<ContactListResponse> {
  return request<ContactListResponse>(`/api/contacts/${encodeURIComponent(userId)}?limit=12`)
}

export async function sendFriendRequest(senderId: string, receiverId: string): Promise<FriendRequest> {
  return request<FriendRequest>('/api/friends/requests', {
    method: 'POST',
    body: JSON.stringify({ sender_id: senderId, receiver_id: receiverId }),
  })
}

export async function getPendingFriendRequests(userId: string): Promise<FriendRequestListResponse> {
  return request<FriendRequestListResponse>(`/api/friends/requests/${encodeURIComponent(userId)}?limit=25`)
}

export async function acceptFriendRequest(requestId: string, actorId: string): Promise<FriendRequest> {
  return request<FriendRequest>(`/api/friends/requests/${encodeURIComponent(requestId)}/accept`, {
    method: 'POST',
    body: JSON.stringify({ actor_id: actorId }),
  })
}

export async function rejectFriendRequest(requestId: string, actorId: string): Promise<FriendRequest> {
  return request<FriendRequest>(`/api/friends/requests/${encodeURIComponent(requestId)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ actor_id: actorId }),
  })
}

export async function initiateChat(currentUserId: string, targetUserId: string): Promise<ChatInitiateResponse> {
  return request<ChatInitiateResponse>('/api/chats/initiate', {
    method: 'POST',
    body: JSON.stringify({ current_user_id: currentUserId, target_user_id: targetUserId }),
  })
}

export async function getChatMessages(chatId: string, limit = 50): Promise<MessageRead[]> {
  return request<MessageRead[]>(`/api/chats/${encodeURIComponent(chatId)}/messages?limit=${limit}`)
}
