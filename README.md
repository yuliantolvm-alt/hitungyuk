# HitungYuk — versi awal

Website kalkulator statis untuk GitHub Pages.

## File
- `index.html` — struktur halaman, SEO dasar, metadata, dan konten.
- `style.css` — tampilan responsif.
- `app.js` — mesin kalkulator dan validasi input.
- `robots.txt` — memberi tahu crawler bahwa halaman boleh dirayapi.
- `sitemap.xml` — daftar URL untuk mesin pencari.

## Keamanan
- Tidak ada API key/password di frontend.
- Tidak menggunakan `eval()` atau `new Function()`.
- Input angka dibatasi dengan min/max dan diperiksa lagi sebelum dihitung.
- Hasil dari input pengguna dimasukkan memakai `textContent`, bukan `innerHTML`.
- Tidak ada data kalkulator yang dikirim ke server pada versi ini.
- Gunakan HTTPS GitHub Pages.

## Sebelum publish
Ganti `USERNAME` pada:
- `index.html`
- `robots.txt`
- `sitemap.xml`

dengan username GitHub Anda.

## Catatan
Versi ini sengaja memakai JavaScript vanilla agar ringan dan mudah diaudit.
