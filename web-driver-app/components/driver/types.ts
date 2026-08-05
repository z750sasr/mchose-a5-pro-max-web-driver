export type DriverTab = "performance" | "buttons" | "device" | "about";

export type DriverToast = {
  id: number;
  kind: "success" | "error";
  message: string;
};

export const DRIVER_NAV_ITEMS: ReadonlyArray<{
  id: DriverTab;
  index: string;
  label: string;
  note: string;
}> = [
  { id: "performance", index: "01", label: "Performance", note: "DPI & sensor" },
  { id: "buttons", index: "02", label: "Buttons", note: "6 assignments" },
  { id: "device", index: "03", label: "Device", note: "Firmware & HID" },
  { id: "about", index: "04", label: "About me", note: "Project & author" },
];
