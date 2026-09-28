const fs = require("node:fs");
const path = require("node:path");
const search = require("../../card-gallery/expressive-search.js");

const ROOT = path.join(__dirname, "../..");

function parseCondition(query) {
  const parser = new search.ExpressiveSearcher(query);
  expect(parser.parseQueryStringIntoTokens()).toBe(true);
  return parser.parseTokenList();
}

describe("matching utilities", () => {
  test("matches strings, lists, and later ordered name offsets", () => {
    expect(search.regexMatch("Absolute Zero", /zero/i)).toBe(true);
    expect(search.listRegexMatch(["Device", "Limited"], /^lim/i)).toBe(true);
    expect(search.subArrayOverlapRegexMatch(
      ["Alpha", "Wrong", "Alpha", "Zero"],
      [/^Alpha$/, /^Zero$/],
    )).toBe(true);
  });

  test("matches numeric zero and every comparison operator", () => {
    expect(search.numberMatch(0, 0, "=")).toBe(true);
    expect(search.numberMatch(3, 2, ">")).toBe(true);
    expect(search.numberMatch(3, 3, ">=")).toBe(true);
    expect(search.numberMatch(2, 3, "<")).toBe(true);
    expect(search.numberMatch(2, 2, "<=")).toBe(true);
    expect(search.numberMatch(null, 0, "=")).toBe(false);
  });

  test("matches booleans case-insensitively", () => {
    expect(search.parseBoolean("TRUE")).toBe(true);
    expect(search.parseBoolean("no")).toBe(false);
    expect(search.xnor(true, true)).toBe(true);
    expect(search.xnor(false, false)).toBe(true);
  });
});

describe("TSV card parsing", () => {
  beforeEach(() => search.resetCards());

  const cases = [
    ["Hero Character Cards", ["Base", "Legacy", "Hero", "30", "Nemesis", "Power", "Do a thing.", "Issue #1", "Down", "A", "B", "C", "Issue #2", "Incap issue", "Core", "2"], "hc-1", "hero", "character"],
    ["Hero Cards", ["Legacy", "Legacy", "Atomic Glare", "-", "One-Shot, Fire", "Deal damage.", "Quote", "Legacy", "3", "Core"], "hd-1", "hero", "deck"],
    ["Villain Character Cards", ["Baron Blade", "Baron Blade", "Mad scientist", "Villain", "40", "Legacy", "Setup", "Front", "Advanced", "Mad Bomber", "Back", "Villain", "20", "-", "Back text", "Back advanced", "Core", "2", "Villain"], "vc-1", "villain", "character"],
    ["Ennead Character Cards", ["Ennead", "Atum", "God", "Villain", "10", "-", "Setup", "Front", "Advanced", "Atum", "Back", "Villain", "5", "-", "Back text", "Back advanced", "RCR", "1", "Villain"], "vce-1", "villain", "character"],
    ["Events", ["Freedom Five", "1950", "Issue", "Flavor", "3", "Legacy", "Rule", "Effect", "Collection flavor", "One Two", "Issue", "A", "A flavor", "A text", "B", "B flavor", "B text", "Core"], "es-1", "event", "event"],
    ["Critical Events", ["Critical", "1960", "Flavor", "2", "Blade", "Blade", "Desc", "Villain", "50", "Legacy", "Setup", "Text", "Advanced", "Core"], "ec-1", "critical event", "event"],
    ["Villain Cards", ["Blade", "Blade", "Mobile Defense Platform", "10", "Device", "Legacy", "Text", "Flavor", "Blade", "1", "Core"], "vd-1", "villain", "deck"],
    ["Environment Cards", ["Megalopolis", "Hostage Situation", "-", "-", "Environment", "Text", "Flavor", "Reporter", "2", "Core"], "ed-1", "environment", "deck"],
    ["Principle Cards", ["Justice", "Principle of Justice", "Text", "Flavor", "1", "Core"], "pd-1", "principle", "deck"],
    ["Dividers", ["Blade", "Baron Blade", "villain", "3", "Core"], "dv-1", "villain", "divider"],
  ];

  const categoryExpectations = {
    "Hero Character Cards": { variant: "Base", title: "Legacy", hp: 30, nemesisIcons: ["Nemesis"], complexity: 2, hasBack: true },
    "Hero Cards": { crunchedDeckName: ["Legacy"], title: "Atomic Glare", hp: null, keywords: ["One-Shot", "Fire"], quantity: 3 },
    "Villain Character Cards": { title: "Baron Blade", backDescription: "Back", backHp: 20, difficulty: 2, hasBack: true },
    "Ennead Character Cards": { title: "Atum", backGameText: "Back text", difficulty: 1, hasBack: true },
    "Events": { title: "Freedom Five", collectionLimit: 3, collectionIssues: ["One Two"], rewardATitle: "A", rewardBTitle: "B", hasBack: true },
    "Critical Events": { title: "Critical", collectionLimit: 2, hp: 50, hasBack: true },
    "Villain Cards": { title: "Mobile Defense Platform", nemesisIcons: ["Legacy"], quantity: 1 },
    "Environment Cards": { crunchedCharacterName: [], title: "Hostage Situation", hp: null, quantity: 2 },
    "Principle Cards": { crunchedDeckName: ["Justice"], title: "Principle of Justice", quantity: 1 },
    "Dividers": { crunchedCharacterName: ["Baron", "Blade"], difficulty: 3, hasBack: true },
  };

  test.each(cases)("parses %s without a phantom trailing card", (group, row, id, type, kind) => {
    const header = row.map((_, i) => "column" + i).join("\t");
    search.awesomeParser(header + "\r\n" + row.join("\t") + "\r\n\r\n", group);
    expect(search.cards).toHaveLength(1);
    expect(search.cards[0]).toMatchObject({ id, type, kind });
    expect(search.cards[0]).toMatchObject(categoryExpectations[group]);
  });

  test("maps representative nullable, list, numeric, and back-face fields", () => {
    const row = ["Legacy", "Legacy", "Atomic Glare", "-", "One-Shot, Fire", "Deal damage.", "Quote", "Legacy", "3", "Core"];
    const header = row.map((_, i) => "h" + i).join("\t");
    search.awesomeParser(header + "\n" + row.join("\t"), "Hero Cards");
    expect(search.cards[0]).toMatchObject({
      title: "Atomic Glare", hp: null, keywords: ["One-Shot", "Fire"],
      quantity: 3, hasBack: false,
    });
  });

  test("splits collection issues when the field value itself contains newlines", () => {
    expect(search.extractCollectionIssues("Issue One\nIssue Two")).toEqual([
      "Issue One", "Issue Two",
    ]);
  });

  test("parses every physical nonblank corpus row and preserves literal quotes", () => {
    const groups = [
      "Hero Character Cards", "Hero Cards", "Villain Character Cards",
      "Ennead Character Cards", "Events", "Critical Events", "Villain Cards",
      "Environment Cards", "Principle Cards", "Dividers",
    ];
    for (const group of groups) {
      search.resetCards();
      const tsv = fs.readFileSync(path.join(ROOT, "card-gallery", group + ".tsv"), "utf8");
      const physicalDataRows = tsv.split(/\r?\n/).filter(line => line.length > 0).length - 1;
      search.awesomeParser(tsv, group);
      expect(search.cards, group).toHaveLength(physicalDataRows);
    }

    search.resetCards();
    const heroTsv = fs.readFileSync(path.join(ROOT, "card-gallery/Hero Cards.tsv"), "utf8");
    search.awesomeParser(heroTsv, "Hero Cards");
    const coldSnap = search.cards.find(card => card.title === "Cold Snap");
    expect(coldSnap.flavorText).toBe('"Looks like you should have flown south for the winter!"');
    expect(parseCondition('flavorText:"flown south"').match(coldSnap)).toBe(true);
  });
});

