"""경량 시계열 저장 (SQLite) - TimescaleDB 없이도 지표 이력 보관."""
from __future__ import annotations

import sqlite3
import time
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parents[2] / ".data" / "metrics.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def init() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS metrics (
                ts REAL PRIMARY KEY,
                detections INTEGER,
                danger INTEGER,
                detect_ms REAL,
                risk REAL,
                label TEXT
            )
        """)


def insert(detections: int, danger: bool, detect_ms: float, risk: float = 0, label: str = "") -> None:
    init()
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO metrics (ts, detections, danger, detect_ms, risk, label) VALUES (?,?,?,?,?,?)",
            (time.time(), detections, int(danger), detect_ms, risk, label),
        )


def recent(limit: int = 100) -> list[dict[str, Any]]:
    init()
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM metrics ORDER BY ts DESC LIMIT ?", (limit,)).fetchall()
    return [dict(r) for r in rows]
