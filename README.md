# Unity's Workshop

An unofficial, static browser-based card creator and card gallery for *Sentinels of
the Multiverse: Definitive Edition*.

## Testing

The test suite requires Node.js 20 or newer, npm, and Python 3. Install the locked
JavaScript dependencies once:

    npm ci

Run all JavaScript and Python tests:

    npm run test:all

`npm test` runs JavaScript tests once, `npm run test:watch` runs them in watch
mode, and `npm run test:python` runs the TSV audit tests. Tests run locally without
a public deployment or runtime network access.

Install Chromium once for the browser smoke tests:

    npx playwright install chromium

Then run the Playwright suite:

    npm run test:e2e

Playwright starts a local static server automatically. External network requests are
handled locally during the tests: the CDN jQuery request is fulfilled from the
locked production-matching dependency, canvas fonts are mapped to the repository's
bundled font, and other requests are blocked.

The Playwright suite includes canvas-only visual regression tests for representative
front and back cards. Linux Chromium in CI is the canonical snapshot platform.
Developers on other operating systems can run the portable browser behavior tests
with `npm run test:e2e:behavior`; verify or update canonical snapshots in Linux using
the same locked dependencies and Chromium version as CI.

Run only the visual tests with `npm run test:e2e:visual`. After an intentional
rendering change, inspect the new images and update the committed Linux baselines
from a Linux environment with:

    npm run test:e2e:update-snapshots

The snapshots use local artwork and fonts so updating or running them does not need
network access. At most 100 pixels may differ, with a strict per-pixel color threshold;
this accommodates minor rasterization noise without hiding layout, text, frame, or
artwork regressions.
