import config from "virtual:config";

export const BSKY_API = "https://public.api.bsky.app";

export function fmtNum(n) {
  return n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : String(n ?? 0);
}

export function fmtDayShort(iso) {
  try { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(iso + "T12:00:00")); }
  catch { return iso; }
}

export function fmtDayLong(iso) {
  try { return new Intl.DateTimeFormat("en", { year: "numeric", month: "long", day: "numeric" }).format(new Date(iso + "T12:00:00")); }
  catch { return iso; }
}

function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export function cleanBio(raw) {
  if (!raw) return "";
  let text = raw;
  (config.bio_exclude || []).forEach((p) => { text = text.replace(new RegExp(escRe(p), "gi"), ""); });
  return text.replace(/^\s*\n+/, "").replace(/\n\s*$/, "").trim();
}

export function cleanText(raw) {
  if (!raw) return "";
  let text = raw;
  (config.excluded_words || []).forEach((w) => { text = text.replace(new RegExp(escRe(w), "gi"), ""); });
  return text.trim();
}

export function matchesFilter(post) {
  if (!post?.record?.text) return false;
  const txt = post.record.text;
  const isReply = !!post.record.reply;
  const tags = isReply ? (config.reply_tags || []) : (config.post_tags || []);
  if (tags.length === 0) return true;
  return tags.some((tag) => new RegExp(escRe(tag), "i").test(txt));
}

export function buildFeed(posts) {
  const items = [];
  let lastDay = null, idx = 0;
  posts.forEach((p) => {
    const day = p.record?.createdAt?.slice(0, 10);
    if (day && day !== lastDay) { items.push({ type: "header", date: day }); lastDay = day; }
    items.push({ type: "post", post: p, index: idx, date: day });
    idx++;
  });
  return items;
}
