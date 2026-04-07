import config from "virtual:config";
const t = config.theme || {};
const lc = t.loading_color || "rgba(220,200,240,.6)";

function spotKeyframes() {
  return (config.spotlights || []).map((_, i) => `
@keyframes spotDrift${i}{
  0%{transform:translate(0,0) scale(1) rotate(0deg)}
  33%{transform:translate(${12+i*5}vw,${10+i*4}vh) scale(${1.12+i*.04}) rotate(${6+i*2}deg)}
  66%{transform:translate(${-10-i*4}vw,${-8-i*3}vh) scale(${.88-i*.02}) rotate(${-4-i*2}deg)}
  100%{transform:translate(0,0) scale(1) rotate(0deg)}
}`).join("\n");
}

export const CSS = `
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
@keyframes slowPulse{0%,100%{opacity:.25}50%{opacity:.6}}
@keyframes loadingGlow{
  0%{opacity:0;text-shadow:0 0 0 transparent}
  50%{opacity:.7;text-shadow:0 0 20px ${lc},0 0 50px ${lc}}
  100%{opacity:1;text-shadow:0 0 30px ${lc},0 0 70px ${lc},0 0 130px ${lc}}
}
${spotKeyframes()}
.is-scrolling .spot-orb{animation-play-state:paused!important}
.spot-orb{will-change:transform}
.hero-parallax{will-change:transform,opacity}
::selection{background:rgba(120,60,200,.4);color:#fff}
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
.no-scrollbar{scrollbar-width:none;-ms-overflow-style:none}
.no-scrollbar::-webkit-scrollbar{display:none}
`;
