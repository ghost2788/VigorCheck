import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  APP_ICON_BACKGROUND,
  APP_ICON_DOT_COUNT,
  APP_ICON_GLOW_OPACITY,
  APP_ICON_RINGS,
  buildAppIconRingLayouts,
} from "../../lib/branding/appIconSpec";

type BackgroundShape = "circle" | "none" | "rounded-square" | "square";
type PaletteMode = "full-color" | "monochrome";

type IconSvgOptions = {
  artScaleRatio?: number;
  backgroundShape: BackgroundShape;
  canvasSize: number;
  includeGlow?: boolean;
  monotoneColor?: string;
  roundedSquareInsetRatio?: number;
  roundedSquareRadiusRatio?: number;
};

const ROOT = path.resolve(__dirname, "../..");
const ASSETS_DIR = path.join(ROOT, "assets");
const BRANDING_DIR = path.join(ASSETS_DIR, "branding");
const STORE_DIR = path.join(ASSETS_DIR, "store");
const STORE_SCREENSHOT_DIR = path.join(STORE_DIR, "app-store-ready-phone-screenshots");
const STORE_BOARD_IMAGE_DIR = path.join(ROOT, "previews", "store-screenshot-board", "images");

const FEATURE_GRAPHIC_SIZE = { height: 500, width: 1024 } as const;
const WELCOME_SCREEN_SIZE = { height: 2340, width: 1080 } as const;
const POSTER_SIZE = { height: 1920, width: 1080 } as const;
const WELCOME_POSTER_PHONE = {
  left: 276,
  screenHeight: 1083,
  screenRadius: 40,
  screenWidth: 500,
  shellPadding: 14,
  shellRadius: 54,
  top: 742,
} as const;
const ANDROID_ADAPTIVE_ART_SCALE_RATIO = 0.74;
const ICON_WHITE = "#f3efe7";

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function renderIconSvg({
  artScaleRatio = 1,
  backgroundShape,
  canvasSize,
  includeGlow = true,
  monotoneColor,
  roundedSquareInsetRatio = 0.06,
  roundedSquareRadiusRatio = 0.22,
}: IconSvgOptions) {
  const center = canvasSize / 2;
  const paletteMode: PaletteMode = monotoneColor ? "monochrome" : "full-color";
  const artCanvasSize = canvasSize * artScaleRatio;
  const artInset = (canvasSize - artCanvasSize) / 2;
  const rings = buildAppIconRingLayouts(artCanvasSize);

  const backgroundMarkup = (() => {
    switch (backgroundShape) {
      case "square":
        return `<rect x="0" y="0" width="${canvasSize}" height="${canvasSize}" fill="url(#bg)" />`;
      case "circle":
        return `<circle cx="${center}" cy="${center}" r="${canvasSize * 0.46}" fill="url(#bg)" />`;
      case "rounded-square": {
        const inset = canvasSize * roundedSquareInsetRatio;
        const size = canvasSize - inset * 2;
        const radius = size * roundedSquareRadiusRatio;
        return `<rect x="${inset}" y="${inset}" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#bg)" />`;
      }
      default:
        return "";
    }
  })();

  const circlesMarkup = rings
    .flatMap((ring) =>
      ring.dots.flatMap((dot) => {
        const color = paletteMode === "monochrome" ? monotoneColor! : ring.color;
        const glow = includeGlow
          ? `<circle cx="${dot.centerX + artInset}" cy="${dot.centerY + artInset}" r="${
              dot.glowSize / 2
            }" fill="${hexToRgba(
              color,
              APP_ICON_GLOW_OPACITY
            )}" />`
          : "";
        const fill = `<circle cx="${dot.centerX + artInset}" cy="${dot.centerY + artInset}" r="${
          dot.size / 2
        }" fill="${color}" />`;

        return [glow, fill];
      })
    )
    .join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${APP_ICON_BACKGROUND.start}" />
          <stop offset="100%" stop-color="${APP_ICON_BACKGROUND.end}" />
        </linearGradient>
      </defs>
      ${backgroundMarkup}
      ${circlesMarkup}
    </svg>
  `;
}

async function writePng(filePath: string, svgMarkup: string, size: number) {
  await sharp(Buffer.from(svgMarkup)).resize(size, size).png().toFile(filePath);
}

async function writeJpeg(filePath: string, svgMarkup: string, width: number, height: number) {
  await sharp(Buffer.from(svgMarkup))
    .resize(width, height)
    .jpeg({ mozjpeg: true, quality: 92 })
    .toFile(filePath);
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function renderFeatureGraphicSvg(theme: "dark" | "light") {
  const colors =
    theme === "dark"
      ? {
          accent: "#d19a52",
          body: "#ddd4c8",
          card: "rgba(255,255,255,0.045)",
          cardBorder: "rgba(255,255,255,0.08)",
          headline: "#f0ece5",
          muted: "rgba(255,255,255,0.52)",
          start: "#2d1d12",
          end: "#141210",
        }
      : {
          accent: "#d08f49",
          body: "#7e6757",
          card: "rgba(255,255,255,0.72)",
          cardBorder: "rgba(96,69,48,0.12)",
          headline: "#4e3928",
          muted: "rgba(78,57,40,0.56)",
          start: "#f1e7d8",
          end: "#e6ddcf",
        };

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${FEATURE_GRAPHIC_SIZE.width}" height="${FEATURE_GRAPHIC_SIZE.height}" viewBox="0 0 ${FEATURE_GRAPHIC_SIZE.width} ${FEATURE_GRAPHIC_SIZE.height}">
      <defs>
        <linearGradient id="feature-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colors.start}" />
          <stop offset="100%" stop-color="${colors.end}" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#feature-bg)" />
      <circle cx="80" cy="422" r="180" fill="${hexToRgba("#8d4d1d", theme === "dark" ? 0.22 : 0.09)}" />
      <circle cx="918" cy="84" r="96" fill="${hexToRgba("#78a0c8", theme === "dark" ? 0.1 : 0.06)}" />
      <circle cx="842" cy="430" r="140" fill="${hexToRgba("#5ebaa9", theme === "dark" ? 0.08 : 0.05)}" />

      <text x="76" y="94" fill="${colors.accent}" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="0.12em">VIGORCHECK</text>
      <text x="76" y="132" fill="${colors.muted}" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="600" letter-spacing="0.08em">MACRO-FIRST NUTRITION TRACKING</text>

      <text x="76" y="210" fill="${colors.headline}" font-family="Segoe UI, Arial, sans-serif" font-size="68" font-weight="320">
        <tspan x="76" dy="0">Track calories,</tspan>
        <tspan x="76" dy="74">protein, carbs,</tspan>
        <tspan x="76" dy="74">and fat with AI.</tspan>
      </text>

      <text x="76" y="398" fill="${colors.body}" font-family="Segoe UI, Arial, sans-serif" font-size="21">
        <tspan x="76" dy="0">Build your plan around your goals, log meals in seconds,</tspan>
        <tspan x="76" dy="30">then see your daily score at a glance.</tspan>
      </text>

      <rect x="634" y="90" width="332" height="114" rx="22" ry="22" fill="${colors.card}" stroke="${colors.cardBorder}" />
      <text x="660" y="132" fill="${colors.accent}" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="0.12em">01 PLAN</text>
      <text x="660" y="166" fill="${colors.headline}" font-family="Segoe UI, Arial, sans-serif" font-size="24">
        <tspan x="660" dy="0">Personalized macro</tspan>
        <tspan x="660" dy="30">targets for your goal</tspan>
      </text>

      <rect x="634" y="218" width="332" height="114" rx="22" ry="22" fill="${colors.card}" stroke="${colors.cardBorder}" />
      <text x="660" y="260" fill="${colors.accent}" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="0.12em">02 LOG</text>
      <text x="660" y="294" fill="${colors.headline}" font-family="Segoe UI, Arial, sans-serif" font-size="24">
        <tspan x="660" dy="0">Fast AI-assisted</tspan>
        <tspan x="660" dy="30">meal capture</tspan>
      </text>

      <rect x="634" y="346" width="332" height="114" rx="22" ry="22" fill="${colors.card}" stroke="${colors.cardBorder}" />
      <text x="660" y="388" fill="${colors.accent}" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="0.12em">03 SEE</text>
      <text x="660" y="422" fill="${colors.headline}" font-family="Segoe UI, Arial, sans-serif" font-size="24">
        <tspan x="660" dy="0">One score across</tspan>
        <tspan x="660" dy="30">all four macros</tspan>
      </text>
    </svg>
  `;
}

