"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  A5Protocol,
  BUTTON_ACTIONS,
  BUTTONS,
  findGrantedA5Device,
  getCollectionLabel,
  type A5HIDDevice,
  type ButtonActionKey,
  type DeviceSnapshot,
  type NavigatorWithHid,
  productInfo,
  requestA5Device,
  SUPPORTED_PRODUCTS,
} from "../lib/a5-protocol";

type Tab = "performance" | "buttons" | "device";
type Toast = { id: number; kind: "success" | "error"; message: string };

const DEFAULT_SNAPSHOT: DeviceSnapshot = {
  firmware: "—",
  dongleFirmware: null,
  battery: 0,
  charging: false,
  profile: 1,
  pollingRate: 1000,
  sleepSeconds: 900,
  debounceMs: 4,
  liftOffDistance: 1,
  angleSnap: false,
  rippleControl: false,
  motionSync: true,
  activeDpiStage: 3,
  dpiStages: [400, 800, 1600, 3200, 6400, 12000],
  dpiColors: ["#ff3b30", "#3478f6", "#36d16f", "#f14cff", "#f3d43b", "#ffffff"],
  buttons: BUTTONS.map((button, index) => ({
    buttonId: button.id,
    functionId: 1,
    data: [index + 1],
    key: (["left", "right", "middle", "back", "forward", "dpiCycleUp"] as ButtonActionKey[])[index],
  })),
};

const NAV_ITEMS: Array<{ id: Tab; index: string; label: string; note: string }> = [
  { id: "performance", index: "01", label: "Performance", note: "DPI & sensor" },
  { id: "buttons", index: "02", label: "Buttons", note: "6 assignments" },
  { id: "device", index: "03", label: "Device", note: "Firmware & HID" },
];

