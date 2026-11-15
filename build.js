// Membuat public/data.json otomatis dari isi folder public/files
// Struktur: public/files/<character>/<versi>/<kategori>/<file>
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, 'public');

const characters = [
  { id: 'alok', name: 'Alok' },
  { id: 'ignis', name: 'Ignis' },
];
const versions = [
  { id: 'ori', name: 'Android FF Ori' },
  { id: 'max', name: 'Android FF Max' },
];
const categories = [
  { id: 'rambut', name: 'Rambut' },
  { id: 'masker', name: 'Masker' },
  { id: 'face', name: 'Face' },
  { id: 'baju', name: 'Baju' },
  { id: 'celana', name: 'Celana' },
  { id: 'sepatu', name: 'Sepatu' },
];

const IMG = ['.png', '.jpg', '.jpeg', '.webp'];
const enc = (p) => p.split('/').map(encodeURIComponent).join('/');

// gambar character: public/characters/alok.png (atau jpg/jpeg/webp)
for (const ch of characters) {
  ch.image = null;
  for (const ext of IMG) {
    if (fs.existsSync(path.join(PUBLIC, 'characters', ch.id + ext))) {
      ch.image = enc(`characters/${ch.id}${ext}`);
      break;
    }
  }
}

const items = [];
for (const ch of characters) {
  for (const v of versions) {
    for (const c of categories) {
      const dir = path.join(PUBLIC, 'files', ch.id, v.id, c.id);
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter((f) => !f.startsWith('.')).sort();
      for (const f of files) {
        const base = path.parse(f).name;
        let thumb = null;
        for (const ext of IMG) {
          const tp = path.join(PUBLIC, 'thumbs', ch.id, v.id, c.id, base + ext);
          if (fs.existsSync(tp)) { thumb = enc(`thumbs/${ch.id}/${v.id}/${c.id}/${base}${ext}`); break; }
        }
        items.push({
          id: `${ch.id}-${v.id}-${c.id}-${items.length}`,
          name: base,
          character: ch.id,
          version: v.id,
          category: c.id,
          file: enc(`files/${ch.id}/${v.id}/${c.id}/${f}`),
          thumb,
        });
      }
    }
  }
}

fs.writeFileSync(path.join(PUBLIC, 'data.json'), JSON.stringify({ characters, versions, categories, items }, null, 2));
console.log(`data.json dibuat: ${items.length} item`);
