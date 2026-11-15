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

## Implementation compared with the original plan

As of commit `c01e9af`, the core registry refactor is implemented: shared handlers
replace the old flat importer and category export templates, character logos use
canonical `NameLogo*` keys with `CharacterLogo*` import aliases, zoom parsing has a
working NaN fallback, and checkbox imports synchronize their globals. Existing
image wire keys are retained.

The branch also includes the optional generated field docs and adds category/face
filtering through `JSON_FIELD_PROFILES`, although face-awareness was originally
out of scope. The hero character back uses an explicit allowlist. Artist credits
from the newer base are retained with the `Artist` import alias. Number fields
now default on blank/null inputs, and principles exports omit unsupported
`Attribution`. The harness is tracked under `tools/` rather than `scratch/`.

These structural changes cover the plan. Manual browser acceptance (including
rendered-card equivalence) is separate from the harness; see verification limits
below. The original plan lives in the locally excluded `plans/` directory, so this
guide retains the comparison in tracked documentation.

## What each kind of change touches

| Change | `CARD_FIELDS` / `IMAGE_FIELD_GROUPS` | tool `index.html` | tool `script.js` | `_resources/` |
| --- | --- | --- | --- | --- |
| **Expose an existing field on another tool in the same category** | — (field already flows to every tool in its `categories`) | add the input control | add rendering, if the tool doesn't already handle that global | maybe (frame/overlay art) |
| **Brand-new field** | +1 entry (`key`, `selector`, `kind`, `default`, `categories`, `description`); update a matching `JSON_FIELD_PROFILES` allowlist if the field belongs on that exceptional face | add the input control | add rendering | as needed |
| **Rename a JSON key** | change `key`; add the old name to `aliases: [...]` so existing blobs still import | — | — | — |
| **Change a default, kind, or category membership** | one-line edit on the entry | — | — | — |
| **New image slot** (e.g. a deck-back art layer) | +1 `IMAGE_FIELD_GROUPS` entry + a new image-purpose constant | add the `data-image-purpose` slider block | add rendering | — |
| **New card category / tool** | add the `CARD_CATEGORY` constant; add it to existing entries' `categories` where shared; add category-specific entries | new page | new script | frame art |

After any registry edit, run `node tools/json-roundtrip.mjs` from the repository
root (requires Node.js and Git, with an `origin/main` ref available locally).
`buildSample()` automatically creates sample values from registry entries; adjust
it when a field requires a particular value. Update the expected key-set deltas in
the harness for intentional additions or removals. Keep those expectations scoped
to the affected category and face so unintended changes still fail.

The `<details>` "JSON Input" list on each tool page is generated from
`CARD_FIELDS` + `IMAGE_FIELD_GROUPS`, using the same category/tool filtering as
import and export.

## Worked example: add a field only to hero character cards

Suppose a future feature adds a text field named `HeroSubtitle`. This example is
illustrative; it does not add a field to the current application.

1. **Define the field once** in `CARD_FIELDS` in `common-before.js`:

   ```js
   {
     key: "HeroSubtitle",
     selector: "#inputHeroSubtitle",
     kind: "text",
     default: "",
     categories: [HERO_CHAR],
     description: "Subtitle printed on the hero character card."
   },
   ```

   This excludes hero deck cards (their category is `BASIC`), villain character
   cards, environment cards, and principles cards from import, export, and docs.
   Unknown or inapplicable JSON properties are ignored rather than preserved.

2. **Choose which hero character faces support it.** `HERO_CHAR` alone includes
   the front. The existing `HERO_CHAR` + `BACK` entry in `JSON_FIELD_PROFILES` is
   an explicit allowlist, so the back excludes new fields by default.

   | Intended scope | Registry/profile change | Controls and rendering |
   | --- | --- | --- |
   | Front only | Add the entry above; leave the back profile unchanged | Add to `hero-character-card-front/index.html` and its `script.js` |
   | Front and back | Also add `"HeroSubtitle"` to the back profile's `fields` array | Add to both hero character pages and their scripts |
   | Back only | Add `"HeroSubtitle"` to the back profile and create a `HERO_CHAR` + `FRONT` profile excluding it | Add to the back page and script |

   A new profile replaces the category-wide set for that face: its `fields` and
   `imageGroups` arrays must list **all** supported canonical keys and image
   prefixes, not just the new field. Review this list whenever later fields are
   added. Category membership is checked first; a profile cannot include an entry
   whose `categories` excludes that category.

3. **Add the control and rendering.** For a text field, add a labeled input with
   `id="inputHeroSubtitle"` and `class="contentInput"` to each supporting page.
   Read its value in that tool's drawing code and draw it where the feature needs
   it. The shared `contentInput` listener already redraws on input. If the feature
   uses a checkbox backed by a global, initialize the global, wire its input
   listener, and add `setState` to the registry entry; the current `setState`
   handler runs only for `kind: "checkbox"`.

4. **Use the shared JSON handlers and generated docs.** No new branch in
   `parseJSONData()`, `outputJSONData()`, or `renderJSONFieldDocs()` is needed.
   The seven existing JSON tools already have the `jsonFieldDocs` container.
   For a renamed key, add `aliases: ["OldKey"]`; canonical keys take precedence
   on import and are the only keys written on export.

5. **Verify inclusion, exclusion, defaults, and rendering.** Run the harness,
   adding `HeroSubtitle` to `expectedNew` only for the intended category/faces.
   In a browser, import and export a nonempty value on each supporting face;
   confirm the card and generated docs reflect it. Import JSON without the key
   to check its default. Try the same JSON on excluded tools/faces and confirm
   the field stays absent from exports and docs. Check any alias explicitly.

For an image instead of a simple field, add an `IMAGE_FIELD_GROUPS` entry and the
image-purpose constant, controls, upload handling, and rendering. A face profile
uses its `imageGroups` array of `keyPrefix` values rather than its `fields` array.

## Verification limits

`tools/json-roundtrip.mjs` discovers ten tool pages, including the three deck
backs that currently have no JSON box. It checks registry/helper value round-trips,
image aliases, unknown/unused-property handling, and intended key-set differences
from the old templates on the local `origin/main` ref.

The harness pretends every selector exists and builds exports through the helpers;
it does not execute `outputJSONData()` or `renderJSONFieldDocs()`. It does not test
real jQuery, range clamping, missing controls, canvas appearance, image loading,
or PNG downloads. It also does not explicitly exercise every missing-field default,
invalid zoom fallback, or simple-field alias. Verify those behaviors in the browser
when affected. A passing harness alone does not satisfy the plan's browser
acceptance checks.

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
