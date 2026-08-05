# Hardware notes

## Supported identities

The driver accepts vendor ID `2023` and these first-generation A5 product IDs:

- `F019`: A5 Pro Max over a wired USB connection
- `F013`: 1K wireless receiver
- `F015`: 4K wireless receiver

The selectable WebHID interface is the vendor configuration collection on usage page `FFFF`. Ordinary mouse-input collections are not used for configuration.

## Editing the page introduction

The hardware-information block at the top of the page is populated from `web-driver-app/lib/hardware-content.ts`.

Edit `HARDWARE_INTRO` to add information such as:

- Visual cues that distinguish this revision from later A5 revisions
- PCB, sensor, switch, shell, or battery details
- Receiver pairing or compatibility notes
- Known firmware quirks
- Links or acknowledgements for hardware research

Keep each fact label short so the three fact cards remain easy to scan. Longer information belongs in `description`.

## Firmware safety

The web driver can read version numbers but does not erase or flash firmware. Use the supplied MCHOSE desktop updater for firmware changes and recovery. Do not unplug the mouse or receiver while that updater is running.

## Compatibility caution

Product names alone are not sufficient evidence that a later revision uses the same protocol. Add a new product ID only after confirming its report layout and commands against captures or a known-good vendor driver.
