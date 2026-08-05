export const MCHOSE_VENDOR_ID = 0x2023;

export const SUPPORTED_PRODUCTS = {
  0xf019: { name: "MCHOSE A5 Pro Max", transport: "Wired" },
  0xf013: { name: "MCHOSE 1K Receiver", transport: "2.4G · 1K receiver" },
  0xf015: { name: "MCHOSE 4K Receiver", transport: "2.4G · 4K receiver" },
} as const;

export type ProductId = keyof typeof SUPPORTED_PRODUCTS;

export type HidReportInfo = { reportId: number };
export type HidCollectionInfo = {
  usagePage: number;
  usage: number;
  featureReports?: HidReportInfo[];
  children?: HidCollectionInfo[];
};

export interface A5HIDDevice extends EventTarget {
  opened: boolean;
  vendorId: number;
  productId: number;
  productName: string;
  collections: HidCollectionInfo[];
  open(): Promise<void>;
  close(): Promise<void>;
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>;
  receiveFeatureReport(reportId: number): Promise<DataView>;
}

type HidApi = EventTarget & {
  getDevices(): Promise<A5HIDDevice[]>;
  requestDevice(options: {
    filters: Array<{
      vendorId: number;
      productId: number;
      usagePage?: number;
      usage?: number;
    }>;
  }): Promise<A5HIDDevice[]>;
};

export type NavigatorWithHid = Navigator & { hid?: HidApi };

export type DeviceSnapshot = {
  firmware: string;
  dongleFirmware: string | null;
  battery: number;
  charging: boolean;
  profile: number;
  pollingRate: number;
  sleepSeconds: number;
  debounceMs: number;
  liftOffDistance: number;
  angleSnap: boolean;
  rippleControl: boolean;
  motionSync: boolean;
  activeDpiStage: number;
  dpiStages: number[];
  dpiColors: string[];
  buttons: ButtonAssignment[];
};

export type ButtonAssignment = {
  buttonId: number;
  functionId: number;
  data: number[];
  key: ButtonActionKey;
};

export type ButtonActionKey = keyof typeof BUTTON_ACTIONS;

export const BUTTONS = [
  { id: 1, label: "Left click", short: "L" },
  { id: 2, label: "Right click", short: "R" },
  { id: 3, label: "Middle click", short: "M" },
  { id: 4, label: "Back", short: "B" },
  { id: 5, label: "Forward", short: "F" },
  { id: 20, label: "DPI button", short: "D" },
] as const;

export const BUTTON_ACTIONS = {
  disabled: { label: "Disabled", functionId: 0, data: [] },
  left: { label: "Left click", functionId: 1, data: [1] },
  right: { label: "Right click", functionId: 1, data: [2] },
  middle: { label: "Middle click", functionId: 1, data: [3] },
  back: { label: "Back", functionId: 1, data: [4] },
  forward: { label: "Forward", functionId: 1, data: [5] },
  scrollUp: { label: "Scroll up", functionId: 1, data: [16] },
  scrollDown: { label: "Scroll down", functionId: 1, data: [17] },
  dpiCycleUp: { label: "DPI cycle up", functionId: 7, data: [6] },
  dpiCycleDown: { label: "DPI cycle down", functionId: 7, data: [7] },
  doubleClick: { label: "Double click", functionId: 2, data: [1, 1, 2, 0, 100] },
  playPause: { label: "Play / pause", functionId: 5, data: [0, 205] },
  volumeUp: { label: "Volume up", functionId: 5, data: [0, 233] },
  volumeDown: { label: "Volume down", functionId: 5, data: [0, 234] },
  mute: { label: "Mute", functionId: 5, data: [0, 226] },
} as const;

const POLLING_CODES = new Map([
  [125, 0x08],
  [250, 0x04],
  [500, 0x02],
  [1000, 0x01],
]);

