// Serve o dist estático + expõe as Netlify Functions via adapter Express→event.
// Nenhuma função é reescrita: usamos os arquivos originais de netlify/functions/,
// com shim do driver Neon (@neondatabase/serverless → pg) feito no COPY do Dockerfile.
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// --- Interface Netlify: Express req -> event ---
function toEvent(req) {
  let raw = req.body;
  if (raw && typeof raw !== 'string' && req.is('application/json')) raw = JSON.stringify(raw);
  return {
    httpMethod: req.method,
    headers: req.headers,
    queryStringParameters: req.query || {},
    body: raw === undefined || raw === null ? null : raw,
  };
}

function sendResult(res, result) {
  if (!result) return res.status(500).end();
  const headers = result.headers || {};
  for (const [k, v] of Object.entries(headers)) res.set(k, v);
  let body = result.body;
  if (result.isBase64Encoded) {
    body = Buffer.from(body, 'base64');
  } else if (body !== undefined && body !== null && typeof body !== 'string') {
    body = JSON.stringify(body);
  }
  res.status(result.statusCode || 200).send(body);
}

// --- Rotas das functions ---
const fnDir = path.join(__dirname, '..', 'netlify', 'functions');
const names = fs.readdirSync(fnDir).filter((f) => f.endsWith('.js')).map((f) => f.replace(/\.js$/, ''));
for (const name of names) {
  const mod = await import(pathToFileURL(path.join(fnDir, name + '.js')));
  const handler = mod.handler;
  app.all('/.netlify/functions/' + name, async (req, res) => {
    try {
      sendResult(res, await handler(toEvent(req)));
    } catch (err) {
      console.error(`Erro em ${name}:`, err);
      res.status(500).json({ error: err.message });
    }
  });
}
console.log('Functions carregadas:', names.join(', '));

// --- Estático ---
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
// SPA fallback (redirect no netlify.toml): /* -> /index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/.netlify/')) return next();
  res.sendFile(path.join(dist, 'index.html'));
});

const port = process.env.PORT || 8300;
app.listen(port, () => console.log(`hubly server em :${port}`));