describe("expressive query parsing", () => {
  const card = Object.assign(new search.Card(), {
    crunchedDeckName: ["Absolute", "Zero"], crunchedCharacterName: ["Absolute", "Zero"],
    title: "Fueled Freeze", variant: "Freedom Six", description: "A cold hero",
    date: "1986", keywords: ["One-Shot", "Cold"], hp: 0, collectionLimit: 3,
    nemesisIcons: ["Baron Blade"], innatePowerName: "Thermodynamics",
    innatePowerEffect: "Deal 1 cold damage", setup: "Put a card into play",
    gameText: "Destroy one target", advancedGameText: "Increase damage",
    featuredIssue: "Freedom Five #1", flavorText: "So cold.",
    flavorTextAttribution: "Ryan Frost", incapCaption: "Frozen",
    incapOptions: ["Draw a card"], incapFeaturedIssue: "Prime Wardens #1",
    collectionFlavorText: "Collection flavor", collectionFeaturedIssue: "Collection #1",
    collectionIssues: ["Issue #1", "Issue #2"],
    rewardATitle: "Victory", rewardAFlavorText: "Reward flavor",
    rewardAGameText: "Gain a reward", quantity: 2, set: "Core", complexity: 2,
    difficulty: 3, type: "hero", kind: "character", hasBack: true,
  });

  test.each([
    ['d:"absolute zero"', true], ["c:zero", true], ["t:freeze", true],
    ["v:freedom", true], ["desc:cold", true], ["date:1986", true],
    ["kw:one", true], ["hp=0", true], ["limit>=3", true],
    ["nemesisIcons:blade", true], ["innatePowerTitle:thermo", true],
    ['power:"cold damage"', true], ["setup:put", true], ["g:destroy", true],
    ["advanced:increase", true], ["featuredIssue:freedom", true],
    ["flavorText:cold", true], ["flavorTextAttribution:frost", true],
    ["incapCaption:frozen", true], ["incapOption:draw", true],
    ["incapFeaturedIssue:wardens", true], ["collectionFlavor:collection", true],
    ["collectionFeaturedIssue:collection", true], ["rewardTitle:victory", true],
    ["collectionIssues:issue", true],
    ["rewardFlavor:reward", true], ["rewardGameText:gain", true],
    ["quantity=2", true], ["set:core", true], ["complexity<=2", true],
    ["difficulty>=3", true], ["type:hero", true], ["kind:character", true],
    ["back:TRUE", true],
  ])("supports alias query %s", (query, expected) => {
    expect(parseCondition(query).match(card)).toBe(expected);
  });

  test("supports implicit/explicit AND, OR, negation, parentheses, and quotes", () => {
    expect(parseCondition('type:hero title:"fueled freeze"').match(card)).toBe(true);
    expect(parseCondition("type:hero and kind:character").match(card)).toBe(true);
    expect(parseCondition("type:villain or title:freeze").match(card)).toBe(true);
    expect(parseCondition("-type:villain").match(card)).toBe(true);
    expect(parseCondition("(type:villain or type:hero) kind:character").match(card)).toBe(true);
  });

  test("rejects invalid expressions and non-expressive searches without filtering", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(new search.ExpressiveSearcher("not-a-field:value").parseQueryStringIntoTokens()).toBe(false);
    expect(new search.ExpressiveSearcher("plain words").search()).toBe(false);
    expect(error).toHaveBeenCalled();
  });

  test("difficulty passes the target and operator in the correct order", () => {
    expect(parseCondition("difficulty>=3").match({ difficulty: 3 })).toBe(true);
    expect(parseCondition("difficulty>3").match({ difficulty: 3 })).toBe(false);
  });
});
