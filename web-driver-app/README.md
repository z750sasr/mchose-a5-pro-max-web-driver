# A5 Control web app

This directory contains the React WebHID interface and both supported build targets:

- `npm run dev` / `npm run build`: vinext build used by the hosted preview
- `npm run build:pages`: static Vite build for GitHub Pages
- `npm run preview:pages`: local preview of the static GitHub Pages output
- `npm run lint`: source linting
- `npm run typecheck`: type-check the app and GitHub Pages entry point
- `npm test`: vinext build plus rendered HTML tests

## Main files

- `app/page.tsx` — interface and device interactions
- `app/globals.css` — EPOMAKER-style charcoal/mint visual system
- `lib/a5-protocol.ts` — WebHID device selection and protocol implementation
- `lib/hardware-content.ts` — editable top-of-page hardware introduction
- `github/` and `vite.github.config.ts` — static GitHub Pages entry point
- `public/` — mouse and social-preview artwork

## Browser requirements

Use desktop Chrome or Edge over HTTPS or localhost. Firefox and Safari do not currently expose WebHID. The browser will ask the user to select a compatible HID interface; access is never automatic on first use.

For project-wide setup, deployment, protocol notes, and safety information, read the [repository documentation](../README.md).
