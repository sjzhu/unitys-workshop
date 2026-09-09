/*
============================================================================
Static global variables
============================================================================
*/
// Card forms. This should be declared in the page's script configurations as CARD_FORM.
const DECK = "deck";
const CHARACTER = "character";
// Orientations. This should be declared in the page's script configurations as ORIENTATION.
const VERTICAL = "vertical";
const HORIZONTAL = "horizontal";
// Faces. This should be declared in the page's script configurations as FACE.
const FRONT = "front";
const BACK = "back";
// Card categories. This should be declared in the page's script configurations as CARD_CATEGORY.
const BASIC = "basic";
const ENVIRONMENT = "environment";
const HERO_CHAR = "hero_character";
const VILLAIN_CHAR = "villain_character";
const PRINCIPLES = "principles";
// Card preview sizes. These should match the text content of buttons on the page.
const SMALL = "Small";
const MEDIUM = "Medium";
const LARGE = "Large";
const CARD_PREVIEW_SIZES = [SMALL, MEDIUM, LARGE];
// Maps canvas container widths based on user-provided sizes (small, med, large) and card orientation. Used in {@link setCanvasWidth()}.
const canvasSizes = new Map([
    [VERTICAL, new Map([
        [SMALL,   250],
        [MEDIUM,  350],
        [LARGE,   450],
    ])],
    [HORIZONTAL, new Map([
        [SMALL,   400],
        [MEDIUM,  550],
        [LARGE,   700],
    ])],
]);
// Block types when parsing card text
const SPACE_BLOCK = "space";
const PHASE_BLOCK = "phase";
const INDENT_BLOCK = "indent";
const SIMPLE_BLOCK = "simple";
const BLOCK_TYPES = [PHASE_BLOCK, INDENT_BLOCK, SIMPLE_BLOCK];
// Phase names
const START_PHASE = "start";
const PLAY_PHASE = "play";
const POWER_PHASE = "power";
const DRAW_PHASE = "draw";
const END_PHASE = "end";
const PHASE_LABELS = [START_PHASE, PLAY_PHASE, POWER_PHASE, DRAW_PHASE, END_PHASE];
// Phase color contrasts
const HIGH_CONTRAST = "high";
const ORIGINAL_CONTRAST = "original"
// Gross RegeEx for identifying phase blocks
const _phaseSymbols = "[.,!;:<>[\\](){}\\-|]"; // "\" and "]" need to be escaped inside regex brackets
const PHASE_REGEX = new RegExp(`^${_phaseSymbols}* ?(${PHASE_LABELS.join("|")}) phase ?${_phaseSymbols}? *`);
const PHASE_INDEX = 1; // the position of the phase word that is identified in PHASE_REGEX

