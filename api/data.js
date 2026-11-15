import { readDB } from '../lib/store.js';

export default async function handler(req, res) {
  try {
    const db = await readDB();
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    res.status(200).json(db);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
