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
