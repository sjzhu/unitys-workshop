/*
============================================================================
Parsing Into Cards
============================================================================
*/
/**
 * A record representing a single Definitive Edition card. This contains a definitive list of every possible property a card can have, including metadata like quantity.
 * <p>
 * Property names and constraints aren't actually enforced because this is JavaScript (big sad), so everything in the constructor is just meant as documentation.
 */
class Card {
  constructor() {
    // ==========
    // Unique ID
    // ==========
    // Some day this might not be necessary, but right now it's a nice way to help identify which card on the webpage corresponds to a which card in memory without needing to track
    // a billion DOM references. JavaScript doesn't guarantee uniqeness, but this *should* be unique because of the way we calculate it.
    // String, non-null
    this.id = "";

    // ==========
    // Names
    // ==========
    // Deck, character, and title are distinct depending on the circumstances. Here are some examples:
    //  - The Morrigan
    //    - crunchedDeckName:       [The, Fey, Court]
    //    - crunchedCharacterName:  [The, Morrigan]
    //    - title:                  The Morrigan
    //  - Play the System
    //    - crunchedDeckName:       [The, Organization]
    //    - crunchedCharacterName:  [The, Operative]
    //    - title:                  Play the System
    //  - FA Absolute Zero
    //    - crunchedDeckName:       [Absolute, Zero]
    //    - crunchedCharacterName:  [Absolute, Zero]
    //    - title:                  Absolute Zero
    //  - Hostage Situation
    //    - crunchedDeckName:       [Megalopolis]
    //    - crunchedCharacterName:  []
    //    - title:                  Hostage Situation
    // Array of strings, non-null
    // Should always have at least one element.
    this.crunchedDeckName = [];

    // Array of strings, non-null
    // This is only empty for environment decks.
    this.crunchedCharacterName = [];

    // String, non-null
    this.title = "";


    // ==========
    // Card Content
    // ==========
    // String, nullable
    // Only non-null for hero character cards
    this.variant = null;

    // String, nullable
    // Only non-null for villain character cards
    this.description = null;

    // String, nullable
    // Only non-null for event cards
    this.date = null;

    // String array, non-null
    // A hypothetical card with no keywords would be an empty array
    this.keywords = [];

    // Integer, nullable
    this.hp = null;

    // Integer, nullable
    this.collectionLimit = null;

    // Array of strings, non-null
    // Cards with no nemesis icons have an empty array
    this.nemesisIcons = [];

    // String, nullable
    // Only non-null for hero character cards
    this.innatePowerName = null;

    // String, nullable
    // Only non-null for hero character cards
    this.innatePowerEffect = null;

    // String, nullable
    // Only non-null for event cards
    this.eventRuleTitle = null;

    // String, nullable
    // Only non-null for event cards
    this.eventRuleEffect = null;

    // String, nullable
    this.setup = null;

    // String, nullable
    this.gameText = null;

    // String, nullable
    this.advancedGameText = null;

    // String, nullable
    this.featuredIssue = null;

    // String, nullable
    this.flavorText = null;

    // String, nullable
    this.flavorTextAttribution = null;

    // String, nullable
    this.incapCaption = null;

    // String array, nullable
    // An hypothetical card with an incap side and no incap options would be an empty array
    this.incapOptions = null;

    // String, nullable
    this.incapFeaturedIssue = null;

    // String, nullable
    // A possible second character name. Currently only for Villain characters that have different names
    // depending on what side they're on
    this.crunchedBackCharacterName = null;

    // String, nullable
    this.backDescription = null;

    // String, nullable
    // A hypothetical card with a back side but not keywords on it would be an empty array
    this.backKeywords = null;

    // Integer, nullable
    this.backHp = null;

    // Array of strings, non-null
    this.backNemesisIcons = [];

    // String, nullable
    this.backGameText = null;

    // String, nullable
    this.backAdvancedGameText = null;

    // String, nullable
    this.collectionFlavorText = null;

    // String, nullable
    this.collectionFeaturedIssue = null;

    // String, nullable
    this.rewardATitle = null;

    // String, nullable
    this.rewardAFlavorText = null;

    // String, nullable
    this.rewardAGameText = null;

    // String, nullable
    this.rewardBTitle = null;

    // String, nullable
    this.rewardBFlavorText = null;

    // String, nullable
    this.rewardBGameText = null;

    // String array, nullable
    this.collectionIssues = null;


    // ==========
    // Metadata
    // ==========
    // Integer, nullable
    // Technically character cards have a quantity of 1, but the only time anyone cares about this field is when it refers to cards in an actual deck
    this.quantity = null;

    // String, non-null
    this.set = ""

    // Integer, nullable
    // Only base hero character cards get complexity. Variants of that hero have a null complexity, as do hero cards in the deck.
    this.complexity = null;

    // Integer, nullable
    // Only primary base villain character cards get difficulty. Secondary villains and critical events have a null complexity, as do villain cards in the deck.
    this.difficulty = null;

    // String, non-null
    // Enum of:
    //  - hero
    //  - villain
    //  - environment
    //  - event
    //  - critical event
    this.type = "";

    // String, non-null
    // Enum of:
    //  - deck
    //  - character
    //  - event
    this.kind = "";

    // String, nullable
    // Special display properties because we have exceptions
    this.displayType = null;

    // Boolean, non-null
    this.hasBack = false;
  }
}

