const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// If a file named tag.png sits at the top of the repo, it is used instead of the drawn tag.
const CUSTOM_TAG = path.join(__dirname, '..', 'tag.png');

const COLOUR = '#F4930F';
const MAX_WIDTH = 1200;
// Tag position as a share of image width. Left 0 sits flush to the left edge. Top 0.06 leaves a gap above, as in the approved example.
const TAG_LEFT = 0;
const TAG_TOP = 0.06;
const ALLOWED_HOST = /(^|\.)rexsoftware\.com$/i;

// Block letters drawn as strokes, so no fonts are needed on the server.
const LETTERS = [
  { w: 56, d: 'M8,0 V92 H56' },
  { w: 56, d: 'M56,8 H8 V92 H56 M8,50 H50' },
  { w: 70, j: 'bevel', d: 'M6,100 L35,8 L64,100 M17,68 H53' },
  { w: 64, d: 'M56,22 C56,10 46,8 33,8 C16,8 8,16 8,28 C8,42 20,46 33,50 C47,54 56,58 56,72 C56,86 46,92 32,92 C18,92 8,86 8,74' },
  { w: 56, d: 'M56,8 H8 V92 H56 M8,50 H50' },
  { w: 68, d: 'M8,8 H30 C52,8 60,26 60,50 C60,74 52,92 30,92 H8 Z' }
];
const GAP = 20;
const STROKE = 17;

function tagSvg(width) {
  const tagW = Math.round(width * 0.286);
  const tagH = Math.round(width * 0.086);
  const textH = tagH * 0.46;
  const s = textH / 100;
  const totalW = LETTERS.reduce((a, l) => a + l.w, 0) + GAP * (LETTERS.length - 1);
  const startX = (tagW - totalW * s) / 2;
  const startY = (tagH - textH) / 2;
  let x = 0;
  let paths = '';
  LETTERS.forEach((l) => {
    paths += '<path transform="translate(' + x + ',0)"' + (l.j ? ' stroke-linejoin="' + l.j + '"' : '') + ' d="' + l.d + '"/>';
    x += l.w + GAP;
  });
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + tagW + '" height="' + tagH + '">' +
    '<rect width="' + tagW + '" height="' + tagH + '" fill="' + COLOUR + '"/>' +
    '<g transform="translate(' + startX + ',' + startY + ') scale(' + s + ')" fill="none" stroke="#FFFFFF" stroke-width="' + STROKE + '" stroke-linejoin="miter" stroke-linecap="butt">' +
    paths + '</g></svg>';
  return { svg: Buffer.from(svg), tagW, tagH };
}

async function addTag(inputBuffer) {
  const base = sharp(inputBuffer).rotate();
  const meta = await base.metadata();
  const outW = Math.min(meta.width || MAX_WIDTH, MAX_WIDTH);
  const resized = await base.resize({ width: outW, withoutEnlargement: true }).toBuffer();
  const rmeta = await sharp(resized).metadata();
  let tagInput;
  if (fs.existsSync(CUSTOM_TAG)) {
    tagInput = await sharp(CUSTOM_TAG).resize({ width: Math.round(rmeta.width * 0.286) }).png().toBuffer();
  } else {
    tagInput = tagSvg(rmeta.width).svg;
  }
  return sharp(resized)
    .composite([{ input: tagInput, left: Math.round(rmeta.width * TAG_LEFT), top: Math.round(rmeta.width * TAG_TOP) }])
    .jpeg({ quality: 86 })
    .toBuffer();
}

module.exports = async (req, res) => {
  try {
    let u = req.query && req.query.u;
    if (!u) { res.status(400).send('Missing u'); return; }
    if (u.indexOf('//') === 0) u = 'https:' + u;
    let parsed;
    try { parsed = new URL(u); } catch (e) { res.status(400).send('Bad url'); return; }
    if (parsed.protocol !== 'https:' || !ALLOWED_HOST.test(parsed.hostname)) { res.status(403).send('Host not allowed'); return; }
    const r = await fetch(parsed.toString());
    if (!r.ok) { res.status(502).send('Source image returned ' + r.status); return; }
    const out = await addTag(Buffer.from(await r.arrayBuffer()));
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    res.status(200).send(out);
  } catch (e) {
    res.status(500).send('Error: ' + String(e && e.message ? e.message : e));
  }
};
module.exports.addTag = addTag;
};
module.exports.addTag = addTag;
