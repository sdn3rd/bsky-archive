import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import config from "virtual:config";
import { fmtDayShort } from "../utils/helpers";
const t = config.theme || {};

export default function Slider({ feedItems, mainRef, archRef, onScrub }) {
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  const isDragging = useRef(false);
  const [frac, setFrac] = useState(0);

  // Compute scroll fraction from scroll position
  const computeFrac = useCallback(() => {
    const el = mainRef?.current;
    const arch = archRef?.current;
    if (!el || !arch) return 0;
    const st = el.scrollTop;
    const aTop = arch.offsetTop;
    const aH = arch.scrollHeight;
    const vH = el.clientHeight;
    return Math.max(0, Math.min(1, (st - aTop + vH) / aH));
  }, [mainRef, archRef]);

  // Listen to scroll events directly on the main container
  useEffect(() => {
    const el = mainRef?.current;
    if (!el) return;
    const onScroll = () => {
      if (!isDragging.current) {
        const f = computeFrac();
        setFrac(f);
        // Also update thumb directly for instant response
        if (thumbRef.current) thumbRef.current.style.top = `${f * 100}%`;
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [mainRef, computeFrac]);

  const dayMarks = useMemo(() => {
    const m = [], total = feedItems.length;
    feedItems.forEach((it, i) => {
      if (it.type === "header") m.push({ date: it.date, frac: total > 1 ? i / (total - 1) : 0 });
    });
    return m;
  }, [feedItems]);

  const scrubFromY = useCallback((clientY) => {
    if (!trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (clientY - r.top) / r.height));
    setFrac(f);
    if (thumbRef.current) thumbRef.current.style.top = `${f * 100}%`;
    onScrub(f);
  }, [onScrub]);

  useEffect(() => {
    const onMove = (e) => { if (isDragging.current) { e.preventDefault(); scrubFromY(e.clientY); } };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [scrubFromY]);

  const onDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    scrubFromY(e.clientY);
  };

  const filtered = dayMarks.filter((_, i, arr) => {
    if (arr.length <= 8) return true;
    const step = Math.ceil(arr.length / 8);
    return i % step === 0 || i === arr.length - 1;
  });

  return (
    <div
      onPointerDown={onDown}
      style={{
        width: 44, height: "100%", cursor: "pointer",
        userSelect: "none", touchAction: "none",
        display: "flex", alignItems: "stretch", justifyContent: "center",
        padding: "24px 0",
      }}
    >
      <div ref={trackRef} style={{
        position: "relative", width: 3, borderRadius: 2,
        background: "rgba(255,255,255,.08)",
      }}>
        <div ref={thumbRef} style={{
          position: "absolute", left: "50%",
          top: `${frac * 100}%`,
          transform: "translate(-50%,-50%)",
          width: 14, height: 14, borderRadius: "50%",
          background: t.accent_strong || "#4a9ade",
          boxShadow: `0 0 8px ${t.accent || "rgba(100,160,230,.5)"}`,
          zIndex: 2,
        }} />
        {filtered.map((m) => {
          const near = Math.abs(m.frac - frac) < .08;
          return (
            <div key={m.date} style={{
              position: "absolute", top: `${m.frac * 100}%`, left: 14,
              transform: "translateY(-50%)", whiteSpace: "nowrap",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: near ? ".52rem" : ".44rem",
              color: near ? (t.text_secondary || "rgba(180,190,210,.65)") : (t.text_muted || "rgba(140,150,170,.3)"),
              transition: "all .2s",
            }}>{fmtDayShort(m.date)}</div>
          );
        })}
      </div>
    </div>
  );
}
