# Vortex Config

## Cara menambah item
1. Taruh file config di: `public/files/<versi>/<kategori>/`
   - versi: `ori` atau `max`
   - kategori: `rambut`, `masker`, `face`, `baju`, `celana`, `sepatu`
   - contoh: `public/files/ori/rambut/Rambut Naga.zip`
2. (Opsional) Thumbnail dengan NAMA SAMA di: `public/thumbs/<versi>/<kategori>/Rambut Naga.png`
   (png / jpg / jpeg / webp)
3. Upload/push ke GitHub. Vercel otomatis menjalankan `node build.js`
   yang membuat `data.json` sendiri. Tidak perlu edit kode.

Nama tombol = nama file tanpa ekstensi.

## Hapus item
Hapus filenya dari folder, lalu push.

## Penting
- Tidak butuh environment variable.
- Hapus folder `api/` dan file lama dari project sebelumnya.
- Batas upload file lewat web GitHub: 25 MB per file.
