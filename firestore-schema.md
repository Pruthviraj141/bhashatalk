# Firestore Schema: Multilingual Real-Time Chat

## 1) `users` collection
Path: `users/{user_id}`

Required fields:
- `user_id` (string)
- `username` (string)
- `email` (string)
- `preferred_language` (string, BCP-47 like `en`, `hi`, `es`)

Example:

```json
{
  "user_id": "u_001",
  "username": "pruthvi",
  "email": "user@example.com",
  "preferred_language": "en"
}
```

---

## 2) `chats` collection
Path: `chats/{chat_id}`

Required fields:
- `participants` (array<string>)
- `last_message` (map)
- `updated_at` (timestamp)

Recommended shape for `last_message`:
- `message_id` (string)
- `sender_id` (string)
- `original_text` (string)
- `translated_text` (string)
- `timestamp` (timestamp)

Example:

```json
{
  "participants": ["u_001", "u_002"],
  "last_message": {
    "message_id": "m_9001",
    "sender_id": "u_001",
    "original_text": "How are you?",
    "translated_text": "¿Cómo estás?",
    "timestamp": "<server_timestamp>"
  },
  "updated_at": "<server_timestamp>"
}
```

---

## 3) `messages` collection (scalable layout)
Use as a subcollection per chat for efficient history reads:

Path: `chats/{chat_id}/messages/{message_id}`

Required fields:
- `chat_id` (string)
- `sender_id` (string)
- `receiver_id` (string)
- `original_text` (string)
- `translated_text` (string)
- `sender_lang` (string)
- `receiver_lang` (string)
- `timestamp` (timestamp)

Example:

```json
{
  "chat_id": "chat_abc123",
  "sender_id": "u_001",
  "receiver_id": "u_002",
  "original_text": "How are you?",
  "translated_text": "¿Cómo estás?",
  "sender_lang": "en",
  "receiver_lang": "es",
  "timestamp": "<server_timestamp>"
}
```

## Efficient querying strategy

1. Chat list (real-time):
   - Query: `chats.where('participants', 'array-contains', userId).orderBy('updated_at', 'desc')`
   - Use listener (`onSnapshot`) for live updates.

2. Chat history (paged):
   - Query: `chats/{chat_id}/messages.orderBy('timestamp', 'desc').limit(50)`
   - Paginate with `startAfter(lastDoc)`.

3. Global moderation/analytics (optional):
   - Use `collectionGroup('messages')` filtered by `chat_id`, `sender_id`, or time range.

## Indexes to keep reads fast

- `chats`: `participants` (array-contains) + `updated_at` (desc)
- `messages`: `chat_id` + `timestamp` (desc)
- `messages`: `sender_id` + `timestamp` (desc)

This supports low-latency inbox loads and real-time message streams at scale.
