from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps.services import get_chat_service, get_user_service
from app.schemas.discovery import (
    ChatInitiateRequest,
    ChatInitiateResponse,
    ContactListResponse,
    FriendRequestActionRequest,
    FriendRequestCreateRequest,
    FriendRequestListResponse,
    FriendRequestView,
    UserSearchResponse,
    UserUpsertRequest,
    UserView,
)
from app.services.chat_service import ChatService
from app.services.firebase_service import FirebaseConflictError, FirebaseServiceError
from app.services.user_service import UserService

router = APIRouter(prefix="/api", tags=["discovery"])


@router.post("/users", response_model=UserView)
async def upsert_user(
    payload: UserUpsertRequest,
    user_service: UserService = Depends(get_user_service),
) -> UserView:
    try:
        user = await user_service.upsert_user(
            user_id=payload.user_id,
            username=payload.username,
            preferred_language=payload.preferred_language,
            avatar=payload.avatar,
        )
        return UserView(
            user_id=user.user_id,
            username=user.username,
            preferred_language=user.preferred_language,
            avatar=user.avatar,
            created_at=user.created_at,
        )
    except FirebaseConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except FirebaseServiceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/users/search", response_model=UserSearchResponse)
async def search_users(
    query: str = Query(..., min_length=1, max_length=40),
    current_user_id: str = Query(..., min_length=1),
    limit: int = Query(default=12, ge=1, le=15),
    user_service: UserService = Depends(get_user_service),
) -> UserSearchResponse:
    try:
        results = await user_service.search_users(query=query, current_user_id=current_user_id, limit=limit)
        return UserSearchResponse(results=results)
    except FirebaseServiceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/contacts/{user_id}", response_model=ContactListResponse)
async def get_recent_contacts(
    user_id: str,
    limit: int = Query(default=12, ge=1, le=25),
    user_service: UserService = Depends(get_user_service),
) -> ContactListResponse:
    try:
        contacts = await user_service.get_recent_contacts(user_id=user_id, limit=limit)
        return ContactListResponse(contacts=contacts)
    except FirebaseServiceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/chats/initiate", response_model=ChatInitiateResponse)
async def initiate_chat(
    payload: ChatInitiateRequest,
    chat_service: ChatService = Depends(get_chat_service),
) -> ChatInitiateResponse:
    if payload.current_user_id == payload.target_user_id:
        raise HTTPException(status_code=400, detail="Cannot initiate chat with self")

    try:
        return await chat_service.initiate_chat(
            current_user_id=payload.current_user_id,
            target_user_id=payload.target_user_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except FirebaseServiceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/friends/requests", response_model=FriendRequestView)
async def send_friend_request(
    payload: FriendRequestCreateRequest,
    user_service: UserService = Depends(get_user_service),
) -> FriendRequestView:
    if payload.sender_id == payload.receiver_id:
        raise HTTPException(status_code=400, detail="Cannot send friend request to self")

    try:
        return await user_service.send_friend_request(
            sender_id=payload.sender_id,
            receiver_id=payload.receiver_id,
        )
    except FirebaseConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except FirebaseServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/friends/requests/{user_id}", response_model=FriendRequestListResponse)
async def get_pending_friend_requests(
    user_id: str,
    limit: int = Query(default=25, ge=1, le=50),
    user_service: UserService = Depends(get_user_service),
) -> FriendRequestListResponse:
    try:
        requests = await user_service.get_pending_friend_requests(user_id=user_id, limit=limit)
        return FriendRequestListResponse(requests=requests)
    except FirebaseServiceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/friends/requests/{request_id}/accept", response_model=FriendRequestView)
async def accept_friend_request(
    request_id: str,
    payload: FriendRequestActionRequest,
    user_service: UserService = Depends(get_user_service),
) -> FriendRequestView:
    try:
        return await user_service.accept_friend_request(request_id=request_id, actor_id=payload.actor_id)
    except FirebaseConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except FirebaseServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/friends/requests/{request_id}/reject", response_model=FriendRequestView)
async def reject_friend_request(
    request_id: str,
    payload: FriendRequestActionRequest,
    user_service: UserService = Depends(get_user_service),
) -> FriendRequestView:
    try:
        return await user_service.reject_friend_request(request_id=request_id, actor_id=payload.actor_id)
    except FirebaseConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except FirebaseServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