// Map of phases to various rendering strings
const PHASE_TEXT_MAP = new Map([
    [START_PHASE, "Start Phase"],
    [PLAY_PHASE, "Play Phase"],
    [POWER_PHASE, "Power Phase"],
    [DRAW_PHASE, "Draw Phase"],
    [END_PHASE, "End Phase"],
]);
const PHASE_ICON_MAP = new Map([
    [START_PHASE, "Start Phase Icon"],
    [PLAY_PHASE, "Play Phase Icon"],
    [POWER_PHASE, "Power Phase Icon"],
    [DRAW_PHASE, "Draw Phase Icon"],
    [END_PHASE, "End Phase Icon"],
]);
// Labels for indented effects (power, reaction, bullets):
const POWER_LABEL = "power:";
const REACTION_LABEL = "reaction:";
const BULLET_LABEL = "»";
const INDENT_LABEL_MAP = new Map([
    [POWER_LABEL, POWER_LABEL],
    [REACTION_LABEL, REACTION_LABEL],
    // Unlike power and reaction labels, bullet labels aren't necessarily specified in the way they are printed.
    ["- ", BULLET_LABEL],
    ["> ", BULLET_LABEL],
    ["* ", BULLET_LABEL],
    ["» ", BULLET_LABEL],
]);
const INDENT_LABELS = [POWER_LABEL, REACTION_LABEL, BULLET_LABEL];
const INDENT_LABEL_SPECIFIERS = Array.from(INDENT_LABEL_MAP.keys());
const INDENT_INDEX = 1;
// Colors for card effects
const colorBlack = '#231f20';
const colorYellow = '#fcb024';
const PHASE_COLOR_MAP = new Map([
    [ORIGINAL_CONTRAST, new Map([
        [START_PHASE, "#3fae49"],
        [PLAY_PHASE, "#fff200"],
        [POWER_PHASE, "#79509e"],
        [DRAW_PHASE, "#00aeef"],
        [END_PHASE, "#ee2d35"],
    ])],
    [HIGH_CONTRAST, new Map([
        [START_PHASE, "#4bc244"],
        [PLAY_PHASE, "#fff72f"],
        [POWER_PHASE, "#a76fb9"],
        [DRAW_PHASE, "#3db7e2"],
        [END_PHASE, "#f34747"],
    ])],
]);
// PHASE_FONT_SIZE_MAP is declared at the bottom of the page because it depends on canvas size
const PHASE_FONT_FAMILY = 'Avengeance Mightiest Avenger';
const PHASE_SIZE_FACTOR = 1;
// Map of indented label properties
const INDENT_LABEL_FONT_FAMILY = "Work Sans";
const INDENT_LABEL_SIZE_FACTOR = 1.08;
// Line joins (we only use miter)
const MITER = "miter";
// Body text properties
const EFFECT_FONT_WEIGHT = 400;
const EFFECT_FONT_FAMILY = "NotoSentinels";
// Backup font for bold effects
const BACKUP_FONT_FAMILY = 'Noto Sans';
// Font-weight-normalized space between words
const SPACE_WIDTH_FACTOR = 0.26;
// A multiplicative factor used to determine the distance of 2 blocks
const BLOCK_SPACING_FACTOR = 1.3;
// A multiplicative factor used to determine where to begin drawing a phase block
const PRE_PHASE_LINE_HEIGHT_FACTOR = 0.2;
// A multiplicative factor used to determine where to draw blocks after a phase block
const POST_PHASE_LINE_HEIGHT_FACTOR = 1.05;
// The terms that should be bolded by default
const DEFAULT_BOLD_LIST = new Set(["START PHASE", "PLAY PHASE", "POWER PHASE", "DRAW PHASE", "END PHASE", "PERFORM", "ACCOMPANY"]);
// The terms that should be italicized by default
const DEFAULT_ITALICS_LIST = new Set(["PERFORM", "ACCOMPANY"]);

// Common Image Key Names
const BACKGROUND_ART = "backgroundArt";
const FOREGROUND_ART = "foregroundArt";
const NEMESIS_ICON = "nemesisIcon";
const BACK_TOP_ART = "topArt";
const BACK_LEFT_ART = "leftArt";
const BACK_RIGHT_ART = "rightArt";
const BACK_BOTTOM_ART = "bottomArt";
const NAME_LOGO = "nameLogo";

// Common Image Sets
const CC_FRONT_IMAGES = new Set([BACKGROUND_ART, FOREGROUND_ART, NEMESIS_ICON, NAME_LOGO]);
const CC_BACK_IMAGES = new Set([BACKGROUND_ART]);
const VCC_IMAGES = new Set([BACKGROUND_ART, FOREGROUND_ART, NEMESIS_ICON, NAME_LOGO]);
const HERO_DECK_BACK_IMAGES = new Set([BACK_LEFT_ART, BACK_RIGHT_ART, BACK_BOTTOM_ART, NAME_LOGO]);
const VILLAIN_DECK_BACK_IMAGES = new Set([BACK_TOP_ART, BACK_LEFT_ART, BACK_RIGHT_ART, NAME_LOGO]);

// Common image style classes
const IMAGE_X = "inputImageOffsetX"
const IMAGE_Y = "inputImageOffsetY"
const IMAGE_ZOOM = "inputImageScale"


