# Stock-driver macro and key-binding findings

This is a clean-room compatibility report based on the supplied MCHOSE desktop driver, its configuration resources, and the additional reverse-engineering material in `G:\mchose-a5-firmware-research`. It is not an official protocol specification.

## Conclusion

The stock driver's macros are **hardware-sided/onboard macros**. The Windows application must be running to record, edit, and upload a macro, but it does not need to remain running for the mouse to play that macro afterward.

The strongest evidence is the stock driver's Apply path:

1. The macro editor records keyboard and mouse events through Windows keyboard/mouse hooks.
2. It serializes every event into a five-byte record.
3. It allocates space in the mouse's macro area and uploads the serialized records through HID page `04`.
4. A button assignment on page `03` stores the macro reference and playback mode for a physical button.

The driver also contains commands to enumerate, download, and delete stored macros. Those operations would not be necessary for a macro engine that depended on background software for playback. The firmware exposes keyboard and consumer-control HID reports, which is consistent with the device playing stored input sequences itself.

## Recovered macro-storage operations

| Page | Command | Observed purpose |
| --- | --- | --- |
| `04` | `81` | Query/enumerate stored macros |
| `04` | `01` | Allocate a macro ID and byte size |
| `04` | `03` | Upload macro data in chunks |
| `04` | `83` | Download stored macro data |
| `04` | `02` | Delete a stored macro |

The stock user interface scans macro IDs `1` through `9`. Reconstructed firmware code suggests the storage format may accept a wider ID range, but the web driver should retain the stock range until physical readback tests prove otherwise.

The desktop UI exposes playback behaviors equivalent to play once/a fixed count, repeat while held, and toggle playback until pressed again. The evidence indicates these modes are executed by the device after upload.

## Why macro editing is not enabled in the web driver yet

The storage lifecycle is understood, but the exact five-byte event encoding and all boundary conditions have not yet been verified on physical hardware. A malformed macro payload could corrupt the macro allocation table or make a button unusable until it is reset.

Before macro uploads are exposed, the implementation should have hardware tests for:

- keyboard, mouse-button, wheel, delay, and modifier event records;
- chunk boundaries and maximum macro size;
- allocation failure and interrupted uploads;
- read-after-write comparison through command `83`;
- deletion and per-profile button-reference cleanup;
- a recovery path using the stock desktop driver.

Existing simple button assignments are safe because they use the already verified page `03` format and stock action definitions.

## Four-button chord to cycle profiles

The requested chord—left click + right click + both side buttons pressed together—cannot be implemented reliably by this website with the stock firmware.

The stock mapping table assigns one action to one physical button. The macro engine can play a sequence after a single assigned-button trigger, but no firmware-side chord detector was found. WebHID also does not give a normal website a dependable system-wide stream of standard mouse clicks, and a tab cannot act as a permanent background input driver.

Two future approaches are technically possible:

- **Custom firmware:** add chord detection and a profile-cycle action inside the mouse. This is the only approach that remains fully onboard, but it requires a verified flash/recovery workflow and careful click suppression so the four constituent clicks do not leak.
- **Resident native helper:** use operating-system input hooks to detect the chord and send the profile command. This must keep running in the background, so it would no longer be a browser-only driver.

Until one of those paths is deliberately developed and tested, the safe answer is: **not with the stock firmware and not from a WebHID page alone**.
