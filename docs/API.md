# API Reference

## REST Endpoints

### Auth (`/api`)
- `POST /api/register`
  - Request: `{ username, password, preferred_language, avatar? }`
  - Response: `{ user: UserView }`
- `POST /api/login`
  - Request: `{ username, password }`
  - Response: `{ user: UserView }`

### Discovery & Social (`/api`)
- `POST /api/users`
- `GET /api/users/search?query=&current_user_id=&limit=`
- `GET /api/contacts/{user_id}?limit=`
- `POST /api/chats/initiate`
- `POST /api/friends/requests`
- `GET /api/friends/requests/{user_id}?limit=`
- `POST /api/friends/requests/{request_id}/accept`
- `POST /api/friends/requests/{request_id}/reject`

### Chats (`/api/chats`)
- `GET /api/chats/{chat_id}/messages?limit=`

### Health
- `GET /health`
- `GET /health/ready`

## WebSocket

### Connect
- `GET /ws/{user_id}`

### Inbound message types
- `{"type":"ping"}`
- `{"type":"typing","payload":{ chat_id, sender_id, receiver_id, is_typing }}`
- `{"type":"message","payload":{ chat_id, client_message_id?, sender_id, receiver_id, message, sender_lang, receiver_lang }}`

### Outbound events
- `ack`: `{ message }`
- `typing`: `{ chat_id, sender_id, receiver_id, is_typing }`
- `message`: `{ message_id, client_message_id, chat_id, translated_text, original_text, sender_id, receiver_id, sender_lang, receiver_lang, timestamp }`
- `error`: `{ message }`

## Notes
- Existing API and WS contracts are backward-compatible with current frontend service wrappers.
- HTTP status mappings: `400/401/403/409/500` are used depending on validation/auth/conflict/server failures.