/*
============================================================================
Declarative JSON import/export field registry

Single source of truth for the JSON fields each card tool reads (import) and
writes (export). Consumed by applyField/readField/applyImageGroup/readImageGroup
in common-after.js. Adding a field here should be all that's needed to make it
round-trip. See docs/json-field-registry.md for the maintainer guide (what each
kind of change touches, guardrails, sparse-export tools).

CARD_FIELDS entry shape:
  key         - canonical JSON key
  selector    - jQuery selector for the input control
  kind        - 'text' | 'number' | 'checkbox' | 'select'
  default     - value applied on import when the key (and any alias) is absent
  categories  - CARD_CATEGORY values this field belongs to on export
  aliases     - (optional) extra JSON keys accepted on import
  setState    - (optional, checkbox) callback `v => { someGlobal = v; }` run on
                import to keep the matching top-level `let` (suddenly, showBorder,
                isVariant, variantTextColor) in sync, the way the input handlers do
  description - human-readable summary of what the control does (for docs)
============================================================================
*/
const CARD_FIELDS = [
  {
    key: "Title", selector: "#inputTitle", kind: "text", default: "",
    categories: [BASIC, ENVIRONMENT, PRINCIPLES],
    description: "Card name shown in the title bar."
  },
  {
    key: "HP", selector: "#inputHP", kind: "text", default: "",
    categories: [BASIC, ENVIRONMENT, HERO_CHAR, VILLAIN_CHAR],
    description: "Hit-point value printed in the HP badge. Free text, so non-numeric values (e.g. blank, '*') render verbatim."
  },
  {
    key: "Keywords", selector: "#inputKeywords", kind: "text", default: "",
    categories: [BASIC, ENVIRONMENT, HERO_CHAR, VILLAIN_CHAR],
    description: "Keyword line printed below the title (e.g. 'Hero', 'Villain', 'Ongoing, Limited'). Rendered as typed."
  },
  {
    key: "BoldedTerms", selector: "#inputBoldWords", kind: "text", default: "",
    categories: [BASIC, ENVIRONMENT, HERO_CHAR, VILLAIN_CHAR, PRINCIPLES],
    description: "Comma-separated phrases to force-bold everywhere they occur in the game text, on top of the always-bold defaults."
  },
  {
    key: "GameText", selector: "#inputEffect", kind: "text", default: "",
    categories: [BASIC, ENVIRONMENT, HERO_CHAR, VILLAIN_CHAR, PRINCIPLES],
    description: "Main rules text. Parsed heuristically for phase headers, Power:/Reaction: labels, bullets and symbols like (H) and [flip]."
  },
  {
    key: "GameTextSize", selector: "#inputEffectTextSize", kind: "number", default: 100,
    categories: [BASIC, ENVIRONMENT, HERO_CHAR, VILLAIN_CHAR, PRINCIPLES],
    description: "Game-text font scale as a percent (slider, roughly 80-100). 100 = default size."
  },
  {
    key: "Quote", selector: "#inputQuote", kind: "text", default: "",
    categories: [BASIC, ENVIRONMENT, PRINCIPLES],
    description: "Flavor quote text printed near the bottom of the card."
  },
  {
    key: "QuoteTextSize", selector: "#inputQuoteTextSize", kind: "number", default: 100,
    categories: [BASIC, ENVIRONMENT, PRINCIPLES],
    description: "Flavor-quote font scale as a percent (slider, roughly 80-100). 100 = default size."
  },
  {
    key: "Attribution", selector: "#inputAttribution", kind: "text", default: "",
    // Not PRINCIPLES: principle cards have no attribution control or game concept.
    // The old outputJSONData template listed it for principles, but #inputAttribution
    // doesn't exist there, so it emitted the literal token `undefined` (invalid JSON).
    categories: [BASIC, ENVIRONMENT],
    description: "Attribution/speaker line printed under the flavor quote."
  },
  {
    key: "Suddenly", selector: "#suddenly", kind: "checkbox", default: false,
    // Plan's inventory table says BASIC, but its note is "only where #suddenly exists"
    // and the checkbox is present on environment-deck-front too (matches the old
    // BASIC||ENVIRONMENT output branch). The kind:'checkbox' handler is a no-op on
    // pages without the control (e.g. villain-deck-front), so listing both is safe.
    categories: [BASIC, ENVIRONMENT], setState: (v) => { suddenly = v; },
    description: "Whether the card carries the 'Suddenly!' keyword. Accepts a JSON boolean or the string 'TRUE' (case-insensitive)."
  },
  {
    key: "ShowBorder", selector: "#inputDisplayBorder", kind: "checkbox", default: true,
    categories: [HERO_CHAR, VILLAIN_CHAR], setState: (v) => { showBorder = v; },
    description: "Whether the printed card border/frame is drawn. Defaults to on."
  },
  {
    key: "VariantToggle", selector: "#inputVariantToggle", kind: "checkbox", default: false,
    categories: [HERO_CHAR], setState: (v) => { isVariant = v; },
    description: "Whether the card shows the 'Variant' tag."
  },
  {
    key: "WhiteVariantText", selector: "#inputVariantColor", kind: "checkbox", default: false,
    categories: [HERO_CHAR], setState: (v) => { variantTextColor = v; },
    description: "Whether the 'Variant' tag text is drawn white instead of the default color."
  },
  {
    key: "HighContrastPhaseLabels", selector: "#inputUseHighConstrast", kind: "checkbox", default: true,
    // The #inputUseHighConstrast control ships with the `checked` attribute present
    // on all 7 tools (the smart-quoted value is cosmetic; the bare boolean attr is
    // effective), so common-before.js initializes useHighContrastPhaseLabels to true.
    // A key-less import must therefore leave it on.
    categories: [BASIC, ENVIRONMENT, HERO_CHAR, VILLAIN_CHAR, PRINCIPLES],
    setState: (v) => { useHighContrastPhaseLabels = v; },
    description: "Whether the Start/Play/Power/Draw/End phase labels use the brighter high-contrast colors and matching phase-icon art."
  },
  {
    key: "PowerName", selector: "#inputPowerName", kind: "text", default: "",
    categories: [HERO_CHAR],
    description: "Name of the hero's innate power, printed in the power bar."
  },
  {
    key: "Description", selector: "#inputDescription", kind: "text", default: "",
    categories: [VILLAIN_CHAR],
    description: "Short descriptor line printed under the villain's name."
  },
  {
    key: "VerticalAlignment", selector: "#inputBelowNameLogoAlignment", kind: "number", default: 0,
    categories: [VILLAIN_CHAR],
    description: "Vertical nudge (slider, roughly -20 to 20) of the HP / keywords / description block beneath the name logo."
  },
  {
    key: "SetupText", selector: "#inputSetup", kind: "text", default: "",
    categories: [VILLAIN_CHAR],
    description: "Villain setup instructions printed in the setup banner at the top of the card."
  },
  {
    key: "GameTextBoxWidth", selector: "#inputEffectBoxWidth", kind: "number", default: 0,
    categories: [VILLAIN_CHAR],
    description: "Width adjustment (slider, roughly -33 to 10) for the main game-text box."
  },
  {
    key: "AdvancedPhase", selector: "#inputAdvancedPhase", kind: "select", default: "none",
    categories: [VILLAIN_CHAR],
    description: "Which phase the Advanced game text attaches to: 'none', 'start', 'play' or 'end'."
  },
  {
    key: "AdvancedGameText", selector: "#inputAdvanced", kind: "text", default: "",
    categories: [VILLAIN_CHAR],
    description: "Extra rules text shown for the villain's advanced side."
  },
  {
    key: "AdvancedGameTextBoxWidth", selector: "#inputAdvancedBoxWidth", kind: "number", default: 0,
    categories: [VILLAIN_CHAR],
    description: "Width adjustment (slider, roughly -33 to 10) for the Advanced game-text box."
  },
];

