# Hardware notes

## Supported identities

The driver accepts vendor ID `2023` and these first-generation A5 product IDs:

- `F019`: A5 Pro Max over a wired USB connection
- `F013`: 1K wireless receiver
- `F015`: 4K wireless receiver

The selectable WebHID interface is the vendor configuration collection on usage page `FFFF`. Ordinary mouse-input collections are not used for configuration.

## Wired and receiver coexistence

When the wired mouse and an approved receiver are present together, the driver keeps both identities available and chooses the wired `F019` connection first, matching the original software's direct-USB preference. Settings use the wired channel while the receiver's firmware is still read through its own feature channel. The connection selector can switch to the receiver manually. If the active connection is removed, the driver switches to the remaining approved connection automatically.

WebHID permission is attached to a USB identity. The user must approve the wired mouse and each receiver identity once through the browser chooser; a website cannot bypass that first permission prompt. Subsequent physical reconnections are handled automatically through WebHID connection events while permission remains granted.

## Editing the page introduction

The hardware-information block at the top of the page is populated from `web-driver-app/lib/hardware-content.ts`.

Edit `HARDWARE_INTRO` to add information such as:

- Visual cues that distinguish this revision from later A5 revisions
- PCB, sensor, switch, shell, or battery details
- Receiver pairing or compatibility notes
- Known firmware quirks
- Links or acknowledgements for hardware research

Keep each fact label short so the three fact cards remain easy to scan. Longer information belongs in `description`.

Edit `web-driver-app/lib/about-content.ts` to personalize the separate About me section.

## Firmware safety

The web driver can read version numbers but does not erase or flash firmware. Use the supplied MCHOSE desktop updater for firmware changes and recovery. Do not unplug the mouse or receiver while that updater is running.

## Compatibility caution

Product names alone are not sufficient evidence that a later revision uses the same protocol. Add a new product ID only after confirming its report layout and commands against captures or a known-good vendor driver.
