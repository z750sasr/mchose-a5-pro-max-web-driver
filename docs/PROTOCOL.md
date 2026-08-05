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
| 2 | Route (`2` for mouse, `0` for receiver firmware reads) |
| 3 | Payload length |
| 4 | Command page |
| 5 | Command |
| 6–62 | Command data, up to 57 bytes |
| 63 | Reserved/zero |

## Implemented command groups

| Page | Functions |
| --- | --- |
| `00` | Firmware, battery, profile, sleep, debounce |
| `01` | DPI stages, active stage, polling rate, lift-off distance, sensor toggles |
| `02` | DPI colors |
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

## Write boundaries

The browser driver writes only profile selection, sleep time, debounce, lift-off distance, polling rate, sensor toggles, DPI stages/colors, and button assignments. It does not expose pairing, firmware erase/write, bootloader entry, or recovery commands.

When adding support for another identity, verify collection layout, report ID behavior, command acknowledgements, safe ranges, and read-after-write behavior on physical hardware before including it in `SUPPORTED_PRODUCTS`.
