import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Serve Three.js ES modules locally so the browser runs with zero external CDN dependencies
app.use('/vendor/three', express.static(path.join(__dirname, 'node_modules', 'three'), {
  maxAge: '1d',
}));

// Serve static HTML, CSS, and Vanilla JS files directly from project root
app.use(express.static(__dirname, {
  extensions: ['html'],
  setHeaders(res, filePath) {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
  },
}));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`UZ GAMES 3D server running on http://0.0.0.0:${PORT}`);
});