/*
IMAGE_FIELD_GROUPS entry shape (a URL + X + Y + Zoom quartet sharing an image purpose):
  keyPrefix     - JSON key prefix; keys are `${keyPrefix}URL|X|Y|Zoom` unless urlKey overrides
  urlKey        - (optional) explicit URL key when it isn't `${keyPrefix}URL`
  purpose       - image purpose constant, or null for the main card art (cardArtImage + plain .inputImage* selectors)
  zoomDefault   - value applied to the zoom slider on import when the key is absent
  categories    - CARD_CATEGORY values this group belongs to on export
  aliasPrefixes - (optional) extra key prefixes accepted on import
  description   - human-readable summary (for docs)
*/
const IMAGE_FIELD_GROUPS = [
  {
    keyPrefix: "Image", purpose: null, zoomDefault: 100,
    categories: [BASIC, ENVIRONMENT, PRINCIPLES],
    description: "Main card art. Loaded with crossOrigin='Anonymous', so the image host must permit cross-origin use."
  },
  {
    keyPrefix: "Nemesis", urlKey: "NemesisIconURL", purpose: NEMESIS_ICON, zoomDefault: 0,
    categories: [HERO_CHAR, VILLAIN_CHAR],
    description: "Nemesis icon badge shown on the card."
  },
  {
    keyPrefix: "BackgroundArt", purpose: BACKGROUND_ART, zoomDefault: 0,
    categories: [HERO_CHAR, VILLAIN_CHAR],
    description: "Art drawn behind the card frame."
  },
  {
    keyPrefix: "ForegroundArt", purpose: FOREGROUND_ART, zoomDefault: 0,
    categories: [HERO_CHAR, VILLAIN_CHAR],
    description: "Character art drawn in front of the background but behind the text areas."
  },
  {
    keyPrefix: "NameLogo", purpose: NAME_LOGO, zoomDefault: 0,
    aliasPrefixes: ["CharacterLogo"],
    categories: [HERO_CHAR, VILLAIN_CHAR],
    description: "Stylised name/title logo placed in the name banner. CharacterLogo* keys are also accepted on import."
  },
];


