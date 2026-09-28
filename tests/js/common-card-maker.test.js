const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const jquery = require("jquery");

const ROOT = path.join(__dirname, "../..");

function createHarness() {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div id="canvasContainer"><canvas id="myCanvas" width="744" height="1039"></canvas></div>
    <input id="inputTitle"><input id="inputHP"><input id="inputKeywords">
    <input id="inputBoldWords"><textarea id="inputEffect"></textarea>
    <input id="inputEffectTextSize"><input id="inputQuote"><input id="inputQuoteTextSize">
    <input id="inputAttribution"><input id="inputArtistAttribution">
    <input class="inputImageOffsetX"><input class="inputImageOffsetY">
    <input class="inputImageScale">
    <input id="suddenly" type="checkbox"><textarea id="jsonInput"></textarea>
    <input id="inputPowerName"><input id="inputDisplayBorder" type="checkbox">
    <input id="inputVariantToggle" type="checkbox"><input id="inputVariantColor" type="checkbox">
    <input class="inputImageOffsetX" data-image-purpose="nemesisIcon">
    <input class="inputImageOffsetY" data-image-purpose="nemesisIcon">
    <input class="inputImageScale" data-image-purpose="nemesisIcon">
    <input class="inputImageOffsetX" data-image-purpose="backgroundArt">
    <input class="inputImageOffsetY" data-image-purpose="backgroundArt">
    <input class="inputImageScale" data-image-purpose="backgroundArt">
    <input class="inputImageOffsetX" data-image-purpose="foregroundArt">
    <input class="inputImageOffsetY" data-image-purpose="foregroundArt">
    <input class="inputImageScale" data-image-purpose="foregroundArt">
    <input class="inputImageOffsetX" data-image-purpose="nameLogo">
    <input class="inputImageOffsetY" data-image-purpose="nameLogo">
    <input class="inputImageScale" data-image-purpose="nameLogo">
  </body></html>`, { runScripts: "outside-only", url: "https://example.test/" });

  const { window } = dom;
  const context = {
    save: vi.fn(), restore: vi.fn(), drawImage: vi.fn(), fillText: vi.fn(),
    measureText: () => ({ width: 10 }), beginPath: vi.fn(), moveTo: vi.fn(),
    lineTo: vi.fn(), closePath: vi.fn(), clip: vi.fn(), stroke: vi.fn(),
    fill: vi.fn(), quadraticCurveTo: vi.fn(), setLineDash: vi.fn(),
  };
  window.HTMLCanvasElement.prototype.getContext = () => context;
  window.Path2D = class {
    moveTo() {}
    lineTo() {}
    closePath() {}
  };
  window.$ = window.jQuery = jquery(window);
  window.drawCardCanvas = vi.fn();

  const config = `
    const CARD_FORM = "deck";
    const CARD_CATEGORY = "basic";
    const ORIENTATION = "vertical";
    const FACE = "front";
    const DEFAULT_DOWNLOAD_NAME = "test-card";
    var cardArtImage = null;
  `;
  const before = fs.readFileSync(path.join(ROOT, "common-before.js"), "utf8");
  const after = fs.readFileSync(path.join(ROOT, "common-after.js"), "utf8");
  window.eval(config + before + after + `
    window.__common = {
      pw, ph, ps, coordinatesToPathShape, parseBodyText, parseJSONData,
      outputJSONData, SPACE_BLOCK, PHASE_BLOCK, INDENT_BLOCK, SIMPLE_BLOCK
    };
  `);
  return { dom, window, $: window.$, api: window.__common };
}

describe("shared card-maker logic", () => {
  test("converts percentage coordinates and reports path bounds", () => {
    const { dom, api } = createHarness();
    expect(api.pw(50)).toBe(372);
    expect(api.ph(50)).toBe(519.5);
    expect(api.ps(10)).toBe(74.4);
    expect(api.coordinatesToPathShape([[10, 20], [50, 80]])).toMatchObject({
      leftmostX: 74.4,
      rightmostX: 372,
      topmostY: 207.8,
      bottommostY: 831.2,
      centerX: 223.2,
      centerY: 519.5,
    });
    dom.window.close();
  });

  test("classifies phases, powers, reactions, bullets, spaces, and plain text", () => {
    const { dom, api } = createHarness();
    expect(api.parseBodyText("")).toEqual({ type: api.SPACE_BLOCK });
    expect(api.parseBodyText("[Start Phase]: Do a thing")).toEqual([
      { type: api.PHASE_BLOCK, label: "start" },
      { type: api.SIMPLE_BLOCK, content: "Do a thing" },
    ]);
    expect(api.parseBodyText("POWER: Hit a target")).toEqual([
      { type: api.INDENT_BLOCK, label: "power:", content: "Hit a target" },
    ]);
    expect(api.parseBodyText("Reaction: Defend")).toEqual([
      { type: api.INDENT_BLOCK, label: "reaction:", content: "Defend" },
    ]);
    expect(api.parseBodyText("> Help an ally")).toEqual([
      { type: api.INDENT_BLOCK, label: "»", content: "Help an ally" },
    ]);
    expect(api.parseBodyText("Ordinary rules text")).toEqual([
      { type: api.SIMPLE_BLOCK, content: "Ordinary rules text" },
    ]);
    dom.window.close();
  });

  test("imports nonnumeric zooms using documented defaults", () => {
    const { dom, $, api } = createHarness();
    api.parseJSONData({
      ImageZoom: "not-a-number",
      NemesisZoom: "bad",
      BackgroundArtZoom: "bad",
      ForegroundArtZoom: "bad",
      NameLogoZoom: "bad",
    });
    expect($(".inputImageScale").first().val()).toBe("100");
    for (const purpose of ["nemesisIcon", "backgroundArt", "foregroundArt", "nameLogo"]) {
      expect($(`.inputImageScale[data-image-purpose="${purpose}"]`).val()).toBe("0");
    }
    dom.window.close();
  });

  test("imports defaults and outputs deck and character JSON", () => {
    const { dom, $, api } = createHarness();
    api.parseJSONData({ Title: "Test Card", GameText: "Power: Test" });
    expect($("#inputTitle").val()).toBe("Test Card");
    expect($("#inputEffect").val()).toBe("Power: Test");
    expect($("#inputEffectTextSize").val()).toBe("100");

    $("#inputHP").val("10");
    $("#inputKeywords").val("One-Shot");
    $(".inputImageScale:not([data-image-purpose])").val("125");
    expect($(".inputImageScale").first().val()).toBe("125");
    $("#suddenly").prop("checked", true);
    api.outputJSONData("basic");
    const deck = JSON.parse($("#jsonInput").val().replace(/,$/, ""));
    expect(deck).toMatchObject({
      Title: "Test Card", HP: "10", GameText: "Power: Test",
      ImageZoom: "125", Suddenly: true,
    });

    $("#inputPowerName").val("Test Power");
    api.outputJSONData("hero_character");
    const character = JSON.parse($("#jsonInput").val());
    expect(character).toMatchObject({
      HP: "10", PowerName: "Test Power", GameText: "Power: Test",
      ShowBorder: false, VariantToggle: false,
    });
    dom.window.close();
  });
});