function renderWelcomeScreenSvg() {
  const size = 300;
  const iconMarkup = renderIconSvg({
    backgroundShape: "none",
    canvasSize: size,
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${WELCOME_SCREEN_SIZE.width}" height="${WELCOME_SCREEN_SIZE.height}" viewBox="0 0 ${WELCOME_SCREEN_SIZE.width} ${WELCOME_SCREEN_SIZE.height}">
      <defs>
        <linearGradient id="welcome-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${APP_ICON_BACKGROUND.start}" />
          <stop offset="100%" stop-color="${APP_ICON_BACKGROUND.end}" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#welcome-bg)" />
      <text x="96" y="146" fill="#c9a66d" font-family="Segoe UI, Arial, sans-serif" font-size="44" font-weight="800" letter-spacing="0.14em">VIGORCHECK</text>
      <g transform="translate(${(WELCOME_SCREEN_SIZE.width - size) / 2}, 290)">
        ${iconMarkup}
      </g>
      <text x="96" y="920" fill="#efe7dc" font-family="Segoe UI, Arial, sans-serif" font-size="92" font-weight="300">
        <tspan x="96" dy="0">Hit your</tspan>
        <tspan x="96" dy="112">macros</tspan>
        <tspan x="96" dy="112">without the</tspan>
        <tspan x="96" dy="112">logging grind.</tspan>
      </text>
      <text x="96" y="1410" fill="rgba(255,255,255,0.62)" font-family="Segoe UI, Arial, sans-serif" font-size="48">
        <tspan x="96" dy="0">Build your plan in minutes. Track</tspan>
        <tspan x="96" dy="64">calories, protein, carbs, and fat</tspan>
        <tspan x="96" dy="64">faster with AI.</tspan>
      </text>
      <rect x="96" y="1754" width="888" height="122" rx="30" ry="30" fill="#213a32" stroke="rgba(94,186,169,0.35)" />
      <text x="540" y="1836" text-anchor="middle" fill="#77d2be" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="0.12em">GET STARTED</text>
      <text x="352" y="2012" fill="rgba(255,255,255,0.52)" font-family="Segoe UI, Arial, sans-serif" font-size="40">Already have an account?</text>
      <text x="762" y="2012" fill="#5ebaa9" font-family="Segoe UI, Arial, sans-serif" font-size="40">Sign in</text>
    </svg>
  `;
}

function renderWelcomePosterSvg() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_SIZE.width}" height="${POSTER_SIZE.height}" viewBox="0 0 ${POSTER_SIZE.width} ${POSTER_SIZE.height}">
      <defs>
        <linearGradient id="poster-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#181511" />
          <stop offset="100%" stop-color="#0d0b09" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#poster-bg)" />
      <circle cx="220" cy="1460" r="340" fill="rgba(209,154,82,0.18)" />
      <circle cx="822" cy="1310" r="240" fill="rgba(120,160,200,0.08)" />
      <text x="88" y="154" fill="#d19a52" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="0.18em">VIGORCHECK</text>
      <text x="88" y="334" fill="#f4f0ea" font-family="Segoe UI, Arial, sans-serif" font-size="110" font-weight="300">
        <tspan x="88" dy="0">A better way</tspan>
        <tspan x="88" dy="108">to track</tspan>
        <tspan x="88" dy="108">nutrition</tspan>
      </text>
      <text x="88" y="638" fill="#ddd5ca" font-family="Segoe UI, Arial, sans-serif" font-size="40">
        <tspan x="88" dy="0">Start with a personalized plan built</tspan>
        <tspan x="88" dy="54">around your goals.</tspan>
      </text>
    </svg>
  `;
}

function renderPosterPhoneShadowSvg(shellWidth: number, shellHeight: number, shellRadius: number) {
  const padding = 140;
  const width = shellWidth + padding * 2;
  const height = shellHeight + padding * 2;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <filter id="phone-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="34" />
        </filter>
      </defs>
      <rect
        x="${padding}"
        y="${padding + 22}"
        width="${shellWidth}"
        height="${shellHeight}"
        rx="${shellRadius}"
        ry="${shellRadius}"
        fill="rgba(0, 0, 0, 0.5)"
        filter="url(#phone-shadow)"
      />
      <rect
        x="${padding + 26}"
        y="${padding + 92}"
        width="${shellWidth - 52}"
        height="${shellHeight - 168}"
        rx="${shellRadius - 18}"
        ry="${shellRadius - 18}"
        fill="rgba(209, 154, 82, 0.1)"
        filter="url(#phone-shadow)"
      />
    </svg>
  `;
}

function renderPosterPhoneShellSvg(
  shellWidth: number,
  shellHeight: number,
  shellRadius: number,
  shellPadding: number,
  screenWidth: number,
  screenHeight: number,
  screenRadius: number
) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${shellWidth}" height="${shellHeight}" viewBox="0 0 ${shellWidth} ${shellHeight}">
      <defs>
        <linearGradient id="phone-shell-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#665847" />
          <stop offset="100%" stop-color="#2b2118" />
        </linearGradient>
        <mask id="phone-shell-mask">
          <rect width="${shellWidth}" height="${shellHeight}" fill="white" />
          <rect
            x="${shellPadding}"
            y="${shellPadding}"
            width="${screenWidth}"
            height="${screenHeight}"
            rx="${screenRadius}"
            ry="${screenRadius}"
            fill="black"
          />
        </mask>
      </defs>
      <rect
        width="${shellWidth}"
        height="${shellHeight}"
        rx="${shellRadius}"
        ry="${shellRadius}"
        fill="url(#phone-shell-fill)"
        mask="url(#phone-shell-mask)"
      />
      <rect
        x="0.5"
        y="0.5"
        width="${shellWidth - 1}"
        height="${shellHeight - 1}"
        rx="${shellRadius - 0.5}"
        ry="${shellRadius - 0.5}"
        fill="none"
        stroke="rgba(255, 255, 255, 0.14)"
      />
      <rect
        x="${shellPadding}"
        y="${shellPadding}"
        width="${screenWidth}"
        height="${screenHeight}"
        rx="${screenRadius}"
        ry="${screenRadius}"
        fill="none"
        stroke="rgba(255, 255, 255, 0.05)"
      />
    </svg>
  `;
}

function renderPosterPhoneNotchSvg(screenWidth: number) {
  const notchWidth = Math.round(screenWidth * 0.34);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${screenWidth}" height="60" viewBox="0 0 ${screenWidth} 60">
      <rect
        x="${Math.round((screenWidth - notchWidth) / 2)}"
        y="0"
        width="${notchWidth}"
        height="28"
        rx="14"
        ry="14"
        fill="rgba(0, 0, 0, 0.84)"
      />
    </svg>
  `;
}

async function renderRoundedPhoneScreenBuffer(
  filePath: string,
  width: number,
  height: number,
  radius: number
) {
  const mask = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white" />
    </svg>
  `);

  return sharp(filePath)
    .resize(width, height, {
      fit: "cover",
      position: "top",
    })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function generateCoreAssets() {
  const iconPng = renderIconSvg({
    backgroundShape: "square",
    canvasSize: 1024,
  });
  const livePreviewPng = renderIconSvg({
    backgroundShape: "square",
    canvasSize: 1024,
  });
  const faviconPng = renderIconSvg({
    backgroundShape: "square",
    canvasSize: 48,
  });
  const splashPng = renderIconSvg({
    backgroundShape: "none",
    canvasSize: 200,
  });
  const androidForegroundPng = renderIconSvg({
    artScaleRatio: ANDROID_ADAPTIVE_ART_SCALE_RATIO,
    backgroundShape: "none",
    canvasSize: 432,
    includeGlow: false,
  });
  const androidMonochromePng = renderIconSvg({
    artScaleRatio: ANDROID_ADAPTIVE_ART_SCALE_RATIO,
    backgroundShape: "none",
    canvasSize: 432,
    includeGlow: false,
    monotoneColor: ICON_WHITE,
  });

  await Promise.all([
    writePng(path.join(ASSETS_DIR, "icon.png"), iconPng, 1024),
    writePng(path.join(ASSETS_DIR, "icon-live-preview.png"), livePreviewPng, 1024),
    writePng(path.join(ASSETS_DIR, "favicon.png"), faviconPng, 48),
    writePng(path.join(ASSETS_DIR, "splash-icon.png"), splashPng, 200),
    writePng(path.join(ASSETS_DIR, "android-icon-foreground.png"), androidForegroundPng, 432),
    writePng(
      path.join(ASSETS_DIR, "android-icon-foreground-live-preview.png"),
      androidForegroundPng,
      432
    ),
    writePng(path.join(ASSETS_DIR, "android-icon-monochrome.png"), androidMonochromePng, 432),
    sharp({
      create: {
        background: APP_ICON_BACKGROUND.start,
        channels: 4,
        height: 432,
        width: 432,
      },
    })
      .png()
      .toFile(path.join(ASSETS_DIR, "android-icon-background.png")),
  ]);
}

async function generateBrandMarks() {
  await Promise.all([
    writePng(
      path.join(BRANDING_DIR, "brand-mark-transparent.png"),
      renderIconSvg({
        backgroundShape: "none",
        canvasSize: 1024,
      }),
      1024
    ),
    writePng(
      path.join(BRANDING_DIR, "brand-mark-rounded-square.png"),
      renderIconSvg({
        backgroundShape: "rounded-square",
        canvasSize: 1024,
      }),
      1024
    ),
    writePng(
      path.join(BRANDING_DIR, "brand-mark-circle-crop.png"),
      renderIconSvg({
        backgroundShape: "circle",
        canvasSize: 1024,
      }),
      1024
    ),
  ]);
}

async function generateFeatureGraphics() {
  const [darkBackground, lightBackground] = await Promise.all([
    sharp(Buffer.from(renderFeatureGraphicSvg("dark"))).png().toBuffer(),
    sharp(Buffer.from(renderFeatureGraphicSvg("light"))).png().toBuffer(),
  ]);

  await Promise.all([
    sharp(darkBackground).png().toFile(path.join(STORE_DIR, "play-feature-graphic.png")),
    sharp(lightBackground).png().toFile(path.join(STORE_DIR, "play-feature-graphic-white-icon.png")),
  ]);
}

async function generateWelcomePosterAssets() {
  const welcomeImagePath = path.join(STORE_BOARD_IMAGE_DIR, "welcome.jpg");
  const generatedWelcomeImagePath = path.join(STORE_BOARD_IMAGE_DIR, "welcome.generated.jpg");
  const screenWidth = WELCOME_POSTER_PHONE.screenWidth;
  const screenHeight = WELCOME_POSTER_PHONE.screenHeight;
  const shellPadding = WELCOME_POSTER_PHONE.shellPadding;
  const shellWidth = screenWidth + shellPadding * 2;
  const shellHeight = screenHeight + shellPadding * 2;

  await writeJpeg(
    generatedWelcomeImagePath,
    renderWelcomeScreenSvg(),
    WELCOME_SCREEN_SIZE.width,
    WELCOME_SCREEN_SIZE.height
  );

  const posterSourceImagePath = (await fileExists(welcomeImagePath))
    ? welcomeImagePath
    : generatedWelcomeImagePath;

  const [posterBackground, phoneShadow, phoneShell, phoneNotch, welcomePhoneImage] = await Promise.all([
    sharp(Buffer.from(renderWelcomePosterSvg())).png().toBuffer(),
    sharp(
      Buffer.from(
        renderPosterPhoneShadowSvg(shellWidth, shellHeight, WELCOME_POSTER_PHONE.shellRadius)
      )
    )
      .png()
      .toBuffer(),
    sharp(
      Buffer.from(
        renderPosterPhoneShellSvg(
          shellWidth,
          shellHeight,
          WELCOME_POSTER_PHONE.shellRadius,
          shellPadding,
          screenWidth,
          screenHeight,
          WELCOME_POSTER_PHONE.screenRadius
        )
      )
    )
      .png()
      .toBuffer(),
    sharp(Buffer.from(renderPosterPhoneNotchSvg(screenWidth))).png().toBuffer(),
    renderRoundedPhoneScreenBuffer(
      posterSourceImagePath,
      screenWidth,
      screenHeight,
      WELCOME_POSTER_PHONE.screenRadius
    ),
  ]);

  await sharp(posterBackground)
    .composite([
      {
        input: phoneShadow,
        left: WELCOME_POSTER_PHONE.left - 140,
        top: WELCOME_POSTER_PHONE.top - 140,
      },
      {
        input: welcomePhoneImage,
        left: WELCOME_POSTER_PHONE.left + shellPadding,
        top: WELCOME_POSTER_PHONE.top + shellPadding,
      },
      {
        input: phoneShell,
        left: WELCOME_POSTER_PHONE.left,
        top: WELCOME_POSTER_PHONE.top,
      },
      {
        input: phoneNotch,
        left: WELCOME_POSTER_PHONE.left + shellPadding,
        top: WELCOME_POSTER_PHONE.top + shellPadding,
      },
    ])
    .png()
    .toFile(path.join(STORE_SCREENSHOT_DIR, "02-welcome-poster.png"));
}

async function main() {
  await mkdir(BRANDING_DIR, { recursive: true });
  await mkdir(STORE_DIR, { recursive: true });
  await mkdir(STORE_SCREENSHOT_DIR, { recursive: true });
  await mkdir(STORE_BOARD_IMAGE_DIR, { recursive: true });

  await generateCoreAssets();
  await generateBrandMarks();
  await generateFeatureGraphics();
  await generateWelcomePosterAssets();

  const summary = [
    `Generated ${APP_ICON_RINGS.length} rings with ${APP_ICON_DOT_COUNT} dots each.`,
    "Updated Expo icon assets, brand marks, targeted feature graphics, and the welcome poster assets.",
  ];

  process.stdout.write(`${summary.join("\n")}\n`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