/*
============================================================================
Global functions
============================================================================
*/
/** Gets the pixel count that corresponds to a given percentage width. */
function pw(percentageWidth) {
    return percentageWidth * canvas.width / 100;
}

/** Gets the pixel count that corresponds to a given percentage height. */
function ph(percentageHeight) {
    return percentageHeight * canvas.height / 100;
}

/**
 * Gets the pixel count that corresponds to a given percentage of the card's smallest dimension, which is
 * height for horizontal cards and width for vertical cards.
 */
function ps(percentageSmall) {
    if (ORIENTATION === HORIZONTAL) {
        return ph(percentageSmall);
    }
    // else ORIENTATION === VERTICAL
    return pw(percentageSmall);
}

/** Loads a a list of custom terms to bold and italicize alongside the default list. */
function loadEffectList() {
    // Get the list of user-specified terms. If it doesn't exist, return an empty array.
    const customEffectList = $('#inputBoldWords').prop('value') ?
        $('#inputBoldWords').prop('value')
            .toUpperCase()
            .split(",")
            .map(x => x.trim())
            .filter(x => x != "") :
        [];
    // Union that list with the list of default bold & default italicized terms
    effectBoldList = Array.from(new Set([...DEFAULT_BOLD_LIST, ...customEffectList]));
    effectItalicsList = Array.from(new Set([...DEFAULT_ITALICS_LIST, ...customEffectList]));
}

// Sets canvas width given a card preview size, using the page's pre-configured orientation
function setCanvasWidth(cardPreviewSize) {
    $('#canvasContainer').css({ width: canvasSizes.get(ORIENTATION).get(cardPreviewSize) });
}

/** Resets the settings for a given data image input with the specified purpose (e.g. "mainArt", "backgroundArt") */
function resetDataImageSettings(imagePurpose) {
    $(`.contentInput[data-image-purpose="${imagePurpose}"]`).each(function () {
        if (this.dataset.default) {
            this.value = this.dataset.default;
        }
    });
}

/*
============================================================================
Initialization Logic
============================================================================
*/
// Establish canvas
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
ctx.save();
setCanvasWidth(MEDIUM);

// Make invisible second canvas for running calculations
const clonedCanvas = $(canvas).clone().appendTo("#canvasContainer");
$(clonedCanvas).attr({
    'id': 'calculationCanvas',
    'style': 'display: none;'
});
var calculationCanvas = document.getElementById("calculationCanvas");

