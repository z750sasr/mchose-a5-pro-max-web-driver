import type { DeviceSnapshot } from "../../lib/a5-protocol";
import type { MouseModelDefinition } from "../../lib/mouse-models/types";

export type SensorSetting = "motionSync" | "rippleControl" | "angleSnap";

type PerformancePanelProps = {
  model: MouseModelDefinition;
  snapshot: DeviceSnapshot;
  connected: boolean;
  busy: boolean;
  activeProductId?: number;
  dpiDirty: boolean;
  onActivateDpiStage: (index: number) => void;
  onUpdateDpi: (index: number, value: number) => void;
  onUpdateDpiColor: (index: number, color: string) => void;
  onToggleDpiStage: (index: number) => void;
  onAddDpiStage: () => void;
  onSaveDpi: () => void;
  onSetPollingRate: (rate: number) => void;
  onPreviewDebounce: (value: number) => void;
  onCommitDebounce: () => void;
  onSetLiftOffDistance: (distance: number) => void;
  onSetSleepSeconds: (seconds: number) => void;
  onSetSensorSetting: (setting: SensorSetting, enabled: boolean) => void;
};

export function PerformancePanel({
  model,
  snapshot,
  connected,
  busy,
  activeProductId,
  dpiDirty,
  onActivateDpiStage,
  onUpdateDpi,
  onUpdateDpiColor,
  onToggleDpiStage,
  onAddDpiStage,
  onSaveDpi,
  onSetPollingRate,
  onPreviewDebounce,
  onCommitDebounce,
  onSetLiftOffDistance,
  onSetSleepSeconds,
  onSetSensorSetting,
}: PerformancePanelProps) {
  const activeConnection = model.connections.find((connection) => connection.productId === activeProductId);
  const unavailablePollingRates = activeConnection?.kind === "wired"
    ? model.capabilities.wiredUnsupportedPollingRates
    : [];

  return (
    <section className="tab-panel" aria-label="Performance settings">
      <div className="section-heading">
        <div><span className="eyebrow">PERFORMANCE / PROFILE {snapshot.profile}</span><h2>Dial in your sensor.</h2></div>
        <div className="save-cluster"><span className={dpiDirty ? "dirty-indicator show" : "dirty-indicator"}>Unsaved DPI changes</span><button className="button primary compact" onClick={onSaveDpi} disabled={!connected || busy || !dpiDirty}>Apply DPI</button></div>
      </div>

      <div className="dpi-grid">
        {snapshot.dpiStages.map((dpi, index) => (
          <article className={snapshot.activeDpiStage === index + 1 ? "dpi-card active" : "dpi-card"} key={`${index}-${snapshot.dpiColors[index]}`}>
            <button className="dpi-active" onClick={() => onActivateDpiStage(index)} disabled={!connected} aria-label={`Make DPI stage ${index + 1} active`}>
              <span style={{ background: snapshot.dpiColors[index] }} /> STAGE {String(index + 1).padStart(2, "0")}
            </button>
            <label><input type="number" min={model.capabilities.dpiStep} max={model.capabilities.maxDpi} step={model.capabilities.dpiStep} value={dpi} disabled={!connected} onChange={(event) => onUpdateDpi(index, Number(event.target.value))} /><small>DPI</small></label>
            <div className="dpi-card-foot">
              <input type="color" aria-label={`Stage ${index + 1} color`} value={snapshot.dpiColors[index]} disabled={!connected} onChange={(event) => onUpdateDpiColor(index, event.target.value)} />
<button 
  onClick={() => onToggleDpiStage(index)} 
  disabled={!connected || snapshot.dpiStages.length === 1}
  style={{
    border: '2px solid #ef4444',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    padding: '6px 14px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: (!connected || snapshot.dpiStages.length === 1) ? 'not-allowed' : 'pointer',
    opacity: (!connected || snapshot.dpiStages.length === 1) ? 0.5 : 1,
    transition: 'all 0.2s ease-in-out'
  }}
>
  REMOVE
</button>            </div>
          </article>
        ))}
        {snapshot.dpiStages.length < model.capabilities.maxDpiStages && <button className="add-stage" onClick={onAddDpiStage} disabled={!connected}><span>＋</span>Add stage</button>}
      </div>

      <div className="control-grid">
        <article className="control-card polling-card">
          <div className="card-head"><span>REPORT RATE</span><strong>{snapshot.pollingRate}<small> HZ</small></strong></div>
          <div className="segment-control">{model.capabilities.pollingRates.map((rate) => <button key={rate} className={snapshot.pollingRate === rate ? "active" : ""} disabled={!connected || busy || unavailablePollingRates.includes(rate)} onClick={() => onSetPollingRate(rate)}>{rate}</button>)}</div>
          <p>{unavailablePollingRates.length ? `${unavailablePollingRates.join(" / ")} Hz is unavailable in wired mode, matching the original driver profile.` : "Available rates follow the active connection profile."}</p>
        </article>

        <article className="control-card range-card">
          <div className="card-head"><span>DEBOUNCE</span><strong>{snapshot.debounceMs}<small> MS</small></strong></div>
          <input type="range" min="0" max="15" value={snapshot.debounceMs} disabled={!connected || busy} onChange={(event) => onPreviewDebounce(Number(event.target.value))} onMouseUp={onCommitDebounce} onTouchEnd={onCommitDebounce} />
          <div className="range-labels"><span>0 ms</span><span>15 ms</span></div>
        </article>

        <article className="control-card lod-card">
          <div className="card-head"><span>LIFT-OFF DISTANCE</span><strong>{snapshot.liftOffDistance}<small> MM</small></strong></div>
          <div className="large-toggle">{[1, 2].map((distance) => <button key={distance} className={snapshot.liftOffDistance === distance ? "active" : ""} disabled={!connected || busy} onClick={() => onSetLiftOffDistance(distance)}><strong>{distance}</strong><small>MM</small></button>)}</div>
        </article>

        <article className="control-card sleep-card">
          <div className="card-head"><span>SLEEP TIMER</span><strong>{snapshot.sleepSeconds === 0xffff ? "OFF" : `${Math.round(snapshot.sleepSeconds / 60)} MIN`}</strong></div>
          <select value={snapshot.sleepSeconds} disabled={!connected || busy} onChange={(event) => onSetSleepSeconds(Number(event.target.value))}>
            {[1, 5, 10, 15, 20, 25, 30].map((minutes) => <option value={minutes * 60} key={minutes}>{minutes} minute{minutes === 1 ? "" : "s"}</option>)}
            <option value={0xffff}>Never sleep</option>
          </select>
          <p>Stored globally on the mouse.</p>
        </article>

        <article className="control-card sensor-card wide-card">
          <div className="card-head"><span>SENSOR PROCESSING</span><strong>{model.hero.sensor}</strong></div>
          <div className="toggle-list">
            <Toggle label="Motion Sync" description="Align sensor frames with USB reports." enabled={snapshot.motionSync} disabled={!connected || busy} onChange={(enabled) => onSetSensorSetting("motionSync", enabled)} />
            <Toggle label="Ripple Control" description="Smooth high-DPI sensor noise." enabled={snapshot.rippleControl} disabled={!connected || busy} onChange={(enabled) => onSetSensorSetting("rippleControl", enabled)} />
            <Toggle label="Angle Snapping" description="Straighten near-horizontal movement." enabled={snapshot.angleSnap} disabled={!connected || busy} onChange={(enabled) => onSetSensorSetting("angleSnap", enabled)} />
          </div>
        </article>
      </div>
    </section>
  );
}

function Toggle({ label, description, enabled, disabled, onChange }: { label: string; description: string; enabled: boolean; disabled: boolean; onChange: (enabled: boolean) => void }) {
  return <label className="toggle-row"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={enabled} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /><i aria-hidden="true" /></label>;
}
