const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "output", "reddit-ads-v2");
const LOGO_PATH = path.join(ROOT, "assets", "branding", "brand-mark-transparent.png");
const SCREEN_DIR = path.join(ROOT, "previews", "store-screenshot-board", "images");

const ADS = [
  {
    fileName: "reddit-sequence-01-hook.png",
    screen: "log.jpg",
    headline: ["Tired of logging", "macros one field", "at a time?"],
    subhead: ["Start with a quick scan instead.", "No spreadsheet energy required."],
    button: "Install Now",
  },
  {
    fileName: "reddit-sequence-02-review.png",
    screen: "review.jpg",
    headline: ["Then review the", "draft before", "you save it."],
    subhead: ["Adjust portions, meal type, and prep", "details while you still have control."],
    button: "Install Now",
  },
  {
    fileName: "reddit-sequence-03-day-view.png",
    screen: "dashboard.jpg",
    headline: ["See your whole", "day in one", "place."],
    subhead: ["Calories, protein, hydration, and", "nutrition without digging through tabs."],
    button: "Install Now",
  },
  {
    fileName: "reddit-sequence-04-week-view.png",
    screen: "trends.jpg",
    headline: ["Then see if your", "week is actually", "working."],
    subhead: ["Track consistency over time,", "not just one meal at a time."],
    button: "Install Now",
  },
  {
    fileName: "reddit-ad-log-clean.png",
    screen: "log.jpg",
    headline: ["Your macro tracker", "shouldn't feel", "like data entry."],
    subhead: ["Snap a meal, review the draft,", "and keep moving."],
    button: "Install Now",
  },
  {
    fileName: "reddit-ad-review-clean.png",
    screen: "review.jpg",
    headline: ["Review AI-drafted", "meals before", "saving."],
    subhead: ["Adjust the draft before", "anything is logged."],
    button: "Install Now",
  },
  {
    fileName: "reddit-ad-score-clean.png",
    screen: "dashboard.jpg",
    headline: ["See your day at", "a glance."],
    subhead: ["Track calories, protein, hydration,", "and nutrition in one view."],
    button: "Install Now",
  },
  {
    fileName: "reddit-ad-review-control.png",
    screen: "review.jpg",
    headline: ["Keep control", "after the scan."],
    subhead: ["Edit portions, meal type, and prep", "details before you save."],
    button: "Install Now",
  },
  {
    fileName: "reddit-ad-score-focus.png",
    screen: "dashboard.jpg",
    headline: ["One screen for", "your whole day."],
    subhead: ["See calories, protein, hydration,", "and nutrition without digging."],
    button: "Install Now",
  },
  {
    fileName: "reddit-ad-trends-clean.png",
    screen: "trends.jpg",
    headline: ["See if your week", "is actually", "working."],
    subhead: ["Track consistency over time,", "not just one meal at a time."],
    button: "Install Now",
  },
  {
    fileName: "reddit-ad-nutrients-clean.png",
    screen: "nutrients.jpg",
    headline: ["Go beyond", "just calories."],
    subhead: ["Spot nutrient gaps without", "turning tracking into homework."],
    button: "Install Now",
  },
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function backgroundSvg(width, height) {
  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1a1714" />
          <stop offset="58%" stop-color="#141619" />
          <stop offset="100%" stop-color="#171412" />
        </linearGradient>
        <radialGradient id="amber" cx="0.09" cy="0.86" r="0.42">
          <stop offset="0%" stop-color="#7b4b1b" stop-opacity="0.36" />
          <stop offset="100%" stop-color="#7b4b1b" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="teal" cx="0.94" cy="0.10" r="0.34">
          <stop offset="0%" stop-color="#285f59" stop-opacity="0.22" />
          <stop offset="100%" stop-color="#285f59" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)" />
      <rect width="${width}" height="${height}" fill="url(#amber)" />
      <rect width="${width}" height="${height}" fill="url(#teal)" />
    </svg>
  `);
}

function textSvg(width, height, blocks) {
  const body = blocks
    .map((block) => {
      const tspans = block.lines
        .map((line, index) => {
          const dy =
            index === 0
              ? 0
              : block.lineHeight || Math.round((block.fontSize || 32) * 1.1);
          return `<tspan x="${block.x}" dy="${dy}">${escapeXml(line)}</tspan>`;
        })
        .join("");

      const attrs = [
        `x="${block.x}"`,
        `y="${block.y}"`,
        `fill="${block.fill || "#efe5d8"}"`,
        `font-family="Segoe UI, Arial, sans-serif"`,
        `font-size="${block.fontSize || 32}"`,
        `font-weight="${block.fontWeight || 500}"`,
        block.letterSpacing ? `letter-spacing="${block.letterSpacing}"` : "",
        block.opacity !== undefined ? `opacity="${block.opacity}"` : "",
      ]
        .filter(Boolean)
        .join(" ");

      return `<text ${attrs}>${tspans}</text>`;
    })
    .join("");

  return Buffer.from(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`
  );
}

function buttonSvg(width, height, label) {
  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="buttonGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#2d6d62" />
          <stop offset="100%" stop-color="#235550" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="${Math.round(height / 2)}" fill="url(#buttonGradient)" />
      <text
        x="${width / 2}"
        y="${height / 2 + 10}"
        fill="#e8f4f2"
        text-anchor="middle"
        font-family="Segoe UI, Arial, sans-serif"
        font-size="28"
        font-weight="700"
      >${escapeXml(label)}</text>
    </svg>
  `);
}

function shadowSvg(width, height, radius, opacity) {
  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>
      <rect
        x="18"
        y="18"
        width="${width - 36}"
        height="${height - 36}"
        rx="${radius}"
        fill="rgba(0,0,0,${opacity})"
        filter="url(#shadow)"
      />
    </svg>
  `);
}

async function roundedScreenshot(inputPath, width, height, radius = 30) {
  const resized = await sharp(inputPath).resize(width, height).png().toBuffer();
  const mask = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" rx="${radius}" fill="#fff" />
    </svg>
  `);

  return sharp(resized)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function buildAd(config) {
  const width = 1080;
  const height = 1080;
  const screenWidth = 330;
  const screenHeight = 898;
  const screenLeft = 694;
  const screenTop = 118;

  const logo = await sharp(LOGO_PATH).resize(52, 52).png().toBuffer();
  const screenshot = await roundedScreenshot(
    path.join(SCREEN_DIR, config.screen),
    screenWidth,
    screenHeight,
    30
  );

  const image = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: "#171513",
    },
  }).composite([
    { input: backgroundSvg(width, height) },
    { input: logo, left: 56, top: 56 },
    {
      input: textSvg(width, height, [
        {
          x: 122,
          y: 92,
          lines: ["VIGORCHECK"],
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 2,
          fill: "#c9a25b",
        },
        {
          x: 60,
          y: 188,
          lines: config.headline,
          fontSize: 62,
          fontWeight: 350,
          lineHeight: 72,
        },
        {
          x: 64,
          y: 420,
          lines: config.subhead,
          fontSize: 31,
          fontWeight: 500,
          lineHeight: 40,
          fill: "#c9c0b6",
        },
      ]),
    },
    { input: shadowSvg(screenWidth + 36, screenHeight + 36, 32, 0.28), left: screenLeft - 18, top: screenTop - 18 },
    { input: screenshot, left: screenLeft, top: screenTop },
    { input: buttonSvg(206, 64, config.button), left: 60, top: 930 },
  ]);

  await image.png().toFile(path.join(OUT_DIR, config.fileName));
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await Promise.all(ADS.map(buildAd));
  console.log(OUT_DIR);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
