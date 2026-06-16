import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';

// admin.js 기준으로 해시 생성 (가장 최근 수정 파일)
const hash = createHash('md5')
  .update(readFileSync('./dist/static/modules/admin.js'))
  .digest('hex').slice(0, 8);

let tsx = readFileSync('./src/index.tsx', 'utf8');
// ?v=xxxxx 패턴 전부 동일 해시로 교체 (new123646 등 수동 태그 포함)
tsx = tsx.replace(/\?v=[a-zA-Z0-9]+/g, `?v=${hash}`);
writeFileSync('./src/index.tsx', tsx);

// app.js 직접 참조도 교체
console.log(`✓ 캐시버스터 버전 통일: v=${hash}`);