/** An array that holds all of the cards. This gets filled out by {@link awesomeParser()}. */
const cards = [];

/** Parses a TSV into {@link Card}s and adds then to {@link cards} */
function awesomeParser(tsvData, dataGroup) {
  if (dataGroup === 'Hero Character Cards') {
      parseHeroCharacterCards(tsvData);
  } else if (dataGroup === 'Hero Cards') {
      parseHeroDeckCards(tsvData);
  } else if (dataGroup === 'Principle Cards') {
      parsePrincipleCards(tsvData);
  } else if (dataGroup === 'Villain Character Cards') {
      parseVillainCharacterCards(tsvData);
  } else if (dataGroup === 'Ennead Character Cards') {
      parseEnneadCharacterCards(tsvData);
  } else if (dataGroup === 'Events') {
      parseStandardEventCards(tsvData);
  } else if (dataGroup === 'Critical Events') {
      parseCriticalEventCards(tsvData);
  } else if (dataGroup === 'Villain Cards') {
      parseVillainDeckCards(tsvData);
  } else if (dataGroup === 'Environment Cards') {
      parseEnvironmentDeckCards(tsvData);
  } else {
      throw new Error(`Unidentified data group: ${dataGroup}.`);
  }
}

function parseHeroCharacterCards(tsvData) {
  let dataLines = getDataLines(tsvData)
  // The hero character sheet has 1 header row
  for (let lineIndex = 1; lineIndex < dataLines.length; lineIndex++) {
    let line = getLine(dataLines, lineIndex);
    let card = new Card();
    card.id = buildUniqueId("hc", lineIndex);
    card.variant = line[0];
    card.crunchedDeckName = extractCrunchedName(line[1]);
    card.crunchedCharacterName = extractCrunchedName(line[1]);
    card.title = line[1];
    card.keywords = extractKeywords(line[2]);
    card.hp = parseInt(line[3]);
    card.nemesisIcons = extractNemesisIcons(line[4]);
    card.innatePowerName = line[5];
    card.innatePowerEffect = line[6];
    card.gameText = line[7];
    card.featuredIssue = line[8];
    card.incapCaption = line[9];
    card.incapOptions = [line[10], line[11], line[12]];
    card.incapFeaturedIssue = line[13];
    card.set = line[14];
    card.complexity = parseInt(line[15]);
    card.type = "hero";
    card.kind = "character";
    card.hasBack = true;
    cards.push(card);
  }
}

function parseHeroDeckCards(tsvData) {
  let dataLines = getDataLines(tsvData)
  // The hero deck card sheet has 1 header row
  for (let lineIndex = 1; lineIndex < dataLines.length; lineIndex++) {
    let line = getLine(dataLines, lineIndex);
    let card = new Card();
    card.id = buildUniqueId("hd", lineIndex);
    card.crunchedCharacterName = extractCrunchedName(line[0]);
    card.crunchedDeckName = extractCrunchedName(line[1]);
    card.title = line[2];
    card.hp = extractHp(line[3]);
    card.keywords = extractKeywords(line[4]);
    card.gameText = line[5];
    card.flavorText = line[6];
    card.flavorTextAttribution = line[7];
    card.quantity = parseInt(line[8]);
    card.set = line[9];
    card.type = "hero";
    card.kind = "deck";
    card.hasBack = false;
    cards.push(card);
  }
}

