# Dependency audit and hosting checklist

Unity's Workshop can run on a static web host without a build step, application
server, database, or npm installation. Hosting the complete feature set also
requires Google Cloud configuration for Google Drive image selection and browser
access to third-party scripts and fonts.

Audited on 2026-10-12 against the tracked source on
`sjzhu--support-google-drive-images` at `8af81cb`. This is a hosting and development
inventory, not a vulnerability audit. Google Cloud, DNS, and GitHub repository
settings live outside this repository; confirm those settings in the accounts
that will operate the new site.

## Choose the features to host

| Feature | What the operator needs | If omitted or unavailable |
| --- | --- | --- |
| Card creators with local uploads and JSON import/export | Static files, browser JavaScript, repository assets | Core site cannot run without these |
| Official card gallery and search reference | Local TSVs/scans and CDN jQuery 3.6.0 | Gallery requires jQuery; missing scans leave images unavailable |
| Existing typography | Google Fonts and CDNFonts network access | Fallback fonts change layout and exported card appearance |
| Google Drive image selection and Drive JSON references | Google Cloud project, OAuth web client, API key, project number, enabled APIs | Drive features fail; local editing and image uploads remain usable |
| Existing automated publishing and PR previews | GitHub repository, Actions permissions, publishing destination | Manual or alternative static deployment still works |
| Custom domain | Domain ownership, DNS configuration, HTTPS | A host-provided URL can be used instead |

## Development tools

| Dependency | Required for | Installation or configuration |
| --- | --- | --- |
| Git | Clone, maintain branches, use hooks, and publish through the existing workflows | Install Git; use branch names such as `yourname--hosting-setup` |
| Python 3 | Both audit scripts and the optional local server | Use Python 3.10 or newer as a conservative baseline; both scripts use only the standard library, with no pip requirements |
| POSIX shell | `.githooks/pre-commit` | Included on Linux/macOS; Git for Windows supplies a shell |
| Static HTTP server | Local gallery AJAX and realistic browser testing | Python's built-in server suffices; no particular server package is required |
| Current browser with developer tools | Canvas rendering, file uploads, JSON/PNG downloads, and OAuth/Picker checks | Exercise Chromium and Firefox; test other browsers you intend to support |

Run from the repository root:

```sh
git config core.hooksPath .githooks
python3 scripts/tsv_audit.py
python3 scripts/card_maker_security_audit.py
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://localhost:8000/`. Opening individual HTML files with `file://` is
insufficient for a complete audit: the gallery fetches TSV files over AJAX and
Google authorization needs an authorized web origin.

The hook runs **both** audits, using `py -3`, `python3`, or `python`, in that order.
The security audit also runs in both deployment workflows. The TSV audit is
currently enforced by the hook, not those workflows.

There is no tracked `package.json`, lockfile, Node build, JavaScript test runner,
or linter configuration. Untracked `node_modules/`, `tests/`, Python caches, and
`test-results/` present in the audit workspace are local artifacts, not a
reproducible project dependency specification. The ignored `plans/` documents
describe development work but are not required to host a fresh clone.

## Browser dependencies and local assets

| Dependency | Where it is used | Operator action |
| --- | --- | --- |
| jQuery 3.6.0, bundled in `_vendor/jquery/` | All ten card creators | Publish the directory and its license unchanged; the security audit verifies the recorded SHA-256 |
| jQuery 3.6.0 at `cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js` | `card-gallery/index.html` and `card-gallery/search-reference/index.html` | Allow CDN access, or deliberately migrate those pages to the bundled copy |
| Google Fonts CSS at `fonts.googleapis.com`, font files at `fonts.gstatic.com` | Boogaloo, Noto Sans, and Work Sans on tool/gallery/home pages; policy pages load a smaller set | No account or key; allow these hosts for the existing appearance |
| CDNFonts CSS/fonts at `fonts.cdnfonts.com` | Unmasked BB and Avengeance Mightiest Avenger | No account or key; allow the host for the existing appearance |
| `_resources/NotoSans-Sentinels.woff2` | Shared `style.css` defines `NotoSentinels` | Publish alongside the stylesheet |
| `_resources/` frames, icons, backgrounds, and scans | Creators and gallery | Preserve paths, capitalization, spaces, and Unicode filenames |
| `card-gallery/*.tsv`, `expressive-search.js`, and `strscan.js` | Gallery data and search | Publish as local static files; no remote database or search service |
| Google Identity Services and Google API loader | `google-drive.js` loads `accounts.google.com/gsi/client` and `apis.google.com/js/api.js`, then the Picker module | Required only for Drive integration; the code starts loading these on page initialization when configuration is valid |
| Drive API v3 | Authorized downloads from `www.googleapis.com/drive/v3/files/...` | Required for Drive image content; requests use the user's temporary bearer token |
| User-supplied image URLs | Legacy URL fields in imported JSON through `common-images.js` | Image host must allow anonymous cross-origin image access for canvas use; use HTTPS in production |

