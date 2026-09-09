# JSON field registry — maintainer guide

The card tools import/export a JSON representation of a card (the "Export/Import
(JSON Format)" box on each tool page). The set of fields is defined **once**, in
`common-before.js`:

- **`CARD_FIELDS`** — simple fields (text / number / checkbox / select).
- **`IMAGE_FIELD_GROUPS`** — image slots, each expanding to `<Prefix>URL` +
  `<Prefix>X` + `<Prefix>Y` + `<Prefix>Zoom`.

`parseJSONData()` and `outputJSONData()` in `common-after.js` are driven entirely
by those two lists (via `applyField` / `readField` / `applyImageGroup` /
`readImageGroup`). **The registry is only the JSON ⇄ input-control bridge** — the
actual card drawing still lives in each tool's own `script.js` and is not affected
by registry changes.

## What each kind of change touches

| Change | `CARD_FIELDS` / `IMAGE_FIELD_GROUPS` | tool `index.html` | tool `script.js` | `_resources/` |
| --- | --- | --- | --- | --- |
| **Expose an existing field on another tool in the same category** | — (field already flows to every tool in its `categories`) | add the input control | add rendering, if the tool doesn't already handle that global | maybe (frame/overlay art) |
| **Brand-new field** | +1 entry (`key`, `selector`, `kind`, `default`, `categories`, `description`) | add the input control | add rendering | as needed |
| **Rename a JSON key** | change `key`; add the old name to `aliases: [...]` so existing blobs still import | — | — | — |
| **Change a default, kind, or category membership** | one-line edit on the entry | — | — | — |
| **New image slot** (e.g. a deck-back art layer) | +1 `IMAGE_FIELD_GROUPS` entry + a new image-purpose constant | add the `data-image-purpose` slider block | add rendering | — |
| **New card category / tool** | add the `CARD_CATEGORY` constant; add it to existing entries' `categories` where shared; add category-specific entries | new page | new script | frame art |

After any registry edit: add a sample value for the field in
`scratch/json-roundtrip.mjs` and run `node scratch/json-roundtrip.mjs` — its delta
gate fails if the export key set changes in a way the test doesn't expect.

(Once the docs-generation step lands, the `<details>` "JSON Input" list on each
tool page is also generated from `CARD_FIELDS` + `description`. Until then those
lists are hand-maintained and known to be inaccurate for character cards.)

## Worked example: add "Suddenly" to villain-deck-front

Most of it is already in place, which shows the pattern:

- villain-deck-front is `CARD_CATEGORY = "basic"`, and the `Suddenly` entry is
  already `categories: [BASIC, ENVIRONMENT]` — so import/export already handle it
  (a no-op today, because there's no control to read).
- `villain-deck-front/script.js` already renders the suddenly state off the global
  `suddenly`.

So the only missing piece is the checkbox in `villain-deck-front/index.html` (copy
the `#suddenly` input + label from `hero-deck-front/index.html`). No registry
change.

## Guardrails

- **Checkbox `default` must match the control's checked-on-load state.** If the
  `<input>` has a `checked` attribute, the registry `default` must be `true`, or a
  key-less import will silently flip the setting off. (This is exactly how the
  `HighContrastPhaseLabels` default bug happened.)
- **Fields that mirror a top-level global** (`suddenly`, `showBorder`, `isVariant`,
  `variantTextColor`, `useHighContrastPhaseLabels`) need a
  `setState: (v) => { theGlobal = v; }` closure on the entry so import keeps the
  global in sync. These `let`s are reachable lexically but not via `window`.
- **Number fields** read back through `.val()`, which returns the range input's
  clamped string. Compare round-trips by parsed value, not raw export text.
- **Granularity is per-category, not per-tool.** A `[BASIC]` field is emitted in
  the JSON of every `basic` tool (hero-deck-front, villain-deck-front, the deck
  backs). Tools without the control get a harmless no-op on import and a sparse key
  on export (`"Suddenly": false`). If you ever need a field on only *some* tools in
  a category, the registry would need per-tool filtering added — don't do that
  preemptively.

## Known sparse-export tools

`outputJSONData` lets `JSON.stringify` drop keys whose control isn't on the page,
so two tools export a valid *subset* of their category's keys:

- **principles-deck-front** — no `#inputAttribution` control (principle cards have
  no attribution concept); `Attribution` is excluded from its field's categories.
- **hero-character-card-back** — shares `hero_character` with the front but has
  ~1/3 the controls, so `HP`, `Keywords`, `BoldedTerms`, and the X/Y/Zoom of
  Nemesis / ForegroundArt / NameLogo are omitted.

Both round-trips were already non-functional before the registry (the old string
templates emitted the literal token `undefined`). Face-aware field sets are out of
scope.
