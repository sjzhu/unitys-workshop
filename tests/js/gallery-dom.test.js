const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const jquery = require("jquery");

const ROOT = path.join(__dirname, "../..");

function createGallery(url = "https://example.test/card-gallery/") {
  const dom = new JSDOM(`<!doctype html><html><body>
    <input class="searchInput"><input id="regex" type="checkbox">
    <input id="autoSubmit" type="checkbox">
    <span class="searchResultsCount"></span>
    <div class="cardFlexDisplay">
      <div id="hd-1" class="card flippable">
        <img class="cardImage" style="display:block">
        <img class="cardImage" style="display:none">
        <div>Fueled Freeze æternus cold damage</div>
      </div>
      <div id="hd-2" class="card">
        <div>Blazing Tornado fire damage bogus:value</div>
      </div>
    </div>
  </body></html>`, { runScripts: "outside-only", url });
  const { window } = dom;
  window.$ = window.jQuery = jquery(window);
  window.$.expr.pseudos.visible = element => element.style.display !== "none";
  window.setTimeout = () => 0;
  window.console.info = vi.fn();
  window.$.ajax = vi.fn();

  const source = [
    "card-gallery/strscan.js",
    "card-gallery/expressive-search.js",
    "card-gallery/script.js",
  ].map(file => fs.readFileSync(path.join(ROOT, file), "utf8")).join("\n");
  window.eval(source + `
    window.__gallery = {
      cards, awesomeParser, submitSearch, executeSearch, updateSearchResultsCount,
      sentinelsReplacements, bindCardFlipping
    };
  `);

  const header = ["Character", "Deck", "Title", "HP", "Keywords", "Game Text", "Flavor", "Attribution", "Quantity", "Set"].join("\t");
  const rows = [
    ["Absolute Zero", "Absolute Zero", "Fueled Freeze", "-", "One-Shot, Cold", "Deal cold damage.", "", "", "1", "Core"],
    ["Ra", "Ra", "Blazing Tornado", "-", "One-Shot, Fire", "Deal fire damage.", "", "", "1", "Core"],
  ].map(row => row.join("\t"));
  window.__gallery.awesomeParser([header, ...rows].join("\n"), "Hero Cards");
  return { dom, window, $: window.$, api: window.__gallery };
}

describe("gallery DOM integration", () => {
  test("filters multiple cards with literal, regex, and expressive searches", () => {
    const { dom, $, api } = createGallery();

    $(".searchInput").val("freeze");
    api.submitSearch();
    expect($("#hd-1").is(":visible")).toBe(true);
    expect($("#hd-2").is(":visible")).toBe(false);
    expect($(".searchResultsCount").text()).toBe("Found 1 result");

    $("#regex").prop("checked", true);
    $(".searchInput").val("Freeze|Tornado");
    api.submitSearch();
    expect($(".card:visible")).toHaveLength(2);
    expect($(".searchResultsCount").text()).toBe("Found 2 results");

    $("#regex").prop("checked", false);
    $(".searchInput").val("type:hero title:freeze");
    api.submitSearch();
    expect($("#hd-1").is(":visible")).toBe(true);
    expect($("#hd-2").is(":visible")).toBe(false);
    dom.window.close();
  });

  test("falls back from invalid expressive syntax and keeps invalid regex stable", () => {
    const { dom, window, $, api } = createGallery();
    window.console.error = vi.fn();
    $(".searchInput").val("bogus:value");
    api.submitSearch();
    expect($("#hd-1").is(":visible")).toBe(false);
    expect($("#hd-2").is(":visible")).toBe(true);
    expect(window.console.error).toHaveBeenCalled();

    $("#regex").prop("checked", true);
    const before = $(".card").map((_, element) => element.style.display).get();
    $(".searchInput").val("[");
    expect(() => api.submitSearch()).not.toThrow();
    expect($(".card").map((_, element) => element.style.display).get()).toEqual(before);
    expect($(".searchResultsCount").text()).toBe("Found 1 result");
    dom.window.close();
  });

  test("updates URL query parameters, counts, and initial URL-backed inputs", () => {
    const { dom, window, $, api } = createGallery(
      "https://example.test/card-gallery/?q=initial&regex=true",
    );
    window.dispatchEvent(new window.Event("load"));
    expect($(".searchInput").val()).toBe("initial");
    expect($("#regex").prop("checked")).toBe(true);

    $("#regex").prop("checked", false);
    $(".searchInput").val("freeze");
    api.submitSearch();
    expect(window.location.search).toBe("?q=freeze");
    $(".searchInput").val("");
    api.submitSearch();
    expect(window.location.search).toBe("");
    expect($(".searchResultsCount").text()).toBe("");
    dom.window.close();
  });

  test("applies Sentinels replacements and flips front/back images", () => {
    const { dom, $, api } = createGallery();
    expect(api.sentinelsReplacements("ae aeternus plain")).toBe("æ æternus plain");
    api.bindCardFlipping();
    $("#hd-1 .cardImage").first().trigger("click");
    expect($("#hd-1").hasClass("flipped")).toBe(true);
    expect($("#hd-1 .cardImage").first().css("display")).toBe("none");
    expect($("#hd-1 .cardImage").last().css("display")).not.toBe("none");
    dom.window.close();
  });
});
