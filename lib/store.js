import { put, list } from '@vercel/blob';
import crypto from 'node:crypto';

const DB_PATH = 'db/data.json';

const defaults = () => ({
  characters: [
    { id: 'alok', name: 'Alok', image: null },
    { id: 'ignis', name: 'Ignis', image: null },
  ],
  versions: [
    { id: 'ori', name: 'Android FF Ori' },
    { id: 'max', name: 'Android FF Max' },
  ],
  categories: [
    { id: 'rambut', name: 'Rambut' },
    { id: 'masker', name: 'Masker' },
    { id: 'face', name: 'Face' },
    { id: 'baju', name: 'Baju' },
    { id: 'celana', name: 'Celana' },
    { id: 'sepatu', name: 'Sepatu' },
  ],
  items: [],
});

export async function readDB() {
  const base = defaults();
  const { blobs } = await list({ prefix: DB_PATH, limit: 5 });
  const b = blobs.find((x) => x.pathname === DB_PATH);
  if (!b) return base;
  const r = await fetch(b.url + '?t=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) return base;
  const saved = await r.json();
  // character, versi, kategori tetap dari default; gambar character & item dari data tersimpan
  base.characters = base.characters.map((c) => {
    const s = (saved.characters || []).find((x) => x.id === c.id);
    return { ...c, image: s ? s.image || null : null };
  });
  base.items = Array.isArray(saved.items) ? saved.items : [];
  return base;
}

export async function writeDB(db) {
  await put(DB_PATH, JSON.stringify(db), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

export function checkPass(p) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real || typeof p !== 'string') return false;
  const a = Buffer.from(p);
  const b = Buffer.from(real);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function isBlobUrl(u) {
  try {
    const x = new URL(u);
    return x.protocol === 'https:' && x.hostname.endsWith('.blob.vercel-storage.com');
  } catch {
    return false;
  }
}
