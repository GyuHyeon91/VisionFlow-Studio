"""WebSocket 실시간 이벤트 버스 (별도 브로커 없이 동작)."""
from __future__ import annotations

import asyncio
from typing import Any

_clients: set[Any] = set()
_latest: dict[str, Any] = {"type": "idle", "data": {}}
_loop: Any = None


def set_loop(loop: Any) -> None:
    global _loop
    _loop = loop


async def connect(websocket: Any) -> None:
    await websocket.accept()
    _clients.add(websocket)
    try:
        await websocket.send_json(_latest)
        while True:
            await websocket.receive_text()
    except Exception:
        pass
    finally:
        _clients.discard(websocket)


async def publish(event: dict[str, Any]) -> None:
    global _latest
    _latest = event
    for ws in list(_clients):
        try:
            await ws.send_json(event)
        except Exception:
            _clients.discard(ws)


def publish_sync(event: dict[str, Any]) -> None:
    """동기 스레드(스트림 워커)에서 이벤트를 발행한다."""
    if _loop is None:
        return
    _loop.call_soon_threadsafe(lambda: asyncio.create_task(publish(event)))


def client_count() -> int:
    return len(_clients)
