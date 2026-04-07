import config from "virtual:config";
const t = config.theme || {};

export default function Loading({ loadKey }) {
  return (
    <div key={`l-${loadKey}`} style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{
        fontFamily: "'Cormorant Garamond',serif", fontSize: "1.1rem",
        color: t.loading_color || "#fff", fontStyle: "italic", letterSpacing: ".03em",
        animation: "loadingGlow 1s ease-out forwards",
      }}>Gathering posts</div>
    </div>
  );
}
