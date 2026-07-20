import { Badge } from "./ui";

const CAMPAIGN_COLORS = {
  draft: "gray",
  scheduled: "blue",
  running: "green",
  paused: "amber",
  completed: "green",
  cancelled: "red",
  failed: "red",
  archived: "gray",
};

const MESSAGE_COLORS = {
  pending: "gray",
  queued: "blue",
  sent: "blue",
  delivered: "green",
  read: "purple",
  failed: "red",
  bounced: "red",
  unsubscribed: "amber",
  spam_complaint: "red",
};

const CHANNEL_COLORS = {
  whatsapp: "green",
  email: "blue",
};

const CONTACT_COLORS = {
  active: "green",
  inactive: "gray",
  blocked: "red",
  unsubscribed: "amber",
};

const TEMPLATE_COLORS = {
  approved: "green",
  pending: "amber",
  rejected: "red",
  draft: "gray",
};

const MAPS = {
  campaign: CAMPAIGN_COLORS,
  message: MESSAGE_COLORS,
  contact: CONTACT_COLORS,
  template: TEMPLATE_COLORS,
  channel: CHANNEL_COLORS,
};

export default function StatusBadge({ status, type = "campaign" }) {
  const color = (MAPS[type] || {})[status] || "gray";
  const label = String(status || "").replace(/_/g, " ");
  return <Badge color={color} className="capitalize">{label}</Badge>;
}
