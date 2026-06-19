/**
 * aqakorea 로컬 개발 서버
 * dist/ 폴더를 정적 서빙 + /api/* → :3001 프록시
 */
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;
const DIST = path.join(__dirname, 'dist');

// /api/* → 백엔드 Express (:3001)
// 커스텀 인증 헤더(X-User-Id, X-User-Role, X-Region-Id)를 upstream으로 그대로 전달
app.use('/api', createProxyMiddleware({
  target: 'http://127.0.0.1:3001',
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req) => {
      // 클라이언트가 보낸 X-User-* 헤더를 upstream에 전달
      ['x-user-id', 'x-user-role', 'x-region-id'].forEach(h => {
        const val = req.headers[h];
        if (val) proxyReq.setHeader(h, val);
      });
    },
    error: (err, req, res) => {
      console.error('[proxy error]', err.message);
      res.status(502).json({ error: 'API 서버 연결 실패' });
    }
  }
}));

// dist/ 정적 파일
app.use(express.static(DIST));

// SPA fallback (index.html)
app.use((req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log('[aqakorea] 서버 시작: http://localhost:' + PORT);
});
