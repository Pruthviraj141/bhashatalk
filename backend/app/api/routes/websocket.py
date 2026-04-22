from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
import logging
from app.api.deps.services import (
    get_connection_manager,
    get_message_pipeline_service,
)
from app.schemas.chat import WSOutboundMessage
from app.services.message_pipeline_service import MessagePipelineError
from app.services.message_pipeline_service import MessagePipelineService
from app.services.websocket_manager import ConnectionManager

router = APIRouter(tags=["websocket"])
logger = logging.getLogger(__name__)


@router.websocket("/ws/{user_id}")
async def chat_socket(
    websocket: WebSocket,
    user_id: str,
    manager: ConnectionManager = Depends(get_connection_manager),
    pipeline: MessagePipelineService = Depends(get_message_pipeline_service),
) -> None:
    logger.info("[ws] incoming connection user_id=%s", user_id)
    await manager.connect(user_id=user_id, websocket=websocket)
    await manager.send_personal_message(
        user_id,
        WSOutboundMessage(event="ack", data={"message": "connected"}).model_dump(),
    )

    try:
        while True:
            raw = await websocket.receive_json()
            logger.debug("[ws] packet received user_id=%s", user_id)
            try:
                await pipeline.process_incoming(
                    current_user_id=user_id,
                    raw_packet=raw,
                )
            except MessagePipelineError as exc:
                logger.warning("[ws] pipeline error user_id=%s error=%s", user_id, exc)
                await manager.send_personal_message(
                    user_id,
                    WSOutboundMessage(event="error", data={"message": str(exc)}).model_dump(),
                )

    except WebSocketDisconnect:
        logger.info("[ws] disconnected by client user_id=%s", user_id)
        await manager.disconnect(user_id=user_id)
    except Exception:
        logger.exception("[ws] unexpected error user_id=%s", user_id)
        await manager.disconnect(user_id=user_id)
