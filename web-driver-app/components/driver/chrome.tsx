import { getDeviceKey, productInfo, type A5HIDDevice } from "../../lib/a5-protocol";
import type { MouseModelDefinition } from "../../lib/mouse-models/types";
import { DRIVER_NAV_ITEMS, type DriverTab } from "./types";

type TopBarProps = {
  model: MouseModelDefinition;
  device: A5HIDDevice | null;
  availableDevices: A5HIDDevice[];
  connected: boolean;
  compatibleBrowser: boolean;
  busy: boolean;
  onConnect: () => void;
  onSwitchDevice: (deviceKey: string) => void;
};

export function TopBar({
  model,
  device,
  availableDevices,
  connected,
  compatibleBrowser,
  busy,
  onConnect,
  onSwitchDevice,
}: TopBarProps) {
  const info = device ? productInfo(device) : null;

  return (
    <header className="topbar">
      <a className="brand" href="#hardware-notes" aria-label={`${model.shortName} Control home`}>
        <span className="brand-mark">{model.shortName}</span>
        <span>
          <strong>CONTROL</strong>
          <small>WebHID driver · {model.generation}</small>
        </span>
      </a>
      <div className="topbar-actions">
        {availableDevices.length > 1 && device && (
          <label className="connection-picker">
            <span>Active connection</span>
            <select
              aria-label="Active device connection"
              value={getDeviceKey(device)}
              disabled={busy}
              onChange={(event) => onSwitchDevice(event.target.value)}
            >
              {availableDevices.map((entry) => (
                <option value={getDeviceKey(entry)} key={getDeviceKey(entry)}>
                  {productInfo(entry).transport}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className={`connection-pill ${connected ? "is-connected" : ""}`}>
          <span className="status-dot" />
          <span>{connected ? info?.transport : compatibleBrowser ? "Device offline" : "WebHID unavailable"}</span>
        </div>
        <button className={connected ? "button ghost" : "button primary"} onClick={onConnect} disabled={busy}>
          {connected ? "Add device" : "Connect device"}
        </button>
      </div>
    </header>
  );
}

type HardwareIntroContent = {
  eyebrow: string;
  title: string;
  description: string;
  facts: ReadonlyArray<{ label: string; value: string }>;
};

export function HardwareIntro({ content }: { content: HardwareIntroContent }) {
  return (
    <section className="hardware-intro" id="hardware-notes" aria-labelledby="hardware-intro-title">
      <div className="hardware-intro-label">
        <span className="eyebrow">{content.eyebrow}</span>
        <small>Editable project introduction</small>
      </div>
      <div className="hardware-intro-copy">
        <h2 id="hardware-intro-title">{content.title}</h2>
        <p>{content.description}</p>
      </div>
      <dl className="hardware-facts">
        {content.facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Sidebar({
  model,
  tab,
  onTabChange,
}: {
  model: MouseModelDefinition;
  tab: DriverTab;
  onTabChange: (tab: DriverTab) => void;
}) {
  const primaryConnection = model.connections[0];
  const vendorId = model.vendorId.toString(16).toUpperCase().padStart(4, "0");
  const productId = primaryConnection.productId.toString(16).toUpperCase().padStart(4, "0");

  return (
    <aside className="sidebar" aria-label="Driver sections">
      <nav>
        {DRIVER_NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? "nav-item active" : "nav-item"}
            onClick={() => onTabChange(item.id)}
          >
            <span className="nav-index">{item.index}</span>
            <span className="nav-copy">
              <strong>{item.label}</strong>
              <small>{item.note}</small>
            </span>
            <span className="nav-arrow">↗</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <span>Protocol</span>
        <strong>{model.protocolLabel}</strong>
        <small>VID {vendorId} · PID {productId}</small>
      </div>
    </aside>
  );
}

export function DriverStatus({
  busy,
  busyLabel,
  toasts,
}: {
  busy: boolean;
  busyLabel: string;
  toasts: ReadonlyArray<{ id: number; kind: "success" | "error"; message: string }>;
}) {
  return (
    <>
      {busy && <div className="busy-strip" role="status"><span /><strong>{busyLabel}</strong><small>Keep the mouse awake</small></div>}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => <div className={`toast ${toast.kind}`} key={toast.id}><span>{toast.kind === "success" ? "✓" : "!"}</span>{toast.message}</div>)}
      </div>
    </>
  );
}
