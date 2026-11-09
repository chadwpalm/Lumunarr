# Contributing to Lumunarr

Thanks for your interest in improving Lumunarr! This guide covers how to get a local copy running, how the project is laid out, and what to check before opening a pull request.

Questions are welcome in [Discussions](https://github.com/chadwpalm/Lumunarr/discussions) or on [Discord](https://discord.gg/d76vc6bBJ6). For bugs, please open an [issue](https://github.com/chadwpalm/Lumunarr/issues) first so the fix can be discussed.

## Contents

- [What you need](#what-you-need)
- [Get the code](#get-the-code)
- [Set up the config folder](#set-up-the-config-folder)
- [Run Lumunarr for development](#run-lumunarr-for-development)
- [Project layout](#project-layout)
- [Sending test webhooks](#sending-test-webhooks)
- [Logging and troubleshooting](#logging-and-troubleshooting)
- [Before you open a pull request](#before-you-open-a-pull-request)
- [Opening the pull request](#opening-the-pull-request)

## What you need

- **Node.js 26** (the version in [`.nvmrc`](.nvmrc), and the one the Docker image uses). With [nvm](https://github.com/nvm-sh/nvm), run `nvm install` then `nvm use` in the repo folder.
- **Git**, and a GitHub account for your fork.
- **A Philips Hue bridge** on your network to test against.
- **Plex Media Server with Plex Pass** if you want real webhooks. Webhooks are a Plex Pass feature. You can also send fake webhooks with `curl` (see [Sending test webhooks](#sending-test-webhooks)).
- **Docker** (optional), to test the image the same way users run it.
- **An editor with Prettier and ESLint.** In VS Code, install the [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) extensions (VS Code suggests both when you open the repo) and turn on **Format On Save**.

Lumunarr is developed on Linux and also runs on macOS. On **Windows**, use [WSL2](https://learn.microsoft.com/windows/wsl/).

## Get the code

1. Fork [chadwpalm/Lumunarr](https://github.com/chadwpalm/Lumunarr) on GitHub.
2. Clone your fork and add the main repository as `upstream`:

   ```bash
   git clone https://github.com/<your-username>/Lumunarr.git
   cd Lumunarr
   git remote add upstream https://github.com/chadwpalm/Lumunarr.git
   ```

3. Create your branch from **`develop`**. `main` only receives releases.

   ```bash
   git fetch upstream
   git checkout -b my-feature upstream/develop
   ```

4. Install dependencies for the backend (repo root) and the frontend:

   ```bash
   nvm use
   npm install
   cd frontend && npm install && cd ..
   ```

## Set up the config folder

Lumunarr keeps its settings (`settings.js`) and logs in a config folder. In Docker this is **`/config`** (the volume users mount). The `CONFIG_DIR` environment variable points it somewhere else.

For development, use **`npm run dev`** (next section). It sets `CONFIG_DIR=./dev-config`, so everything goes into a `dev-config` folder inside your clone. That folder is ignored by Git, is created on first start, and keeps your development settings apart from any real installation. To start over with a fresh setup, stop Lumunarr and delete `dev-config`.

> [!NOTE]
> `npm start` (without `CONFIG_DIR`) uses `/config`, like the Docker image. Use it only if you want to work with that folder. Other apps, such as Preroll Plus, use `/config/settings.js` too, so don't share that folder between them.

## Run Lumunarr for development

Use two terminals.

**Terminal 1: backend** (Express on port 3939, settings in `./dev-config`, restarts automatically when backend files change):

```bash
npm run dev
```

**Terminal 2: frontend** (Vite dev server on port 3000, with hot reload):

```bash
cd frontend
npm run dev
```

Open **http://localhost:3000**. The Vite dev server forwards `/backend` and `/webhook` requests to the backend on 3939 (see [`frontend/vite.config.js`](frontend/vite.config.js)), so the backend in terminal 1 must be running.

- Frontend changes (`.jsx` and `.css` files) show up in the browser immediately, usually without a page reload.
- Backend changes restart the server through nodemon (see [`nodemon.json`](nodemon.json)). Changes under `frontend/` do not restart it.
- If your backend runs somewhere else, start the frontend with `BACKEND_URL=http://host:port npm run dev`.

> [!NOTE]
> If you set a **URL Base** in Settings (or `APP_BASE_URL`), the backend only answers under that path, and the dev server on port 3000 will not reach it. Clear the URL base while developing, or test that feature against a production build (below).

### Production build

This is what the Docker image serves. Express serves the built files from `frontend/production`:

```bash
cd frontend && npm run build && cd ..
npm run dev
```

Then open **http://localhost:3939**.

### Useful environment variables

| Variable        | Purpose                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONFIG_DIR`    | Folder for settings and logs (default `/config`). `npm run dev` sets it to `./dev-config`. Relative paths are resolved from the folder you start Lumunarr in. |
| `APP_PORT`      | Port to listen on (default 3939). Overrides the Port setting. `PORT` also works.                                                                              |
| `APP_BASE_URL`  | URL base for reverse proxies, e.g. `/lumunarr`. Overrides the URL Base setting.                                                                               |
| `PUID` / `PGID` | Owner applied to the settings file (mainly for Docker).                                                                                                       |
| `BUILD`         | Build number shown in the UI and logs (set by CI; defaults to `Native`).                                                                                      |
| `BACKEND_URL`   | Frontend dev server only: where to forward API calls (default `http://localhost:3939`).                                                                       |

## Project layout

```
app.js                  Express app: routes, URL base handling, serves the built frontend
bin/www                 Starts the HTTP server (port from backend/config.js)
bin/healthcheck.js      Docker HEALTHCHECK
backend/
  config.js             Port and URL base (env vars and settings)
  logger.js             Logging: levels, tags, secret masking, log files
  paths.js              Config folder location (CONFIG_DIR, default /config)
  load.js, save.js      Read and write settings.js in the config folder
  client.js             Data for the profile (Create) form: Plex users/clients/libraries, Hue scenes
  server.js             Data for the Server page: Hue rooms, zones, lights
  discover.js           Hue bridge discovery (mDNS, then the Hue Discovery service)
  monitor.js            Checks the bridge every 15 minutes and follows IP changes
  user.js               Pairing with the bridge (link button)
  host.js               Running port/URL base for the Settings page
webhook/index.js        Receives Plex webhooks and runs the matching profile actions
frontend/               React app (Vite)
  src/components/       One folder per page or component
  src/components/Common Shared form pieces (labels with tooltips, time/schedule fields, sliders)
```

Backend modules log through a tagged logger:

```js
const log = require("./logger").tagged("MYTAG");
log.info("Something happened");
log.debug("Details that help troubleshooting");
log.error("What failed:", error); // pass the error object, not error.message
```

Use **info** for things Lumunarr did (webhook received, scene recalled, bridge found), **debug** for details and "why" information, **warn** for recoverable problems, and **error** for failures. Do not log tokens or keys. The logger masks the known ones, but don't rely on that.

## Sending test webhooks

Plex sends webhooks as a multipart form with a `payload` field containing JSON. You can imitate one with `curl`:

```bash
curl -F 'payload={
  "event": "media.play",
  "Account": { "id": 1, "title": "testuser" },
  "Player":  { "title": "Test TV", "uuid": "test-player" },
  "Server":  { "title": "My Server" },
  "Metadata": { "type": "movie", "title": "Test Movie",
                "librarySectionType": "movie", "librarySectionTitle": "Movies" }
}' http://localhost:3939/webhook
```

Events Lumunarr acts on: `media.play`, `media.pause`, `media.resume`, `media.stop`, `media.scrobble` (profiles), and `playback.started`, `library.new` (Server page alerts).

> [!CAUTION]
> If the `Player.uuid` and account match one of your profiles, **your lights will really change**. Use a made-up player ID to test only the matching and logging.

To get real webhooks from Plex, add `http://<your-machine-ip>:3939/webhook` under **Plex > Settings > Webhooks**.

## Logging and troubleshooting

- Logs go to the terminal and to `logs/lumunarr-YYYY-MM-DD.log` in the config folder (`dev-config/logs/` with `npm run dev`).
- Set **Settings > Logging > Log Level** to **Debug** to see why each profile did or didn't match a webhook, every API request, and Hue/Plex lookup details. The change applies as soon as you save.
- Tokens and keys are masked in the logs, but check before pasting logs into an issue anyway.

## Before you open a pull request

### Checks

- [ ] **Lint passes** (no errors; warnings in older code are OK): `npm run lint` for the backend, and `cd frontend && npm run lint`
- [ ] **Code is formatted with Prettier** (format on save, or `npx prettier --write <files>`)
- [ ] **Frontend builds:** `cd frontend && npm run build`
- [ ] **No new vulnerabilities:** `npm audit` in the repo root and in `frontend/`
- [ ] **You tested the change in the app**, including dark mode and a narrow (phone-width) window if you touched the UI
- [ ] **Existing settings still work.** If you change what gets saved in `settings.js`, existing users' files must keep working. Give new fields a sensible default when they are missing.

### Test the Docker image

Lumunarr is mostly run in Docker, so build and run the image if your change touches the backend, dependencies or the Dockerfile:

```bash
docker build -t lumunarr-dev .
mkdir -p ./docker-config
docker run --rm --network host -e PUID="$(id -u)" -e PGID="$(id -g)" \
  -v "$(pwd)/docker-config:/config" lumunarr-dev
```

- `--network host` lets Lumunarr find your bridge with mDNS (Linux only; on macOS use `-p 3939:3939` and enter the bridge IP manually).
- `docker-config` (ignored by Git) keeps the container's settings separate from your `dev-config`.
- Stop your `npm run dev` backend first, since both use port 3939.
- The container reports `healthy` in `docker ps` once it answers on its port.
- The container creates `docker-config/logs` as root, so removing the folder afterwards needs `sudo rm -rf docker-config`.

### Code style

- Formatting is handled by [Prettier](https://prettier.io) using the repo's [`.prettierrc.json`](.prettierrc.json) (Prettier defaults with a 120 character line width). Let your editor format on save rather than formatting by hand.
- Linting uses ESLint: [`eslint.config.mjs`](eslint.config.mjs) for the backend and [`frontend/eslint.config.js`](frontend/eslint.config.js) for the frontend.
- Keep changes focused. Separate refactoring from behavior changes where you can.
- Prefer the shared components in `frontend/src/components/Common` and `SettingsSection` for new form fields.

### history.md

Add a line for your change to [`history.md`](history.md) under the version at the top, in the matching section (**Added**, **Changes** or **Fixes**). Link the related issue or PR, following the existing entries:

```markdown
- Short description of what changed for users. {[#123](https://github.com/chadwpalm/Lumunarr/issues/123)}
```

Don't change `version.json`; the maintainer sets the version when releasing.

## Opening the pull request

1. Bring your branch up to date with `develop`:

   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

2. Push to your fork and open a pull request **into `develop`** (not `main`).
3. In the description, explain:
   - what the change does and why
   - how you tested it (native and/or Docker, which Plex client, which Hue setup)
   - screenshots for UI changes (light and dark mode)
   - the related issue, e.g. `Fixes #123`

By contributing you agree that your contribution is licensed under the project's [GNU GPL v3](LICENSE.md) license.
