import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';

const hash = createHash('md5')
  .update(readFileSync('./dist/static/modules/customer.js'))
  .digest('hex').slice(0, 8);

let tsx = readFileSync('./src/index.tsx', 'utf8');
tsx = tsx.replace(/\?v=[a-f0-9]+/g, `?v=${hash}`);
writeFileSync('./src/index.tsx', tsx);

console.log(`✓ 캐시버스터 버전 업데이트: v=${hash}`);
