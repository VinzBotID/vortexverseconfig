import { del } from '@vercel/blob';
import crypto from 'node:crypto';
import { readDB, writeDB, checkPass, isBlobUrl } from '../lib/store.js';

const safeDel = async (u) => {
  if (u && isBlobUrl(u)) {
    try { await del(u); } catch {}
  }
};
const clean = (s, n) => String(s || '').trim().slice(0, n);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const b = req.body || {};
  if (!checkPass(b.password)) return res.status(401).json({ error: 'Password salah' });

  try {
    const db = await readDB();

    switch (b.action) {
      case 'login':
        return res.json({ ok: true });

      case 'addItem': {
        const name = clean(b.name, 80);
        if (!name) return res.status(400).json({ error: 'Nama wajib diisi' });
        if (!db.characters.some((c) => c.id === b.character)) return res.status(400).json({ error: 'Character tidak valid' });
        if (!db.versions.some((v) => v.id === b.version)) return res.status(400).json({ error: 'Versi tidak valid' });
        if (!db.categories.some((c) => c.id === b.category)) return res.status(400).json({ error: 'Kategori tidak valid' });
        if (!b.file || !isBlobUrl(b.file.url)) return res.status(400).json({ error: 'File config tidak valid' });
        if (b.thumb && !isBlobUrl(b.thumb)) return res.status(400).json({ error: 'Gambar tidak valid' });
        const item = {
          id: crypto.randomUUID(),
          name,
          character: b.character,
          version: b.version,
          category: b.category,
          file: b.file.url,
          fileName: clean(b.file.name, 120) || 'config',
          thumb: b.thumb || null,
          createdAt: Date.now(),
        };
        db.items.push(item);
        await writeDB(db);
        return res.json({ ok: true, item });
      }

      case 'updateItem': {
        const it = db.items.find((i) => i.id === b.id);
        if (!it) return res.status(404).json({ error: 'Item tidak ditemukan' });
        const name = clean(b.name, 80);
        if (name) it.name = name;
        if (b.thumb) {
          if (!isBlobUrl(b.thumb)) return res.status(400).json({ error: 'Gambar tidak valid' });
          await safeDel(it.thumb);
          it.thumb = b.thumb;
        }
        if (b.file) {
          if (!isBlobUrl(b.file.url)) return res.status(400).json({ error: 'File tidak valid' });
          await safeDel(it.file);
          it.file = b.file.url;
          it.fileName = clean(b.file.name, 120) || it.fileName;
        }
        await writeDB(db);
        return res.json({ ok: true, item: it });
      }

      case 'deleteItem': {
        const idx = db.items.findIndex((i) => i.id === b.id);
        if (idx < 0) return res.status(404).json({ error: 'Item tidak ditemukan' });
        const [it] = db.items.splice(idx, 1);
        await writeDB(db);
        await safeDel(it.file);
        await safeDel(it.thumb);
        return res.json({ ok: true });
      }

      case 'setCharacterImage': {
        const c = db.characters.find((x) => x.id === b.id);
        if (!c) return res.status(404).json({ error: 'Character tidak ditemukan' });
        if (!isBlobUrl(b.image)) return res.status(400).json({ error: 'Gambar tidak valid' });
        await safeDel(c.image);
        c.image = b.image;
        await writeDB(db);
        return res.json({ ok: true });
      }

      default:
        return res.status(400).json({ error: 'Aksi tidak dikenal' });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