The old `by3302files.storage.live.com` frame URL strings in the hero, villain,
and environment deck-front scripts are **inactive**: their `.src` assignments are
commented out and the frames load from `_resources/`. No OneDrive account is
needed for the default frames.

The Google spreadsheet, `opensheet.elk.sh`, and `jsonformatter.org` URLs in the
JSON instructions are examples of optional authoring tools. The application does
not fetch from them. The `spiritforge.app` attribution and the upstream URL in
`strscan.js` are also references, not runtime dependencies.

## Static hosting checklist

- [ ] Choose a production URL and publish the site files with the repository's
  directory structure intact. Keep `_resources/`, `_vendor/`, creator folders,
  gallery files, and shared scripts/styles together. Serve directory `index.html`
  files normally rather than rewriting every request to the home page.
- [ ] Include `.nojekyll` when using GitHub Pages so directories beginning with
  underscores are served. `_config.yml` is Jekyll metadata, not a required build
  configuration for this static site.
- [ ] Provide HTTPS on the production URL and configure DNS if using a custom
  domain. Replace `CNAME` with your domain, or remove it when using the hosting
  provider's default URL. Check the published branch too: the live workflow
  preserves an existing `CNAME` when the source file is absent.
- [ ] Serve JavaScript, CSS, images, fonts, and UTF-8 TSVs with appropriate content
  types. Allow enough storage and bandwidth for the scan collection; `_resources/`
  occupies approximately 195 MiB in the audited checkout.
- [ ] Retain each creator page's Content Security Policy. If your host adds a CSP
  response header, ensure it also permits the required resources; multiple CSPs
  apply together. The security audit expects the current policy exactly, so an
  intentional policy change also requires updating the audit.
- [ ] Publish `privacy/` and `terms/`; review their operator identity and statements
  against your hosting/integration choices before registering their URLs with
  Google.
- [ ] Publish only the intended site files. Do not copy local `.git/`,
  `node_modules/`, caches, private account files, or temporary test outputs. The
  current workflow copy rules exclude `.git/` but do not provide a general site
  allowlist; review any additional files you commit.
- [ ] Preserve the project's MIT license and bundled jQuery license. Review the
  separate provenance and redistribution terms of scans, artwork, and fonts when
  choosing what to distribute; the code license does not establish their rights.

No server-side environment variables, service account, application session store,
or backend OAuth callback route are used by the current application.

## Google Drive setup checklist

The three values in [google-drive-config.js](google-drive-config.js) belong to the
existing integration. For independent hosting, create credentials in a Google
Cloud project you control. For an operator handover, transfer appropriate project
access and update domain settings. Copying the public values alone does not give
you control of the project or authorize a new origin.

- [ ] Create or select a Google Cloud project with an accountable owner and
  administrative access. Enable **Google Picker API** and **Google Drive API**.
