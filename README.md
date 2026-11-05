# Unity's Workshop

An unofficial browser-based card creator and gallery for *Sentinels of the
Multiverse: Definitive Edition*. This repository is the maintained source of
truth; the original upstream is no longer maintained.

The site is static HTML, CSS, and JavaScript, with no build or package installation
step. For local development, serve the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://localhost:8000/`. Google Drive selection requires separate Google
Cloud configuration; local image uploads do not.

See [the dependency audit and hosting checklist](HOSTING.md) for local tools,
external services, Google OAuth setup, deployment, and checks before launch.
