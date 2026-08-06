import type { MouseModelDefinition } from "./types";

export const A5_PRO_MAX_CONNECTIONS = {
  0xf019: {
    productId: 0xf019,
    name: "MCHOSE A5 Pro Max",
    transport: "Wired",
    kind: "wired",
    priority: 0,
    usagePage: 0xffff,
  },
  0xf013: {
    productId: 0xf013,
    name: "MCHOSE 1K Receiver",
    transport: "2.4G · 1K receiver",
    kind: "receiver",
    priority: 2,
    usagePage: 0xffff,
  },
  0xf015: {
    productId: 0xf015,
    name: "MCHOSE 4K Receiver",
    transport: "2.4G · 4K receiver",
    kind: "receiver",
    priority: 1,
    usagePage: 0xffff,
  },
} as const;

export const A5_PRO_MAX_MODEL: MouseModelDefinition = {
  id: "a5-pro-max-gen-1",
  manufacturer: "MCHOSE",
  name: "MCHOSE A5 Pro Max",
  shortName: "A5",
  generation: "gen 1",
  vendorId: 0x2023,
  protocolLabel: "XVI · 64B FEATURE",
  firmwarePackage: "01.00.15.00",
  artwork: {
    src: "a5-mouse.png",
    alt: "Black MCHOSE A5 Pro Max viewed from above",
  },
  hero: {
    eyebrow: "FIRST-GENERATION HARDWARE",
    titleLines: ["MCHOSE A5", "PRO MAX"],
    description:
      "Configure performance directly in the browser. Changes write to the mouse's onboard memory—no background software.",
    sensor: "PAW3395",
    weight: "58 G",
  },
  capabilities: {
    profiles: 3,
    maxDpi: 26000,
    dpiStep: 50,
    maxDpiStages: 6,
    pollingRates: [125, 250, 500, 1000],
    wiredUnsupportedPollingRates: [250],
    dpiLighting: {
      effects: [
        { id: 5, label: "Solid", speedEnabled: false },
        { id: 4, label: "Breathing", speedEnabled: true },
        { id: 0, label: "Off", speedEnabled: false },
      ],
      minSpeed: 0,
      maxSpeed: 255,
      movementControl: true,
    },
    receiverPairing: {
      timeoutMs: 30_000,
    },
    profileReset: true,
  },
  connections: Object.values(A5_PRO_MAX_CONNECTIONS),
};
