import { A5_PRO_MAX_MODEL } from "./a5-pro-max";
import type { MouseModelDefinition } from "./types";

/**
 * Add future MCHOSE model definitions here after their protocol adapter exists.
 * The first entry remains the default until a model selector is introduced.
 */
export const MOUSE_MODEL_REGISTRY: readonly MouseModelDefinition[] = [A5_PRO_MAX_MODEL];

export const DEFAULT_MOUSE_MODEL = MOUSE_MODEL_REGISTRY[0];

export function findMouseModel(vendorId: number, productId: number) {
  return MOUSE_MODEL_REGISTRY.find(
    (model) => model.vendorId === vendorId && model.connections.some((connection) => connection.productId === productId),
  );
}

export function listWebHidFilters(model: MouseModelDefinition) {
  return model.connections.map((connection) => ({
    vendorId: model.vendorId,
    productId: connection.productId,
    usagePage: connection.usagePage,
  }));
}
