import type { PairingUiState } from "./types";

const PAIRING_MESSAGES: Record<PairingUiState, string> = {
  idle: "Ready to pair an approved A5 receiver.",
  starting: "Starting the receiver pairing channel…",
  waiting: "Searching for the mouse. Keep it close to the receiver.",
  success: "Pairing completed successfully.",
  failed: "The receiver reported that pairing failed. Put the mouse in pairing mode and try again.",
  timeout: "No mouse was found within 30 seconds. Pairing was stopped safely.",
  cancelled: "Pairing was cancelled.",
};

export function DeviceActions({
  profile,
  hasReceiver,
  connected,
  busy,
  pairingState,
  canResetProfile,
  onStartPairing,
  onCancelPairing,
  onResetProfile,
}: {
  profile: number;
  hasReceiver: boolean;
  connected: boolean;
  busy: boolean;
  pairingState: PairingUiState;
  canResetProfile: boolean;
  onStartPairing: () => void;
  onCancelPairing: () => void;
  onResetProfile: () => void;
}) {
  const pairing = pairingState === "starting" || pairingState === "waiting";

  return (
    <>
      <article className="device-card pairing-card">
        <span className="eyebrow">DONGLE PAIRING</span>
        <h3>Pair the 2.4G receiver.</h3>
        <ol className="pairing-steps">
          <li>Disconnect the USB cable and switch the mouse to 2.4G mode.</li>
          <li>Hold left + middle + right click for 3 seconds until the indicator flashes quickly.</li>
          <li>Keep the mouse close to the receiver, then start pairing.</li>
        </ol>
        <div className={`pairing-status pairing-${pairingState}`} role="status" aria-live="polite">
          <span aria-hidden="true" />
          {PAIRING_MESSAGES[pairingState]}
        </div>
        <div className="device-action-buttons">
          {pairing ? (
            <button className="button danger compact" onClick={onCancelPairing}>Cancel pairing</button>
          ) : (
            <button className="button primary compact" disabled={!hasReceiver || busy} onClick={onStartPairing}>Start pairing</button>
          )}
        </div>
        {!hasReceiver && <p className="device-action-note">Approve and plug in an A5 1K or 4K receiver before pairing.</p>}
      </article>

      <article className="device-card reset-card">
        <span className="eyebrow">DEFAULT SETTINGS</span>
        <h3>Restore profile {profile}.</h3>
        <p>This sends the stock per-profile reset command to onboard memory. It restores the current profile&apos;s DPI, lighting, sensor, and button defaults without changing the other two profiles.</p>
        <div className="reset-scope">
          <span>Reset target</span>
          <strong>ONBOARD PROFILE {profile}</strong>
        </div>
        <button
          className="button danger compact"
          disabled={!connected || busy || !canResetProfile}
          onClick={onResetProfile}
        >
          Restore profile defaults
        </button>
        <p className="device-action-note">You will be asked to confirm. This cannot be undone from the web driver.</p>
      </article>
    </>
  );
}
