# WebHID protocol notes

These notes document the protocol implemented in `web-driver-app/lib/a5-protocol.ts`. They are intended for maintenance and compatibility research, not as an official MCHOSE specification.

## Transport

- Vendor ID: `2023`
- Supported product IDs: `F019`, `F013`, and `F015`
- Preferred usage page: `FFFF`
- Transfer type: 64-byte HID feature reports
- Report ID: discovered from the selected vendor collection; falls back to `0`

The driver filters for the vendor interface, opens it, sends a feature report, then polls for a response. A valid response begins with `A1` and echoes the requested page and command in bytes 4 and 5. The request is retried once during the bounded response loop.

## Request frame

| Offset | Meaning |
| --- | --- |
| 0–1 | Reserved/zero |
| 2 | Route (`2` for mouse, `1` for pairing control, `0` for receiver-local operations) |
| 3 | Payload length |
| 4 | Command page |
| 5 | Command |
| 6–62 | Command data, up to 57 bytes |
| 63 | Reserved/zero |

## Implemented command groups

| Page | Functions |
| --- | --- |
| `00` | Firmware, battery, profile, sleep, debounce, profile reset, receiver pairing |
| `01` | DPI stages, active stage, polling rate, lift-off distance, sensor toggles |
| `02` | DPI colors and DPI LED behavior |
| `03` | Button mappings |

The implementation clamps values before writing: DPI to 50–26,000 in 50-DPI steps, debounce to 0–15 ms, six DPI stages maximum, and lift-off distance to 1 or 2 mm.

## Polling-rate values

| Rate | Device code |
| --- | --- |
| 125 Hz | `08` |
| 250 Hz | `04` |
| 500 Hz | `02` |
| 1000 Hz | `01` |

The interface disables 250 Hz for the wired `F019` identity to match the observed original-driver matrix.

## DPI LED commands

| Operation | Route/page/command | Normalized data from offset 6 |
| --- | --- | --- |
| Read effect | `2 / 02 / 80` | `[profile, 0, 0, 0, 0]` |
| Set effect | `2 / 02 / 00` | `[profile, FF, effect, 0, speed]` |
| Read brightness | `2 / 02 / 82` | `[profile, connectionMode, 0]` |
| Set brightness | `2 / 02 / 02` | `[profile, connectionMode, value]` |
| Read movement behavior | `2 / 02 / 83` | no meaningful request data |
| Set movement behavior | `2 / 02 / 03` | `[enabled]` |

`connectionMode` is `1` for wired and `0` for a receiver. Brightness is stored as `0–255` and presented by the UI as `0–100%`. The first-generation A5 resources expose effect ID `05` (solid), `04` (breathing), and `00` (off). DPI-stage colors continue to use page `02`, command `01`/`81`.

## Receiver pairing

Pairing is receiver-local on route `1`:

- command `0C`, one-byte data `01` starts pairing;
- command `8C` returns the status byte at response offset 6;
- status `02` means success and `03` means failure;
- command `0C`, data `00` stops or cancels pairing.

The web driver polls every 500 ms for up to 30 seconds and always sends the stop command when it finishes. Pairing is never started automatically.

## Default settings

Route `2`, page `00`, command `0D`, data `[profile]` restores the selected onboard profile. The UI requires explicit confirmation and reloads the profile after the device acknowledges the command. It does not silently reset the other two profiles.

## Write boundaries

The browser driver writes profile selection/reset, sleep time, debounce, lift-off distance, polling rate, sensor toggles, DPI stages/colors/lighting, receiver pairing state, and verified button assignments. It does not expose macro storage, firmware erase/write, bootloader entry, or recovery commands.

See [Stock-driver macro and key-binding findings](MACROS.md) for the evidence that stock macros are stored onboard and why macro uploads remain disabled pending physical validation.

When adding support for another identity, verify collection layout, report ID behavior, command acknowledgements, safe ranges, and read-after-write behavior on physical hardware before including it in `SUPPORTED_PRODUCTS`.
