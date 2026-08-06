# A5 Control web app

This directory contains the React WebHID interface and both supported build targets:

- `npm run dev` / `npm run build`: vinext build used by the hosted preview
- `npm run build:pages`: static Vite build for GitHub Pages
- `npm run preview:pages`: local preview of the static GitHub Pages output
- `npm run lint`: source linting
- `npm run typecheck`: type-check the app and GitHub Pages entry point
- `npm test`: vinext build plus rendered HTML tests

## Main files

- `app/page.tsx` — device-session controller and active driver assembly
- `app/globals.css` — EPOMAKER-style charcoal/mint visual system
- `components/driver/` — reusable navigation, hero, settings, device, and About sections
- `lib/mouse-models/` — model definitions, USB identities, capabilities, and registry
- `lib/a5-protocol.ts` — WebHID device selection and protocol implementation
- `public/about-me.html` — blank, independent About me document for custom HTML and inline CSS
- `github/` and `vite.github.config.ts` — static GitHub Pages entry point
- `public/` — mouse artwork, custom About page, sitemap, and crawl metadata

The UI receives its model name, artwork, USB identities, connection ordering, profile count, DPI limits, and polling-rate options from `lib/mouse-models/a5-pro-max.ts`. This keeps product data out of the reusable components and leaves the A5 command implementation isolated in its protocol adapter.

To add another model, follow [Adding another MCHOSE mouse](../docs/ADDING-A-MOUSE.md). A new product needs both a model definition and a hardware-verified protocol adapter; registering a USB ID alone is not sufficient.

The About me tab loads `public/about-me.html` inside an isolated frame. Write ordinary HTML in its `<body>` and put CSS in the existing `<style>` block or directly in `style="..."` attributes. It intentionally contains no visible default profile content.

The public build contains indexable fallback HTML, a canonical URL, structured application data, `sitemap.xml`, and crawl directives. Follow [Google Search visibility](../docs/SEO.md) for the one-time Search Console verification and sitemap submission.

## Browser requirements

Use desktop Chrome or Edge over HTTPS or localhost. Firefox and Safari do not currently expose WebHID. The browser will ask the user to select a compatible HID interface; access is never automatic on first use.

After a USB identity has been approved, the app discovers it with `navigator.hid.getDevices()` and listens for WebHID connect/disconnect events. It automatically restores an approved device, prefers wired when both wired and receiver are available, and falls back to the remaining receiver if the wired connection is removed.

Browsers can return several JavaScript `HIDDevice` objects for one approved USB identity. The connection manager deduplicates them by vendor/product identity, so one dongle is shown as one connection.

The receiver connection is kept open when the wireless mouse is switched off or asleep. In this state the app shows `mouse standby`, disables setting writes, and quietly checks for a response. Moving or waking the mouse triggers a full onboard-information refresh without requiring the Connect button again.

While the mouse is active, the app periodically reads the lightweight onboard active-DPI value. Pressing the physical DPI-cycle button therefore moves the highlighted DPI card without reloading the full settings snapshot.

The Performance section includes model-defined DPI lighting controls. The Device section contains receiver pairing and a confirmed per-profile default restore. Pairing always uses an approved receiver identity, even when the wired mouse remains the preferred settings connection.

The stock macro editor records input on Windows but uploads the resulting event stream to onboard macro storage; playback does not require the desktop driver to remain open. Macro uploads are intentionally withheld until the event encoding has physical readback tests. See [Macro and key-binding findings](../docs/MACROS.md).

For project-wide setup, deployment, protocol notes, and safety information, read the [repository documentation](../README.md).
