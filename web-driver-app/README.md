# A5 Control

A browser-based WebHID driver for the first-generation MCHOSE A5 Pro Max.

## Supported hardware

- Wired mouse: `VID 2023 / PID F019`
- 1K receiver: `VID 2023 / PID F013`
- 4K receiver: `VID 2023 / PID F015`
- Vendor configuration interface: `MI_02`, usage page `FFFF`, 64-byte feature reports

## Features

- Three onboard profiles
- Six DPI stages from 50–26,000 DPI, including stage colors and active-stage selection
- 125 / 250 / 500 / 1000 Hz report rate, following the original model matrix
- Debounce, lift-off distance, sleep timer, Motion Sync, ripple control, and angle snapping
- Six-button remapping with a protected primary click
- Battery, charging state, mouse firmware, and receiver firmware reads
- Automatic reconnection to previously approved devices

Firmware flashing is intentionally not exposed through the browser. Use the supplied MCHOSE desktop updater for firmware updates.

## Run locally

Use a recent desktop version of Chrome or Edge. WebHID requires HTTPS or localhost.

```sh
npm install
npm run dev
```

The app is built with vinext for Cloudflare Workers-compatible deployment.
