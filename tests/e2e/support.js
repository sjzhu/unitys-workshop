const path = require("node:path");

const localOrigin = "http://127.0.0.1:4173";
const jqueryCdnUrl = "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js";
const jqueryPath = require.resolve("jquery/dist/jquery.min.js");
const fontStylesheetOrigins = new Set([
  "https://fonts.googleapis.com",
  "https://fonts.cdnfonts.com",
]);

// Production loads these families from Google Fonts. Browser tests cannot use the
// network, so map every canvas font to the repository's bundled font. This keeps
// text metrics and rasterization deterministic across developer machines and CI.
const localFontUrl = `${localOrigin}/_resources/NotoSans-Sentinels.woff2`;
const canvasFontFamilies = [
  "Boogaloo",
  "Noto Sans",
  "Work Sans",
  "Unmasked BB",
  "Avengeance Mightiest Avenger",
];
const localFontStylesheet = canvasFontFamilies.map(fontFamily => `
  @font-face {
    font-family: "${fontFamily}";
    src: url("${localFontUrl}") format("woff2");
    font-style: normal;
    font-weight: 100 900;
  }
`).join("\n");

async function installOfflineRoutes(page) {
  await page.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.origin === localOrigin) {
      if (request.resourceType() !== "document") {
        await route.continue();
        return;
      }
      const response = await route.fetch();
      const body = (await response.text())
        .replace(/\s*<link\s+rel=["']preconnect["'][^>]*>/gi, "");
      await route.fulfill({ response, body });
      return;
    }
    if (request.url() === jqueryCdnUrl) {
      await route.fulfill({ path: jqueryPath, contentType: "application/javascript" });
      return;
    }
    if (request.resourceType() === "stylesheet" && fontStylesheetOrigins.has(url.origin)) {
      await route.fulfill({ body: localFontStylesheet, contentType: "text/css" });
      return;
    }
    await route.abort("blockedbyclient");
  });
}

async function waitForCardCanvas(page) {
  await page.waitForFunction(() => {
    if (typeof loadedGraphics === "undefined") return false;
    return Object.values(loadedGraphics).every(image => image.complete && image.naturalWidth > 0);
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
    drawCardCanvas();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

function resourcePath(fileName) {
  return path.join(__dirname, "../../_resources", fileName);
}

module.exports = {
  installOfflineRoutes,
  resourcePath,
  waitForCardCanvas,
};
