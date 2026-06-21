from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.realtime.manager import manager

router = APIRouter()


@router.websocket("/ws/prices")
async def ws_prices(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        await websocket.send_json({"type": "connected"})
        while True:
            # Keep the connection open; inbound messages are ignored for now.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