/*
============================================================================
Initialization-Dependent Global Variables
============================================================================
*/
// TODO: HORIZONTAL CHARACTERS - UW hasn't set up horizontal character cards yet, so many mapped results for CHARACTER + VERTICAL cards
//       are null. If you're reading this comment because you hit a null error, figure this value out and update the maps!

// Font size for phase labels
const _phaseFontSizeMap = new Map([
    [BASIC, pw(4.1)],
    [ENVIRONMENT, ph(4.1)],
    [HERO_CHAR, pw(4)],
    [VILLAIN_CHAR, ph(3.2)],
    [PRINCIPLES, ph(4.1)],
]);
const EFFECT_PHASE_FONT_SIZE = _phaseFontSizeMap.get(CARD_CATEGORY);

// X position of the icons next to phase labels
const _phaseIconXMap = new Map([
    [BASIC, pw(8.9)],
    [ENVIRONMENT, pw(54)],
    [HERO_CHAR, pw(9.2)],
    [VILLAIN_CHAR, pw(58.5)],
    [PRINCIPLES, pw(4)],
]);
const PHASE_ICON_X = _phaseIconXMap.get(CARD_CATEGORY);

// Size of the icons next to phase labels
const _phaseIconSizeMap = new Map([
    [BASIC, ps(5)],
    [ENVIRONMENT, ps(5)],
    [HERO_CHAR, ps(5)],
    [VILLAIN_CHAR, ps(3.8)],
    [PRINCIPLES, ps(5)],
]);
const PHASE_ICON_SIZE = _phaseIconSizeMap.get(CARD_CATEGORY);

// Font size for most effect text
const _baseFontSizeMap = new Map([
    [BASIC, pw(4.05)],
    [ENVIRONMENT, ph(4.05)],
    [HERO_CHAR, pw(3.95)],
    [VILLAIN_CHAR, ph(2.9)],
    [PRINCIPLES, ph(4.05)],
]);
const EFFECT_BASE_FONT_SIZE = _baseFontSizeMap.get(CARD_CATEGORY);

// The X position to begin drawing effect text
const _effectStartXMap = new Map([
    [BASIC, new Map([
        [FRONT, pw(12.5)],
        // Deck backs don't have effect text
        [BACK, null],
    ])],
    [ENVIRONMENT, new Map([
        [FRONT, pw(57)],
        // Deck backs don't have effect text
        [BACK, null],
    ])],
    [HERO_CHAR, new Map([
        [FRONT, pw(12.5)],
        [BACK, pw(14.5)]
    ])],
    [VILLAIN_CHAR, new Map([
        [FRONT, pw(60.25)],
        [BACK, null],
    ])],
    [PRINCIPLES, new Map([
        [FRONT, pw(6.5)],
        // Principle deck backs don't have effect text
        [BACK, null],
    ])],
]);
const EFFECT_START_X = _effectStartXMap.get(CARD_CATEGORY)?.get(FACE);

// The X position to stop drawing effect text
const _effectEndXMap = new Map([
    [BASIC, pw(88.5)],
    [ENVIRONMENT, pw(94)],
    [HERO_CHAR, pw(86.5)],
    [VILLAIN_CHAR, pw(96.75)],
    [PRINCIPLES, pw(47.5)],
]);
const EFFECT_END_X =  _effectEndXMap.get(CARD_CATEGORY);

// The Y position to begin drawing effect text
const _effectStartYMap = new Map([
    [BASIC, new Map([
        [FRONT, ph(61.5)],
        // Deck backs don't have effect text
        [BACK, null],
    ])],
    [ENVIRONMENT, new Map([
        [FRONT, ph(28)],
        // Deck backs don't have effect text
        [BACK, null],
    ])],
    [HERO_CHAR, new Map([
        [FRONT, ph(85.5)],
        [BACK, ph(86)],
    ])],
    [VILLAIN_CHAR, new Map([
        [FRONT, ph(86.1)],
        [BACK, null],
    ])],
    [PRINCIPLES, new Map([
        [FRONT, ph(21.5)],
        // Principle deck backs don't have effect text
        [BACK, null],
    ])],
]);
const EFFECT_START_Y = _effectStartYMap.get(CARD_CATEGORY)?.get(FACE);

