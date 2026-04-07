import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import config from "virtual:config";
import { CSS } from "./styles";
import { BSKY_API, fmtNum, fmtDayLong, cleanBio, cleanText, matchesFilter, buildFeed } from "./utils/helpers";
import Spotlights from "./components/Spotlights";
import Slider from "./components/Slider";
import ReadingMode from "./components/ReadingMode";
import UserPrompt from "./components/UserPrompt";
import Loading from "./components/Loading";

const t = config.theme || {};

export default function App() {
  const [actor, setActor] = useState(config.actor || "");
  const [posts, setPosts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gathering, setGathering] = useState(false);
  const [ready, setReady] = useState(false);
  const [splashOut, setSplashOut] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [error, setError] = useState(null);
  const [promptError, setPromptError] = useState(null);
  const [mx, setMx] = useState(0.5);
  const [my, setMy] = useState(0.5);
  const [readingMode, setReadingMode] = useState(null);
  const [gyroEnabled, setGyroEnabled] = useState(false);

  const mainRef = useRef(null);
  const archRef = useRef(null);
  const rootRef = useRef(null);
  const heroHeaderRef = useRef(null);
  const heroLogoRef = useRef(null);
  const heroSubRef = useRef(null);
  const heroBioRef = useRef(null);
  const heroHintRef = useRef(null);
  const scrollTimer = useRef(null);
  const splashStart = useRef(0);
  const actorRef = useRef(actor);
  actorRef.current = actor;

  const feedItems = useMemo(() => buildFeed(posts), [posts]);
  const isDemo = !config.actor;

  // ─── Dismiss splash when data arrives (min 1s) ───
  useEffect(() => {
    if (ready || !actor) return;
    if (error && isDemo) {
      setPromptError(error); setActor(""); setError(null);
      setLoading(false); setReady(false); setSplashOut(false);
      return;
    }
    if (error && !isDemo) { setSplashOut(true); setTimeout(() => setReady(true), 400); return; }
    if (!profile && posts.length === 0) return;
    if (!profile && !loading) return;
    const elapsed = Date.now() - splashStart.current;
    const go = () => { setSplashOut(true); setTimeout(() => setReady(true), 400); };
    if (elapsed >= 1000) go(); else setTimeout(go, 1000 - elapsed);
  }, [profile, posts.length, ready, error, actor, loading]);

  // ─── Fallback: dismiss splash after 8s ───
  useEffect(() => {
    if (!actor || ready) return;
    const tm = setTimeout(() => { if (!ready) { setSplashOut(true); setTimeout(() => setReady(true), 400); } }, 8000);
    return () => clearTimeout(tm);
  }, [actor, ready]);

  // ─── Scroll handler: DOM refs, no re-renders ───
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    let ticking = false;
    const update = (st) => {
      const vh = window.innerHeight;
      const heroP = Math.max(0, Math.min(1, st / (vh * 0.5)));
      if (heroHeaderRef.current) {
        const h = heroHeaderRef.current;
        h.style.opacity = heroP;
        h.style.backdropFilter = heroP > .05 ? `blur(${heroP * 10}px)` : "none";
        h.style.pointerEvents = heroP > .3 ? "auto" : "none";
      }
      if (heroLogoRef.current) heroLogoRef.current.style.opacity = 1 - heroP;
      if (heroSubRef.current) {
        heroSubRef.current.style.transform = `translateY(${st * .5}px) scale(${1 + heroP * .5})`;
        heroSubRef.current.style.opacity = Math.max(0, 1 - heroP * 1.5);
      }
      if (heroBioRef.current) {
        const vis = Math.max(0, (1 - heroP) * 100);
        heroBioRef.current.style.opacity = Math.max(0, 1 - heroP * 1.2);
        heroBioRef.current.style.maskImage = `linear-gradient(to bottom, black ${vis}%, transparent ${vis + 15}%)`;
        heroBioRef.current.style.webkitMaskImage = `linear-gradient(to bottom, black ${vis}%, transparent ${vis + 15}%)`;
        heroBioRef.current.style.transform = `translateY(${st * .25}px)`;
      }
      if (heroHintRef.current) heroHintRef.current.style.opacity = Math.max(0, 1 - heroP * 3);
    };
    const onScroll = () => {
      if (rootRef.current && !rootRef.current.classList.contains("is-scrolling"))
        rootRef.current.classList.add("is-scrolling");
      clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => {
        if (rootRef.current) rootRef.current.classList.remove("is-scrolling");
        update(el.scrollTop);
      }, 150);
      if (!ticking) {
        requestAnimationFrame(() => { update(el.scrollTop); ticking = false; });
        ticking = true;
      } else if (el.scrollTop < 10) update(el.scrollTop);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // ─── Mouse / gyro / touch ───
  const lastFrame = useRef(0);
  const throttle = useCallback((fn) => { const now = Date.now(); if (now - lastFrame.current < 33) return; lastFrame.current = now; fn(); }, []);
  useEffect(() => { const h = (e) => { throttle(() => { setMx(e.clientX / window.innerWidth); setMy(e.clientY / window.innerHeight); }); }; window.addEventListener("mousemove", h); return () => window.removeEventListener("mousemove", h); }, [throttle]);
  useEffect(() => {
    const h = (e) => { throttle(() => { setMx(Math.max(0, Math.min(1, ((e.gamma || 0) + 45) / 90))); setMy(Math.max(0, Math.min(1, ((e.beta || 0) - 20) / 70))); }); };
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission !== "function") {
      window.addEventListener("deviceorientation", h, true); setGyroEnabled(true);
    }
    window.__enableGyro = async () => {
      if (typeof DeviceOrientationEvent?.requestPermission === "function") {
        try { if ((await DeviceOrientationEvent.requestPermission()) === "granted") { window.addEventListener("deviceorientation", h, true); setGyroEnabled(true); } } catch {}
      }
    };
    return () => window.removeEventListener("deviceorientation", h, true);
  }, [throttle]);
  useEffect(() => { const h = (e) => { if (gyroEnabled) return; throttle(() => { const tc = e.touches[0]; if (tc) { setMx(tc.clientX / window.innerWidth); setMy(tc.clientY / window.innerHeight); } }); }; window.addEventListener("touchmove", h, { passive: true }); return () => window.removeEventListener("touchmove", h); }, [gyroEnabled, throttle]);

  // ─── Data fetching ───
  const fetchFeed = useCallback(async (cur) => {
    const handle = actorRef.current;
    if (!handle) return;
    setLoading(true); setError(null);
    if (cur) { setGathering(true); setLoadKey((k) => k + 1); }
    const start = Date.now();
    try {
      const p = new URLSearchParams({ actor: handle, limit: "100", filter: "posts_with_replies" });
      if (cur) p.set("cursor", cur);
      const resp = await fetch(`${BSKY_API}/xrpc/app.bsky.feed.getAuthorFeed?${p}`);
      if (!resp.ok) throw new Error(resp.status === 400 ? "Handle not found" : "Failed to load feed");
      const data = await resp.json();
      const np = (data.feed || []).filter((item) => !item.reason && matchesFilter(item.post)).map((item) => item.post);
      if (cur) { const el = Date.now() - start; if (el < 1000) await new Promise((r) => setTimeout(r, 1000 - el)); }
      setPosts((prev) => cur ? [...prev, ...np] : np);
      setCursor(data.cursor || null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setGathering(false); }
  }, []);

  const fetchProfile = useCallback(async (handle) => {
    try { const resp = await fetch(`${BSKY_API}/xrpc/app.bsky.actor.getProfile?actor=${handle}`); if (resp.ok) setProfile(await resp.json()); } catch {}
  }, []);

  // ─── Trigger fetch when actor changes ───
  useEffect(() => {
    if (!actor) return;
    splashStart.current = Date.now();
    setReady(false); setSplashOut(false); setPosts([]); setProfile(null);
    setCursor(null); setError(null); setPromptError(null);
    fetchProfile(actor); fetchFeed(null);
  }, [actor]);

  const handleScrub = useCallback((frac) => {
    if (!mainRef.current || !archRef.current) return;
    const aTop = archRef.current.offsetTop, aH = archRef.current.scrollHeight, vH = mainRef.current.clientHeight;
    mainRef.current.scrollTop = Math.max(0, aTop - vH + frac * aH);
  }, []);

  const bioText = cleanBio(profile?.description) || "";
  const displayName = profile?.displayName || actor;

  // ─── Demo prompt ───
  if (!actor) {
    return (
      <div style={{ width: "100%", height: "100vh", overflow: "hidden", fontFamily: "'Inter',system-ui,sans-serif", color: t.text_primary }}>
        <style>{CSS}</style>
        <Spotlights mx={mx} my={my} />
        <UserPrompt onSubmit={(h) => { setPromptError(null); setActor(h); }} error={promptError} />
      </div>
    );
  }

  return (
    <div ref={rootRef} style={{ width: "100%", height: "100vh", overflow: "hidden", fontFamily: "'Inter',system-ui,sans-serif", color: t.text_primary }}>
      <style>{CSS}</style>
      <Spotlights mx={mx} my={my} />

      {/* Splash */}
      {!ready && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
          opacity: splashOut ? 0 : 1, transition: "opacity .4s ease-out",
        }}>
          <Loading loadKey={0} />
        </div>
      )}

      {readingMode !== null && <ReadingMode posts={posts} startIndex={readingMode} onClose={() => setReadingMode(null)} />}

      {/* Fixed header */}
      <div ref={heroHeaderRef} style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, display: "flex", justifyContent: "center", alignItems: "center", padding: "12px 24px", opacity: 0, pointerEvents: "none", visibility: ready ? "visible" : "hidden", background: `linear-gradient(${t.background || "#0e0a1a"}e0, transparent)` }}>
        <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(1.2rem,3.5vw,1.8rem)", fontWeight: 300, color: t.text_primary }}>{displayName}</span>
      </div>

      <div ref={mainRef} className="no-scrollbar" style={{ position: "relative", zIndex: 1, height: "100vh", overflowY: "auto", overflowX: "hidden", opacity: ready ? 1 : 0, transition: "opacity .5s ease-out" }}>

        {/* Hero */}
        <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 24px", position: "relative" }}>
          <div style={{ textAlign: "center", maxWidth: 560, transform: `translate(${(mx - .5) * -60}px,${(my - .5) * -60}px)`, transition: "transform .2s ease-out" }}>
            <div ref={heroLogoRef} className="hero-parallax" style={{ animation: "slideUp 1s ease-out", marginBottom: 20 }}>
              <span style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(2.5rem,8vw,5rem)", fontWeight: 300, color: t.text_primary }}>{displayName}</span>
            </div>
            {profile?.followersCount != null && (
              <div ref={heroSubRef} className="hero-parallax" style={{ animation: "slideUp 1.3s ease-out", marginBottom: 40 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".8rem", color: t.text_muted }}>
                  {fmtNum(profile.followersCount)} followers · {fmtNum(profile.postsCount)} posts
                </span>
              </div>
            )}
            {config.show_bio && bioText && (
              <div ref={heroBioRef} className="hero-parallax" style={{ animation: "slideUp 1.6s ease-out" }}>
                <p style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(1.1rem,3vw,1.45rem)", fontWeight: 300, fontStyle: "italic", lineHeight: 2.1, color: t.text_secondary, whiteSpace: "pre-wrap" }}>{bioText}</p>
              </div>
            )}
          </div>
          <div ref={heroHintRef} style={{ position: "absolute", bottom: 28, animation: "slowPulse 3s ease-in-out infinite", fontFamily: "'JetBrains Mono',monospace", fontSize: ".6rem", color: t.text_muted, letterSpacing: ".25em" }}>▼ posts</div>
        </section>

        {/* Archive */}
        <section ref={archRef} style={{ position: "relative", minHeight: "100vh" }}>
          <div style={{ padding: "40px 24px 80px 24px", maxWidth: 620, margin: "0 auto" }}>
            {error && posts.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.1rem", color: t.text_muted, fontStyle: "italic", marginBottom: 18 }}>Failed to load posts.</div>
                {isDemo && <button onClick={() => { setActor(""); setError(null); }} style={{ background: "none", border: `1px solid ${t.card_border}`, color: t.accent, fontFamily: "'JetBrains Mono',monospace", fontSize: ".72rem", padding: "7px 22px", borderRadius: 18, cursor: "pointer", marginRight: 10 }}>← Back</button>}
                <button onClick={() => { setError(null); fetchProfile(actor); fetchFeed(null); }} style={{ background: "none", border: `1px solid ${t.card_border}`, color: t.accent, fontFamily: "'JetBrains Mono',monospace", fontSize: ".72rem", padding: "7px 22px", borderRadius: 18, cursor: "pointer" }}>Retry</button>
              </div>
            )}
            {feedItems.map((item, i) => {
              if (item.type === "header") return <div key={`h-${item.date}`} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".7rem", color: t.text_accent, padding: "32px 0 16px", textAlign: "center", letterSpacing: ".14em" }}>{fmtDayLong(item.date)}</div>;
              const p = item.post, text = cleanText(p.record?.text);
              return (
                <div key={p.uri || i} onClick={() => setReadingMode(item.index)}
                  style={{ background: t.card_bg, border: `1px solid ${t.card_border}`, borderRadius: 14, padding: "26px", marginBottom: 14, cursor: "pointer", transition: "all .4s ease", position: "relative", overflow: "hidden", WebkitTapHighlightColor: "transparent", userSelect: "none", WebkitUserSelect: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.card_border_hover; e.currentTarget.style.boxShadow = `0 12px 50px ${t.card_glow}`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.card_border; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, width: 2, height: "100%", background: `linear-gradient(180deg,${t.card_accent},${t.accent})`, opacity: .4 }} />
                  <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(.98rem,2.4vw,1.12rem)", lineHeight: 1.9, color: t.text_primary, whiteSpace: "pre-wrap" }}>{text}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, fontFamily: "'JetBrains Mono',monospace", fontSize: "clamp(.82rem,2.2vw,.95rem)", color: t.text_muted }}>
                    <div style={{ display: "flex", gap: 18 }}><span>♡ {fmtNum(p.likeCount)}</span><span>↻ {fmtNum(p.repostCount)}</span></div>
                    <span style={{ color: t.text_accent, fontSize: "clamp(.65rem,1.6vw,.78rem)" }}>tap to read ↗</span>
                  </div>
                </div>
              );
            })}
            {!gathering && cursor && (
              <div style={{ textAlign: "center", padding: "28px 0" }}>
                <button onClick={() => fetchFeed(cursor)} style={{ background: "none", border: `1px solid ${t.card_border}`, color: t.accent, fontFamily: "'JetBrains Mono',monospace", fontSize: ".7rem", padding: "7px 20px", borderRadius: 18, cursor: "pointer" }}>More →</button>
              </div>
            )}
            {gathering && <Loading loadKey={loadKey} />}
          </div>
          {posts.length > 0 && <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, zIndex: 30 }}><Slider feedItems={feedItems} mainRef={mainRef} archRef={archRef} onScrub={handleScrub} /></div>}
        </section>

        <footer style={{ textAlign: "center", padding: "36px 24px 50px", fontFamily: "'JetBrains Mono',monospace", fontSize: ".58rem", color: t.text_muted, letterSpacing: ".14em" }}>
          {config.site?.name || "Bluesky Archive"} · {new Date().getFullYear()}
        </footer>
      </div>

      {/* Floating footer */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", background: `linear-gradient(transparent, ${t.background || "#0e0a1a"} 40%)`, backdropFilter: "blur(6px)", pointerEvents: "none", opacity: ready ? 1 : 0, transition: "opacity .5s ease-out" }}>
        <span style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: ".7rem", color: t.text_muted, letterSpacing: ".06em", pointerEvents: "auto" }}>© {new Date().getFullYear()}</span>
        <a href={`https://bsky.app/profile/${actor}`} target="_blank" rel="noopener noreferrer" style={{ pointerEvents: "auto", opacity: .35, transition: "opacity .3s", display: "flex", alignItems: "center" }} onMouseEnter={(e) => e.currentTarget.style.opacity = ".7"} onMouseLeave={(e) => e.currentTarget.style.opacity = ".35"}>
          <svg width="22" height="22" viewBox="0 0 600 530" fill="#ffffff" xmlns="http://www.w3.org/2000/svg"><path d="M135.72 44.03C202.216 93.951 273.74 195.17 300 249.49c26.262-54.316 97.782-155.54 164.28-205.46C512.26 8.009 590-19.862 590 68.825c0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.38-3.69-10.832-3.708-7.896-.017-2.936-1.193.516-3.707 7.896-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.256 82.697-152.22-67.108 11.421-142.549-7.449-163.25-81.433C20.15 217.613 10 86.536 10 68.824c0-88.687 77.742-60.816 125.72-24.795z" /></svg>
        </a>
      </div>
    </div>
  );
}
