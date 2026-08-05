# Adding another MCHOSE mouse

The web driver is organized around two separate pieces:

1. A **model definition** describes the mouse, USB identities, artwork, connection priority, and UI capability limits.
2. A **protocol adapter** contains only the verified HID commands for that hardware family.

Keeping these separate prevents a new product ID from accidentally using A5 commands that may be unsafe or incompatible.

## Current structure

| Location | Responsibility |
| --- | --- |
| `web-driver-app/lib/mouse-models/types.ts` | Shared model and connection types |
| `web-driver-app/lib/mouse-models/a5-pro-max.ts` | First-generation A5 Pro Max definition |
| `web-driver-app/lib/mouse-models/registry.ts` | Models that the application knows about |
| `web-driver-app/lib/a5-protocol.ts` | A5-specific WebHID discovery and command adapter |
| `web-driver-app/components/driver/` | Reusable product UI sections |
| `web-driver-app/app/page.tsx` | Device-session controller that joins the active model and protocol |

## Checklist for a new model

### 1. Capture and verify the hardware identities

Record every supported connection separately:

- USB vendor ID and product ID
- wired mouse, 1K receiver, 4K receiver, or other receiver type
- vendor HID usage page and usage
- feature report ID and report length
- which connection should be preferred when several are present

Do not assume that two mice with the same vendor ID share a command protocol.

### 2. Add a model definition

Copy `web-driver-app/lib/mouse-models/a5-pro-max.ts` to a clearly named file such as `m7-pro.ts`. Give the new model a stable `id` and update:

- product name, short name, and generation
- every USB connection identity
- connection kind and priority
- hero copy, sensor, weight, and artwork path
- profile count, DPI limits, stage count, and polling rates
- firmware package label

Add the new definition to `MOUSE_MODEL_REGISTRY` in `web-driver-app/lib/mouse-models/registry.ts` only after its protocol adapter is usable.

### 3. Create a protocol adapter

Create a separate file under `web-driver-app/lib/` for the new hardware family. It should own:

- WebHID filters and granted-device discovery
- supported-device checks and connection ordering
- report selection and packet encoding
- read/write methods for each supported setting
- conservative defaults and response validation

Use `a5-protocol.ts` as the shape reference, but verify every command against captures, the vendor driver, or physical hardware. Never route an unknown product through `A5Protocol` just because the packet size looks similar.

### 4. Connect the model and adapter

The controller in `web-driver-app/app/page.tsx` currently selects `DEFAULT_MOUSE_MODEL` and `A5Protocol`. When the second verified adapter is added:

1. Introduce a driver-module registry that pairs each model definition with its protocol factory and discovery functions.
2. Select the module from the device's vendor/product identity.
3. Show the model selector only when more than one registered module exists.
4. Keep approved devices grouped by model so a receiver from one model is never treated as another model's fallback.

The reusable components already receive a `MouseModelDefinition`, so the visual interface and capability controls do not need to be duplicated.

### 5. Add artwork and editable copy

Put transparent mouse artwork in `web-driver-app/public/` and reference the filename in the model definition. If the project-level hardware notes need model-specific text, add another content object beside `web-driver-app/lib/hardware-content.ts`.

### 6. Test all connection states

At minimum, verify:

- wired only
- each receiver only
- wired and receiver connected together
- disconnecting the active wired connection while a receiver remains
- reconnecting an already-approved device without opening the picker again
- first-time permission behavior
- every setting read, write, and read-back
- invalid or sleeping-device responses

Then run from `web-driver-app`:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run build:pages
node --test tests/rendered-html.test.mjs
```

## Safety boundary

The browser app should continue to read firmware versions but should not flash firmware unless a future implementation has a verified recovery path. Keep desktop vendor updaters and their firmware packages documented separately.
