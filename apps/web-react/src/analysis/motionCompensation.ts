/** 카메라 흔들림(전역 이동) 보정 유틸 */

/**
 * 두 그레이 프레임 간의 전역 이동량(dx, dy)을 추정한다.
 * 축소 이미지에서 SAD(절대차 합) 최소 지점을 찾는다.
 */
export function estimateGlobalShift(
  prev: Float32Array,
  curr: Float32Array,
  width: number,
  height: number,
): { dx: number; dy: number } {
  const scale = 4;
  const sw = Math.floor(width / scale);
  const sh = Math.floor(height / scale);
  const smallPrev = new Float32Array(sw * sh);
  const smallCurr = new Float32Array(sw * sh);
  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < sw; x += 1) {
      const p = (y * scale) * width + x * scale;
      smallPrev[y * sw + x] = prev[p];
      smallCurr[y * sw + x] = curr[p];
    }
  }

  let bestX = 0;
  let bestY = 0;
  let bestScore = Infinity;
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      let score = 0;
      for (let y = 2; y < sh - 2; y += 1) {
        for (let x = 2; x < sw - 2; x += 1) {
          score += Math.abs(smallPrev[y * sw + x] - smallCurr[(y + dy) * sw + x + dx]);
        }
      }
      if (score < bestScore) { bestScore = score; bestX = dx; bestY = dy; }
    }
  }
  return { dx: bestX * scale, dy: bestY * scale };
}

/** 현재 프레임을 이전 프레임 기준으로 되밀어 정렬한다 */
export function alignFrame(
  curr: Float32Array,
  dx: number,
  dy: number,
  width: number,
  height: number,
): Float32Array {
  const out = new Float32Array(curr.length);
  for (let y = 0; y < height; y += 1) {
    const sy = Math.max(0, Math.min(height - 1, y + dy));
    for (let x = 0; x < width; x += 1) {
      const sx = Math.max(0, Math.min(width - 1, x + dx));
      out[y * width + x] = curr[sy * width + sx];
    }
  }
  return out;
}
