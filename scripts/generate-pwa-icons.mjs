import sharp from "sharp";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";

const ICON_DIR = "public/icons";

// Bold geometric "J" lettermark — jorrey-black bg, jorrey-gold stroke
// Centered in 512×512. Butt caps give flat top and hook tip.
const jPath = "M 311 90 L 311 340 Q 311 430 256 430 Q 201 430 201 360 L 201 320";

function iconSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <rect width="512" height="512" fill="#0C0C0C"/>
  <rect x="18" y="18" width="476" height="476" fill="none" stroke="#C9A96E" stroke-width="2.5" opacity="0.45"/>
  <path d="${jPath}" stroke="#C9A96E" stroke-width="86" fill="none"
        stroke-linecap="butt" stroke-linejoin="round"/>
</svg>`;
}

// Maskable: same J scaled to 72% from centre, keeping it inside the safe zone
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#0C0C0C"/>
  <g transform="translate(256,256) scale(0.72) translate(-256,-256)">
    <path d="${jPath}" stroke="#C9A96E" stroke-width="86" fill="none"
          stroke-linecap="butt" stroke-linejoin="round"/>
  </g>
</svg>`;

async function main() {
  if (!existsSync(ICON_DIR)) {
    await mkdir(ICON_DIR, { recursive: true });
  }

  const stdSvg512 = Buffer.from(iconSvg(512));
  const maskableBuf = Buffer.from(maskableSvg);

  await Promise.all([
    sharp(stdSvg512).resize(192, 192).png().toFile(`${ICON_DIR}/icon-192.png`),
    sharp(stdSvg512).resize(512, 512).png().toFile(`${ICON_DIR}/icon-512.png`),
    sharp(maskableBuf).resize(512, 512).png().toFile(`${ICON_DIR}/icon-512-maskable.png`),
    sharp(stdSvg512).resize(180, 180).png().toFile(`${ICON_DIR}/apple-touch-icon.png`),
    sharp(stdSvg512).resize(72, 72).png().toFile(`${ICON_DIR}/badge-72.png`),
  ]);

  console.log("✓ PWA icons generated in public/icons/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
