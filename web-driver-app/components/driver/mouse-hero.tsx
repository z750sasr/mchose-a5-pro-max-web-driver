/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import type { DeviceSnapshot } from "../../lib/a5-protocol";
import type { MouseModelDefinition } from "../../lib/mouse-models/types";

export function MouseHero({
  model,
  snapshot,
  connected,
  compatibleBrowser,
  busy,
  onSelectProfile,
}: {
  model: MouseModelDefinition;
  snapshot: DeviceSnapshot;
  connected: boolean;
  compatibleBrowser: boolean;
  busy: boolean;
  onSelectProfile: (profile: number) => void;
}) {
  const profiles = Array.from({ length: model.capabilities.profiles }, (_, index) => index + 1);

  return (
    <section className="device-hero">
      <div className="hero-copy">
        <span className="eyebrow">{model.hero.eyebrow}</span>
        <h1>{model.hero.titleLines.map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1>
        <p>{model.hero.description}</p>
        {!compatibleBrowser && (
          <div className="browser-warning">Use desktop Chrome or Edge over HTTPS to connect with WebHID.</div>
        )}
      </div>

      <div className="mouse-stage" aria-label={`${model.name} mouse illustration`}>
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <span className="axis axis-x" />
        <span className="axis axis-y" />
        <img src={model.artwork.src} alt={model.artwork.alt} width="153" height="251" />
        <div className="mouse-callout top-callout"><span>{model.hero.sensor}</span><small>SENSOR</small></div>
        <div className="mouse-callout bottom-callout"><span>{model.hero.weight}</span><small>WEIGHT</small></div>
      </div>

      <div className="quick-stats">
        <div className="battery-stat">
          <div className="battery-ring" style={{ "--battery": `${connected ? snapshot.battery : 0}%` } as CSSProperties}>
            <span>{connected ? snapshot.battery : "—"}<small>{connected ? "%" : ""}</small></span>
          </div>
          <div><strong>{snapshot.charging ? "Charging" : "Battery"}</strong><small>{connected ? "Live receiver read" : "Connect to read"}</small></div>
        </div>
        <div className="stat-row"><span>REPORT RATE</span><strong>{connected ? snapshot.pollingRate : "—"} <small>{connected ? "HZ" : ""}</small></strong></div>
        <div className="stat-row"><span>FIRMWARE</span><strong>{snapshot.firmware}</strong></div>
        <div className="profile-switch" aria-label="Onboard profile">
          <span>ONBOARD PROFILE</span>
          <div>{profiles.map((profile) => <button key={profile} className={snapshot.profile === profile ? "active" : ""} onClick={() => onSelectProfile(profile)} disabled={!connected || busy}>{profile}</button>)}</div>
        </div>
      </div>
    </section>
  );
}
