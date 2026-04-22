from datetime import UTC, datetime, timedelta
from functools import lru_cache
import logging
import re
from uuid import uuid4

import bcrypt
from firebase_admin import firestore
from google.api_core.exceptions import AlreadyExists, GoogleAPICallError, RetryError
from starlette.concurrency import run_in_threadpool

from app.core.firebase import get_firestore_client
from app.schemas.chat import MessageRead, UserProfile
from app.schemas.discovery import ContactView, FriendRequestView, UserView

logger = logging.getLogger(__name__)


class FirebaseServiceError(RuntimeError):
    """Base error for Firebase service operations."""


class FirebaseConflictError(FirebaseServiceError):
    """Raised when creating a resource that already exists."""


class FirebaseService:
    """
    Service-layer abstraction for Firestore operations.

    Keeps DB logic out of API routes and centralizes error handling.
    """

    def __init__(self, db: firestore.Client | None = None) -> None:
        self._db = db or get_firestore_client()

    async def ping(self) -> bool:
        """Lightweight Firestore connectivity check used by health endpoints."""

        def _probe() -> bool:
            self._db.collection("_healthcheck").document("ping")
            return True

        return await run_in_threadpool(_probe)

    @staticmethod
    def _normalize_username(username: str) -> str:
        normalized = re.sub(r"\s+", "", username.strip().lower())
        if not normalized:
            raise FirebaseServiceError("Username cannot be empty")
        return normalized

    @staticmethod
    def _build_prefixes(value: str) -> list[str]:
        base = value.strip().lower()
        return [base[:i] for i in range(1, len(base) + 1)]

    @staticmethod
    def _pair_key(user_a: str, user_b: str) -> str:
        a, b = sorted([user_a, user_b])
        return f"{a}:{b}"

    def create_user(
        self,
        user_id: str,
        username: str,
        email: str,
        preferred_language: str,
    ) -> UserProfile:
        return self.upsert_user(
            user_id=user_id,
            username=username,
            preferred_language=preferred_language,
            avatar=None,
            email=email,
        )

    def upsert_user(
        self,
        user_id: str,
        username: str,
        preferred_language: str,
        avatar: str | None = None,
        email: str | None = None,
    ) -> UserProfile:
        normalized = self._normalize_username(username)
        now = datetime.now(UTC)

        user_ref = self._db.collection("users").document(user_id)
        username_ref = self._db.collection("username_registry").document(normalized)

        try:
            existing_username = username_ref.get()
            if existing_username.exists:
                owner = (existing_username.to_dict() or {}).get("user_id")
                if owner and owner != user_id:
                    raise FirebaseConflictError("Username already taken")

            current_user = user_ref.get()
            current_data = current_user.to_dict() if current_user.exists else {}

            previous_normalized = (current_data or {}).get("username_lower")
            if previous_normalized and previous_normalized != normalized:
                old_ref = self._db.collection("username_registry").document(previous_normalized)
                old_ref.delete()

            user_payload = {
                "user_id": user_id,
                "username": username,
                "username_lower": normalized,
                "username_prefixes": self._build_prefixes(normalized),
                "preferred_language": preferred_language,
                "avatar": avatar,
                "email": email,
                "created_at": (current_data or {}).get("created_at") or now,
                "updated_at": now,
            }

            user_ref.set(user_payload, merge=True)
            username_ref.set(
                {
                    "user_id": user_id,
                    "username_lower": normalized,
                    "created_at": now,
                },
                merge=True,
            )

            return UserProfile(
                user_id=user_payload["user_id"],
                username=user_payload["username"],
                email=user_payload["email"],
                preferred_language=user_payload["preferred_language"],
                avatar=user_payload["avatar"],
                created_at=user_payload["created_at"],
            )
        except FirebaseConflictError:
            raise
        except (GoogleAPICallError, RetryError) as exc:
            raise FirebaseServiceError("Failed to upsert user in Firestore") from exc

    def register_user(
        self,
        username: str,
        password: str,
        preferred_language: str,
        avatar: str | None = None,
    ) -> UserView:
        normalized = self._normalize_username(username)
        now = datetime.now(UTC)

        username_ref = self._db.collection("username_registry").document(normalized)
        existing_username = username_ref.get()
        if existing_username.exists:
            raise FirebaseConflictError("Username already taken")

        user_id = f"u_{uuid4().hex[:12]}"
        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        payload = {
            "user_id": user_id,
            "username": username,
            "username_lower": normalized,
            "username_prefixes": self._build_prefixes(normalized),
            "preferred_language": preferred_language,
            "avatar": avatar,
            "created_at": now,
            "updated_at": now,
            "password_hash": password_hash,
        }

        try:
            self._db.collection("users").document(user_id).set(payload)
            username_ref.set(
                {
                    "user_id": user_id,
                    "username_lower": normalized,
                    "created_at": now,
                },
                merge=True,
            )

            return UserView(
                user_id=user_id,
                username=username,
                preferred_language=preferred_language,
                avatar=avatar,
                created_at=now,
            )
        except (GoogleAPICallError, RetryError) as exc:
            raise FirebaseServiceError("Failed to register user") from exc

    def login_user(self, username: str, password: str) -> UserView:
        normalized = self._normalize_username(username)

        try:
            username_doc = self._db.collection("username_registry").document(normalized).get()
            if not username_doc.exists:
                raise FirebaseServiceError("Invalid username or password")

            user_id = (username_doc.to_dict() or {}).get("user_id")
            if not user_id:
                raise FirebaseServiceError("Invalid username or password")

            user_doc = self._db.collection("users").document(user_id).get()
            if not user_doc.exists:
                raise FirebaseServiceError("Invalid username or password")

            data = user_doc.to_dict() or {}
            stored_hash = data.get("password_hash")
            if not stored_hash:
                raise FirebaseServiceError("Account credentials are not initialized")

            valid = bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
            if not valid:
                raise FirebaseServiceError("Invalid username or password")

            return UserView(
                user_id=data.get("user_id", user_id),
                username=data.get("username", username),
                preferred_language=data.get("preferred_language", "en"),
                avatar=data.get("avatar"),
                created_at=data.get("created_at"),
            )
        except FirebaseServiceError:
            raise
        except (GoogleAPICallError, RetryError) as exc:
            raise FirebaseServiceError("Failed to login user") from exc

    def get_user_by_id(self, user_id: str) -> UserProfile | None:
        try:
            snapshot = (
                self._db.collection("users")
                .document(user_id)
                .get(
                    field_paths=[
                        "user_id",
                        "username",
                        "email",
                        "preferred_language",
                    ]
                )
            )

            if not snapshot.exists:
                return None

            data = snapshot.to_dict() or {}
            data.setdefault("user_id", user_id)
            return UserProfile(**data)
        except (GoogleAPICallError, RetryError) as exc:
            raise FirebaseServiceError("Failed to fetch user from Firestore") from exc

    def get_user_preferred_language(self, user_id: str) -> str | None:
        try:
            snapshot = (
                self._db.collection("users")
                .document(user_id)
                .get(field_paths=["preferred_language"])
            )
            if not snapshot.exists:
                return None
            data = snapshot.to_dict() or {}
            lang = data.get("preferred_language")
            if isinstance(lang, str) and lang.strip():
                return lang.strip().lower()
            return None
        except (GoogleAPICallError, RetryError) as exc:
            raise FirebaseServiceError("Failed to fetch preferred language") from exc

    def search_users(
        self,
        query: str,
        current_user_id: str,
        limit: int = 15,
        include_relationship_state: bool = True,
    ) -> list[UserView]:
        normalized = self._normalize_username(query)
        page_size = max(1, min(limit, 15))

        try:
            docs = (
                self._db.collection("users")
                .where("username_prefixes", "array_contains", normalized)
                .limit(page_size + 5)
                .stream()
            )

            results: list[UserView] = []
            for doc in docs:
                data = doc.to_dict() or {}
                if data.get("user_id") == current_user_id:
                    continue
                results.append(
                    UserView(
                        user_id=data.get("user_id", doc.id),
                        username=data.get("username", ""),
                        preferred_language=data.get("preferred_language", "en"),
                        avatar=data.get("avatar"),
                        created_at=data.get("created_at"),
                    )
                )
                if len(results) >= page_size:
                    break

            if include_relationship_state and results:
                relation_map = self.get_relationship_status_map(
                    user_id=current_user_id,
                    target_user_ids=[item.user_id for item in results],
                )
                results = [
                    item.model_copy(
                        update={
                            "relation_status": relation_map.get(item.user_id, {}).get("status", "none"),
                            "request_id": relation_map.get(item.user_id, {}).get("request_id"),
                        }
                    )
                    for item in results
                ]

            return results
        except (GoogleAPICallError, RetryError) as exc:
            raise FirebaseServiceError("Failed to search users") from exc

    def get_relationship_status_map(self, user_id: str, target_user_ids: list[str]) -> dict[str, dict[str, str | None]]:
        relation_map: dict[str, dict[str, str | None]] = {
            target: {"status": "none", "request_id": None} for target in target_user_ids if target != user_id
        }

        if not relation_map:
            return {}

        try:
            for target in list(relation_map.keys()):
                if self.are_friends(user_id, target):
                    relation_map[target] = {"status": "friends", "request_id": None}

            pending_requests = (
                self._db.collection("friend_requests")
                .where("status", "==", "pending")
                .where("participants", "array_contains", user_id)
                .stream()
            )

            targets_set = set(relation_map.keys())
            for doc in pending_requests:
                data = doc.to_dict() or {}
                sender_id = data.get("sender_id")
                receiver_id = data.get("receiver_id")
                if sender_id not in targets_set and receiver_id not in targets_set:
                    continue

                target_id = sender_id if sender_id != user_id else receiver_id
                if target_id not in relation_map:
                    continue
                if relation_map[target_id]["status"] == "friends":
                    continue

                relation_map[target_id] = {
                    "status": "pending_outgoing" if sender_id == user_id else "pending_incoming",
                    "request_id": doc.id,
                }

            return relation_map
        except (GoogleAPICallError, RetryError) as exc:
            raise FirebaseServiceError("Failed to fetch relationship statuses") from exc

    def create_chat_if_not_exists(
        self,
        chat_id: str,
        participants: list[str],
    ) -> dict:
        unique_participants = list(dict.fromkeys(participants))
        now = datetime.now(UTC)
        payload = {
            "participants": unique_participants,
            "last_message": None,
            "updated_at": now,
        }

        try:
            self._db.collection("chats").document(chat_id).create(payload)
            return {"chat_id": chat_id, "created": True, **payload}
        except AlreadyExists:
            # Minimal-read strategy: avoid an extra read just to confirm existence.
            return {"chat_id": chat_id, "created": False}
        except (GoogleAPICallError, RetryError) as exc:
            raise FirebaseServiceError("Failed to create chat in Firestore") from exc

    @staticmethod
    def build_direct_chat_id(sender_id: str, receiver_id: str) -> str:
        a, b = sorted([sender_id, receiver_id])
        return f"direct_{a}_{b}"

    def ensure_direct_chat(self, sender_id: str, receiver_id: str) -> str:
        chat_id = self.build_direct_chat_id(sender_id, receiver_id)
        self.create_chat_if_not_exists(chat_id, [sender_id, receiver_id])
        return chat_id

    def initiate_direct_chat(self, current_user_id: str, target_user_id: str) -> tuple[str, bool]:
        chat_id = self.build_direct_chat_id(current_user_id, target_user_id)
        result = self.create_chat_if_not_exists(chat_id, [current_user_id, target_user_id])
        return chat_id, bool(result.get("created", False))

    def update_chat_last_message(self, chat_id: str, last_message: dict) -> None:
        try:
            self._db.collection("chats").document(chat_id).set(
                {
                    "last_message": last_message,
                    "updated_at": datetime.now(UTC),
                },
                merge=True,
            )
        except (GoogleAPICallError, RetryError) as exc:
            raise FirebaseServiceError("Failed to update chat metadata") from exc

    def upsert_contact(
        self,
        user_id: str,
        contact_id: str,
        interaction_time: datetime,
        create_if_missing: bool = True,
    ) -> None:
        doc_id = f"{user_id}_{contact_id}"
        ref = self._db.collection("contacts").document(doc_id)

        try:
            snapshot = ref.get()
            current = snapshot.to_dict() if snapshot.exists else {}
            if not snapshot.exists and not create_if_missing:
                return

            current_count = int((current or {}).get("interaction_count", 0))
            ref.set(
                {
                    "user_id": user_id,
                    "contact_id": contact_id,
                    "added_at": (current or {}).get("added_at") or interaction_time,
                    "last_interaction": interaction_time,
                    "interaction_count": current_count + 1,
                },
                merge=True,
            )
        except (GoogleAPICallError, RetryError) as exc:
            raise FirebaseServiceError("Failed to upsert contact") from exc

    def are_friends(self, user_id: str, target_user_id: str) -> bool:
        try:
            doc_id = f"{user_id}_{target_user_id}"
            return self._db.collection("contacts").document(doc_id).get().exists
        except (GoogleAPICallError, RetryError) as exc:
            raise FirebaseServiceError("Failed to check friendship status") from exc

    def create_friend_request(self, sender_id: str, receiver_id: str) -> FriendRequestView:
        if sender_id == receiver_id:
            raise FirebaseServiceError("Cannot send friend request to self")

        if self.are_friends(sender_id, receiver_id):
            raise FirebaseConflictError("Users are already friends")

        now = datetime.now(UTC)
        pair_key = self._pair_key(sender_id, receiver_id)

        try:
            existing = (
                self._db.collection("friend_requests")
                .where("pair_key", "==", pair_key)
                .where("status", "==", "pending")
                .limit(1)
                .stream()
            )
            existing_doc = next(existing, None)
            if existing_doc is not None:
                raise FirebaseConflictError("A pending friend request already exists")

            recent_rejected = (
                self._db.collection("friend_requests")
                .where("sender_id", "==", sender_id)
                .where("receiver_id", "==", receiver_id)
                .where("status", "==", "rejected")
                .stream()
            )
            recent_rejected_doc = None
            latest_rejected_ts: datetime | None = None
            for item in recent_rejected:
                row = item.to_dict() or {}
                candidate_ts = row.get("updated_at")
                if isinstance(candidate_ts, datetime) and (
                    latest_rejected_ts is None or candidate_ts > latest_rejected_ts
                ):
                    latest_rejected_ts = candidate_ts
                    recent_rejected_doc = item
            if recent_rejected_doc is not None:
                rejected_data = recent_rejected_doc.to_dict() or {}
                updated_at = rejected_data.get("updated_at")
                if isinstance(updated_at, datetime) and updated_at > (now - timedelta(minutes=30)):
                    raise FirebaseConflictError("Request throttled. Try again later")

            request_id = f"fr_{uuid4().hex[:18]}"
            payload = {
                "request_id": request_id,
                "sender_id": sender_id,
                "receiver_id": receiver_id,
                "participants": [sender_id, receiver_id],
                "pair_key": pair_key,
                "status": "pending",
                "created_at": now,
                "updated_at": now,
            }

            self._db.collection("friend_requests").document(request_id).set(payload)
            return FriendRequestView(**payload)
        except FirebaseServiceError:
            raise
        except FirebaseConflictError:
            raise
        except (GoogleAPICallError, RetryError) as exc:
            raise FirebaseServiceError("Failed to create friend request") from exc

    def get_pending_friend_requests(self, user_id: str, limit: int = 25) -> list[FriendRequestView]:
        page_size = max(1, min(limit, 50))
        try:
            docs = (
                self._db.collection("friend_requests")
                .where("receiver_id", "==", user_id)
                .where("status", "==", "pending")
                .stream()
            )

            rows = [doc.to_dict() or {} for doc in docs]
            rows.sort(
                key=lambda item: item.get("created_at") or datetime.fromtimestamp(0, tz=UTC),
                reverse=True,
            )
            rows = rows[:page_size]
            sender_refs = [
                self._db.collection("users").document(item.get("sender_id", ""))
                for item in rows
                if item.get("sender_id")
            ]

            sender_map: dict[str, dict] = {}
            if sender_refs:
                for sender_doc in self._db.get_all(sender_refs):
                    if sender_doc.exists:
                        sender_map[sender_doc.id] = sender_doc.to_dict() or {}

            result: list[FriendRequestView] = []
            for row in rows:
                sender_id = row.get("sender_id", "")
                sender_profile = sender_map.get(sender_id, {})
                result.append(
                    FriendRequestView(
                        request_id=row.get("request_id", ""),
                        sender_id=sender_id,
                        receiver_id=row.get("receiver_id", ""),
                        status=row.get("status", "pending"),
                        created_at=row.get("created_at", datetime.now(UTC)),
                        sender_username=sender_profile.get("username"),
                        sender_avatar=sender_profile.get("avatar"),
                        sender_preferred_language=sender_profile.get("preferred_language"),
                    )
                )
            return result
        except (GoogleAPICallError, RetryError) as exc:
            raise FirebaseServiceError("Failed to fetch friend requests") from exc

    def resolve_friend_request(self, request_id: str, actor_id: str, accept: bool) -> FriendRequestView:
        ref = self._db.collection("friend_requests").document(request_id)
        now = datetime.now(UTC)

        try:
            snapshot = ref.get()
            if not snapshot.exists:
                raise FirebaseServiceError("Friend request not found")

            data = snapshot.to_dict() or {}
            if data.get("status") != "pending":
                raise FirebaseConflictError("Friend request is no longer pending")

            if data.get("receiver_id") != actor_id:
                raise FirebaseServiceError("Only receiver can respond to this request")

            new_status = "accepted" if accept else "rejected"
            ref.set({"status": new_status, "updated_at": now}, merge=True)

            sender_id = data.get("sender_id", "")
            receiver_id = data.get("receiver_id", "")

            if accept:
                self.upsert_contact(sender_id, receiver_id, now, create_if_missing=True)
                self.upsert_contact(receiver_id, sender_id, now, create_if_missing=True)

            return FriendRequestView(
                request_id=request_id,
                sender_id=sender_id,
                receiver_id=receiver_id,
                status=new_status,
                created_at=data.get("created_at", now),
            )
        except FirebaseServiceError:
            raise
        except FirebaseConflictError:
            raise
        except (GoogleAPICallError, RetryError) as exc:
            raise FirebaseServiceError("Failed to resolve friend request") from exc

    def get_recent_contacts(self, user_id: str, limit: int = 15) -> list[ContactView]:
        page_size = max(1, min(limit, 25))

        try:
            contact_docs = (
                self._db.collection("contacts")
                .where("user_id", "==", user_id)
                .stream()
            )

            contacts_data = [doc.to_dict() or {} for doc in contact_docs]
            contacts_data.sort(
                key=lambda item: item.get("last_interaction") or datetime.fromtimestamp(0, tz=UTC),
                reverse=True,
            )
            contacts_data = contacts_data[:page_size]
            user_refs = [
                self._db.collection("users").document(item.get("contact_id", ""))
                for item in contacts_data
                if item.get("contact_id")
            ]

            user_map: dict[str, dict] = {}
            if user_refs:
                for snap in self._db.get_all(user_refs):
                    if snap.exists:
                        user_map[snap.id] = snap.to_dict() or {}

            results: list[ContactView] = []
            for item in contacts_data:
                contact_id = item.get("contact_id")
                if not contact_id:
                    continue
                profile = user_map.get(contact_id, {})
                results.append(
                    ContactView(
                        user_id=user_id,
                        contact_id=contact_id,
                        username=profile.get("username", f"User {contact_id[-4:]}"),
                        preferred_language=profile.get("preferred_language", "en"),
                        avatar=profile.get("avatar"),
                        last_interaction=item.get("last_interaction", datetime.now(UTC)),
                        interaction_count=int(item.get("interaction_count", 0)),
                    )
                )
            return results
        except (GoogleAPICallError, RetryError) as exc:
            raise FirebaseServiceError("Failed to fetch recent contacts") from exc

    def save_message(
        self,
        chat_id: str,
        sender_id: str,
        receiver_id: str,
        original_text: str,
        translated_text: str,
        sender_lang: str,
        receiver_lang: str,
    ) -> MessageRead:
        now = datetime.now(UTC)
        message_id = uuid4().hex

        message_doc = {
            "chat_id": chat_id,
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "original_text": original_text,
            "translated_text": translated_text,
            "sender_lang": sender_lang,
            "receiver_lang": receiver_lang,
            "timestamp": now,
        }

        message_ref = (
            self._db.collection("chats")
            .document(chat_id)
            .collection("messages")
            .document(message_id)
        )
        chat_ref = self._db.collection("chats").document(chat_id)

        try:
            batch = self._db.batch()
            batch.set(message_ref, message_doc)
            batch.set(
                chat_ref,
                {
                    "participants": firestore.ArrayUnion([sender_id, receiver_id]),
                    "last_message": {
                        "message_id": message_id,
                        "sender_id": sender_id,
                        "original_text": original_text,
                        "translated_text": translated_text,
                        "timestamp": now,
                    },
                    "updated_at": now,
                },
                merge=True,
            )
            batch.commit()

            return MessageRead(message_id=message_id, **message_doc)
        except (GoogleAPICallError, RetryError) as exc:
            raise FirebaseServiceError("Failed to save message in Firestore") from exc

    def get_chat_messages(self, chat_id: str, limit: int = 50) -> list[MessageRead]:
        page_size = max(1, min(limit, 200))

        try:
            query = (
                self._db.collection("chats")
                .document(chat_id)
                .collection("messages")
                .order_by("timestamp", direction=firestore.Query.DESCENDING)
                .limit(page_size)
            )

            docs = query.stream()
            messages: list[MessageRead] = []
            for doc in docs:
                data = doc.to_dict() or {}
                messages.append(
                    MessageRead(
                        message_id=doc.id,
                        chat_id=data["chat_id"],
                        sender_id=data["sender_id"],
                        receiver_id=data["receiver_id"],
                        original_text=data["original_text"],
                        translated_text=data["translated_text"],
                        sender_lang=data["sender_lang"],
                        receiver_lang=data["receiver_lang"],
                        timestamp=data["timestamp"],
                    )
                )
            return messages
        except (GoogleAPICallError, RetryError) as exc:
            raise FirebaseServiceError("Failed to fetch chat messages from Firestore") from exc


@lru_cache(maxsize=1)
def get_firebase_service() -> FirebaseService:
    return FirebaseService()
