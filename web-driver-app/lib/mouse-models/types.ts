export type MouseConnectionKind = "wired" | "receiver";

export type MouseConnectionDefinition = {
  productId: number;
  name: string;
  transport: string;
  kind: MouseConnectionKind;
  priority: number;
  usagePage: number;
};

export type MouseModelDefinition = {
  id: string;
  manufacturer: "MCHOSE";
  name: string;
  shortName: string;
  generation: string;
  vendorId: number;
  protocolLabel: string;
  firmwarePackage: string;
  artwork: {
    src: string;
    alt: string;
  };
  hero: {
    eyebrow: string;
    titleLines: readonly string[];
    description: string;
    sensor: string;
    weight: string;
  };
  capabilities: {
    profiles: number;
    maxDpi: number;
    dpiStep: number;
    maxDpiStages: number;
    pollingRates: readonly number[];
    wiredUnsupportedPollingRates: readonly number[];
  };
  connections: readonly MouseConnectionDefinition[];
};
