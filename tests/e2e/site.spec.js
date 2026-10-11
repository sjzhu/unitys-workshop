const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");
const { installOfflineRoutes, waitForCardCanvas } = require("./support");

const galleryCategories = [
  "Hero Character Cards",
  "Hero Cards",
  "Villain Character Cards",
  "Ennead Character Cards",
  "Events",
  "Critical Events",
  "Villain Cards",
  "Environment Cards",
  "Principle Cards",
  "Dividers",
];

const galleryCardCount = galleryCategories.reduce((total, category) => {
  const file = path.join(__dirname, "../../card-gallery", `${category}.tsv`);
  const rows = fs.readFileSync(file, "utf8").replace(/(?:\r?\n)+$/, "").split(/\r?\n/);
  const headerRows = rows[1].split("\t")[0] === "" ? 2 : 1;
  return total + rows.length - headerRows;
}, 0);

const cardMakerPages = [
  "/hero-deck-front/",
  "/hero-deck-back/",
  "/hero-character-card-front/",
  "/hero-character-card-back/",
  "/villain-deck-front/",
  "/villain-deck-back/",
  "/villain-character-card/",
  "/environment-deck-front/",
  "/environment-deck-back/",
  "/principles-deck-front/",
];

test.beforeEach(async ({ page }) => {
  await installOfflineRoutes(page);
});

for (const pagePath of cardMakerPages) {
  test(`${pagePath} loads and draws its canvas`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));

    await page.goto(pagePath);
    await expect(page.locator("#myCanvas")).toBeVisible();
    await waitForCardCanvas(page);
    const canvasState = await page.locator("#myCanvas").evaluate(canvas => {
      const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      const firstRed = pixels[0];
      const firstGreen = pixels[1];
      const firstBlue = pixels[2];
      const firstAlpha = pixels[3];
      let hasOpaquePixel = false;
      let hasColorVariation = false;

      for (let index = 0; index < pixels.length; index += 4) {
        hasOpaquePixel ||= pixels[index + 3] > 0;
        hasColorVariation ||= pixels[index] !== firstRed || pixels[index + 1] !== firstGreen ||
          pixels[index + 2] !== firstBlue || pixels[index + 3] !== firstAlpha;
        if (hasOpaquePixel && hasColorVariation) break;
      }

      return {
        width: canvas.width,
        height: canvas.height,
        hasOpaquePixel,
        hasColorVariation,
      };
    });
    expect(canvasState.width).toBeGreaterThan(0);
    expect(canvasState.height).toBeGreaterThan(0);
    expect(canvasState.hasOpaquePixel).toBe(true);
    expect(canvasState.hasColorVariation).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("gallery loads the real corpus, searches, and flips a card", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));

  await page.goto("/card-gallery/");
  await expect(page.locator(".card")).toHaveCount(galleryCardCount, { timeout: 30_000 });

  await page.locator(".searchInput").fill('title:"Cold Snap"');
  await page.locator(".searchSubmit").click();
  await expect(page.locator(".searchResultsCount")).toHaveText("Found 1 result");
  await expect(page).toHaveURL(/q=title%3A%22Cold\+Snap%22/);

  const result = page.locator(".card:visible").first();
  await expect(result).toContainText("Cold Snap");
  const images = result.locator(".cardImage");
  await expect(images).toHaveCount(2);
  await expect(images.nth(1)).toBeHidden();
  await images.first().click();
  await expect(result).toHaveClass(/flipped/);
  await expect(images.first()).toBeHidden();
  await expect(images.nth(1)).toBeVisible();

  expect(errors).toEqual([]);
});

test("hero deck front redraws and round-trips JSON", async ({ page }) => {
  await page.goto("/hero-deck-front/");
  const canvas = page.locator("#myCanvas");
  const initialImage = await canvas.evaluate(element => element.toDataURL("image/png"));

  await page.locator("#inputTitle").fill("Playwright Hero");
  await page.locator("#inputEffect").fill("Power: Draw 1 card.");
  await expect.poll(() => canvas.evaluate(element => element.toDataURL("image/png")))
    .not.toBe(initialImage);

  await page.locator("#outputJsonButton").click();
  const exported = await page.locator("#jsonInput").inputValue();
  expect(exported).toContain('"Title": "Playwright Hero"');

  await page.locator("#inputTitle").fill("");
  await page.locator("#inputEffect").fill("");
  await page.locator("#jsonInput").fill(exported);
  await page.locator("#parseJsonInputButton").click();
  await expect(page.locator("#jsonError")).toHaveText("");
  await expect(page.locator("#inputTitle")).toHaveValue("Playwright Hero");
  await expect(page.locator("#inputEffect")).toHaveValue("Power: Draw 1 card.");
});

test("hero character back redraws and round-trips JSON", async ({ page }) => {
  await page.goto("/hero-character-card-back/");
  const canvas = page.locator("#myCanvas");
  const initialImage = await canvas.evaluate(element => element.toDataURL("image/png"));

  await page.locator("#inputPowerName").fill("Browser Tested");
  await page.locator("#inputEffect").fill("Power: One target regains 1 HP.");
  await expect.poll(() => canvas.evaluate(element => element.toDataURL("image/png")))
    .not.toBe(initialImage);

  await page.locator("#outputJsonButton").click();
  const exported = await page.locator("#jsonInput").inputValue();
  expect(exported).toContain('"PowerName": "Browser Tested"');

  await page.locator("#inputPowerName").fill("");
  await page.locator("#inputEffect").fill("");
  await page.locator("#jsonInput").fill(exported);
  await page.locator("#parseJsonInputButton").click();
  await expect(page.locator("#jsonError")).toHaveText("");
  await expect(page.locator("#inputPowerName")).toHaveValue("Browser Tested");
  await expect(page.locator("#inputEffect")).toHaveValue("Power: One target regains 1 HP.");
});
