"""학습 API smoke test: 상태 조회 + 프레임 자동 라벨 수집."""
import io

import requests

base = 'http://localhost:53720'
print('status:', requests.get(f'{base}/api/train/status', timeout=30).json())

sample = requests.get('https://ultralytics.com/images/bus.jpg', timeout=60)
measured = requests.post(
    f'{base}/api/measure-frame',
    files={'file': ('bus.jpg', io.BytesIO(sample.content), 'image/jpeg')},
    data={'threshold': '0.4'},
    timeout=180,
).json()
detections = [
    {'label': m['label'], 'bbox': m['bbox']}
    for m in measured['measurements']
]
captured = requests.post(
    f'{base}/api/dataset/capture',
    files={'file': ('bus.jpg', io.BytesIO(sample.content), 'image/jpeg')},
    data={'payload': __import__('json').dumps({'datasetId': 'smoke', 'detections': detections})},
    timeout=60,
)
print('capture:', captured.status_code, captured.json())
