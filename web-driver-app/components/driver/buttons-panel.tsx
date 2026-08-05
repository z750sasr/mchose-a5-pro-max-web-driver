/* eslint-disable @next/next/no-img-element */
import { BUTTON_ACTIONS, BUTTONS, type ButtonActionKey, type DeviceSnapshot } from "../../lib/a5-protocol";
import type { MouseModelDefinition } from "../../lib/mouse-models/types";

export function ButtonsPanel({
  model,
  snapshot,
  connected,
  busy,
  onSetAssignment,
}: {
  model: MouseModelDefinition;
  snapshot: DeviceSnapshot;
  connected: boolean;
  busy: boolean;
  onSetAssignment: (buttonId: number, label: string, action: ButtonActionKey) => void;
}) {
  return (
    <section className="tab-panel" aria-label="Button assignments">
      <div className="section-heading"><div><span className="eyebrow">BUTTONS / PROFILE {snapshot.profile}</span><h2>Make every click yours.</h2></div><p className="section-note">Changes save instantly to the selected onboard profile.</p></div>
      <div className="button-layout">
        <div className="button-mouse-map">
          <div className="map-rings" />
          <img src={model.artwork.src} alt={`${model.name} button map`} width="153" height="251" />
          <span className="map-pin pin-1">1</span><span className="map-pin pin-2">2</span><span className="map-pin pin-3">3</span><span className="map-pin pin-4">4</span><span className="map-pin pin-5">5</span><span className="map-pin pin-6">6</span>
        </div>
        <div className="assignment-list">
          {BUTTONS.map((button, index) => {
            const assignment = snapshot.buttons.find((item) => item.buttonId === button.id);
            return (
              <label className="assignment-row" key={button.id}>
                <span className="assignment-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="assignment-name"><strong>{button.label}</strong><small>Physical input {button.id}</small></span>
                <select value={assignment?.key ?? "disabled"} disabled={!connected || busy} onChange={(event) => onSetAssignment(button.id, button.label, event.target.value as ButtonActionKey)}>
                  {Object.entries(BUTTON_ACTIONS).filter(([key]) => !(button.id === 1 && key === "disabled")).map(([key, action]) => <option value={key} key={key}>{action.label}</option>)}
                </select>
              </label>
            );
          })}
        </div>
      </div>
      <div className="safety-note"><strong>Keep a primary click.</strong><span>Disabling the left button is intentionally blocked so the mouse remains usable.</span></div>
    </section>
  );
}
