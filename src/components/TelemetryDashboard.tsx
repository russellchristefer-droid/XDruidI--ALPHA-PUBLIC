import { useEffect, useState } from "react";
import { getStoredEvents, clearStoredEvents, setTelemetryOptIn, isTelemetryOptedIn, type TelemetryEvent } from "@/game/telemetry";

export function TelemetryDashboard() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [opted, setOpted] = useState(isTelemetryOptedIn());

  useEffect(() => {
    setEvents(getStoredEvents());
  }, []);

  const refresh = () => setEvents(getStoredEvents());

  const sessions = events.filter(e => e.name === "session_end").length;
  const avgDuration = events.filter(e => e.name === "session_end").reduce((a, e) => a + (e as any).durationSec, 0) / Math.max(1, sessions);
  const portals = events.filter(e => e.name === "portal_visit").length;
  const failures = events.filter(e => e.name === "failure").length;
  const savesOk = events.filter(e => e.name === "save_attempt" && (e as any).success).length;
  const savesFail = events.filter(e => e.name === "save_attempt" && !(e as any).success).length;
  const actions = events.filter(e => e.name === "action").length;

  return (
    <div style={{ padding: 16, fontFamily: "system-ui", maxWidth: 800, margin: "0 auto", color: "#e8dcc8", background: "#1a1612" }}>
      <h1>XDruid Telemetry Dashboard (local)</h1>
      <p>Opt-in only. No personal data. Events stay in this browser unless the optional endpoint is configured.</p>
      <label>
        <input
          type="checkbox"
          checked={opted}
          onChange={(e) => {
            setTelemetryOptIn(e.target.checked);
            setOpted(e.target.checked);
          }}
        />
        Enable telemetry
      </label>
      <button type="button" onClick={refresh} style={{ marginLeft: 12 }}>Refresh</button>
      <button type="button" onClick={() => { clearStoredEvents(); refresh(); }} style={{ marginLeft: 8 }}>Clear</button>
      <h2>Trends</h2>
      <ul>
        <li>Sessions ended: {sessions}</li>
        <li>Avg session length: {avgDuration.toFixed(0)}s</li>
        <li>Actions tracked: {actions}</li>
        <li>Portal visits: {portals}</li>
        <li>Failures: {failures}</li>
        <li>Saves success/fail: {savesOk}/{savesFail}</li>
      </ul>
      <h2>Recent events (last 20)</h2>
      <pre style={{ background: "#2a221c", padding: 8, overflow: "auto", maxHeight: 400 }}>
        {JSON.stringify(events.slice(-20), null, 2)}
      </pre>
    </div>
  );
}
