"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  A5Protocol,
  BUTTONS,
  choosePreferredA5Device,
  findGrantedA5Devices,
  getDeviceKey,
  type A5HIDDevice,
  type ButtonActionKey,
  type DeviceSnapshot,
  type NavigatorWithHid,
  productInfo,
  requestA5Device,
  sortA5Devices,
} from "../lib/a5-protocol";
import { AboutPanel } from "../components/driver/about-panel";
import { ButtonsPanel } from "../components/driver/buttons-panel";
import { DriverStatus, Sidebar, TopBar } from "../components/driver/chrome";
import { DevicePanel } from "../components/driver/device-panel";
import { MouseHero } from "../components/driver/mouse-hero";
import { PerformancePanel, type SensorSetting } from "../components/driver/performance-panel";
import type { DriverTab, DriverToast, PairingUiState } from "../components/driver/types";
import { DEFAULT_MOUSE_MODEL } from "../lib/mouse-models/registry";

const MODEL = DEFAULT_MOUSE_MODEL;

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
  lightingEffect: 5,
  lightingSpeed: 128,
  lightingBrightness: 100,
  lightingOffWhileMoving: false,
  buttons: BUTTONS.map((button, index) => ({
    buttonId: button.id,
    functionId: 1,
    data: [index + 1],
    key: (["left", "right", "middle", "back", "forward", "dpiCycleUp"] as ButtonActionKey[])[index],
  })),
};

const subscribeToHydration = () => () => undefined;
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function formatError(error: unknown) {
  if (error instanceof DOMException && error.name === "NotFoundError") return "No device was selected.";
  if (error instanceof Error) return error.message;
  return "The device operation could not be completed.";
}

function connectionFor(device: A5HIDDevice) {
  return MODEL.connections.find((connection) => connection.productId === device.productId);
}

function isWiredDevice(device: A5HIDDevice | null | undefined) {
  return device ? connectionFor(device)?.kind === "wired" : false;
}

