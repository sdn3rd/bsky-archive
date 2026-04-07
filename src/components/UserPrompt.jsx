import { useState } from "react";
import config from "virtual:config";
const t = config.theme || {};
const DEFAULT_HANDLE = "tn02.ink";

export default function UserPrompt({ onSubmit, error }) {
  const [handle, setHandle] = useState("");

  const submit = () => {
    const h = handle.trim().replace(/^@/, "");
    onSubmit(h || DEFAULT_HANDLE);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
      padding: "24px",
    }}>
      <div style={{ textAlign: "center", maxWidth: 400, width: "100%" }}>
        <div style={{
          fontFamily: "'Cormorant Garamond',Georgia,serif",
          fontSize: "clamp(2rem,6vw,3.2rem)", fontWeight: 300,
          color: t.text_primary, marginBottom: 12,
        }}>{config.site?.name || "Bluesky Archive"}</div>
        <div style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: ".8rem",
          color: t.text_secondary, marginBottom: 32, letterSpacing: ".04em",
        }}>Enter a Bluesky handle to browse their posts</div>
        {error && <div style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: ".75rem",
          color: "#e06080", marginBottom: 16, padding: "10px 16px",
          background: "rgba(224,96,128,.08)", borderRadius: 10, border: "1px solid rgba(224,96,128,.2)",
        }}>{error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 360, margin: "0 auto" }}>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder={DEFAULT_HANDLE}
            autoFocus
            style={{
              width: "100%", background: "rgba(255,255,255,.06)", border: `1px solid ${t.card_border}`,
              borderRadius: 12, padding: "14px 18px", color: t.text_primary,
              fontFamily: "'JetBrains Mono',monospace", fontSize: ".9rem", outline: "none",
              textAlign: "center",
            }}
          />
          <button onClick={submit} style={{
            width: "100%", background: t.accent_strong, border: "none", borderRadius: 12,
            padding: "14px 24px", color: "#fff",
            fontFamily: "'JetBrains Mono',monospace", fontSize: ".85rem",
            cursor: "pointer", letterSpacing: ".04em",
          }}>Continue</button>
        </div>
      </div>
    </div>
  );
}