const subscribeToHydration = () => () => undefined;
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function formatError(error: unknown) {
  if (error instanceof DOMException && error.name === "NotFoundError") return "No device was selected.";
  if (error instanceof Error) return error.message;
  return "The device operation could not be completed.";
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("performance");
  const [device, setDevice] = useState<A5HIDDevice | null>(null);
  const [snapshot, setSnapshot] = useState<DeviceSnapshot>(DEFAULT_SNAPSHOT);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("Reading onboard settings");
  const [dpiDirty, setDpiDirty] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [log, setLog] = useState<string[]>(["Ready — connect the mouse or receiver to begin."]);
  const protocolRef = useRef<A5Protocol | null>(null);
  const toastId = useRef(0);

  const browserReady = useSyncExternalStore(subscribeToHydration, clientSnapshot, serverSnapshot);
  const hid = browserReady ? (navigator as NavigatorWithHid).hid : undefined;
  const compatibleBrowser = Boolean(hid && globalThis.isSecureContext);
  const connected = Boolean(device?.opened);
  const info = device ? productInfo(device) : null;

  const addLog = useCallback((message: string) => {
    const time = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());
    setLog((current) => [`${time}  ${message}`, ...current].slice(0, 12));
  }, []);

  const notify = useCallback((kind: Toast["kind"], message: string) => {
    const id = ++toastId.current;
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4200);
  }, []);

  const loadSnapshot = useCallback(
    async (protocol: A5Protocol, profile?: number) => {
      setBusy(true);
      setBusyLabel(profile ? `Loading profile ${profile}` : "Reading onboard settings");
      try {
        const next = await protocol.readSnapshot(profile);
        setSnapshot(next);
        setDpiDirty(false);
        addLog(`Profile ${next.profile} loaded from onboard memory.`);
      } finally {
        setBusy(false);
      }
    },
    [addLog],
  );

  const attachDevice = useCallback(
    async (nextDevice: A5HIDDevice) => {
      setBusy(true);
      setBusyLabel("Opening vendor HID channel");
      try {
        const protocol = new A5Protocol(nextDevice);
        await protocol.open();
        protocolRef.current = protocol;
        setDevice(nextDevice);
        addLog(`${productInfo(nextDevice).transport} channel opened on report ${protocol.reportId}.`);
        await loadSnapshot(protocol);
        notify("success", "A5 Pro Max connected — onboard settings loaded.");
      } catch (error) {
        protocolRef.current = null;
        setDevice(null);
        const message = formatError(error);
        addLog(`Connection failed: ${message}`);
        notify("error", message);
        setBusy(false);
      }
    },
    [addLog, loadSnapshot, notify],
  );

  const connect = useCallback(async () => {
    if (!hid) {
      notify("error", "WebHID is unavailable. Open this app in Chrome or Edge on desktop.");
      return;
    }
    if (!globalThis.isSecureContext) {
      notify("error", "WebHID requires HTTPS or localhost.");
      return;
    }
    try {
      const nextDevice = await requestA5Device(hid);
      if (!nextDevice) throw new Error("Choose the MCHOSE A5 vendor HID interface in the browser prompt.");
      await attachDevice(nextDevice);
    } catch (error) {
      const message = formatError(error);
      if (message !== "No device was selected.") addLog(`Connection failed: ${message}`);
      notify("error", message);
    }
  }, [addLog, attachDevice, hid, notify]);

  const disconnect = useCallback(async () => {
    const current = device;
    protocolRef.current = null;
    setDevice(null);
    setSnapshot(DEFAULT_SNAPSHOT);
    if (current?.opened) await current.close().catch(() => undefined);
    addLog("HID channel closed.");
  }, [addLog, device]);

  useEffect(() => {
    if (!hid || !globalThis.isSecureContext) return;
    let cancelled = false;
    findGrantedA5Device(hid).then((granted) => {
      if (!cancelled && granted) attachDevice(granted);
    });
    const onDisconnect = (event: Event) => {
      const disconnected = (event as Event & { device?: A5HIDDevice }).device;
      if (!disconnected || disconnected === protocolRef.current?.device) {
        protocolRef.current = null;
        setDevice(null);
        setSnapshot(DEFAULT_SNAPSHOT);
        addLog("Device disconnected.");
        notify("error", "The mouse or receiver was disconnected.");
      }
    };
    hid.addEventListener("disconnect", onDisconnect);
    return () => {
      cancelled = true;
      hid.removeEventListener("disconnect", onDisconnect);
    };
  }, [addLog, attachDevice, hid, notify]);

  const runSetting = useCallback(
    async (label: string, action: (protocol: A5Protocol) => Promise<void>) => {
      const protocol = protocolRef.current;
      if (!protocol) return;
      setBusy(true);
      setBusyLabel(`Saving ${label.toLowerCase()}`);
      try {
        await action(protocol);
        addLog(`${label} saved to onboard memory.`);
        notify("success", `${label} saved.`);
      } catch (error) {
        const message = formatError(error);
        addLog(`${label} failed: ${message}`);
        notify("error", message);
      } finally {
        setBusy(false);
      }
    },
    [addLog, notify],
  );

  const selectProfile = async (profile: number) => {
    const protocol = protocolRef.current;
    if (!protocol || profile === snapshot.profile) return;
    setBusy(true);
    setBusyLabel(`Switching to profile ${profile}`);
    try {
      await protocol.setProfile(profile);
      await loadSnapshot(protocol, profile);
      notify("success", `Profile ${profile} is now active.`);
    } catch (error) {
      notify("error", formatError(error));
      setBusy(false);
    }
  };

  const updateDpi = (index: number, value: number) => {
    setSnapshot((current) => ({
      ...current,
      dpiStages: current.dpiStages.map((dpi, stage) => (stage === index ? value : dpi)),
    }));
    setDpiDirty(true);
  };

  const toggleDpiStage = (index: number) => {
    setSnapshot((current) => {
      if (current.dpiStages.length === 1) return current;
      const dpiStages = current.dpiStages.filter((_, stage) => stage !== index);
      const dpiColors = current.dpiColors.filter((_, stage) => stage !== index);
      return {
        ...current,
        dpiStages,
        dpiColors,
        activeDpiStage: Math.min(current.activeDpiStage, dpiStages.length),
      };
    });
    setDpiDirty(true);
  };

  const addDpiStage = () => {
    setSnapshot((current) => {
      if (current.dpiStages.length >= 6) return current;
      const previous = current.dpiStages.at(-1) ?? 800;
      const colors = DEFAULT_SNAPSHOT.dpiColors;
      return {
        ...current,
        dpiStages: [...current.dpiStages, Math.min(26000, previous * 2)],
        dpiColors: [...current.dpiColors, colors[current.dpiStages.length]],
      };
    });
    setDpiDirty(true);
  };

  const saveDpi = () =>
    runSetting("DPI stages", async (protocol) => {
      await protocol.setDpi(snapshot.profile, snapshot.dpiStages, snapshot.activeDpiStage);
      await protocol.setDpiColors(snapshot.profile, snapshot.dpiColors);
      setDpiDirty(false);
    });

  const supportedIdList = useMemo(
    () => Object.entries(SUPPORTED_PRODUCTS).map(([id, product]) => ({ id: `2023:${Number(id).toString(16).toUpperCase()}`, ...product })),
    [],
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="A5 Control home">
          <span className="brand-mark">A5</span>
          <span>
            <strong>CONTROL</strong>
            <small>WebHID driver · gen 1</small>
          </span>
        </a>
        <div className="topbar-actions">
          <div className={`connection-pill ${connected ? "is-connected" : ""}`}>
            <span className="status-dot" />
            <span>{connected ? info?.transport : compatibleBrowser ? "Device offline" : "WebHID unavailable"}</span>
          </div>
          <button className={connected ? "button ghost" : "button primary"} onClick={connected ? disconnect : connect} disabled={busy}>
            {connected ? "Disconnect" : "Connect device"}
          </button>
        </div>
      </header>

      <section className="workspace" id="top">
        <aside className="sidebar" aria-label="Driver sections">
          <nav>
            {NAV_ITEMS.map((item) => (
              <button key={item.id} className={tab === item.id ? "nav-item active" : "nav-item"} onClick={() => setTab(item.id)}>
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
            <strong>XVI · 64B FEATURE</strong>
            <small>VID 2023 · PID F019</small>
          </div>
        </aside>

        <div className="content">
          <section className="device-hero">
            <div className="hero-copy">
              <span className="eyebrow">FIRST-GENERATION HARDWARE</span>
              <h1>MCHOSE A5<br />PRO MAX</h1>
              <p>Configure performance directly in the browser. Changes write to the mouse&apos;s onboard memory—no background software.</p>
              {!compatibleBrowser && (
                <div className="browser-warning">Use desktop Chrome or Edge over HTTPS to connect with WebHID.</div>
              )}
            </div>

            <div className="mouse-stage" aria-label="MCHOSE A5 Pro Max mouse illustration">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <span className="axis axis-x" />
              <span className="axis axis-y" />
              <Image src="/a5-mouse.png" alt="Black MCHOSE A5 Pro Max viewed from above" width={153} height={251} priority />
              <div className="mouse-callout top-callout"><span>PAW3395</span><small>SENSOR</small></div>
              <div className="mouse-callout bottom-callout"><span>58 G</span><small>WEIGHT</small></div>
            </div>

            <div className="quick-stats">
              <div className="battery-stat">
                <div className="battery-ring" style={{ "--battery": `${connected ? snapshot.battery : 0}%` } as React.CSSProperties}>
                  <span>{connected ? snapshot.battery : "—"}<small>{connected ? "%" : ""}</small></span>
                </div>
                <div><strong>{snapshot.charging ? "Charging" : "Battery"}</strong><small>{connected ? "Live receiver read" : "Connect to read"}</small></div>
              </div>
              <div className="stat-row"><span>REPORT RATE</span><strong>{connected ? snapshot.pollingRate : "—"} <small>{connected ? "HZ" : ""}</small></strong></div>
              <div className="stat-row"><span>FIRMWARE</span><strong>{snapshot.firmware}</strong></div>
              <div className="profile-switch" aria-label="Onboard profile">
                <span>ONBOARD PROFILE</span>
                <div>{[1, 2, 3].map((profile) => <button key={profile} className={snapshot.profile === profile ? "active" : ""} onClick={() => selectProfile(profile)} disabled={!connected || busy}>{profile}</button>)}</div>
              </div>
            </div>
          </section>

          {tab === "performance" && (
            <section className="tab-panel" aria-label="Performance settings">
              <div className="section-heading">
                <div><span className="eyebrow">PERFORMANCE / PROFILE {snapshot.profile}</span><h2>Dial in your sensor.</h2></div>
                <div className="save-cluster"><span className={dpiDirty ? "dirty-indicator show" : "dirty-indicator"}>Unsaved DPI changes</span><button className="button primary compact" onClick={saveDpi} disabled={!connected || busy || !dpiDirty}>Apply DPI</button></div>
              </div>

              <div className="dpi-grid">
                {snapshot.dpiStages.map((dpi, index) => (
                  <article className={snapshot.activeDpiStage === index + 1 ? "dpi-card active" : "dpi-card"} key={`${index}-${snapshot.dpiColors[index]}`}>
                    <button className="dpi-active" onClick={() => { setSnapshot((current) => ({ ...current, activeDpiStage: index + 1 })); setDpiDirty(true); }} disabled={!connected} aria-label={`Make DPI stage ${index + 1} active`}>
                      <span style={{ background: snapshot.dpiColors[index] }} /> STAGE {String(index + 1).padStart(2, "0")}
                    </button>
                    <label><input type="number" min="50" max="26000" step="50" value={dpi} disabled={!connected} onChange={(event) => updateDpi(index, Number(event.target.value))} /><small>DPI</small></label>
                    <div className="dpi-card-foot">
                      <input type="color" aria-label={`Stage ${index + 1} color`} value={snapshot.dpiColors[index]} disabled={!connected} onChange={(event) => { const color = event.target.value; setSnapshot((current) => ({ ...current, dpiColors: current.dpiColors.map((value, stage) => stage === index ? color : value) })); setDpiDirty(true); }} />
                      <button onClick={() => toggleDpiStage(index)} disabled={!connected || snapshot.dpiStages.length === 1}>REMOVE</button>
                    </div>
                  </article>
                ))}
                {snapshot.dpiStages.length < 6 && <button className="add-stage" onClick={addDpiStage} disabled={!connected}><span>＋</span>Add stage</button>}
              </div>

              <div className="control-grid">
                <article className="control-card polling-card">
                  <div className="card-head"><span>REPORT RATE</span><strong>{snapshot.pollingRate}<small> HZ</small></strong></div>
                  <div className="segment-control">{[125, 250, 500, 1000].map((rate) => <button key={rate} className={snapshot.pollingRate === rate ? "active" : ""} disabled={!connected || busy || (device?.productId === 0xf019 && rate === 250)} onClick={() => { setSnapshot((current) => ({ ...current, pollingRate: rate })); runSetting("Polling rate", (protocol) => protocol.setPollingRate(rate)); }}>{rate}</button>)}</div>
                  <p>250 Hz is unavailable in wired mode, matching the original driver profile.</p>
                </article>

                <article className="control-card range-card">
                  <div className="card-head"><span>DEBOUNCE</span><strong>{snapshot.debounceMs}<small> MS</small></strong></div>
                  <input type="range" min="0" max="15" value={snapshot.debounceMs} disabled={!connected || busy} onChange={(event) => setSnapshot((current) => ({ ...current, debounceMs: Number(event.target.value) }))} onMouseUp={() => runSetting("Debounce", (protocol) => protocol.setDebounce(snapshot.profile, snapshot.debounceMs))} onTouchEnd={() => runSetting("Debounce", (protocol) => protocol.setDebounce(snapshot.profile, snapshot.debounceMs))} />
                  <div className="range-labels"><span>0 ms</span><span>15 ms</span></div>
                </article>

                <article className="control-card lod-card">
                  <div className="card-head"><span>LIFT-OFF DISTANCE</span><strong>{snapshot.liftOffDistance}<small> MM</small></strong></div>
                  <div className="large-toggle">{[1, 2].map((distance) => <button key={distance} className={snapshot.liftOffDistance === distance ? "active" : ""} disabled={!connected || busy} onClick={() => { setSnapshot((current) => ({ ...current, liftOffDistance: distance })); runSetting("Lift-off distance", (protocol) => protocol.setLiftOffDistance(distance)); }}><strong>{distance}</strong><small>MM</small></button>)}</div>
                </article>

                <article className="control-card sleep-card">
                  <div className="card-head"><span>SLEEP TIMER</span><strong>{snapshot.sleepSeconds === 0xffff ? "OFF" : `${Math.round(snapshot.sleepSeconds / 60)} MIN`}</strong></div>
                  <select value={snapshot.sleepSeconds} disabled={!connected || busy} onChange={(event) => { const seconds = Number(event.target.value); setSnapshot((current) => ({ ...current, sleepSeconds: seconds })); runSetting("Sleep timer", (protocol) => protocol.setSleepSeconds(seconds)); }}>
                    {[1, 5, 10, 15, 20, 25, 30].map((minutes) => <option value={minutes * 60} key={minutes}>{minutes} minute{minutes === 1 ? "" : "s"}</option>)}
                    <option value={0xffff}>Never sleep</option>
                  </select>
                  <p>Stored globally on the mouse.</p>
                </article>

                <article className="control-card sensor-card wide-card">
                  <div className="card-head"><span>SENSOR PROCESSING</span><strong>PAW3395</strong></div>
                  <div className="toggle-list">
                    <Toggle label="Motion Sync" description="Align sensor frames with USB reports." enabled={snapshot.motionSync} disabled={!connected || busy} onChange={(enabled) => { setSnapshot((current) => ({ ...current, motionSync: enabled })); runSetting("Motion Sync", (protocol) => protocol.setSensorToggle(0x09, enabled)); }} />
                    <Toggle label="Ripple Control" description="Smooth high-DPI sensor noise." enabled={snapshot.rippleControl} disabled={!connected || busy} onChange={(enabled) => { setSnapshot((current) => ({ ...current, rippleControl: enabled })); runSetting("Ripple Control", (protocol) => protocol.setSensorToggle(0x0a, enabled)); }} />
                    <Toggle label="Angle Snapping" description="Straighten near-horizontal movement." enabled={snapshot.angleSnap} disabled={!connected || busy} onChange={(enabled) => { setSnapshot((current) => ({ ...current, angleSnap: enabled })); runSetting("Angle Snapping", (protocol) => protocol.setSensorToggle(0x04, enabled)); }} />
                  </div>
                </article>
              </div>
            </section>
          )}

          {tab === "buttons" && (
            <section className="tab-panel" aria-label="Button assignments">
              <div className="section-heading"><div><span className="eyebrow">BUTTONS / PROFILE {snapshot.profile}</span><h2>Make every click yours.</h2></div><p className="section-note">Changes save instantly to the selected onboard profile.</p></div>
              <div className="button-layout">
                <div className="button-mouse-map">
                  <div className="map-rings" />
                  <Image src="/a5-mouse.png" alt="MCHOSE A5 Pro Max button map" width={153} height={251} />
                  <span className="map-pin pin-1">1</span><span className="map-pin pin-2">2</span><span className="map-pin pin-3">3</span><span className="map-pin pin-4">4</span><span className="map-pin pin-5">5</span><span className="map-pin pin-6">6</span>
                </div>
                <div className="assignment-list">
                  {BUTTONS.map((button, index) => {
                    const assignment = snapshot.buttons.find((item) => item.buttonId === button.id);
                    return <label className="assignment-row" key={button.id}><span className="assignment-number">{String(index + 1).padStart(2, "0")}</span><span className="assignment-name"><strong>{button.label}</strong><small>Physical input {button.id}</small></span><select value={assignment?.key ?? "disabled"} disabled={!connected || busy} onChange={(event) => { const key = event.target.value as ButtonActionKey; setSnapshot((current) => ({ ...current, buttons: current.buttons.map((item) => item.buttonId === button.id ? { ...item, key } : item) })); runSetting(`${button.label} assignment`, (protocol) => protocol.setButton(snapshot.profile, button.id, key)); }}>{Object.entries(BUTTON_ACTIONS).filter(([key]) => !(button.id === 1 && key === "disabled")).map(([key, action]) => <option value={key} key={key}>{action.label}</option>)}</select></label>;
                  })}
                </div>
              </div>
              <div className="safety-note"><strong>Keep a primary click.</strong><span>Disabling the left button is intentionally blocked so the mouse remains usable.</span></div>
            </section>
          )}

          {tab === "device" && (
            <section className="tab-panel" aria-label="Device information">
              <div className="section-heading"><div><span className="eyebrow">DEVICE / DIAGNOSTICS</span><h2>Hardware, plainly visible.</h2></div><button className="button ghost compact" disabled={!connected || busy} onClick={() => protocolRef.current && loadSnapshot(protocolRef.current)}>Refresh all</button></div>
              <div className="device-grid">
                <article className="device-card identity-card"><span className="eyebrow">CONNECTED HARDWARE</span><h3>{device?.productName || "MCHOSE A5 Pro Max"}</h3><dl><div><dt>Transport</dt><dd>{info?.transport ?? "—"}</dd></div><div><dt>USB identity</dt><dd>{device ? `2023:${device.productId.toString(16).toUpperCase().padStart(4, "0")}` : "2023:F019"}</dd></div><div><dt>Mouse firmware</dt><dd>{snapshot.firmware}</dd></div><div><dt>Receiver firmware</dt><dd>{snapshot.dongleFirmware ?? "Direct USB"}</dd></div><div><dt>Feature channel</dt><dd>{device ? getCollectionLabel(device) : "Usage FFFF:00 · report 0"}</dd></div></dl></article>
                <article className="device-card support-card"><span className="eyebrow">SUPPORTED IDENTITIES</span><h3>First-gen A5 family</h3><div className="id-list">{supportedIdList.map((product) => <div key={product.id}><code>{product.id}</code><span><strong>{product.name}</strong><small>{product.transport}</small></span></div>)}</div></article>
                <article className="device-card firmware-card"><span className="eyebrow">FIRMWARE SAFETY</span><h3>Updates stay on desktop.</h3><p>This web driver reads firmware versions but does not flash firmware. Use the supplied MCHOSE updater for recovery-capable updates and never disconnect during flashing.</p><div className="firmware-version"><span>Bundled package</span><strong>01.00.15.00</strong></div></article>
                <article className="device-card log-card"><span className="eyebrow">SESSION LOG</span><h3>Feature report activity</h3><div className="log-window">{log.map((entry, index) => <div key={`${entry}-${index}`}><span>{String(log.length - index).padStart(2, "0")}</span><code>{entry}</code></div>)}</div></article>
              </div>
            </section>
          )}
        </div>
      </section>

      {busy && <div className="busy-strip" role="status"><span /><strong>{busyLabel}</strong><small>Keep the mouse awake</small></div>}
      <div className="toast-stack" aria-live="polite">{toasts.map((toast) => <div className={`toast ${toast.kind}`} key={toast.id}><span>{toast.kind === "success" ? "✓" : "!"}</span>{toast.message}</div>)}</div>
    </main>
  );
}

function Toggle({ label, description, enabled, disabled, onChange }: { label: string; description: string; enabled: boolean; disabled: boolean; onChange: (enabled: boolean) => void }) {
  return <label className="toggle-row"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={enabled} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /><i aria-hidden="true" /></label>;
}
