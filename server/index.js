import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'studyflow.json');
const AUTH_FILE = path.join(DATA_DIR, 'accounts.json');

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ users: {}, currentUser: null }, null, 2));
if (!fs.existsSync(AUTH_FILE)) fs.writeFileSync(AUTH_FILE, JSON.stringify({}, null, 2));

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ── Data endpoints ──

app.get('/api/data', (req, res) => {
  res.json(readJSON(DATA_FILE));
});

app.post('/api/data', (req, res) => {
  writeJSON(DATA_FILE, req.body);
  res.json({ success: true });
});

// ── Auth endpoints ──

app.get('/api/accounts', (req, res) => {
  res.json(readJSON(AUTH_FILE));
});

app.post('/api/accounts', (req, res) => {
  writeJSON(AUTH_FILE, req.body);
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`StudyFlow API server running on http://localhost:${PORT}`);
  console.log(`Data stored in: ${DATA_DIR}`);
});
