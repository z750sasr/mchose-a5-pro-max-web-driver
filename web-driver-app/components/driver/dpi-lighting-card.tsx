import type { DeviceSnapshot } from "../../lib/a5-protocol";
import type { MouseModelDefinition } from "../../lib/mouse-models/types";

export function DpiLightingCard({
  model,
  snapshot,
  connected,
  busy,
  onSetEffect,
  onPreviewSpeed,
  onCommitSpeed,
  onPreviewBrightness,
  onCommitBrightness,
  onSetOffWhileMoving,
}: {
  model: MouseModelDefinition;
  snapshot: DeviceSnapshot;
  connected: boolean;
  busy: boolean;
  onSetEffect: (effect: number) => void;
  onPreviewSpeed: (speed: number) => void;
  onCommitSpeed: () => void;
  onPreviewBrightness: (brightness: number) => void;
  onCommitBrightness: () => void;
  onSetOffWhileMoving: (enabled: boolean) => void;
}) {
  const lighting = model.capabilities.dpiLighting;
  const activeEffect = lighting.effects.find((effect) => effect.id === snapshot.lightingEffect);

  return (
    <article className="control-card lighting-card wide-card">
      <div className="card-head lighting-card-head">
        <span>DPI LED EFFECT</span>
        <strong>{activeEffect?.label ?? "Custom"}</strong>
      </div>

      <div className="lighting-effect-options" aria-label="DPI LED effect">
        {lighting.effects.map((effect) => (
          <button
            key={effect.id}
            className={snapshot.lightingEffect === effect.id ? "active" : ""}
            disabled={!connected || busy}
            onClick={() => onSetEffect(effect.id)}
          >
            <span className={`effect-preview effect-${effect.id}`} aria-hidden="true" />
            <strong>{effect.label}</strong>
            <small>{effect.speedEnabled ? "Animated" : effect.id === 0 ? "LED disabled" : "Steady color"}</small>
          </button>
        ))}
      </div>

      <div className="lighting-settings">
        <label className="lighting-range">
          <span><strong>Effect speed</strong><small>{snapshot.lightingSpeed} ms</small></span>
          <input
            type="range"
            min={lighting.minSpeed}
            max={lighting.maxSpeed}
            value={snapshot.lightingSpeed}
            disabled={!connected || busy || !activeEffect?.speedEnabled}
            onChange={(event) => onPreviewSpeed(Number(event.target.value))}
            onMouseUp={onCommitSpeed}
            onTouchEnd={onCommitSpeed}
          />
        </label>

        <label className="lighting-range">
          <span><strong>LED brightness</strong><small>{snapshot.lightingBrightness}%</small></span>
          <input
            type="range"
            min="0"
            max="100"
            value={snapshot.lightingBrightness}
            disabled={!connected || busy || snapshot.lightingEffect === 0}
            onChange={(event) => onPreviewBrightness(Number(event.target.value))}
            onMouseUp={onCommitBrightness}
            onTouchEnd={onCommitBrightness}
          />
        </label>

        {lighting.movementControl && (
          <label className="toggle-row lighting-movement-toggle">
            <span>
              <strong>Turn off while moving</strong>
              <small>Reduce lighting activity while the sensor detects movement.</small>
            </span>
            <input
              type="checkbox"
              checked={snapshot.lightingOffWhileMoving}
              disabled={!connected || busy || snapshot.lightingEffect === 0}
              onChange={(event) => onSetOffWhileMoving(event.target.checked)}
            />
            <i aria-hidden="true" />
          </label>
        )}
      </div>
    </article>
  );
}
