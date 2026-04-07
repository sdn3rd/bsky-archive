import { useState, useEffect, useRef } from "react";
import config from "virtual:config";
import { fmtNum, fmtDayLong, cleanText } from "../utils/helpers";
const t = config.theme || {};

export default function ReadingMode({ posts, startIndex, onClose }) {
  const [cur, setCur] = useState(startIndex);
  const [closing, setClosing] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { setCur(startIndex); setClosing(false); }, [startIndex]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [cur]);
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") doClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [closing]);

  const doClose = () => { if (closing) return; setClosing(true); setTimeout(onClose, 300); };

  if (!posts.length) return null;
  const post = posts[cur];
  const text = cleanText(post?.record?.text);
  const date = post?.record?.createdAt;
  const hasPrev = cur > 0, hasNext = cur < posts.length - 1;

  return (
    <div onClick={doClose} style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: t.background || "#0e0a1a", cursor: "pointer",
      opacity: closing ? 0 : 1, transition: "opacity .3s ease-out",
      WebkitTapHighlightColor: "transparent", userSelect: "none", WebkitUserSelect: "none",
      pointerEvents: closing ? "none" : "auto",
    }}>
      <div ref={scrollRef} className="no-scrollbar" style={{
        position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden",
        padding: "40px 28px 84px 28px",
      }}>
        <div style={{ maxWidth: 580, width: "100%", margin: "auto", WebkitTouchCallout: "none" }}>
          {date && <div style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: ".68rem",
            color: t.text_accent, marginBottom: 28, textAlign: "center", letterSpacing: ".12em",
          }}>{fmtDayLong(date.slice(0, 10))}</div>}
          <div style={{
            fontFamily: "'Cormorant Garamond',Georgia,serif",
            fontSize: "clamp(1.5rem,4.5vw,2.2rem)", fontWeight: 300, lineHeight: 2.1,
            color: t.text_primary, whiteSpace: "pre-wrap", textAlign: "center",
          }}>{text}</div>
          <div style={{
            display: "flex", justifyContent: "center", gap: 28, marginTop: 36,
            fontFamily: "'JetBrains Mono',monospace", fontSize: "clamp(.85rem,2.5vw,1rem)", color: t.text_muted,
          }}>
            <span>♡ {fmtNum(post?.likeCount)}</span>
            <span>↻ {fmtNum(post?.repostCount)}</span>
          </div>
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: "absolute", bottom: 12, left: 0, right: 0, zIndex: 210,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        maxWidth: 320, margin: "0 auto", padding: "0 20px",
      }}>
        <button disabled={!hasPrev} onClick={() => setCur((c) => c - 1)} style={{
          background: "rgba(0,0,0,.3)", backdropFilter: "blur(10px)",
          border: `1px solid ${t.card_border}`, color: hasPrev ? t.text_secondary : "rgba(255,255,255,.08)",
          width: 56, height: 56, borderRadius: "50%", cursor: hasPrev ? "pointer" : "default", fontSize: "1.3rem",
        }}>←</button>
        <button disabled={!hasNext} onClick={() => setCur((c) => c + 1)} style={{
          background: "rgba(0,0,0,.3)", backdropFilter: "blur(10px)",
          border: `1px solid ${t.card_border}`, color: hasNext ? t.text_secondary : "rgba(255,255,255,.08)",
          width: 56, height: 56, borderRadius: "50%", cursor: hasNext ? "pointer" : "default", fontSize: "1.3rem",
        }}>→</button>
      </div>
    </div>
  );
}
