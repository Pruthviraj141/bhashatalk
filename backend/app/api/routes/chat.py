from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps.services import get_message_service
from app.schemas.chat import MessageRead
from app.services.firebase_service import FirebaseServiceError
from app.services.message_service import MessageService

router = APIRouter(prefix="/api/chats", tags=["chats"])


@router.get("/{chat_id}/messages", response_model=list[MessageRead])
async def get_chat_history(
    chat_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    message_service: MessageService = Depends(get_message_service),
) -> list[MessageRead]:
    try:
        return await message_service.get_chat_messages(chat_id=chat_id, limit=limit)
    except FirebaseServiceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
