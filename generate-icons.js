// Generates PNG icons without any external dependencies (uses built-in zlib).
// Run: node generate-icons.js
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

function createPNG(size, drawFn) {
  // drawFn(x, y) -> [r, g, b, a]
  const raw = [];
  for (let y = 0; y < size; y++) {
    raw.push(0); // filter byte per row
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = drawFn(x, y, size);
      raw.push(r, g, b, a);
    }
  }
  const compressed = zlib.deflateSync(Buffer.from(raw));
  const buf = Buffer.alloc(8 + 25 + 12 + compressed.length + 12 + 12);
  let offset = 0;

  function write(bytes) { bytes.forEach(b => buf[offset++] = b); }
  function writeU32(n) { buf.writeUInt32BE(n, offset); offset += 4; }

  function chunk(type, data) {
    writeU32(data.length);
    const typeBytes = [...type].map(c => c.charCodeAt(0));
    write(typeBytes);
    data.copy(buf, offset); offset += data.length;
    const crc = crc32(Buffer.concat([Buffer.from(typeBytes), data]));
    writeU32(crc);
  }

  // PNG signature
  write([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = ihdr[11] = ihdr[12] = 0;
  chunk('IHDR', ihdr);

  // IDAT
  chunk('IDAT', compressed);

  // IEND
  chunk('IEND', Buffer.alloc(0));

  return buf.slice(0, offset);
}

// CRC-32 table
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Draw function: butterfly on green rounded-rect background
function drawIcon(x, y, size) {
  const S = size;
  const cx = S / 2, cy = S / 2;

  // Background: dark green rounded square
  const radius = S * 0.21;
  const inBg = x >= radius && x < S - radius && y >= 0 && y < S ||
               x >= 0 && x < S && y >= radius && y < S - radius;
  const corner = (dx, dy) => Math.sqrt(dx * dx + dy * dy) <= radius;
  const inCorner =
    (x < radius && y < radius && corner(radius - x, radius - y)) ||
    (x >= S - radius && y < radius && corner(x - (S - radius), radius - y)) ||
    (x < radius && y >= S - radius && corner(radius - x, y - (S - radius))) ||
    (x >= S - radius && y >= S - radius && corner(x - (S - radius), y - (S - radius)));
  if (!inBg && !inCorner) return [26, 61, 14, 0]; // transparent outside

  const bg = [45, 106, 31, 255];

  // Body: dark purple vertical ellipse
  const bx = (x - cx) / (S * 0.047);
  const by = (y - cy) / (S * 0.2);
  if (bx * bx + by * by < 1) return [61, 43, 110, 255];

  // Head: small circle above centre
  const hx = x - cx, hy = y - (cy - S * 0.185);
  if (hx * hx + hy * hy < (S * 0.052) ** 2) return [61, 43, 110, 255];

  // Upper wings
  function inEllipseR(ox, oy, rx, ry, ang) {
    const cos = Math.cos(ang), sin = Math.sin(ang);
    const lx = (x - ox) * cos + (y - oy) * sin;
    const ly = -(x - ox) * sin + (y - oy) * cos;
    return (lx / rx) ** 2 + (ly / ry) ** 2 < 1;
  }
  if (inEllipseR(cx - S * 0.12, cy - S * 0.04, S * 0.22, S * 0.27, -0.44)) return [123, 94, 167, 230];
  if (inEllipseR(cx + S * 0.12, cy - S * 0.04, S * 0.22, S * 0.27,  0.44)) return [123, 94, 167, 230];

  // Lower wings
  if (inEllipseR(cx - S * 0.1,  cy + S * 0.11, S * 0.15, S * 0.19,  0.26)) return [156, 109, 206, 230];
  if (inEllipseR(cx + S * 0.1,  cy + S * 0.11, S * 0.15, S * 0.19, -0.26)) return [156, 109, 206, 230];

  // Yellow dots on upper wings
  const d1x = x - (cx - S * 0.22), d1y = y - (cy - S * 0.08);
  const d2x = x - (cx + S * 0.22), d2y = y - (cy - S * 0.08);
  if (d1x * d1x + d1y * d1y < (S * 0.055) ** 2) return [255, 224, 102, 200];
  if (d2x * d2x + d2y * d2y < (S * 0.055) ** 2) return [255, 224, 102, 200];

  return bg;
}

const outDir = path.join(__dirname, 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPNG(192, drawIcon));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPNG(512, drawIcon));
console.log('Icons generated successfully.');
