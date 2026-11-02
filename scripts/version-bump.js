import { createHash } from 'crypto';
import { readFileSync, writeFileSync, readdirSync } from 'fs';

// 모든 고객/관리 모듈과 스타일 변경을 빌드 전에 캐시 버전에 반영합니다.
const files = readdirSync('./public/static/modules').filter(f => f.endsWith('.js')).sort()
  .map(f => `./public/static/modules/${f}`);
files.push('./public/static/app.js', './public/static/style.css');
const digest = createHash('sha256');
for (const file of files) digest.update(file).update(readFileSync(file));
const hash = digest.digest('hex').slice(0, 12);
const path = './src/index.tsx';
writeFileSync(path, readFileSync(path, 'utf8').replace(/\?v=[a-zA-Z0-9]+/g, `?v=${hash}`));
console.log(`캐시버스터 버전: ${hash}`);
