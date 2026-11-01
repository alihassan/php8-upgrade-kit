# Deploying php8-check

The tool is a static site: HTML, CSS, JavaScript and fonts, no server code.
Any static host works. All the options below are free.

The build reads two settings:

| Variable | What it does | Example |
|---|---|---|
| `BASE` | The URL path the tool lives under. Must start and end with `/`. | `/php8-check/` |
| `VITE_GA_ID` | Google Analytics 4 measurement ID. Leave it out to build with no analytics at all. | `G-XXXXXXXXXX` |
| `OUT_DIR` | Where the files go (default `dist`). | `../site/public/php8-check` |

## Option 1: GitHub Pages (set up in this repo)

1. On GitHub, open the repo's **Settings > Pages** and set **Source** to **GitHub Actions**.
2. Push to `main`. The `pages` workflow runs the tests, builds with
   `BASE=/php8-upgrade-kit/`, and publishes.
3. The tool is then at `https://<your-user>.github.io/php8-upgrade-kit/`.

## Option 2: inside an existing site at `/php8-check/`

If your site is already a static build (made with a static site generator, or
any host that serves a folder of files), the simplest route is to
put the tool's files in that site's static folder. The site's own deploy then
ships it, and it gets the same domain, HTTPS and analytics with no extra
service.

1. Build the tool into the site's static folder:

   ```sh
   cd tool
   npm ci
   BASE=/php8-check/ OUT_DIR=/path/to/site/public/php8-check VITE_GA_ID=G-XXXXXXXXXX npm run build
   ```

   (On Windows PowerShell: `$env:BASE='/php8-check/'; $env:OUT_DIR='...'; npm run build`.)

2. Deploy the site the way you normally do.

3. Open `https://your-domain/php8-check/` and press **Load a legacy example**.
   A report should appear within a second or two.

## Option 3: a separate Cloudflare Pages project behind a path

Cloudflare Pages gives each project its own domain (`*.pages.dev`, or a custom
domain or subdomain such as `tools.example.com`). It can't be attached to a
path like `example.com/php8-check/` on its own. To get a path anyway:

1. **Create the Pages project.** In the Cloudflare dashboard go to
   **Workers & Pages > Create > Pages > Connect to Git**, pick this repo, and set:
   - Root directory: `tool`
   - Build command: `npm ci && npm run build`
   - Build output directory: `dist`
   - Environment variables: `BASE=/php8-check/`, and `VITE_GA_ID` if you want analytics.
2. **Deploy** and note the address, for example `php8-check.pages.dev`.
   The files are built for `/php8-check/`, so they expect to sit under that path.
3. **Add a Worker route** on your domain that forwards the path to Pages.
   Create a Worker with this code and add the route `example.com/php8-check/*`:

   ```js
   export default {
     async fetch(request) {
       const url = new URL(request.url);
       url.hostname = 'php8-check.pages.dev';
       url.pathname = url.pathname.replace(/^\/php8-check/, '') || '/';
       return fetch(new Request(url, request));
     },
   };
   ```

   Because `BASE` is `/php8-check/`, the browser keeps asking for
   `/php8-check/assets/...`, and the Worker maps those to the Pages project.
4. Open `https://example.com/php8-check/` and check the legacy example loads.

Option 2 is less to maintain. Option 3 is useful when the main site isn't a
static build you control.

## Privacy notes for whoever deploys it

- Pasted and dropped code is analysed in the browser (a Web Worker) and never sent anywhere.
- The Composer check calls `https://packagist.org/packages/<vendor>/<name>.json`
  from the browser, so Packagist sees the package names and the visitor's IP.
  That endpoint sends `Access-Control-Allow-Origin: *`. The newer
  `repo.packagist.org/p2/...` endpoint does not (checked 2026-11-01), so the
  tool doesn't use it.
- With `VITE_GA_ID` set, these Google Analytics events are sent, with counts
  and choices only: `php8_scan` (source, target, number of files, counts per
  severity, effort band, number of rules hit, scan time), `php8_target`,
  `php8_sample_load`, `php8_composer` (number of packages, blocked, unknown),
  `php8_export` (md or json), `php8_copy_summary` and `php8_outbound`.
  No code, file names or package names are sent. If you change this, update
  the privacy line on the page too.
