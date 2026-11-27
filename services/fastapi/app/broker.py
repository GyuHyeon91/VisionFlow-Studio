"""이벤트 브로커: Redis Streams 사용 가능 시 사용, 아니면 로컬 파일 폴백."""
from __future__ import annotations

import json
import threading
import time
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parents[2] / ".data"
LOCAL_PATH = DATA_DIR / "broker.jsonl"
DATA_DIR.mkdir(parents=True, exist_ok=True)

_settings: dict[str, Any] = {"type": "local", "url": "redis://127.0.0.1:6379/0", "stream": "visionflow:events"}
_client = None
_lock = threading.Lock()


def configure(config: dict[str, Any]) -> None:
    _settings.update({
        "type": config.get("type", {}).get("value", "local"),
        "url": config.get("url", {}).get("value", "redis://127.0.0.1:6379/0"),
        "stream": config.get("stream", {}).get("value", "visionflow:events"),
    })


def status() -> dict[str, Any]:
    return {**_settings, "connected": _client is not None}


def publish(event: dict[str, Any]) -> None:
    payload = {"ts": time.time(), **event}
    with _lock:
        if _settings["type"] == "redis":
            if _client is None:
                try:
                    import redis

                    _client = redis.Redis.from_url(_settings["url"], socket_connect_timeout=1)
                    _client.ping()
                except Exception:
                    globals()["_client"] = None
            if _client is not None:
                try:
                    _client.xadd(_settings["stream"], {"event": json.dumps(payload, ensure_ascii=False)})
                    return
                except Exception:
                    globals()["_client"] = None
        with LOCAL_PATH.open("a", encoding="utf-8") as f:
            f.write(json.dumps(payload, ensure_ascii=False) + "\n")


def recent(limit: int = 50) -> list[dict[str, Any]]:
    if not LOCAL_PATH.exists():
        return []
    out = []
    for line in LOCAL_PATH.read_text(encoding="utf-8").splitlines()[-limit:]:
        try:
            out.append(json.loads(line))
        except Exception:
            continue
    return out[::-1]
