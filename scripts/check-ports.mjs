/**
 * 포트 충돌 검사기.
 * 이 프로젝트가 예약한 포트가 다른 프로젝트와 겹치지 않는지 확인합니다.
 * 실행: npm run ports:check
 */
import net from 'node:net';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(resolve(__dirname, '../configs/app.config.json'), 'utf-8'));
const ports = config.ports;
const owner = config.isolation?.reservedPortOwner ?? 'unknown';

const values = Object.values(ports);
const duplicated = values.filter((p, i) => values.indexOf(p) !== i);

function isFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen({ port, host: '0.0.0.0' });
  });
}

console.log(`VisionFlow Studio 포트 검사 (예약자: ${owner})`);
if (duplicated.length) {
  console.error(`❌ 설정 내부에서 포트 중복: ${[...new Set(duplicated)].join(', ')}`);
  process.exit(1);
}

const results = await Promise.all(Object.entries(ports).map(async ([name, port]) => ({
  name,
  port,
  free: await isFree(port),
})));

let blocked = false;
for (const r of results) {
  console.log(`  ${r.free ? '✅' : '⚠️ '} ${r.name.padEnd(8)} :${r.port} ${r.free ? '사용 가능' : '이미 사용 중 (다른 프로젝트와 충돌 가능)'}`);
  if (!r.free) blocked = true;
}

if (blocked) {
  console.error('\n충돌이 감지되었습니다. configs/app.config.json 의 ports 값을 변경하세요.');
  process.exit(1);
}
console.log('\n모든 포트가 격리되어 있으며 충돌이 없습니다.');
