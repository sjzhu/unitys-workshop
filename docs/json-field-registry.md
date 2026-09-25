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
| **Brand-new field** | +1 entry (`key`, `selector`, `kind`, `default`, `categories`, `description`); update a matching `JSON_FIELD_PROFILES` allowlist if the field belongs on that exceptional face | add the input control | add rendering | as needed |
| **Rename a JSON key** | change `key`; add the old name to `aliases: [...]` so existing blobs still import | — | — | — |
| **Change a default, kind, or category membership** | one-line edit on the entry | — | — | — |
| **New image slot** (e.g. a deck-back art layer) | +1 `IMAGE_FIELD_GROUPS` entry + a new image-purpose constant | add the `data-image-purpose` slider block | add rendering | — |
| **New card category / tool** | add the `CARD_CATEGORY` constant; add it to existing entries' `categories` where shared; add category-specific entries | new page | new script | frame art |

After any registry edit: add a sample value for the field in
`tools/json-roundtrip.mjs` and run `node tools/json-roundtrip.mjs` — its delta
gate fails if the export key set changes in a way the test doesn't expect. It
also verifies that unknown properties and registry fields unused by a particular
tool are accepted without errors and omitted from that tool's export.

The `<details>` "JSON Input" list on each tool page is generated from
`CARD_FIELDS` + `IMAGE_FIELD_GROUPS`, using the same category/tool filtering as
import and export.

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
- **Granularity is per-category by default.** A `[BASIC]` field is emitted in the
  JSON of every `basic` tool. Established category/face exceptions belong in a
  centralized `JSON_FIELD_PROFILES` allowlist; import, export, and generated docs
  all use the same profile.

## Tool-specific field sets

- **principles-deck-front** — no `#inputAttribution` control or attribution
  concept, so `Attribution` does not include `PRINCIPLES` in its categories.
- **hero-character-card-back** — shares `hero_character` with the front, but the
  `HERO_CHAR` + `BACK` profile limits it to the fields and image groups the back
  actually supports.