const POLLING_VALUES = new Map(Array.from(POLLING_CODES, ([rate, code]) => [code, rate]));
const DEFAULT_DPI = [400, 800, 1600, 3200, 6400, 12000];
const DEFAULT_COLORS = ["#ff3b30", "#3478f6", "#36d16f", "#f14cff", "#f3d43b", "#ffffff"];

function flattenCollections(collections: HidCollectionInfo[]): HidCollectionInfo[] {
  return collections.flatMap((collection) => [
    collection,
    ...flattenCollections(collection.children ?? []),
  ]);
}

function hasVendorFeatureCollection(device: A5HIDDevice) {
  return flattenCollections(device.collections).some(
    (collection) => collection.usagePage >= 0xff00 && (collection.featureReports?.length ?? 0) > 0,
  );
}

const CONNECTION_PRIORITY: Record<number, number> = {
  0xf019: 0,
  0xf015: 1,
  0xf013: 2,
};

export function isSupportedDevice(device: A5HIDDevice) {
  return (
    device.vendorId === MCHOSE_VENDOR_ID &&
    Object.prototype.hasOwnProperty.call(SUPPORTED_PRODUCTS, device.productId)
  );
}

export function getReportId(device: A5HIDDevice) {
  const reports = flattenCollections(device.collections)
    .filter((collection) => collection.usagePage >= 0xff00)
    .flatMap((collection) => collection.featureReports ?? []);
  return reports[0]?.reportId ?? 0;
}

export function getCollectionLabel(device: A5HIDDevice) {
  const collection = flattenCollections(device.collections).find(
    (entry) => entry.usagePage >= 0xff00 && (entry.featureReports?.length ?? 0) > 0,
  );
  if (!collection) return "Vendor HID · 64-byte feature report";
  return `Usage ${hex(collection.usagePage, 4)}:${hex(collection.usage, 2)} · report ${getReportId(device)}`;
}

export function productInfo(device: A5HIDDevice) {
  return SUPPORTED_PRODUCTS[device.productId as ProductId] ?? {
    name: device.productName || "MCHOSE A5",
    transport: "USB HID",
  };
}

export function getDeviceKey(device: A5HIDDevice) {
  return `${device.vendorId.toString(16)}:${device.productId.toString(16)}:${getReportId(device)}`;
}

export function sortA5Devices(devices: A5HIDDevice[]) {
  const unique = Array.from(new Set(devices)).filter(isSupportedDevice);
  return unique.sort((left, right) => {
    const featureDifference = Number(!hasVendorFeatureCollection(left)) - Number(!hasVendorFeatureCollection(right));
    if (featureDifference !== 0) return featureDifference;
    return (CONNECTION_PRIORITY[left.productId] ?? 99) - (CONNECTION_PRIORITY[right.productId] ?? 99);
  });
}

export function choosePreferredA5Device(devices: A5HIDDevice[]) {
  return sortA5Devices(devices)[0] ?? null;
}

export async function requestA5Device(hid: HidApi) {
  const filters = (Object.keys(SUPPORTED_PRODUCTS) as unknown as ProductId[]).map((productId) => ({
    vendorId: MCHOSE_VENDOR_ID,
    productId: Number(productId),
    usagePage: 0xffff,
  }));
  const selected = await hid.requestDevice({ filters });
  return choosePreferredA5Device([...selected, ...(await hid.getDevices())]);
}

export async function findGrantedA5Devices(hid: HidApi) {
  return sortA5Devices(await hid.getDevices());
}

export async function findGrantedA5Device(hid: HidApi) {
  return choosePreferredA5Device(await findGrantedA5Devices(hid));
}

