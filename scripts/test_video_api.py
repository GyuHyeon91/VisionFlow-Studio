"""YOLO 영상 분석 API smoke test (짧은 테스트 영상 생성 → 분석)."""
import io

import cv2
import numpy as np
import requests

path = 'services/.models/test_clip.mp4'
writer = cv2.VideoWriter(path, cv2.VideoWriter_fourcc(*'mp4v'), 5, (320, 180))
for i in range(25):
    frame = np.full((180, 320, 3), 40, dtype=np.uint8)
    cv2.rectangle(frame, (20 + i * 4, 70), (70 + i * 4, 120), (240, 240, 240), -1)
    writer.write(frame)
writer.release()

with open(path, 'rb') as f:
    res = requests.post(
        'http://localhost:53720/api/analyze-video',
        files={'file': ('test_clip.mp4', f, 'video/mp4')},
        data={'threshold': '0.3'},
        timeout=180,
    )
print('status:', res.status_code)
print(res.text[:800])