// The Y position of the bottom of the effect text box. This is currently only used
// to calculate vertical centering for horizontal deck cards.
const _effectEndYMap = new Map([
    [BASIC, new Map([
        [FRONT, null],
        // Deck backs don't have effect text
        [BACK, null],
    ])],
    [ENVIRONMENT, new Map([
        [FRONT, ph(81)],
        // Deck backs don't have effect text
        [BACK, null],
    ])],
    [HERO_CHAR, new Map([
        [FRONT, null],
        [BACK, null],
    ])],
    [VILLAIN_CHAR, new Map([
        [FRONT, null],
        [BACK, null],
    ])],
    [PRINCIPLES, new Map([
        [FRONT, ph(81)],
        // Principle deck backs don't have effect text
        [BACK, null],
    ])],
]);
const EFFECT_END_Y = _effectEndYMap.get(CARD_CATEGORY)?.get(FACE);

// The base line height. Used to set the line height for body text.
const BODY_BASE_LINE_HEIGHT = EFFECT_BASE_FONT_SIZE * 1.2345;


// Default coordinates for character card game text box
// NOTE: Deck values have intentionally been left null, since this does not apply to deck cards
const _characterBodyBoxMap = new Map([
    [BASIC, null],
    [ENVIRONMENT, null],
    [HERO_CHAR, {
        topLeft: {x: pw(10), y: ph(79)},
        topRight: {x: pw(90), y: ph(79)},
        bottomRight: {x: pw(90), y: ph(93.3)},
        bottomLeft: {x: pw(10), y: ph(94)},
        bgColor: '#ffffffcc',  // Last two digits are transparency
        borderThickness: pw(0.5),
        shadowThickness: pw(1),
    }],
    [VILLAIN_CHAR, {
        topLeft: {x: pw(58), y: ph(81.5)},
        topRight: {x: pw(98), y: ph(81.5)},
        bottomRight: {x: pw(98), y: ph(97)},
        bottomLeft: {x: pw(58), y: ph(97)},
        bgColor: '#ffffffff',  // Last two digits are transparency,
        borderThickness: pw(0.25),
        shadowThickness: pw(0.5),
    }],
    [PRINCIPLES, null],
]);
const CHARACTER_BODY_BOX = _characterBodyBoxMap.get(CARD_CATEGORY);


// Values for quotes:
// NOTE: All quote values have been left null for characters, given that no character card currently
// has quote text.
// Font size for quote text
const _quoteFontSizeMap = new Map([
    [BASIC, pw(3.5)],
    [ENVIRONMENT, ph(3.4)],
    [HERO_CHAR, null],
    [VILLAIN_CHAR, null],
    [PRINCIPLES, ph(3.4)]
]);
const QUOTE_FONT_SIZE = _quoteFontSizeMap.get(CARD_CATEGORY);

// These values assume quotes are centered horizontally.
const _quoteStartXMap = new Map([
    [BASIC, new Map([
        [FRONT, pw(50)],
        // Deck backs don't have quotes
        [BACK, null],
    ])],
    [ENVIRONMENT, new Map([
        [FRONT, pw(72)],
        // Deck backs don't have quotes
        [BACK, null],
    ])],
    [HERO_CHAR, null],
    [VILLAIN_CHAR, null],
    [PRINCIPLES, new Map([
        [FRONT, pw(27)],
        // Principle deck backs don't have quotes
        [BACK, null],
    ])],
]);
const QUOTE_START_X = _quoteStartXMap.get(CARD_CATEGORY)?.get(FACE);

// These values assume quotes are centered vertically.
const _quoteStartYMap = new Map([
    [BASIC, new Map([
        [FRONT, ph(92.3)],
        // Deck backs don't have quotes
        [BACK, null],
    ])],
    [ENVIRONMENT, new Map([
        [FRONT, ph(87)],
        // Deck backs don't have quotes
        [BACK, null],
    ])],
    [HERO_CHAR, null],
    [VILLAIN_CHAR, null],
    [PRINCIPLES, new Map([
        [FRONT, ph(89)],
        // Principle deck backs don't have quotes
        [BACK, null],
    ])],
]);
const QUOTE_START_Y = _quoteStartYMap.get(CARD_CATEGORY)?.get(FACE);

