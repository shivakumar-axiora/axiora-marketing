export const cx = (...args) => args.filter(Boolean).join(" ");

export function formatDate(iso, opts = {}) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", ...opts });
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function timeAgo(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const units = [
    [60, "s"], [60, "m"], [24, "h"], [7, "d"], [4.34, "w"], [12, "mo"], [Infinity, "y"],
  ];
  let value = diff;
  let unit = "s";
  let acc = 1;
  for (const [div, label] of units) {
    if (value < div * acc) { unit = label; break; }
    acc *= div;
  }
  return `${Math.max(1, Math.floor(diff / acc))}${unit} ago`;
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function initials(name = "") {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export const prettyRole = (r) =>
  ({ admin: "Admin", marketing_manager: "Marketing Manager", executive: "Executive" }[r] || r);
