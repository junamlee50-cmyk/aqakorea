/**
 * aqakorea miniflare 직접 서버
 * wrangler의 비대화형 종료 문제를 우회
 */
import { Miniflare } from 'miniflare';
import { createServer } from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const WORKER_PATH = join(__dirname, 'dist/_worker.js');

// API 프록시 서버 (Express) — /api/* → :3001
const proxyApp = express();
const { createProxyMiddleware: proxy } = await import('http-proxy-middleware');

proxyApp.use('/api', proxy.createProxyMiddleware({
  target: 'http://127.0.0.1:3001',
  changeOrigin: true,
}));

// Miniflare로 Worker 실행
const workerCode = readFileSync(WORKER_PATH, 'utf8');

const mf = new Miniflare({
  script: workerCode,
  modules: true,
  compatibilityDate: '2026-04-12',
  compatibilityFlags: ['nodejs_compat'],
  port: PORT,
  host: '0.0.0.0',
  bindings: {
    CF_PAGES: '1',
    CF_PAGES_BRANCH: 'main',
  },
  serviceBindings: {},
});

await mf.ready;
console.log('[aqakorea] miniflare ready on http://localhost:' + PORT);