export default function Home() {
  const [tab, setTab] = useState<DriverTab>("performance");
  const [device, setDevice] = useState<A5HIDDevice | null>(null);
  const [availableDevices, setAvailableDevices] = useState<A5HIDDevice[]>([]);
  const [snapshot, setSnapshot] = useState<DeviceSnapshot>(DEFAULT_SNAPSHOT);
  const [mouseReady, setMouseReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("Reading onboard settings");
  const [dpiDirty, setDpiDirty] = useState(false);
  const [pairingState, setPairingState] = useState<PairingUiState>("idle");
  const [toasts, setToasts] = useState<DriverToast[]>([]);
  const [log, setLog] = useState<string[]>(["Ready — connect the mouse or receiver to begin."]);
  const protocolRef = useRef<A5Protocol | null>(null);
  const activeDeviceRef = useRef<A5HIDDevice | null>(null);
  const availableDevicesRef = useRef<A5HIDDevice[]>([]);
  const mouseReadyRef = useRef(false);
  const pairingAbortRef = useRef<AbortController | null>(null);
  const toastId = useRef(0);

  const browserReady = useSyncExternalStore(subscribeToHydration, clientSnapshot, serverSnapshot);
  const hid = browserReady ? (navigator as NavigatorWithHid).hid : undefined;
  const compatibleBrowser = Boolean(hid && globalThis.isSecureContext);
  const hidConnected = Boolean(device?.opened);
  const connected = hidConnected && mouseReady;

  const updateMouseReady = useCallback((ready: boolean) => {
    mouseReadyRef.current = ready;
    setMouseReady(ready);
  }, []);

  const addLog = useCallback((message: string) => {
    const time = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());
    setLog((current) => [`${time}  ${message}`, ...current].slice(0, 12));
  }, []);

  const notify = useCallback((kind: DriverToast["kind"], message: string) => {
    const id = ++toastId.current;
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4200);
  }, []);

  const rememberDevices = useCallback((nextDevices: A5HIDDevice[]) => {
    const sorted = sortA5Devices(nextDevices);
    availableDevicesRef.current = sorted;
    setAvailableDevices(sorted);
    return sorted;
  }, []);

  const loadSnapshot = useCallback(
    async (protocol: A5Protocol, profile?: number) => {
      setBusy(true);
      setBusyLabel(profile ? `Loading profile ${profile}` : "Reading onboard settings");
      try {
        let next = await protocol.readSnapshot(profile);
        const receiver = isWiredDevice(protocol.device)
          ? availableDevicesRef.current.find((entry) => connectionFor(entry)?.kind === "receiver")
          : null;

        if (receiver) {
          try {
            const receiverProtocol = new A5Protocol(receiver);
            await receiverProtocol.open();
            next = { ...next, dongleFirmware: await receiverProtocol.getFirmwareVersion(0) };
            addLog(`${productInfo(receiver).transport} detected alongside the wired mouse.`);
          } catch (error) {
            addLog(`Receiver is present but its firmware read failed: ${formatError(error)}`);
          }
        }

        setSnapshot(next);
        updateMouseReady(true);
        setDpiDirty(false);
        addLog(`Profile ${next.profile} loaded from onboard memory.`);
      } finally {
        setBusy(false);
      }
    },
    [addLog, updateMouseReady],
  );

  const attachDevice = useCallback(
    async (nextDevice: A5HIDDevice, notice = `${MODEL.name} connected — onboard settings loaded.`) => {
      const previousDevice = activeDeviceRef.current;
      const previousProtocol = protocolRef.current;
      const previousMouseReady = mouseReadyRef.current;
      setBusy(true);
      setBusyLabel("Opening vendor HID channel");
      try {
        const protocol = new A5Protocol(nextDevice);
        await protocol.open();
        protocolRef.current = protocol;
        activeDeviceRef.current = nextDevice;
        updateMouseReady(false);
        setDevice(nextDevice);
        rememberDevices([...availableDevicesRef.current, nextDevice]);
        addLog(`${productInfo(nextDevice).transport} channel opened on report ${protocol.reportId}.`);
        try {
          await loadSnapshot(protocol);
          notify("success", notice);
        } catch (error) {
          if (connectionFor(nextDevice)?.kind !== "receiver") throw error;
          updateMouseReady(false);
          setSnapshot(DEFAULT_SNAPSHOT);
          setDpiDirty(false);
          addLog(`${productInfo(nextDevice).transport} remains connected while the wireless mouse is asleep.`);
          notify("success", "Receiver connected. Wake or move the mouse to load its settings automatically.");
        }
      } catch (error) {
        const canRestorePrevious = Boolean(
          previousDevice && previousDevice !== nextDevice && previousDevice.opened && previousProtocol,
        );
        protocolRef.current = canRestorePrevious ? previousProtocol : null;
        activeDeviceRef.current = canRestorePrevious ? previousDevice : null;
        setDevice(canRestorePrevious ? previousDevice : null);
        updateMouseReady(canRestorePrevious ? previousMouseReady : false);
        if (!canRestorePrevious) setSnapshot(DEFAULT_SNAPSHOT);
        const message = formatError(error);
        addLog(`Connection failed: ${message}`);
        notify("error", message);
        setBusy(false);
      }
    },
    [addLog, loadSnapshot, notify, rememberDevices, updateMouseReady],
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
      const selectedDevice = await requestA5Device(hid);
      if (!selectedDevice) throw new Error(`Choose the ${MODEL.name} vendor HID interface in the browser prompt.`);
      const granted = rememberDevices(await findGrantedA5Devices(hid));
      const current = activeDeviceRef.current;
      const currentAvailable = Boolean(current && granted.includes(current));
      const preferred = choosePreferredA5Device(granted) ?? selectedDevice;
      const shouldPreferWired = !isWiredDevice(current) && isWiredDevice(preferred);

      if (!currentAvailable || shouldPreferWired) {
        await attachDevice(
          preferred,
          shouldPreferWired ? "Wired mouse detected — switched to the direct USB connection." : undefined,
        );
      } else {
        notify("success", `${granted.length} approved connection${granted.length === 1 ? " is" : "s are"} available.`);
      }
    } catch (error) {
      const message = formatError(error);
      if (message !== "No device was selected.") addLog(`Connection failed: ${message}`);
      notify("error", message);
    }
  }, [addLog, attachDevice, hid, notify, rememberDevices]);

  const disconnect = useCallback(async () => {
    pairingAbortRef.current?.abort();
    pairingAbortRef.current = null;
    setPairingState("idle");
    const devices = Array.from(new Set([...availableDevicesRef.current, activeDeviceRef.current].filter(Boolean))) as A5HIDDevice[];
    protocolRef.current = null;
    activeDeviceRef.current = null;
    setDevice(null);
    updateMouseReady(false);
    setSnapshot(DEFAULT_SNAPSHOT);
    rememberDevices([]);
    await Promise.all(devices.map((entry) => (entry.opened ? entry.close().catch(() => undefined) : Promise.resolve())));
    addLog("All HID channels closed for this page session.");
  }, [addLog, rememberDevices, updateMouseReady]);

  const switchDevice = useCallback(
    async (deviceKey: string) => {
      const nextDevice = availableDevicesRef.current.find((entry) => getDeviceKey(entry) === deviceKey);
      if (!nextDevice || nextDevice === activeDeviceRef.current) return;
      await attachDevice(nextDevice, `Switched to ${productInfo(nextDevice).transport}.`);
    },
    [attachDevice],
  );

  useEffect(() => {
    if (!hid || !globalThis.isSecureContext) return;
    let cancelled = false;

    const synchronize = async (preferNewWired = false) => {
      const granted = await findGrantedA5Devices(hid);
      if (cancelled) return;
      const sorted = rememberDevices(granted);
      const current = activeDeviceRef.current;
      const currentAvailable = Boolean(current && sorted.includes(current));
      const preferred = choosePreferredA5Device(sorted);

      if (!preferred) return;
      if (!currentAvailable) {
        await attachDevice(preferred, current ? `Reconnected through ${productInfo(preferred).transport}.` : `Approved ${MODEL.shortName} hardware reconnected automatically.`);
      } else if (preferNewWired && !isWiredDevice(current) && isWiredDevice(preferred)) {
        await attachDevice(preferred, "Wired mouse detected — switched to the direct USB connection.");
      }
    };

    const queueSynchronization = (preferNewWired = false) => {
      void synchronize(preferNewWired).catch((error) => {
        addLog(`Automatic connection check failed: ${formatError(error)}`);
      });
    };

    queueSynchronization();

    const onConnect = (event: Event) => {
      const connectedDevice = (event as Event & { device?: A5HIDDevice }).device;
      if (connectedDevice && connectedDevice.vendorId !== MODEL.vendorId) return;
      addLog(`USB connection detected. Checking approved ${MODEL.shortName} interfaces.`);
      queueSynchronization(true);
    };

    const onDisconnect = async (event: Event) => {
      const disconnected = (event as Event & { device?: A5HIDDevice }).device;
      const disconnectedKey = disconnected ? getDeviceKey(disconnected) : null;
      const remaining = rememberDevices(
        availableDevicesRef.current.filter((entry) => !disconnectedKey || getDeviceKey(entry) !== disconnectedKey),
      );
      const active = activeDeviceRef.current;
      const activeWasDisconnected = Boolean(
        active && (!disconnectedKey || getDeviceKey(active) === disconnectedKey),
      );

      if (!activeWasDisconnected) {
        addLog(`${disconnected ? productInfo(disconnected).transport : "A secondary connection"} disconnected; active connection preserved.`);
        return;
      }

      protocolRef.current = null;
      activeDeviceRef.current = null;
      setDevice(null);
      updateMouseReady(false);
      setSnapshot(DEFAULT_SNAPSHOT);
      addLog("Active device disconnected.");

      const fallback = choosePreferredA5Device(remaining);
      if (fallback) {
        await attachDevice(fallback, `Active connection lost — switched to ${productInfo(fallback).transport}.`);
      } else {
        notify("error", "Device disconnected. Reconnect it and the approved interface will reopen automatically.");
      }
    };
    hid.addEventListener("connect", onConnect);
    hid.addEventListener("disconnect", onDisconnect);
    return () => {
      cancelled = true;
      hid.removeEventListener("connect", onConnect);
      hid.removeEventListener("disconnect", onDisconnect);
    };
  }, [addLog, attachDevice, hid, notify, rememberDevices, updateMouseReady]);

  useEffect(() => {
    const waitingOnReceiver = Boolean(
      device && hidConnected && !mouseReady && connectionFor(device)?.kind === "receiver",
    );
    if (!waitingOnReceiver || !device) return;

    let checking = false;
    const checkForWake = async () => {
      const protocol = protocolRef.current;
      if (checking || busy || !protocol || activeDeviceRef.current !== device) return;
      checking = true;
      try {
        await protocol.getBattery();
        if (activeDeviceRef.current !== device) return;
        await loadSnapshot(protocol);
        if (activeDeviceRef.current === device) {
          addLog("Wireless mouse is active again; onboard information refreshed.");
          notify("success", "Mouse awake — settings and battery information are ready.");
        }
      } catch {
        // A sleeping mouse does not answer receiver-routed feature reports. Keep
        // the receiver session open and try again without surfacing noisy errors.
      } finally {
        checking = false;
      }
    };

    const firstCheck = window.setTimeout(() => void checkForWake(), 750);
    const interval = window.setInterval(() => void checkForWake(), 2500);
    return () => {
      window.clearTimeout(firstCheck);
      window.clearInterval(interval);
    };
  }, [addLog, busy, device, hidConnected, loadSnapshot, mouseReady, notify]);

  useEffect(() => {
    if (!connected || busy || dpiDirty || !device) return;

    let stopped = false;
    let checking = false;
    const synchronizeActiveDpi = async () => {
      const protocol = protocolRef.current;
      if (checking || !protocol || activeDeviceRef.current !== device) return;
      checking = true;
      try {
        const activeStage = await protocol.getActiveDpiStage(snapshot.profile);
        if (stopped || activeDeviceRef.current !== device) return;
        setSnapshot((current) => {
          const normalizedStage = Math.max(1, Math.min(current.dpiStages.length, activeStage));
          return normalizedStage === current.activeDpiStage
            ? current
            : { ...current, activeDpiStage: normalizedStage };
        });
      } catch {
        // The mouse may briefly stop answering while it sleeps. The receiver
        // session remains open and the next interval checks again.
      } finally {
        checking = false;
      }
    };

    const firstCheck = window.setTimeout(() => void synchronizeActiveDpi(), 500);
    const interval = window.setInterval(() => void synchronizeActiveDpi(), 700);
    return () => {
      stopped = true;
      window.clearTimeout(firstCheck);
      window.clearInterval(interval);
    };
  }, [busy, connected, device, dpiDirty, snapshot.profile]);

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
      if (current.dpiStages.length >= MODEL.capabilities.maxDpiStages) return current;
      const previous = current.dpiStages.at(-1) ?? 800;
      const colors = DEFAULT_SNAPSHOT.dpiColors;
      return {
        ...current,
        dpiStages: [...current.dpiStages, Math.min(MODEL.capabilities.maxDpi, previous * 2)],
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

  const activateDpiStage = (index: number) => {
    setSnapshot((current) => ({ ...current, activeDpiStage: index + 1 }));
    setDpiDirty(true);
  };

  const updateDpiColor = (index: number, color: string) => {
    setSnapshot((current) => ({
      ...current,
      dpiColors: current.dpiColors.map((value, stage) => stage === index ? color : value),
    }));
    setDpiDirty(true);
  };

  const setPollingRate = (rate: number) => {
    setSnapshot((current) => ({ ...current, pollingRate: rate }));
    void runSetting("Polling rate", (protocol) => protocol.setPollingRate(rate));
  };

  const setLiftOffDistance = (distance: number) => {
    setSnapshot((current) => ({ ...current, liftOffDistance: distance }));
    void runSetting("Lift-off distance", (protocol) => protocol.setLiftOffDistance(distance));
  };

  const setSleepSeconds = (seconds: number) => {
    setSnapshot((current) => ({ ...current, sleepSeconds: seconds }));
    void runSetting("Sleep timer", (protocol) => protocol.setSleepSeconds(seconds));
  };

  const setSensorSetting = (setting: SensorSetting, enabled: boolean) => {
    const commands: Record<SensorSetting, number> = { motionSync: 0x09, rippleControl: 0x0a, angleSnap: 0x04 };
    const labels: Record<SensorSetting, string> = { motionSync: "Motion Sync", rippleControl: "Ripple Control", angleSnap: "Angle Snapping" };
    setSnapshot((current) => ({ ...current, [setting]: enabled }));
    void runSetting(labels[setting], (protocol) => protocol.setSensorToggle(commands[setting], enabled));
  };

  const setLightingEffect = (effect: number) => {
    setSnapshot((current) => ({ ...current, lightingEffect: effect }));
    void runSetting("DPI LED effect", (protocol) =>
      protocol.setDpiLightingEffect(snapshot.profile, effect, snapshot.lightingSpeed),
    );
  };

  const setLightingOffWhileMoving = (enabled: boolean) => {
    setSnapshot((current) => ({ ...current, lightingOffWhileMoving: enabled }));
    void runSetting("DPI LED movement behavior", (protocol) =>
      protocol.setDpiLightingOffWhileMoving(enabled),
    );
  };

  const resetCurrentProfile = async () => {
    const protocol = protocolRef.current;
    if (!protocol) return;
    const profile = snapshot.profile;
    const confirmed = window.confirm(
      `Restore onboard profile ${profile} to the MCHOSE default settings?\n\nThis replaces its DPI, lighting, sensor, and button settings and cannot be undone.`,
    );
    if (!confirmed) return;

    setBusy(true);
    setBusyLabel(`Restoring profile ${profile} defaults`);
    try {
      await protocol.resetProfile(profile);
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      await loadSnapshot(protocol, profile);
      addLog(`Profile ${profile} restored with the stock onboard reset command.`);
      notify("success", `Profile ${profile} defaults restored.`);
    } catch (error) {
      const message = formatError(error);
      addLog(`Profile reset failed: ${message}`);
      notify("error", message);
      setBusy(false);
    }
  };

  const startPairing = async () => {
    const pairingCapability = MODEL.capabilities.receiverPairing;
    const receiver = availableDevicesRef.current.find(
      (entry) => connectionFor(entry)?.kind === "receiver",
    );
    if (!pairingCapability || !receiver) {
      notify("error", "Approve and connect an A5 receiver before starting pairing.");
      return;
    }

    const controller = new AbortController();
    pairingAbortRef.current = controller;
    setBusy(true);
    setBusyLabel("Pairing the 2.4G receiver");
    setPairingState("starting");
    addLog(`Pairing started on ${productInfo(receiver).transport}.`);

    try {
      const pairingProtocol = receiver === activeDeviceRef.current && protocolRef.current
        ? protocolRef.current
        : new A5Protocol(receiver);
      await pairingProtocol.open();
      const result = await pairingProtocol.pairReceiver({
        signal: controller.signal,
        timeoutMs: pairingCapability.timeoutMs,
        onProgress: setPairingState,
      });
      setPairingState(result);
      if (result === "success") {
        addLog("Receiver reported a successful mouse pairing.");
        notify("success", "Dongle pairing completed.");
      } else if (result === "cancelled") {
        addLog("Dongle pairing cancelled; receiver pairing mode stopped.");
      } else {
        addLog(`Dongle pairing ended with status: ${result}.`);
        notify("error", result === "timeout" ? "Pairing timed out after 30 seconds." : "The receiver could not pair with the mouse.");
      }
    } catch (error) {
      const message = formatError(error);
      setPairingState(controller.signal.aborted ? "cancelled" : "failed");
      addLog(`Dongle pairing failed: ${message}`);
      if (!controller.signal.aborted) notify("error", message);
    } finally {
      if (pairingAbortRef.current === controller) pairingAbortRef.current = null;
      setBusy(false);
    }
  };

  const cancelPairing = () => {
    pairingAbortRef.current?.abort();
    setPairingState("cancelled");
  };

  const setButtonAssignment = (buttonId: number, label: string, key: ButtonActionKey) => {
    setSnapshot((current) => ({
      ...current,
      buttons: current.buttons.map((item) => item.buttonId === buttonId ? { ...item, key } : item),
    }));
    void runSetting(`${label} assignment`, (protocol) => protocol.setButton(snapshot.profile, buttonId, key));
  };

  return (
    <main className="app-shell">
      <TopBar
        model={MODEL}
        device={device}
        availableDevices={availableDevices}
        hidConnected={hidConnected}
        mouseReady={mouseReady}
        compatibleBrowser={compatibleBrowser}
        busy={busy}
        onConnect={() => void connect()}
        onSwitchDevice={(deviceKey) => void switchDevice(deviceKey)}
      />

      <section className="workspace" id="top">
        <Sidebar model={MODEL} tab={tab} onTabChange={setTab} />

        <div className="content">
          <MouseHero
            model={MODEL}
            snapshot={snapshot}
            connected={connected}
            compatibleBrowser={compatibleBrowser}
            waitingForMouse={hidConnected && !mouseReady}
            busy={busy}
            onSelectProfile={(profile) => void selectProfile(profile)}
          />

          {tab === "performance" && (
            <PerformancePanel
              model={MODEL}
              snapshot={snapshot}
              connected={connected}
              busy={busy}
              activeProductId={device?.productId}
              dpiDirty={dpiDirty}
              onActivateDpiStage={activateDpiStage}
              onUpdateDpi={updateDpi}
              onUpdateDpiColor={updateDpiColor}
              onToggleDpiStage={toggleDpiStage}
              onAddDpiStage={addDpiStage}
              onSaveDpi={() => void saveDpi()}
              onSetPollingRate={setPollingRate}
              onPreviewDebounce={(value) => setSnapshot((current) => ({ ...current, debounceMs: value }))}
              onCommitDebounce={() => void runSetting("Debounce", (protocol) => protocol.setDebounce(snapshot.profile, snapshot.debounceMs))}
              onSetLiftOffDistance={setLiftOffDistance}
              onSetSleepSeconds={setSleepSeconds}
              onSetSensorSetting={setSensorSetting}
              onSetLightingEffect={setLightingEffect}
              onPreviewLightingSpeed={(speed) => setSnapshot((current) => ({ ...current, lightingSpeed: speed }))}
              onCommitLightingSpeed={() => void runSetting("DPI LED speed", (protocol) => protocol.setDpiLightingEffect(snapshot.profile, snapshot.lightingEffect, snapshot.lightingSpeed))}
              onPreviewLightingBrightness={(brightness) => setSnapshot((current) => ({ ...current, lightingBrightness: brightness }))}
              onCommitLightingBrightness={() => void runSetting("DPI LED brightness", (protocol) => protocol.setDpiLightingBrightness(snapshot.profile, snapshot.lightingBrightness))}
              onSetLightingOffWhileMoving={setLightingOffWhileMoving}
            />
          )}

          {tab === "buttons" && (
            <ButtonsPanel
              model={MODEL}
              snapshot={snapshot}
              connected={connected}
              busy={busy}
              onSetAssignment={setButtonAssignment}
            />
          )}

          {tab === "device" && (
            <DevicePanel
              model={MODEL}
              device={device}
              availableDevices={availableDevices}
              snapshot={snapshot}
              connected={connected}
              busy={busy}
              log={log}
              onRefresh={() => protocolRef.current && void loadSnapshot(protocolRef.current)}
              onDisconnect={() => void disconnect()}
              onConnect={() => void connect()}
              onSwitchDevice={(deviceKey) => void switchDevice(deviceKey)}
              pairingState={pairingState}
              onStartPairing={() => void startPairing()}
              onCancelPairing={cancelPairing}
              onResetProfile={() => void resetCurrentProfile()}
            />
          )}

          {tab === "about" && (
            <AboutPanel />
          )}
        </div>
      </section>

      <DriverStatus busy={busy} busyLabel={busyLabel} toasts={toasts} />
    </main>
  );
}
