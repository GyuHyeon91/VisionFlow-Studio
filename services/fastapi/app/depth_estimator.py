"""MiDaS 기반 단안 깊이(상대 깊이) 추정.

- 모델/가중치는 프로젝트 내부 `.models/torch` 에 저장해 외부 프로젝트와 공유하지 않는다.
- 로드 실패 시 None 을 반환해 호출侧에서 깊이 없이 동작하도록 폴백한다.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import numpy as np

MODEL_DIR = Path(__file__).resolve().parents[2] / ".models"
TORCH_DIR = MODEL_DIR / "torch"
TORCH_DIR.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("TORCH_HOME", str(TORCH_DIR))

_model: Any = None
_transform: Any = None
_failed = False


def get_depth_model():
    global _model, _transform, _failed
    if _failed:
        return None, None
    if _model is not None:
        return _model, _transform
    try:
        import torch
        import torch.hub

        # timm이 참조하는 rwightman 저장소를 비대화형으로 신뢰 처리
        torch.hub._TRUSTED_REPO_OWNERS = tuple(
            set(torch.hub._TRUSTED_REPO_OWNERS) | {"rwightman", "intel-isl", "isl-org"}
        )
        model = torch.hub.load("intel-isl/MiDaS", "MiDaS_small", trust_repo=True)
        transforms = torch.hub.load("intel-isl/MiDaS", "transforms", trust_repo=True)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model.to(device).eval()
        _model = model
        # MiDaS 버전에 따라 small / small_transform 모두 지원
        _transform = getattr(transforms, "small_transform", None) or getattr(transforms, "small", None)
        return _model, _transform
    except Exception:
        _failed = True
        return None, None


def estimate_disparity(image: np.ndarray) -> np.ndarray | None:
    """이미지에서 상대 역깊이(disparity) 맵을 반환한다. 실패 시 None."""
    import torch

    model, transform = get_depth_model()
    if model is None or transform is None:
        return None
    try:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        inp = transform(image).to(device)
        with torch.no_grad():
            pred = model(inp)
        return pred.squeeze().cpu().numpy()
    except Exception:
        return None