function parseVillainCharacterCards(tsvData) {
  let dataLines = getDataLines(tsvData)
  // The villain character card sheet has 1 header rows
  for (let lineIndex = 1; lineIndex < dataLines.length; lineIndex++) {
    let line = getLine(dataLines, lineIndex);
    let card = new Card();
    card.id = buildUniqueId("vc", lineIndex);
    card.crunchedDeckName = extractCrunchedName(line[0]);
    card.crunchedCharacterName = extractCrunchedName(line[1]);
    card.title = line[1];
    card.description = line[2];
    card.keywords = extractKeywords(line[3]);
    card.hp = extractHp(line[4]);
    card.nemesisIcons = extractNemesisIcons(line[5]);
    card.setup = line[6];
    card.gameText = line[7];
    card.advancedGameText = line[8];
    card.crunchedBackCharacterName = extractCrunchedName(line[9]);
    card.backDescription = line[10];
    card.backKeywords = extractKeywords(line[11]);
    card.backHp = extractHp(line[12]);
    card.backNemesisIcons = extractNemesisIcons(line[13]);
    card.backGameText = line[14];
    card.backAdvancedGameText = line[15];
    card.set = line[16];
    card.difficulty = line[17];
    card.type = "villain";
    card.kind = "character";
    card.displayType = line[18];
    card.hasBack = true;
    cards.push(card);
  }
}

function parseEnneadCharacterCards(tsvData) {
    let dataLines = getDataLines(tsvData)
  // The villain character card sheet has 1 header rows
  for (let lineIndex = 1; lineIndex < dataLines.length; lineIndex++) {
    let line = getLine(dataLines, lineIndex);
    let card = new Card();
    card.id = buildUniqueId("vce", lineIndex);
    card.crunchedDeckName = extractCrunchedName(line[0]);
    card.crunchedCharacterName = extractCrunchedName(line[1]);
    card.title = line[1];
    card.description = line[2];
    card.keywords = extractKeywords(line[3]);
    card.hp = extractHp(line[4]);
    card.nemesisIcons = extractNemesisIcons(line[5]);
    card.setup = line[6];
    card.gameText = line[7];
    card.advancedGameText = line[8];
    card.crunchedBackCharacterName = extractCrunchedName(line[9]);
    card.backDescription = line[10];
    card.backKeywords = extractKeywords(line[11]);
    card.backHp = extractHp(line[12]);
    card.backNemesisIcons = extractNemesisIcons(line[13]);
    card.backGameText = line[14];
    card.backAdvancedGameText = line[15];
    card.set = line[16];
    card.difficulty = line[17];
    card.type = "villain";
    card.kind = "character";
    card.displayType = line[18];
    card.hasBack = true;
    cards.push(card);
  }
}

function parseStandardEventCards(tsvData) {
  let dataLines = getDataLines(tsvData)
  // The standard event card sheet has 1 header rows
  for (let lineIndex = 1; lineIndex < dataLines.length; lineIndex++) {
    let line = getLine(dataLines, lineIndex);
    let card = new Card();
    card.id = buildUniqueId("es", lineIndex);
    card.title = line[0];
    card.date = line[1];
    card.featuredIssue = line[2];
    card.flavorText = line[3];
    card.collectionLimit = parseInt(line[4]);
    card.crunchedDeckName = extractCrunchedName(line[5]);
    card.crunchedCharacterName = extractCrunchedName(line[5]);
    card.eventRuleTitle = line[6];
    card.eventRuleEffect = line[7];
    card.collectionFlavorText = line[8];
    card.collectionIssues = line[9].split("\n");
    card.collectionFeaturedIssue = line[10];
    card.rewardATitle = line[11];
    card.rewardAFlavorText = line[12];
    card.rewardAGameText = line[13];
    card.rewardBTitle = line[14];
    card.rewardBFlavorText = line[15];
    card.rewardBGameText = line[16];
    card.set = line[17];
    card.type = "event";
    card.kind = "event";
    card.hasBack = true;
    cards.push(card);
  }
}

