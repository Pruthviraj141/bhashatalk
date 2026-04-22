import clsx from 'clsx'
import { Search } from 'lucide-react'
import { useState } from 'react'
import type { ContactItem, Conversation, DiscoverUser, FriendRequest } from '../types/chat'
import { formatConversationTime } from '../utils/time'

interface ChatListProps {
  currentUsername: string
  onLogout: () => void
  conversations: Conversation[]
  selectedId: string
  onSelect: (id: string) => void
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  searchResults: DiscoverUser[]
  searchLoading: boolean
  onSelectSearchUser: (user: DiscoverUser) => void
  onSendFriendRequest: (user: DiscoverUser) => void
  pendingRequests: FriendRequest[]
  onAcceptRequest: (request: FriendRequest) => void
  onRejectRequest: (requestId: string) => void
  recentContacts: ContactItem[]
  onSelectRecentContact: (contact: ContactItem) => void
}

export function ChatList({
  currentUsername,
  onLogout,
  conversations,
  selectedId,
  onSelect,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  searchLoading,
  onSelectSearchUser,
  onSendFriendRequest,
  pendingRequests,
  onAcceptRequest,
  onRejectRequest,
  recentContacts,
  onSelectRecentContact,
}: ChatListProps) {
  const [showRequests, setShowRequests] = useState(false)

  return (
    <aside className="panel-surface flex h-full w-full flex-col border-r border-slate-200/80 dark:border-slate-800/80 md:max-w-sm">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/90 px-4 py-4 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/85">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">Inbox</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as {currentUsername}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
          >
            Logout
          </button>
        </div>

        <div className="field-shell mt-3">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-slate-400 dark:text-slate-500" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Search by username"
              className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {searchQuery.trim().length > 0 && (
          <div className="panel-soft mt-2 max-h-56 overflow-y-auto rounded-2xl p-1.5">
            {searchLoading ? (
              <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">Searching…</div>
            ) : searchResults.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">No users found</div>
            ) : (
              searchResults.map((user) => (
                <div
                  key={user.user_id}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/70"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.username}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.user_id}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
                      {user.preferred_language}
                    </span>

                    {user.relation_status === 'friends' ? (
                      <button
                        type="button"
                        onClick={() => onSelectSearchUser(user)}
                        className="rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500"
                      >
                        Message
                      </button>
                    ) : user.relation_status === 'pending_outgoing' ? (
                      <span className="rounded-lg border border-amber-500 px-2 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-300">
                        Requested
                      </span>
                    ) : user.relation_status === 'pending_incoming' ? (
                      <span className="rounded-lg border border-brand-500 px-2 py-1 text-[11px] font-semibold text-brand-700 dark:text-brand-300">
                        Respond in Requests
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSendFriendRequest(user)}
                        className="rounded-lg bg-brand-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-brand-500"
                      >
                        Add Friend
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-2.5 py-2.5">
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setShowRequests((value) => !value)}
            className="panel-soft flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left transition hover:border-primary-300/50 hover:bg-primary-50/40 dark:hover:border-primary-700/40 dark:hover:bg-primary-500/10"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Friend Requests</span>
            <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-semibold text-white">
              {pendingRequests.length}
            </span>
          </button>

          {showRequests && (
            <div className="mt-2 space-y-1">
              {pendingRequests.length === 0 ? (
                <div className="panel-soft rounded-xl px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                  No pending requests
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div
                    key={request.request_id}
                    className="panel-soft w-full rounded-2xl px-3 py-2.5"
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {request.sender_username ?? request.sender_id}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatConversationTime(request.created_at)}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onAcceptRequest(request)}
                        className="rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => onRejectRequest(request.request_id)}
                        className="rounded-lg bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-500"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {recentContacts.length > 0 && (
          <div className="mb-3">
            <p className="section-label">
              Recent Contacts
            </p>
            <div className="space-y-1">
              {recentContacts.slice(0, 5).map((contact) => (
                <button
                  key={`${contact.user_id}-${contact.contact_id}`}
                  type="button"
                  onClick={() => onSelectRecentContact(contact)}
                  className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{contact.username}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatConversationTime(contact.last_interaction)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="section-label">Conversations</p>

        {conversations.map((conversation) => {
          const isActive = conversation.id === selectedId
          return (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={clsx(
                'mb-1.5 w-full rounded-2xl border px-3 py-3 text-left transition-all duration-200',
                isActive
                  ? 'border-primary-300/60 bg-gradient-to-r from-primary-50 to-primary-100/50 shadow-sm dark:border-primary-700/50 dark:bg-primary-500/10'
                  : 'border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50 active:scale-[0.995] dark:hover:border-slate-700 dark:hover:bg-slate-800/80',
              )}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold text-white shadow-chat"
                    style={{ backgroundColor: conversation.avatarColor }}
                  >
                    {conversation.username.slice(0, 1).toUpperCase()}
                  </div>
                  <span
                    className={clsx(
                      'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900',
                      conversation.online ? 'bg-emerald-500' : 'bg-slate-400',
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                      {conversation.username}
                    </p>
                    <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                      {formatConversationTime(conversation.lastTime)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-slate-600 dark:text-slate-400">
                    {conversation.lastPreview ?? 'No messages yet'}
                    </p>
                    {!!conversation.unread && conversation.unread > 0 && (
                      <span className="rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
