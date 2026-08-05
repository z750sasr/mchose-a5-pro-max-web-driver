/**
 * Edit this object to change the hardware-information section shown above the driver.
 * Keeping the copy here means you can update the introduction without touching the UI.
 */
export const HARDWARE_INTRO = {
  eyebrow: "Hardware notes",
  title: "First-generation MCHOSE A5 Pro Max",
  description:
    "Add your hardware notes here—for example, how to identify this revision, receiver compatibility, known quirks, or setup guidance for other owners.",
  facts: [
    { label: "Mouse", value: "VID 2023 · PID F019" },
    { label: "1K receiver", value: "VID 2023 · PID F013" },
    { label: "4K receiver", value: "VID 2023 · PID F015" },
  ],
} as const;