- [ ] Create an API key in that project. Restrict it to the Picker and Drive APIs
  and to website referrers for your site, development, and previews as needed.
  Google's current Picker guide also requires allowing `https://docs.google.com/*`
  because Picker runs in that iframe. See [Google's Picker setup](https://developers.google.com/workspace/drive/picker/guides/web-picker-sample).
- [ ] Configure Google Auth Platform branding, support/developer contact details,
  audience, and data access. Register the new site's home, privacy, and terms URLs
  and authorized domains where required. During external testing, add the Google
  accounts that will test the integration; for public use, move beyond the testing
  audience and complete any verification Google requires. See [OAuth consent setup](https://developers.google.com/workspace/guides/configure-oauth-consent).
- [ ] Keep the requested scope at
  `https://www.googleapis.com/auth/drive.file`. It provides per-file access through
  Picker and is classified as non-sensitive; this does not remove branding and
  publication requirements. See [Drive scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth).
- [ ] Create an OAuth client of type **Web application**. Add production and
  preview **origins** (scheme, hostname, optional port, without a path). For local
  testing add both `http://localhost` and `http://localhost:8000`. An origin such
  as `https://example.com` covers `/pr/123/` too; a different preview hostname
  needs its own entry. See [Google client ID setup](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid).
- [ ] Set `apiKey` to the new API key, `clientId` to the OAuth web client ID, and
  `appId` to the numeric **project number**, not the project ID string. Use the
  same project for all three. See [Picker credentials](https://developers.google.com/workspace/drive/picker/guides/web-picker-sample).
- [ ] Confirm browser popups can open and the host's headers do not interfere with
  Google authorization. This code uses `initTokenClient` with a popup and browser
  callback, with no client secret or refresh token. See [the GIS token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model).
- [ ] Review project quotas, key restrictions, consent status, and any Workspace
  administrator restrictions in the intended accounts; test with a real user on
  the final domain. These settings cannot be validated by the repository audit.

The configuration must remain a single `Object.freeze` assignment with exactly
three string properties: `apiKey`, `clientId`, and `appId`. These are public browser
identifiers. Never add client secrets, service account credentials, access tokens,
or refresh tokens. Placeholder or empty API keys fail the security audit.

Users authorize their own Google accounts. Tokens remain in page memory. Exported
JSON stores file references, not credentials or image bytes. A fresh OAuth client
may require users to select a referenced file again through Picker; a file ID or
resource key alone does not grant access.

### Hosting without Google Drive

Local uploads and card editing can run without working Google credentials. To
prevent requests to Google, the current runtime can be given an empty `apiKey`;
it displays a configuration error and leaves Drive controls disabled. **That
configuration fails the existing security audit and deployment workflows.**

There is currently no supported audited feature flag to disable Drive cleanly.
If you want a production site without it, implement an explicit disabled mode
and update the audit/workflow expectations together. Do not remove credentials
and assume the existing workflows will publish successfully.

## GitHub publishing checklist

These dependencies apply only if you keep the repository's publishing workflows.
Other static hosts can deploy the same files without GitHub Actions.

| Dependency | Current configuration |
| --- | --- |
| GitHub Actions runner | `ubuntu-latest` in both workflows |
| Checkout action | `actions/checkout@v6` |
| PR comment action | `marocchino/sticky-pull-request-comment@v2` |
| Runner programs | Python 3, Git, POSIX shell, and rsync; live workflow installs rsync with `sudo apt-get`, preview workflow assumes it is present |
| Repository token | Checkout uses the default `GITHUB_TOKEN`; live needs `contents: write`, preview also needs `pull-requests: write` |
| Source and destination | Pushes to `main` or manual dispatch sync the live root to `gh-pages`; PR events copy to `gh-pages/pr/<number>/` and closed PRs remove their preview |

- [ ] Enable Actions and allow both referenced actions under your repository or
  organization policy. Permit the declared token writes and ensure branch rules
  allow the workflow to update `gh-pages`.
- [ ] Decide how `gh-pages` actually reaches the host. The tracked workflows only
  commit/push files: they do not upload a Pages artifact or call
  `actions/deploy-pages`. GitHub documents that pushes with `GITHUB_TOKEN` do not
  trigger a Pages build. For GitHub Pages, add an explicit Pages deployment step
  and the required permissions/settings, or configure another publishing trigger
  with suitable credentials. Simply selecting `gh-pages` as the branch source is
  not a complete automated deployment setup for these workflows. See [GitHub
  publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
- [ ] Replace the hard-coded `https://unitysworkshop.com/pr/` base URL in
  `.github/workflows/pr-preview.yml` with your site's actual base URL, including a
  repository path when applicable. The comment's URL must match the destination.
- [ ] Test the first live publish on a new repository. The branch initialization
  path is present, but the live workflow subsequently pulls/rebases `gh-pages`;
  creating the publishing branch beforehand avoids pulling a nonexistent remote
  branch.
- [ ] Verify preview creation, update, and cleanup. Fork PRs normally lack the
  write permissions this workflow needs; do not assume they can publish/comment.
- [ ] Review concurrent live/preview publishing: different concurrency groups
  write the same branch, so competing pushes can fail. Confirm workflow success
  and a real hosted response rather than relying on a preview comment alone.

No custom repository secret is referenced by the tracked workflows. Credentials
for an alternative deployment trigger or external host must be configured by
that operator; they are not supplied by this repository.

## Checks before launch

- [ ] Both Python audits pass in a clean checkout.
- [ ] Home, every creator, gallery, search reference, privacy, and terms load from
  the final URL, including any repository or preview subpath.
- [ ] Local image selection, text edits, phase symbols, PNG download, and JSON
  export/import work. Exported PNG typography matches the browser canvas.
- [ ] Gallery TSV requests and scan images return successfully; search and card
  flipping work. Confirm files under `_resources/` and `_vendor/` are served.
- [ ] Font requests succeed and the console has no unexplained CSP violations.
- [ ] If enabled, first-time Google consent, Picker selection, image download,
  cancellation, and JSON reimport work on localhost and the hosted origin. Reload
  and reconnect as needed; test a different account and a file it cannot access.
- [ ] With Google/CDN requests blocked, confirm expected degradation: creators
  still support local uploads, Drive reports its error, fonts fall back, and the
  gallery's CDN jQuery dependency is understood.
- [ ] Publishing changes the hosted content; preview lifecycle and any configured
  custom domain work independently of the original operator's accounts.

## Operator handover record

Keep the following in the operator's own records; put secrets in the chosen
platform's credential store rather than this repository.

| Item | Record |
| --- | --- |
| Source repository and publishing mechanism | Repository URL, source branch, deployment settings, maintainer access |
| Hosting | Provider/account owner, production and preview URLs, publish destination |
| Domain | Registrar/DNS owner, records, renewal responsibility, HTTPS settings |
| Google Cloud | Project ID and number, owner/admins, enabled APIs, quotas |
| Google OAuth | Client ID, authorized origins/domains, consent audience/publication status, contact addresses |
| Google API key | Key identity, website/API restrictions, maintenance responsibility |
| Deployment credentials if added | Credential store location, permissions, owner, rotation procedure |

Revisit this checklist when adding an external URL, changing Google permissions,
moving domains, or changing either publishing workflow.
