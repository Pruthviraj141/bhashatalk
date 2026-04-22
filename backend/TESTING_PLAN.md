# FastAPI WebSocket Chat Backend - Testing Plan

## Objectives
- Validate multi-user WebSocket concurrency.
- Validate real-time message delivery latency and correctness.
- Validate Firestore persistence for each delivered message.
- Validate disconnect/reconnect behavior and connection cleanup.

## Scope
- Endpoint: `/ws/{user_id}`
- Pipeline: WebSocket route -> message pipeline service -> chat service -> message service -> connection manager
- Storage: Firestore `chats` and `messages` collections

## Test Environment
- Run app with production-like worker settings (single process first, then multi-worker if sticky sessions are configured).
- Use separate Firebase project or test namespace.
- Seed 10-100 test users.

## Pre-checks
1. Firestore indexes deployed for message history query by `chat_id` + `timestamp`.
2. Service account credentials loaded from env.
3. Server health endpoint returns OK.

## Test Cases

### 1) Multiple users connect concurrently
**Goal:** Ensure non-blocking WebSocket handling and stable connection tracking.

Steps:
1. Start 50 clients concurrently with unique `user_id`.
2. Connect each to `/ws/{user_id}`.
3. Wait for `ack` message.

Expected:
- All clients receive connection ack.
- No event-loop starvation or timeout.
- Active connection count equals connected clients.

---

### 2) Send messages between users
**Goal:** Validate pipeline processing and routing.

Steps:
1. User A sends JSON payload:
   - `sender_id`, `receiver_id`, `message`, `sender_lang`, `receiver_lang`
2. Repeat across 100-1000 messages with mixed user pairs.

Expected:
- No payload validation failures for valid data.
- Invalid payloads return `error` event without crashing connection.

---

### 3) Verify real-time delivery
**Goal:** Ensure receiver gets messages quickly.

Steps:
1. Keep sender and receiver sockets open.
2. Measure send time and receive time.
3. Compute end-to-end latency percentile.

Expected:
- Receiver gets broadcast message event.
- P95 latency within acceptable threshold (set target, e.g. < 300ms in local test).

---

### 4) Verify Firestore persistence
**Goal:** Ensure every accepted message is stored.

Steps:
1. After message send burst, query Firestore by `chat_id`.
2. Compare sent message IDs/count with stored message count.
3. Validate fields: `chat_id`, `sender_id`, `receiver_id`, `original_text`, `translated_text`, `sender_lang`, `receiver_lang`, `timestamp`.

Expected:
- No missing messages.
- Timestamp always present and ordered for history queries.

---

### 5) Disconnect and reconnect scenarios
**Goal:** Ensure no leaked stale sockets and reconnection is stable.

Steps:
1. Disconnect receiver abruptly.
2. Sender continues sending messages.
3. Reconnect receiver using same `user_id`.
4. Send new messages.

Expected:
- Old socket removed from manager.
- Reconnected socket becomes active session.
- New messages delivered to reconnected user.
- No duplicate delivery from stale connection.

---

### 6) Soak test (stability)
**Goal:** Validate long-running behavior.

Steps:
1. Run 1-2 hour test with periodic connects/disconnects and continuous traffic.
2. Monitor memory usage, open connections, and error rate.

Expected:
- Stable memory trend (no leak growth).
- Connection count tracks active clients accurately.
- Error rate remains low and recoverable.

## Metrics to Capture
- Connection success rate
- Message send success rate
- Delivery success rate
- Persistence success rate
- P50/P95/P99 delivery latency
- Reconnect success rate
- Memory/CPU over time

## Tooling Suggestions
- Async Python load generator using `websockets` + `asyncio`.
- Pytest + pytest-asyncio for integration scenarios.
- Firestore verification helper script for count/field validation.

## Pass Criteria
- 99%+ successful connections/messages in stress tests.
- 0 data loss in persisted messages for acknowledged sends.
- No sustained memory leak during soak test.
- Reconnect logic consistently replaces stale sessions.
