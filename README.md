# A5 Control

A browser-only WebHID driver for the **first-generation MCHOSE A5 Pro Max**. It reads and writes the mouse's onboard settings directly from desktop Chrome or Edge, without installing a background driver or uploading device data.

The interface uses the same charcoal, mint, mono-label, rounded-panel design language as the EPOMAKER HE30 web driver.

## Supported hardware

| Connection | USB identity | Notes |
| --- | --- | --- |
| Wired mouse | `2023:F019` | Direct USB connection |
| 1K receiver | `2023:F013` | 2.4 GHz receiver |
| 4K receiver | `2023:F015` | 2.4 GHz receiver |

The app selects the vendor configuration collection on usage page `FFFF` and communicates with 64-byte HID feature reports.

## Features

- Three onboard profiles
- Up to six DPI stages, stage colors, and active-stage selection
- 125, 250, 500, and 1000 Hz report rates, subject to connection support
- Debounce, lift-off distance, sleep timer, Motion Sync, ripple control, and angle snapping
- Six button assignments with primary-click protection
- Battery, charging state, mouse firmware, and receiver firmware reads
- Automatic reconnection to a device that the browser has already approved

Firmware flashing is deliberately excluded. Use the supplied MCHOSE desktop updater for firmware and recovery operations.

## Edit the hardware information at the top

The introductory hardware block is intentionally separated from the interface code. Edit:

[`web-driver-app/lib/hardware-content.ts`](web-driver-app/lib/hardware-content.ts)

Change the title, description, or facts in `HARDWARE_INTRO`; the top section updates automatically. See [Hardware notes](docs/HARDWARE.md) for examples and guidance.

## Run locally

Requirements: Node.js 22.13 or newer and a current desktop version of Chrome or Edge.

```sh
cd web-driver-app
npm ci
npm run dev
```

Open the localhost address shown in the terminal. WebHID only works in a secure context: HTTPS or localhost.

## Deploy with GitHub Pages

The repository includes a static Vite build and a GitHub Actions workflow.

1. Push the repository to GitHub.
2. Open **Settings → Pages** in the repository.
3. Set **Source** to **GitHub Actions**.
4. Push to `main`, or run **Deploy WebHID driver to GitHub Pages** from the Actions tab.

The workflow builds `web-driver-app/github-dist` and publishes it. Repository subpaths and `username.github.io` repositories are both handled automatically. GitHub Pages supplies the HTTPS connection required by WebHID.

To test the same static build locally:

```sh
cd web-driver-app
npm run build:pages
npm run preview:pages
```

## Documentation

- [Hardware support and editable intro](docs/HARDWARE.md)
- [GitHub Pages and other deployment options](docs/DEPLOYMENT.md)
- [WebHID protocol notes](docs/PROTOCOL.md)
- [App-specific development notes](web-driver-app/README.md)

## Safety and privacy

- All HID traffic stays between the browser and the selected USB device.
- The browser requires an explicit device-selection gesture before granting access.
- The app writes only the settings exposed by the interface.
- Disconnecting during a settings write can leave that one setting unapplied; reconnect and read the device again.
- Firmware flashing remains in the vendor desktop updater because browser-based recovery is not provided.

This is an independent compatibility project and is not an official MCHOSE product.
