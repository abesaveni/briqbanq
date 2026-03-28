/**
 * Production server with SPA fallback + API proxy to backend.
 * Run after `npm run build`: node server.js
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');
const PORT = process.env.PORT || 3000;
const BACKEND = process.env.BACKEND_HOST || 'localhost';
const BACKEND_PORT = process.env.BACKEND_PORT || 8000;

const MIMES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];

  // Proxy /api and /uploads to FastAPI backend
  if (url.startsWith('/api') || url.startsWith('/uploads')) {
    const proxyReq = http.request(
      {
        hostname: BACKEND,
        port: BACKEND_PORT,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: `${BACKEND}:${BACKEND_PORT}` },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      }
    );
    proxyReq.on('error', () => {
      res.writeHead(502);
      res.end('Backend unavailable');
    });
    req.pipe(proxyReq, { end: true });
    return;
  }

  // Serve static files from dist/
  const hasExtension = path.extname(url);
  const serveIndex = url === '/' || !hasExtension;
  const filePath = serveIndex
    ? path.join(DIST, 'index.html')
    : path.join(DIST, url.startsWith('/') ? url.slice(1) : url);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback — serve index.html for unknown routes
      fs.readFile(path.join(DIST, 'index.html'), (err2, indexData) => {
        if (err2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(indexData);
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIMES[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n✅  Production server running at http://localhost:${PORT}`);
  console.log(`🔗  API proxied to http://${BACKEND}:${BACKEND_PORT}\n`);
});
