import asyncio
import json
import uuid
import urllib.request

import websockets

BASE = "http://127.0.0.1:8001"
WS_BASE = "ws://127.0.0.1:8001"


def post(path: str, payload: dict) -> dict:
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{BASE}{path}",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def get(path: str) -> dict:
    request = urllib.request.Request(f"{BASE}{path}", method="GET")
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


async def recv_message(ws):
    while True:
        packet = json.loads(await ws.recv())
        if packet.get("event") == "message":
            return packet["data"]


async def wait_for_message(ws, timeout: float = 25.0):
    return await asyncio.wait_for(recv_message(ws), timeout=timeout)


async def wait_for_socket_ready(ws, timeout: float = 10.0):
    return await asyncio.wait_for(ws.recv(), timeout=timeout)


async def run_test() -> None:
    suffix = uuid.uuid4().hex[:6]

    en_user = post(
        "/api/register",
        {
            "username": f"en_demo_{suffix}",
            "password": "secret123",
            "preferred_language": "en",
        },
    )["user"]

    hi_user = post(
        "/api/register",
        {
            "username": f"hi_demo_{suffix}",
            "password": "secret123",
            "preferred_language": "hi",
        },
    )["user"]

    post(
        "/api/friends/requests",
        {
            "sender_id": en_user["user_id"],
            "receiver_id": hi_user["user_id"],
        },
    )

    requests = get(f"/api/friends/requests/{hi_user['user_id']}?limit=25")["requests"]
    req = next((item for item in requests if item["sender_id"] == en_user["user_id"]), None)
    if req is None:
        raise RuntimeError("Friend request was not found for target user")

    post(f"/api/friends/requests/{req['request_id']}/accept", {"actor_id": hi_user["user_id"]})

    chat_id = post(
        "/api/chats/initiate",
        {
            "current_user_id": en_user["user_id"],
            "target_user_id": hi_user["user_id"],
        },
    )["chat_id"]

    async with websockets.connect(f"{WS_BASE}/ws/{en_user['user_id']}") as ws_en, websockets.connect(
        f"{WS_BASE}/ws/{hi_user['user_id']}"
    ) as ws_hi:
        await wait_for_socket_ready(ws_en)
        await wait_for_socket_ready(ws_hi)

        cid1 = uuid.uuid4().hex
        await ws_en.send(
            json.dumps(
                {
                    "type": "message",
                    "payload": {
                        "chat_id": chat_id,
                        "client_message_id": cid1,
                        "sender_id": en_user["user_id"],
                        "receiver_id": hi_user["user_id"],
                        "message": "Hello friend",
                        "sender_lang": "en",
                        "receiver_lang": "hi",
                    },
                }
            )
        )

        en_self, hi_recv = await asyncio.gather(wait_for_message(ws_en), wait_for_message(ws_hi))

        cid2 = uuid.uuid4().hex
        await ws_hi.send(
            json.dumps(
                {
                    "type": "message",
                    "payload": {
                        "chat_id": chat_id,
                        "client_message_id": cid2,
                        "sender_id": hi_user["user_id"],
                        "receiver_id": en_user["user_id"],
                        "message": "नमस्ते दोस्त",
                        "sender_lang": "hi",
                        "receiver_lang": "en",
                    },
                }
            )
        )

        hi_self, en_recv = await asyncio.gather(wait_for_message(ws_hi), wait_for_message(ws_en))

    history = get(f"/api/chats/{chat_id}/messages?limit=10")
    ids = [msg["message_id"] for msg in history]

    same_id_en_hi = en_self["message_id"] == hi_recv["message_id"]
    same_id_hi_en = hi_self["message_id"] == en_recv["message_id"]
    no_dupes = len(ids) == len(set(ids))
    en_hi_translation = (hi_recv.get("translated_text") or "").strip()
    hi_en_translation = (en_recv.get("translated_text") or "").strip()

    print("EN->HI same id:", same_id_en_hi)
    print("EN->HI translated:", en_hi_translation)
    print("HI->EN same id:", same_id_hi_en)
    print("HI->EN translated:", hi_en_translation)
    print("No duplicate history IDs:", no_dupes)

    if not same_id_en_hi:
        raise RuntimeError("EN->HI message_id mismatch between sender and receiver packets")
    if not same_id_hi_en:
        raise RuntimeError("HI->EN message_id mismatch between sender and receiver packets")
    if not en_hi_translation:
        raise RuntimeError("EN->HI translated_text is empty")
    if not hi_en_translation:
        raise RuntimeError("HI->EN translated_text is empty")
    if not no_dupes:
        raise RuntimeError("Duplicate message_id values found in chat history")

    print("SMOKE_TEST_PASS")


if __name__ == "__main__":
    asyncio.run(run_test())