function parseCriticalEventCards(tsvData) {
  let dataLines = getDataLines(tsvData)
  // The critical event card sheet has 1 header row
  for (let lineIndex = 1; lineIndex < dataLines.length; lineIndex++) {
    let line = getLine(dataLines, lineIndex);
    let card = new Card();
    card.id = buildUniqueId("ec", lineIndex);
    card.title = line[0];
    card.date = line[1];
    card.flavorText = line[2];
    card.collectionLimit = line[3];
    // TODO: someone needs to update the spreadsheet with these or do it by hand, because the original villain character isn't present
    card.crunchedDeckName = ["TODO"];
    card.crunchedCharacterName = extractCrunchedName(line[4]);
    card.description = line[5];
    card.keywords = extractKeywords(line[6]);
    card.hp = extractHp(line[7]);
    card.nemesisIcons = extractNemesisIcons(line[8]);
    card.setup = line[9];
    card.gameText = line[10];
    card.advancedGameText = line[11];
    card.set = line[12];
    card.type = "critical event";
    card.kind = "event";
    card.hasBack = true;
    cards.push(card);
  }
}

function parseVillainDeckCards(tsvData) {
  let dataLines = getDataLines(tsvData)
  // The villain deck card sheet has 1 header row
  for (let lineIndex = 1; lineIndex < dataLines.length; lineIndex++) {
    let line = getLine(dataLines, lineIndex);
    let card = new Card();
    card.id = buildUniqueId("vd", lineIndex);
    card.crunchedDeckName = extractCrunchedName(line[0]);
    card.crunchedCharacterName = extractCrunchedName(line[1]);
    card.title = line[2];
    card.hp = extractHp(line[3]);
    card.keywords = extractKeywords(line[4]);
    card.nemesisIcons = extractNemesisIcons(line[5]);
    card.gameText = line[6];
    card.flavorText = line[7];
    card.flavorTextAttribution = line[8];
    card.quantity = parseInt(line[9]);
    card.set = line[10];
    card.type = "villain";
    card.kind = "deck";
    card.hasBack = false;
    cards.push(card);
  }
}

function parseEnvironmentDeckCards(tsvData) {
  let dataLines = getDataLines(tsvData)
  // The environment deck card sheet has 1 header row
  for (let lineIndex = 1; lineIndex < dataLines.length; lineIndex++) {
    let line = getLine(dataLines, lineIndex);
    let card = new Card();
    card.id = buildUniqueId("ed", lineIndex);
    card.crunchedDeckName = extractCrunchedName(line[0]);
    card.crunchedCharacterName = [];
    card.title = line[1];
    card.hp = extractHp(line[2]);
    card.nemesisIcons = extractNemesisIcons(line[3]);
    card.keywords = extractKeywords(line[4]);
    card.gameText = line[5];
    card.flavorText = line[6];
    card.flavorTextAttribution = line[7];
    card.quantity = parseInt(line[8]);
    card.set = line[9];
    card.type = "environment";
    card.kind = "deck";
    card.hasBack = false;
    cards.push(card);
  }
}

function parsePrincipleCards(tsvData) {
  let dataLines = getDataLines(tsvData)
  // The principle card sheet has 1 header row
  for (let lineIndex = 1; lineIndex < dataLines.length; lineIndex++) {
    let line = getLine(dataLines, lineIndex);
    let card = new Card();
    card.id = buildUniqueId("pd", lineIndex);
    card.crunchedDeckName = extractCrunchedName(line[0]);
    card.crunchedCharacterName = [];
    card.title = line[1];
    card.gameText = line[2];
    card.flavorText = line[3];
    card.quantity = parseInt(line[4]);
    card.set = line[5];
    card.type = "principle";
    card.kind = "deck";
    card.hasBack = false;
    cards.push(card);
  }
}

function getDataLines(tsvData) {
  return tsvData.split("\n");
}

function getLine(dataLines, lineIndex) {
  return dataLines[lineIndex].split("\t");
}

function extractCrunchedName(nameString) {
  return nameString.trim().split(" ");
}

function extractKeywords(keywordsString) {
  return keywordsString.split(", ");
}

function extractHp(hpString) {
  if (hpString === "-") {
    return null;
  }
  return parseInt(hpString);
}

function extractNemesisIcons(nemesisIconsString) {
  if (nemesisIconsString === "-") {
    return [];
  }
  return nemesisIconsString.split("\n");
}

/**
 * Creates a unique ID for a card, given its data group prefix (the spreadsheet it appears in) and its line index (the line in which it appears in that spreadsheet).
 * See {@link Card#id}.
 */
function buildUniqueId(dataGroupIdPrefix, lineIndex) {
  return `${dataGroupIdPrefix}-${lineIndex}`;
}

/*
============================================================================
Matching Utility Methods
============================================================================
*/
function regexMatch(candidate, regexp) {
  return !!candidate?.match(regexp);
}

