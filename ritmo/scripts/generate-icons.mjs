// Genera los iconos PNG de la app sin dependencias externas (solo zlib de Node).
// Uso: npm run icons
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const GREEN = [79, 122, 90];
const CREAM = [246, 243, 238];

// Barras verticales de distinta altura: el "ritmo".
const BARS = [
  { x: -0.17, h: 0.30 },
  { x: 0, h: 0.50 },
  { x: 0.17, h: 0.38 },
];

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Distancia con signo a un rectángulo redondeado centrado en (0,0).
function sdRoundRect(px, py, hw, hh, r) {
  const qx = Math.abs(px) - hw + r;
  const qy = Math.abs(py) - hh + r;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
}

function render(size, { scale, rounded }) {
  const px = Buffer.alloc(size * size * 4);
  const SS = 4; // supersampling
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0;
      let fg = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x + (sx + 0.5) / SS) / size - 0.5;
          const v = (y + (sy + 0.5) / SS) / size - 0.5;
          const inBg = rounded ? sdRoundRect(u, v, 0.5, 0.5, 0.22) <= 0 : true;
          if (!inBg) continue;
          bg++;
          for (const bar of BARS) {
            const w = 0.045 * scale;
            const d = sdRoundRect(u - bar.x * scale, v, w, (bar.h * scale) / 2, w);
            if (d <= 0) {
              fg++;
              break;
            }
          }
        }
      }
      const total = SS * SS;
      const a = bg / total;
      const f = bg ? fg / bg : 0;
      const i = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) px[i + c] = Math.round(GREEN[c] * (1 - f) + CREAM[c] * f);
      px[i + 3] = Math.round(a * 255);
    }
  }
  return png(size, px);
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', render(192, { scale: 1, rounded: true }));
writeFileSync('public/icons/icon-512.png', render(512, { scale: 1, rounded: true }));
// Maskable: fondo completo y contenido dentro de la zona segura (80 %).
writeFileSync('public/icons/maskable-512.png', render(512, { scale: 0.75, rounded: false }));
writeFileSync('public/icons/apple-touch-icon.png', render(180, { scale: 0.85, rounded: false }));
console.log('Iconos generados en public/icons');
