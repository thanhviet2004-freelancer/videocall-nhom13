import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { AccessToken } from 'livekit-server-sdk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const app = express();
const port = Number(process.env.PORT || 3001);
const roomName = 'nhom-13-phong-chung';

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Requests without Origin are useful for health checks/server-to-server.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  }
}));
app.use(express.json({ limit: '32kb' }));

try {
  if (!admin.apps.length) {
    const serviceAccountPath = fileURLToPath(
  new URL('./firebase-service-account.json', import.meta.url)
);

const serviceAccount = JSON.parse(
  readFileSync(serviceAccountPath, 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
  }
} catch (error) {
  console.error('Firebase Admin initialization failed:', error.message);
  process.exit(1);
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/token', async (req, res) => {
  try {
    const authorization = req.headers.authorization || '';
    const match = authorization.match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ error: 'Missing Firebase ID token.' });

    const decoded = await admin.auth().verifyIdToken(match[1]);
    const uid = decoded.uid;
    const name = String(decoded.name || decoded.email || 'Người dùng').slice(0, 80);
    const identity = `firebase_${uid}`;

    const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return res.status(500).json({ error: 'LiveKit server is not configured.' });
    }

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name,
      ttl: '2h'
    });
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    const jwt = await token.toJwt();
    return res.json({ token: jwt, serverUrl: LIVEKIT_URL, roomName, identity, name });
  } catch (error) {
    console.error('Token endpoint error:', error.message);
    return res.status(401).json({ error: 'Authentication failed. Please sign in again.' });
  }
});

app.use((error, _req, res, _next) => {
  console.error(error.message);
  res.status(403).json({ error: 'Request origin is not allowed.' });
});

app.listen(port, () => console.log(`VideoCall Nhóm 13 API listening on port ${port}`));