function listRegexMatch(candidate, regexp) {
  if (!candidate || candidate.length === 0) {
    return false;
  }
  return candidate.some(c => regexMatch(c, regexp));
}

function subArrayOverlapRegexMatch(candidate, regexList) {
  if (!candidate || candidate.length === 0) {
    return false;
  }
  if (candidate.length < regexList.length) {
    return false;
  }
  if (regexList.length === 1) {
    return listRegexMatch(candidate, regexList[0]);
  }
  // We've handled all naive cases, time for ugliness...
  // Iterate through the candidate's crunches, which should be ordered (ex. ["The", "Ruler", "of", "Aeternus"]) to find a crunch that matches the *first* element of regexList
  for (let i = 0; i < candidate.length - regexList.length + 1; i++) {
    let c = candidate[i];
    if (regexMatch(c, regexList[0])) {
      // If we find a match, perform an ordered check of all child regexList elements. *Everything* must match.
      let allMatch = true;
      for (let j = 1; j < regexList.length; j++) {
        if (!regexMatch(candidate[i + j], regexList[j])) {
          allMatch = false;
          break;
        }
      }
      // If everything matched, terminate the loop early. Doesn't matter if there are multiple matches as long as there's 1.
      if (allMatch) {
        return true;
      }
      // If not, continue the loop until we're out of candidate crunches. 
    }
    return false;
  }
}

function numberMatch(candidate, target, relationship) {
  if (!candidate) {
    return false;
  }
  if (relationship === "=" || relationship === ":") {
    return candidate == target;
  } else if (relationship === ">") {
    return candidate > target;
  } else if (relationship === ">=") {
    return candidate >= target;
  } else if (relationship === "<") {
    return candidate < target;
  } else if (relationship === "<=") {
    return candidate <= target;
  } else {
    throw new Error(`Invaid relationship: ${this.relationship}.`);
  }
}

function xnor(a, b) {
  return a ? b : !b;
}

function parseBoolean(boolString) {
  if (['t', 'true', 'y', 'yes'].includes(boolString)) {
    return true;
  } else if (['f', 'false', 'n', 'no'].includes(boolString)) {
    return false;
  }
  throw new Error(`Can't parse string to boolean: ${boolString}`);
}

function escapeRegex(string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

/*
============================================================================
Expressive Search Queries
============================================================================
*/
const Instruction = Object.freeze({
  AND:    "AND", // not used in querying, included for completeness
  OR:     "OR",
  NOT:    "NOT",
  OPEN:   "OPEN",
  CLOSE:  "CLOSE",
});

class Condition {
  match(c) {
    throw new Error("You must override the match method!");
  }
}

class DeckNameCond extends Condition {
  constructor(str) {
    super();
    this.regexList = extractCrunchedName(str).map(s => new RegExp("^" + s, "i"));
  }
  match(c) {
    return subArrayOverlapRegexMatch(c.crunchedDeckName, this.regexList);
  }
}

class CharacterNameCond extends Condition {
  constructor(str) {
    super();
    this.regexList = extractCrunchedName(str).map(s => new RegExp("^" + s, "i"));
  }
  match(c) {
    return subArrayOverlapRegexMatch(c.crunchedCharacterName, this.regexList) || subArrayOverlapRegexMatch(c.crunchedBackCharacterName, this.regexList);
  }
}

class TitleCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.title, this.regexp) || regexMatch(c.eventRuleTitle, this.regexp);
  }
}

class VariantCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.variant, this.regexp);
  }
}

class DescriptionCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.description, this.regexp) || regexMatch(c.backDescription, this.regexp);
  }
}

class DateCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.date, this.regexp);
  }
}

class KeywordCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return listRegexMatch(c.keywords, this.regexp) || listRegexMatch(c.backKeywords, this.regexp);
  }
}

class HpCond extends Condition {
  constructor(num, relationship) {
    super();
    this.num = num;
    this.relationship = relationship;
  }
  match(c) {
    return numberMatch(c.hp, this.num, this.relationship) || numberMatch(c.backHp, this.num, this.relationship);
  }
}

class CollectionLimitCond extends Condition {
  constructor(num, relationship) {
    super();
    this.num = num;
    this.relationship = relationship;
  }
  match(c) {
    return numberMatch(c.collectionLimit, this.num, this.relationship);
  }
}

class NemesisIconCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return listRegexMatch(c.nemesisIcons, this.regexp) || listRegexMatch(c.backNemesisIcons, this.regexp);
  }
}

class InnatePowerNameCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.innatePowerName, this.regexp);
  }
}

class InnatePowerEffectCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.innatePowerEffect, this.regexp);
  }
}

class SetupCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.setup, this.regexp);
  }
}

class GameTextCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.gameText, this.regexp) ||
      regexMatch(c.backGameText, this.regexp) ||
      regexMatch(c.eventRuleEffect, this.regexp);
  }
}

class AdvancedGameTextCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.advancedGameText, this.regexp) || regexMatch(c.advancedGameText, this.regexp);
  }
}

class FeaturedIssueCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.featuredIssue, this.regexp);
  }
}

class FlavorTextCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.flavorText, this.regexp);
  }
}

class FlavorTextAttributionCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.flavorTextAttribution, this.regexp);
  }
}

class IncapCaptionCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.incapCaption, this.regexp);
  }
}

class IncapOptionCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return listRegexMatch(c.incapOptions, this.regexp);
  }
}

class IncapFeaturedIssueCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.incapFeaturedIssue, this.regexp);
  }
}

class CollectionFlavorTextCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.collectionFlavorText, this.regexp);
  }
}

class CollectionFeaturedIssueCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.collectionFeaturedIssue, this.regexp);
  }
}

class RewardTitleCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.rewardATitle, this.regexp) || regexMatch(c.rewardBTitle, this.regexp);
  }
}

class RewardFlavorTextCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.rewardAFlavorText, this.regexp) || regexMatch(c.rewardBFlavorText, this.regexp);
  }
}

class RewardGameTextCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.rewardAGameText, this.regexp) || regexMatch(c.rewardBGameText, this.regexp);
  }
}

class CollectionIssuesCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return listRegexMatch(c.collectionIssues, regexp);
  }
}

class QuantityCond extends Condition {
  constructor(num, relationship) {
    super();
    this.num = num;
    this.relationship = relationship;
  }
  match(c) {
    return numberMatch(c.quantity, this.num, this.relationship);
  }
}

class SetCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.set, this.regexp);
  }
}

class ComplexityCond extends Condition {
  constructor(num, relationship) {
    super();
    this.num = num;
    this.relationship = relationship;
  }
  match(c) {
    return numberMatch(c.complexity, this.num, this.relationship);
  }
}

class DifficultyCond extends Condition {
  constructor(num, relationship) {
    super();
    this.num = num;
    this.relationship = relationship;
  }
  match(c) {
    return numberMatch(c.difficulty, this.num, this.relationship);
  }
}

class TypeCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.type, this.regexp);
  }
}

class KindCond extends Condition {
  constructor(regexp) {
    super();
    this.regexp = regexp;
  }
  match(c) {
    return regexMatch(c.kind, this.regexp);
  }
}

class HasBackCond extends Condition {
  constructor(flag) {
    super();
    this.flag = flag;
  }
  match(c) {
    return xnor(this.flag, c.hasBack);
  }
}

class AndCond extends Condition {
  constructor(children) {
    super();
    this.children = children || [];
  }
  push(cond) {
    this.children.push(cond);
  }
  match(c) {
    for (let cond of this.children) {
      if (!cond.match(c)) {
        return false;
      }
    }
    return true;
  }
}

class OrCond extends Condition {
  constructor(cond1, cond2) {
    super();
    this.cond1 = cond1;
    this.cond2 = cond2;
  }
  match(c) {
    return this.cond1.match(c) || this.cond2.match(c);
  }
}

class NotCond extends Condition {
  constructor(cond) {
    super();
    this.cond = cond;
  }
  match(c) {
    return !this.cond.match(c);
  }
}

/** A class for performing expressive searches. Each searcher is used for a single search. */
class ExpressiveSearcher {
  /** The query string is the string provided by the user when they submit a search. */
  queryString = "";

  /** Tokens are an ordered array of instructions (from the Instruction enum) and Conditions (inheriting from the Condition) class. */
  queryTokens = [];

  constructor(queryString) {
    this.queryString = queryString;
  }

