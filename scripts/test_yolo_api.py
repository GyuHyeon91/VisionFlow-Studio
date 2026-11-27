"""YOLO API smoke test: 실제 COCO 샘플 이미지로 감지 결과를 확인한다."""
import io

import requests

# Ultralytics 공개 샘플(버스 + 사람) - 실제 객체 감지 검증용
sample = requests.get('https://ultralytics.com/images/bus.jpg', timeout=60)
print('sample bytes:', len(sample.content))
res = requests.post(
    'http://localhost:53720/api/detect-frame',
    files={'file': ('bus.jpg', io.BytesIO(sample.content), 'image/jpeg')},
    data={'threshold': '0.4'},
    timeout=180,
)
print('status:', res.status_code)
print(res.text[:2000])