function hex(value: number, width = 2) {
  return `0x${value.toString(16).toUpperCase().padStart(width, "0")}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class A5Protocol {
  readonly reportId: number;

  constructor(readonly device: A5HIDDevice) {
    this.reportId = getReportId(device);
  }

  async open() {
    if (!this.device.opened) await this.device.open();
  }

  private async receive() {
    const view = await this.device.receiveFeatureReport(this.reportId);
    const bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    return bytes.length === 65 && bytes[0] === this.reportId ? bytes.slice(1) : bytes;
  }

  private async command(
    length: number,
    page: number,
    command: number,
    data: number[] = [],
    route = 2,
  ) {
    const payload = new Uint8Array(64);
    payload[2] = route;
    payload[3] = length;
    payload[4] = page;
    payload[5] = command;
    payload.set(data.slice(0, 57), 6);

    await this.device.sendFeatureReport(this.reportId, payload);
    await sleep(34);

    let response: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      response = await this.receive();
      if (response[0] === 0xa1 && response[4] === page && response[5] === command) {
        return response;
      }
      if (attempt === 3) await this.device.sendFeatureReport(this.reportId, payload);
      await sleep(30);
    }

    throw new Error(
      `The mouse did not acknowledge page ${hex(page)} command ${hex(command)}. Keep it awake and try again.`,
    );
  }

  async getFirmwareVersion(route = 2) {
    const response = await this.command(16, 0, 0x81, [], route);
    return [response[6], response[7], response[8], response[9]]
      .map((part) => String(part ?? 0).padStart(2, "0"))
      .join(".");
  }

  async getBattery() {
    const response = await this.command(2, 0, 0x83);
    return { charging: response[6] > 0, battery: Math.min(100, response[7] ?? 0) };
  }

  async getProfile() {
    return (await this.command(1, 0, 0x85))[6] || 1;
  }

  async setProfile(profile: number) {
    await this.command(1, 0, 0x05, [profile]);
  }

  async getSleepSeconds() {
    const response = await this.command(2, 0, 0x87);
    return ((response[6] ?? 0) << 8) | (response[7] ?? 0);
  }

  async setSleepSeconds(seconds: number) {
    const value = Math.max(0, Math.min(0xffff, seconds));
    await this.command(2, 0, 0x07, [(value >> 8) & 0xff, value & 0xff]);
  }

  async getDebounce(profile: number) {
    return (await this.command(2, 0, 0x88, [profile]))[7] ?? 0;
  }

  async setDebounce(profile: number, value: number) {
    await this.command(2, 0, 0x08, [profile, Math.max(0, Math.min(15, value))]);
  }

  async getLiftOffDistance() {
    return (await this.command(1, 1, 0x88))[6] || 1;
  }

  async setLiftOffDistance(value: number) {
    await this.command(1, 1, 0x08, [value === 2 ? 2 : 1]);
  }

  async getPollingRate() {
    const code = (await this.command(1, 1, 0x80))[6];
    return POLLING_VALUES.get(code) ?? 1000;
  }

  async setPollingRate(rate: number) {
    const code = POLLING_CODES.get(rate);
    if (!code) throw new Error("Unsupported polling rate for this first-generation A5 Pro Max.");
    await this.command(1, 1, 0x00, [code]);
  }

  async getSensorToggle(command: number) {
    return (await this.command(1, 1, command))[6] > 0;
  }

  async setSensorToggle(command: number, enabled: boolean) {
    await this.command(1, 1, command, [enabled ? 1 : 0]);
  }

  async getDpi(profile: number) {
    const stageResponse = await this.command(10, 1, 0x81, [profile, 6]);
    const activeResponse = await this.command(2, 1, 0x82, [profile]);
    const count = Math.max(1, Math.min(6, stageResponse[7] || 6));
    const stages = Array.from({ length: count }, (_, index) => {
      const offset = 8 + index * 4;
      return ((stageResponse[offset] ?? 0) << 8) | (stageResponse[offset + 1] ?? 0);
    }).filter((value) => value >= 50);
    return {
      activeStage: Math.max(1, Math.min(count, activeResponse[7] || 1)),
      stages: stages.length ? stages : DEFAULT_DPI,
    };
  }

  async setDpi(profile: number, stages: number[], activeStage: number) {
    const normalized = stages.slice(0, 6).map((value) =>
      Math.max(50, Math.min(26000, Math.round(value / 50) * 50)),
    );
    const data = [profile, normalized.length];
    for (const dpi of normalized) data.push((dpi >> 8) & 0xff, dpi & 0xff, (dpi >> 8) & 0xff, dpi & 0xff);
    await this.command(2 + normalized.length * 4, 1, 0x01, data);
    await this.command(2, 1, 0x02, [profile, Math.max(1, Math.min(normalized.length, activeStage))]);
  }

  async getDpiColors(profile: number) {
    const response = await this.command(19, 2, 0x81, [profile]);
    return Array.from({ length: 6 }, (_, index) => {
      const offset = 7 + index * 3;
      return `#${[response[offset], response[offset + 1], response[offset + 2]]
        .map((part) => (part ?? 0).toString(16).padStart(2, "0"))
        .join("")}`;
    });
  }

  async setDpiColors(profile: number, colors: string[]) {
    const bytes = colors.slice(0, 6).flatMap((color) => {
      const clean = color.replace("#", "").padEnd(6, "0");
      return [0, 2, 4].map((offset) => Number.parseInt(clean.slice(offset, offset + 2), 16) || 0);
    });
    await this.command(19, 2, 0x01, [profile, ...bytes]);
  }

  async getButton(profile: number, buttonId: number): Promise<ButtonAssignment> {
    const response = await this.command(15, 3, 0x80, [profile, buttonId, 0, 0xff, 10, ...Array(10).fill(0)]);
    const functionId = response[9] ?? 0;
    const size = Math.min(10, response[10] ?? 0);
    const data = Array.from(response.slice(11, 11 + size));
    return { buttonId, functionId, data, key: identifyButtonAction(functionId, data) };
  }

  async setButton(profile: number, buttonId: number, action: ButtonActionKey) {
    const definition = BUTTON_ACTIONS[action];
    await this.command(5 + definition.data.length, 3, 0x00, [
      profile,
      buttonId,
      0,
      definition.functionId,
      definition.data.length,
      ...definition.data,
    ]);
  }

  async readSnapshot(profileOverride?: number): Promise<DeviceSnapshot> {
    const firmware = await this.getFirmwareVersion();
    const dongleFirmware = this.device.productId === 0xf019 ? null : await this.getFirmwareVersion(0);
    const { battery, charging } = await this.getBattery();
    const profile = profileOverride ?? (await this.getProfile());
    const dpi = await this.getDpi(profile);
    const dpiColors = await this.getDpiColors(profile).catch(() => DEFAULT_COLORS);
    const buttons: ButtonAssignment[] = [];
    for (const button of BUTTONS) buttons.push(await this.getButton(profile, button.id));
    return {
      firmware,
      dongleFirmware,
      battery,
      charging,
      profile,
      pollingRate: await this.getPollingRate(),
      sleepSeconds: await this.getSleepSeconds(),
      debounceMs: await this.getDebounce(profile),
      liftOffDistance: await this.getLiftOffDistance(),
      angleSnap: await this.getSensorToggle(0x84),
      rippleControl: await this.getSensorToggle(0x8a),
      motionSync: await this.getSensorToggle(0x89),
      activeDpiStage: dpi.activeStage,
      dpiStages: dpi.stages,
      dpiColors,
      buttons,
    };
  }
}

function identifyButtonAction(functionId: number, data: number[]): ButtonActionKey {
  const match = (Object.entries(BUTTON_ACTIONS) as Array<[ButtonActionKey, (typeof BUTTON_ACTIONS)[ButtonActionKey]]>)
    .find(([, action]) =>
      action.functionId === functionId &&
      action.data.length === data.length &&
      action.data.every((value, index) => value === data[index]),
    );
  return match?.[0] ?? "disabled";
}