  /**
   * Performs the search, showing / hiding card images based on the user's search query.
   * @returns whether expressive search ran on the query. If a search is invalid for some reason (like parsing the search fails), expressive search will return false and not make any changes
   *          to the page. This is used to determine whether to use legacy search as a fallback.
  */
  search() {
    // Searches without query parameters should be handled in the future, but for now we can just bail and let legacy search handle it. Do a quick check for that.
    if (!this.queryString.match(/[:=<>]/i)) {
      return false;
    }
    // Reads the queryString into a token array, capturing low-hanging fruit and identifying instructions. If parsing fails: logs and terminates early.
    if (!this.parseQueryStringIntoTokens()) {
      return false;
    }
    // Converts Instruction tokens into Conditions so we can actually do a full match
    const queryCond = this.parseTokenList();
    // Filters the cards based on our fancy new query
    filterCards(queryCond);
    return true;
  }

  /**
   * Parses a query string from a user into an array of non-nested tokens and saves it to {@link #queryTokens}.
   * @returns whether an error was encountered during parsing
   */
  parseQueryStringIntoTokens() {
    const tokens = [];
    const s = new StringScanner(this.queryString);
    try {
      while (!s.hasTerminated()) {
        if (s.scan(/[\s,]+/i)) {
          // skip whitespace
        } else if (s.scan(/and\b/i)) {
          // AND is the default join for conditions, skip it as well
        } else if (s.scan(/or\b/i)) {
          tokens.push(Instruction.OR);
        } else if (s.scan(/-/i)) {
          tokens.push(Instruction.NOT);
        } else if (s.scan(/\(/i)) {
          tokens.push(Instruction.OPEN);
        } else if (s.scan(/\)/i)) {
          tokens.push(Instruction.CLOSE);
        } else if (s.scan(/(?:g|gt|gametext)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new GameTextCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:t|ti|title)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new TitleCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:k|kw|keyword)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new KeywordCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:p|power|innatePowerEffect)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new InnatePowerEffectCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:d|deck)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new DeckNameCond(s.getCapture(0) || s.getCapture(1)));
        } else if (s.scan(/(?:c|character)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new CharacterNameCond(s.getCapture(0) || s.getCapture(1)));
        } else if (s.scan(/(?:f|flavorText)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new FlavorTextCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:s|setup)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new SetupCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:a|advanced)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new AdvancedGameTextCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/hp\s*(>=|>|<=|<|=|:)\s*(\d+)/i)) {
          tokens.push(new HpCond(s.getCapture(1), s.getCapture(0)))
        } else if (s.scan(/(?:v|variant)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new VariantCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:desc|description)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new DescriptionCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:date)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new DateCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:l|limit|collectionLimit)\s*(>=|>|<=|<|=|:)\s*(\d+)/i)) {
          tokens.push(new CollectionLimitCond(s.getCapture(1), s.getCapture(0)));
        } else if (s.scan(/(?:nemesisIcon|nemesisIcons)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new NemesisIconCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:innatePowerTitle)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new InnatePowerNameCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:featuredIssue)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new FeaturedIssueCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:flavorTextAttribution)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new FlavorTextAttributionCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:incapCaption)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new IncapCaptionCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:incapFeaturedIssue)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new IncapFeaturedIssueCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:option|incapOption)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new IncapOptionCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:collectionFlavor|collectionFlavorText)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new CollectionFlavorTextCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:collectionFeaturedIssue)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new CollectionFeaturedIssueCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:rewardTitle)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new RewardTitleCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:rewardFlavor)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new RewardFlavorTextCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:rewardGameText)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new RewardGameTextCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(q|quantity)\s*(>=|>|<=|<|=|:)\s*(\d+)/i)) {
          tokens.push(new QuantityCond(s.getCapture(2), s.getCapture(1)))
        } else if (s.scan(/(?:set)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new SetCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(c|complexity)\s*(>=|>|<=|<|=|:)\s*(\d+)/i)) {
          tokens.push(new ComplexityCond(s.getCapture(2), s.getCapture(1)));
        } else if (s.scan(/(diff|difficulty)\s*(>=|>|<=|<|=|:)\s*(\d+)/i)) {
          tokens.push(new DifficultyCond(s.getCapture(1), s.getCapture(0)));
        } else if (s.scan(/(?:ty|type)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new TypeCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/(?:ki|kind)\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new KindCond(new RegExp(s.getCapture(0) || s.getCapture(1), "i")));
        } else if (s.scan(/back\s*[:=]\s*(?:"(.*?)"|([^\s\)]+))/i)) {
          tokens.push(new HasBackCond(parseBoolean(s.getCapture(0) || s.getCapture(1))));
        } else {
          throw new Error(`Couldn't identify query string: ${this.queryString}`);
        }
      }
    } catch (ex) {
      console.error(`Caught an error attempting to parse an expressive query.`, ex);
      return false;
    }
    this.queryTokens = tokens;
    return true;
  }

  /**
   * Parses the tokens in {@link #queryTokens} into a single {@link Condition}. Can be called from other methods to parse sub-queries of the token list (such as when handling "or" or "()")
   * @returns a single {@link Condition} that will be used for filtering search results.
   */
  parseTokenList() {
    // Build up a list of conditions to apply the query to.
    const queryConditions = [];
    while (this.queryTokens.length > 0) {
      const token = this.queryTokens[0];
      if (token == Instruction.CLOSE) {
        // A closed bracket ends a token. There's nothing left to read in this statement. Bear in mind that parseCondList() can be called recursively from inside parseCond(), so this can be the
        // end of the entire query (if we're at the topmost call on the stack) or some nested parenthetical (if we're in a lower call).
        this.queryTokens.shift();
        break;
      } else if (token == Instruction.OR) {
        // ORs get broken into 2 separate queries and returned
        this.queryTokens.shift();
        if (queryConditions.length > 0) {
          const rightQuery = this.parseTokenList();
          if (rightQuery) {
            return new OrCond(this.condsToQuery(queryConditions), rightQuery);
          } else {
            // If you don't have anything on the right, there's nothing to OR against, so this conditional isn't used. We can treat it as a terminator.
            break;
          }
          //If you don't have anything on the left, there's nothing to OR against, so we ignore this.
        }
      } else {
        // This is the normal case. Just parse the next condition and add it to our array.
        const nextCond = this.parseNextToken();
        if (nextCond) {
          queryConditions.push(nextCond);
        } else {
          // If there's nothing left to parse, we're done with this call.
          break;
        }
      }
    }
    return this.condsToQuery(queryConditions);
  }

  /**
   * Parses the next token in the {@link #queryTokens} array. This name is a misnomer but I don't have a better one. This method will parse a single {@link Condition} and return it, but it can
   * parse open braces (reading up to 2 tokens), closed braces (reading zero tokens), or not instructions (reading up to 2 tokens) by making subsequent calls to
   * {@link ExpressiveSearcher#parseTokenList()} or {@link ExpressiveSearcher#parseNextToken()}.
   * @returns a single parsed {@link Condition}
   */
  parseNextToken() {
    if (this.queryTokens.length == 0) {
      return null;
    }
    const token = this.queryTokens[0];
    if (token === Instruction.OPEN) {
      this.queryTokens.shift();
      const subQuery = this.parseTokenList();
      if (this.queryTokens[0] === this.queryTokens.CLOSE) {
        this.queryTokens.shift();
      }
      return subQuery;
    }
    if (token === Instruction.CLOSE) {
      return null;
    }
    if (token === Instruction.NOT) {
      this.queryTokens.shift();
      const cond = this.parseNextToken();
      if (cond instanceof Condition) {
        return new NotCond(cond);
      } else {
        return null;
      }
    }
    if (token === Instruction.OR) {
      // The only way to get here is if the query has some kind of invalid syntax, like "-or", so just ignore it.
      this.queryTokens.shift();
      this.parseNextToken();
    }
    if (token instanceof Condition) {
      return this.queryTokens.shift();
    }
  }

  /**
   * Consolidates a potential array of {@link Condition}s into one.
   * @return a single {@link Condition}. If the input is falsey or empty, this returns null. A single condition is just returned. More than 1 condition in an array gets anded together.
   */
  condsToQuery(conds) {
    if (!conds || conds.length == 0) {
      return null;
    } else if (conds.length == 1) {
      return conds[0];
    } else {
      return new AndCond(conds);
    }
  }
}

/**
 * Performs an expressive search by decomposing the provided query string into an ANDed set of query conditions.
 * @returns true if the search was successful. Returns false if any errors occurred parsing / resolving the query, or if the query doesn't use the expressive syntax.
 */
function expressiveSearch(queryString) {
  return (new ExpressiveSearcher(queryString)).search();
}

/** Shows or hides cards on the gallery page based on whether they match the input {@link Condition}. */
function filterCards(query) {
  for (let card of cards) {
    if (query.match(card)) {
      $(`#${card.id}`).show()
    } else {
      $(`#${card.id}`).hide()
    }
  }
}
