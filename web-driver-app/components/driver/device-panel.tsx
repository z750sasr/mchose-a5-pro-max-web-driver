import {
  getCollectionLabel,
  getDeviceKey,
  productInfo,
  type A5HIDDevice,
  type DeviceSnapshot,
} from "../../lib/a5-protocol";
import type { MouseModelDefinition } from "../../lib/mouse-models/types";

function hexId(value: number) {
  return value.toString(16).toUpperCase().padStart(4, "0");
}

export function DevicePanel({
  model,
  device,
  availableDevices,
  snapshot,
  connected,
  busy,
  log,
  onRefresh,
  onDisconnect,
  onConnect,
  onSwitchDevice,
}: {
  model: MouseModelDefinition;
  device: A5HIDDevice | null;
  availableDevices: A5HIDDevice[];
  snapshot: DeviceSnapshot;
  connected: boolean;
  busy: boolean;
  log: string[];
  onRefresh: () => void;
  onDisconnect: () => void;
  onConnect: () => void;
  onSwitchDevice: (deviceKey: string) => void;
}) {
  const info = device ? productInfo(device) : null;
  const primaryConnection = model.connections[0];
  const vendorId = hexId(model.vendorId);

  return (
    <section className="tab-panel" aria-label="Device information">
      <div className="section-heading">
        <div><span className="eyebrow">DEVICE / DIAGNOSTICS</span><h2>Hardware, plainly visible.</h2></div>
        <div className="section-actions">
          <button className="button ghost compact" disabled={!connected || busy} onClick={onRefresh}>Refresh all</button>
          <button className="button ghost compact" disabled={!availableDevices.length || busy} onClick={onDisconnect}>Close session</button>
        </div>
      </div>
      <div className="device-grid">
        <article className="device-card identity-card">
          <span className="eyebrow">CONNECTED HARDWARE</span>
          <h3>{device?.productName || model.name}</h3>
          <dl>
            <div><dt>Transport</dt><dd>{info?.transport ?? "—"}</dd></div>
            <div><dt>USB identity</dt><dd>{device ? `${vendorId}:${hexId(device.productId)}` : `${vendorId}:${hexId(primaryConnection.productId)}`}</dd></div>
            <div><dt>Mouse firmware</dt><dd>{snapshot.firmware}</dd></div>
            <div><dt>Receiver firmware</dt><dd>{snapshot.dongleFirmware ?? "Direct USB"}</dd></div>
            <div><dt>Feature channel</dt><dd>{device ? getCollectionLabel(device) : "Usage FFFF:00 · report 0"}</dd></div>
          </dl>
        </article>

        <article className="device-card connection-card">
          <span className="eyebrow">CONNECTION MANAGER</span>
          <h3>{availableDevices.length ? `${availableDevices.length} connection${availableDevices.length === 1 ? "" : "s"} ready` : "No approved device"}</h3>
          <p>Once a USB identity has been approved, Chrome or Edge can reopen it automatically after reconnection. A first-time identity still requires the browser&apos;s device prompt.</p>
          <div className="connection-options" aria-label={`Available ${model.shortName} connections`}>
            {availableDevices.map((entry) => {
              const active = entry === device;
              return (
                <button
                  key={getDeviceKey(entry)}
                  className={active ? "connection-option active" : "connection-option"}
                  disabled={busy || active}
                  onClick={() => onSwitchDevice(getDeviceKey(entry))}
                >
                  <span><strong>{productInfo(entry).transport}</strong><small>{vendorId}:{hexId(entry.productId)}</small></span>
                  <b>{active ? "ACTIVE" : "USE"}</b>
                </button>
              );
            })}
            {!availableDevices.length && <div className="empty-connection">Connect the wired mouse or receiver to begin.</div>}
          </div>
          <button className="button ghost compact" onClick={onConnect} disabled={busy}>Approve another device</button>
          {availableDevices.length > 1 && <div className="multi-device-note">Wired is preferred for settings, while receiver firmware remains visible. If wired disconnects, the approved receiver becomes active automatically.</div>}
        </article>

        <article className="device-card support-card">
          <span className="eyebrow">SUPPORTED IDENTITIES</span>
          <h3>{model.name} · {model.generation}</h3>
          <div className="id-list">
            {model.connections.map((connection) => (
              <div key={connection.productId}>
                <code>{vendorId}:{hexId(connection.productId)}</code>
                <span><strong>{connection.name}</strong><small>{connection.transport}</small></span>
              </div>
            ))}
          </div>
        </article>

        <article className="device-card firmware-card">
          <span className="eyebrow">FIRMWARE SAFETY</span>
          <h3>Updates stay on desktop.</h3>
          <p>This web driver reads firmware versions but does not flash firmware. Use the supplied MCHOSE updater for recovery-capable updates and never disconnect during flashing.</p>
          <div className="firmware-version"><span>Bundled package</span><strong>{model.firmwarePackage}</strong></div>
        </article>

        <article className="device-card log-card">
          <span className="eyebrow">SESSION LOG</span>
          <h3>Feature report activity</h3>
          <div className="log-window">{log.map((entry, index) => <div key={`${entry}-${index}`}><span>{String(log.length - index).padStart(2, "0")}</span><code>{entry}</code></div>)}</div>
        </article>
      </div>
    </section>
  );
}
