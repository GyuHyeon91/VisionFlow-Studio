"""로컬 이벤트 로그 저장 (Redis/Kafka 없이도 동작하는 경량 스토어)."""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parents[2] / ".data"
LOG_PATH = DATA_DIR / "events.jsonl"
DATA_DIR.mkdir(parents=True, exist_ok=True)


def append(event: dict[str, Any]) -> None:
    record = {"ts": time.time(), **event}
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def recent(limit: int = 100) -> list[dict[str, Any]]:
    if not LOG_PATH.exists():
        return []
    lines = LOG_PATH.read_text(encoding="utf-8").splitlines()[-limit:]
    result = []
    for line in lines:
        try:
            result.append(json.loads(line))
        except Exception:
            continue
    return result[::-1]
