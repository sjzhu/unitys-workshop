const { test, expect } = require("@playwright/test");
const {
  installOfflineRoutes,
  resourcePath,
  waitForCardCanvas,
} = require("./support");

test.beforeEach(async ({ page }) => {
  await installOfflineRoutes(page);
});

async function expectCanvasToMatchSnapshot(canvas, snapshotName) {
  const dataUrl = await canvas.evaluate(element => element.toDataURL("image/png"));
  const image = Buffer.from(dataUrl.split(",")[1], "base64");
  expect(image).toMatchSnapshot(snapshotName, {
    maxDiffPixels: 100,
    threshold: 0.1,
  });
}

test("hero deck front canvas matches its baseline", async ({ page }) => {
  await page.goto("/hero-deck-front/");
  await waitForCardCanvas(page);

  await page.locator("#inputImageFile").setInputFiles(resourcePath("test_hyperspin.png"));
  await page.locator("#inputTitle").fill("Snapshot Strike");
  await page.locator("#inputHP").fill("7");
  await page.locator("#inputKeywords").fill("One-Shot");
  await page.locator("#inputEffect").fill("Power: Draw 1 card.\n[End Phase]: Deal 1 target 2 energy damage.");
  await page.locator("#inputQuote").fill("A stable future starts here.");
  await page.locator("#inputAttribution").fill("Unity's Workshop #1");
  await page.locator("#inputArtistAttribution").fill("Local Test Art");
  await page.waitForFunction(() => cardArtImage?.complete && cardArtImage.naturalWidth > 0);
  await page.evaluate(() => drawCardCanvas());

  await expectCanvasToMatchSnapshot(page.locator("#myCanvas"), "hero-deck-front.png");
});

test("hero character back canvas matches its baseline", async ({ page }) => {
  await page.goto("/hero-character-card-back/");
  await waitForCardCanvas(page);

  await page.locator('[data-image-purpose="backgroundArt"][type="file"]')
    .setInputFiles(resourcePath("test_herocc.png"));
  await page.locator("#inputPowerName").fill("Reliable Response");
  await page.locator("#inputEffect").fill(
    "Reaction: When a hero target would be dealt damage, reduce that damage by 2."
  );
  await page.waitForFunction(() => {
    const image = loadedUserImages.backgroundArt;
    return image?.complete && image.naturalWidth > 0;
  });
  await page.evaluate(() => drawCardCanvas());

  await expectCanvasToMatchSnapshot(page.locator("#myCanvas"), "hero-character-back.png");
});
