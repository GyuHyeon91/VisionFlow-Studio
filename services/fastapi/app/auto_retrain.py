"""오인식 → 라벨 수정 → 재학습 자동화 파이프라인.

1) 검토 결과(false verdict)를 수집해 하드 네거티브로 저장
2) 웹에 업로드된 영상(.data/uploads)에서 프레임 샘플링
3) COCO/커스텀 모델로 초기 라벨 생성 후 사람 라벨만 신뢰
4) 데이터셋 재구축 → YOLO 미세조정 → 커스텀 모델 자동 적용
"""
from __future__ import annotations

import json
import threading
import time
from pathlib import Path
from typing import Any

from . import trainer, evaluation

ROOT = Path(__file__).resolve().parents[2]
UPLOAD_DIR = ROOT / ".data" / "uploads"
STATE: dict[str, Any] = {
    "status": "idle", "progress": 0, "message": "대기 중",
    "lastRun": None, "samplesAdded": 0, "error": None,
}
_lock = threading.Lock()


def _update(**kwargs: Any) -> None:
    with _lock:
        STATE.update(kwargs)


def status() -> dict[str, Any]:
    with _lock:
        return dict(STATE)


def _collect_negatives() -> int:
    """화면에서 신고된 오탐 네거티브 수를 반환 (feedback.py가 이미 저장함)."""
    try:
        from . import feedback
        return feedback.stats()["count"]
    except Exception:
        return 0


def run(epochs: int = 10, imgsz: int = 640, base_model: str = "yolov8n.pt") -> dict[str, Any]:
    if STATE["status"] == "running":
        return status()
    _update(status="running", progress=0, message="오인식 데이터 수집 중", error=None)

    def worker() -> None:
        try:
            negatives = _collect_negatives()
            _update(progress=0.2, message=f"하드 네거티브 {negatives}건 수집", samplesAdded=negatives)

            from . import build_site_dataset

            result = build_site_dataset.build(sample_sec=1.0)
            _update(progress=0.45, message=f"데이터셋 {result['samples']}장 구축", samplesAdded=result["samples"])

            trainer.start_training(
                "construction", epochs=epochs, imgsz=imgsz, batch=4, base_model=base_model,
                augmentation={"fliplr": 0.3, "flipud": 0.0, "mosaic": 0.3, "mixup": 0.0,
                              "degrees": 3, "scale": 0.3},
            )
            # 학습 완료 폴링
            deadline = time.time() + 1800
            while time.time() < deadline:
                t = trainer.status()
                if t["status"] in ("completed", "error"):
                    break
                _update(progress=0.45 + min(0.5, t["progress"] * 0.5),
                        message=t.get("message", "학습 중"))
                time.sleep(2)
            final = trainer.status()
            if final["status"] == "error":
                _update(status="error", progress=1, message="학습 실패", error=final.get("error"))
            else:
                _update(status="completed", progress=1, message="재학습 완료 · 커스텀 모델 적용",
                        lastRun=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
        except Exception as exc:  # noqa: BLE001
            _update(status="error", progress=1, message="재학습 실패", error=str(exc))

    threading.Thread(target=worker, daemon=True).start()
    return status()