const _quoteWidthMap = new Map([
    [BASIC, new Map([
        [FRONT, pw(75)],
        // Deck backs don't have quotes
        [BACK, null],
    ])],
    [ENVIRONMENT, new Map([
        [FRONT, ph(68)],
        // Deck backs don't have quotes
        [BACK, null],
    ])],
    [HERO_CHAR, null],
    [VILLAIN_CHAR, null],
    [PRINCIPLES, new Map([
        [FRONT, ph(63)],
        // Principle deck backs don't have quotes
        [BACK, null],
    ])],
]);
const QUOTE_WIDTH = _quoteWidthMap.get(CARD_CATEGORY)?.get(FACE);

// This object is where user input images (specifically Image objects) are stored
// currently unused for deck fronts, but needs to exist for JSON parsing to function correctly
const loadedUserImages = {
};


/*
============================================================================
Modifiable Global Variables
============================================================================
*/
// The offset to apply to the height at which the body of a card is drawn.
let boxHeightOffset = 0;

// Whether to use high contrast phase labels
let useHighContrastPhaseLabels = $('#inputUseHighConstrast').length > 0 ? $('#inputUseHighConstrast')[0].checked : false;

// Whether a card has the Suddenly! keyword
let suddenly = $('#suddenly').length > 0 ? $('#suddenly')[0].checked : false;

// The scale of the body text and line height for a card. This is a value between 0 and 1, set by the user.
let effectFontScale = 1;

// The size of body text for a card. This is a convenience variable, derived from effectFontScale * EFFECT_BASE_FONT_SIZE
let effectFontSize = effectFontScale * EFFECT_BASE_FONT_SIZE;

// The size of the space between words. This is a convenience variable, derived from effectFontSize * SPACE_WIDTH_FACTOR
let spaceWidth = effectFontSize * SPACE_WIDTH_FACTOR;

// The line height for body text. This is a convenience variable, derived from effectFontScale * BODY_BASE_LINE_HEIGHT
let lineHeight = effectFontScale * BODY_BASE_LINE_HEIGHT;

// These phrases will be automatically bolded. This list is updated based on user input.
let effectBoldList = Array.from(DEFAULT_BOLD_LIST);

// These phrases will be automatically italicized. This list is updated based on user input.
let effectItalicsList = Array.from(DEFAULT_ITALICS_LIST);

// The indentation of the X-position cursor when drawing indented blocks (such as Power, Reaction, and Bullet point blocks).
var currentIndentX = EFFECT_START_X;
/*
Using "var" instead of "let" above to fix a bug that started happening within drawSimpleBlock(),
where executing [currentOffsetX = currentIndentX;] caused both variables to then return as NaN,
even though both logged as valid numbers immediately before.
This bug randomly started occuring around 3/19/2025, in Google Chrome but not Firefox.
*/

// The X position for draw commands.
let currentOffsetX = 0;

// The Y position for draw commands.
let currentOffsetY = 0;

// Whether to display the card border for character cards
let showBorder = $('#inputDisplayBorder').length > 0 ? $('#inputDisplayBorder')[0].checked : true;

// Whether to display the variant tag for Hero character cards
let isVariant = $('#inputVariantToggle').length > 0 ? $('#inputVariantToggle')[0].checked : false;

// Simple color toggle for variant text (if we ever decide to do more advanced variant stuff, this should be deleted)
let variantTextColor = $('#inputVariantColor').length > 0 ? $('#inputVariantColor')[0].checked : false;

// Whether an Advanced game text box is being drawn
let drawingAdvanced = false;

// Variable for adjusting the normal game text Y values based on the advanced game text Y values
let advancedBoxYAdjustment = 0;
let advancedTextYAdjustment = 0;

// Variable to hold vertical alignment for HP, keywords, and description
let inputBelowNameLogoAlignment = 1;

// How much the border in a Villain character card should adjust to fit the setup text
let setupBorderOffset = 0;
