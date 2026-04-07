import { memo } from "react";
import config from "virtual:config";

export default memo(function Spotlights({ mx, my }) {
  const spots = config.spotlights || [];
  const px = (mx - .5) * 60, py = (my - .5) * 60;

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0, background: config.theme?.background || "#0e0a1a" }}>
      {spots.map((spot, i) => {
        const pos = spot.position || {};
        return (
          <div key={i} style={{
            position: "absolute", top: pos.top, left: pos.left, right: pos.right, bottom: pos.bottom,
            width: spot.size, height: spot.size,
            transform: `translate(${px * (.3 + i * .1)}px, ${py * (.3 + i * .1)}px)`,
          }}>
            <div className="spot-orb" style={{
              width: "100%", height: "100%", borderRadius: "50%",
              background: `radial-gradient(circle, ${spot.color} 0%, transparent 70%)`,
              filter: `blur(${spot.blur || 80}px)`,
              animation: `spotDrift${i} ${spot.speed || 20}s ease-in-out infinite`,
              animationDelay: `${-i * 5}s`,
            }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", inset: 0, opacity: config.background_noise || .03, mixBlendMode: "overlay", backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "200px 200px" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,${config.background_vignette || .5}) 100%)` }} />
    </div>
  );
});
