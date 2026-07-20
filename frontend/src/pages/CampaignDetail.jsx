import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiSend, FiPause, FiPlay, FiX, FiRefreshCw, FiCopy, FiEdit2, FiArchive,
  FiCheckCircle, FiXCircle, FiClock, FiEye,
} from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { Card, Spinner, ProgressBar, CircularProgress, EmptyState, Pagination } from "../components/ui";
import { campaignsApi } from "../services/endpoints";
import { getErrorMessage } from "../services/api";
import { formatDateTime, cx } from "../utils/format";

const LIVE_STATUSES = ["running", "scheduled", "paused"];

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [recipients, setRecipients] = useState({ items: [], pages: 1 });
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState("recipients");
  const [rPage, setRPage] = useState(1);
  const [rFilter, setRFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const timer = useRef();

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await campaignsApi.get(id);
      setCampaign(data);
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setLoading(false); }
  };

  const loadRecipients = async () => {
    const { data } = await campaignsApi.recipients(id, { page: rPage, size: 15, status: rFilter || undefined });
    setRecipients(data);
  };
  const loadLogs = async () => { const { data } = await campaignsApi.logs(id); setLogs(data); };

  useEffect(() => { load(); }, [id]);
  useEffect(() => { loadRecipients(); /* eslint-disable-next-line */ }, [id, rPage, rFilter]);
  useEffect(() => { if (tab === "logs") loadLogs(); /* eslint-disable-next-line */ }, [tab, campaign?.status]);

  // Live polling while active
  useEffect(() => {
    clearInterval(timer.current);
    if (campaign && LIVE_STATUSES.includes(campaign.status)) {
      timer.current = setInterval(() => { load(true); loadRecipients(); }, 4000);
    }
    return () => clearInterval(timer.current);
    // eslint-disable-next-line
  }, [campaign?.status]);

  const act = async (fn, msg) => {
    try { await fn(id); toast.success(msg); load(); loadRecipients(); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };
  const clone = async () => { const { data } = await campaignsApi.clone(id); toast.success("Cloned"); navigate(`/campaigns/${data.id}`); };

  if (loading || !campaign) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-brand-500" /></div>;

  const c = campaign;
  const progress = c.total_recipients ? Math.round((c.sent_count / c.total_recipients) * 100) : 0;
  const deliveryRate = c.sent_count ? Math.round((c.delivered_count / c.sent_count) * 100) : 0;

  return (
    <div>
      <PageHeader title={<span className="flex items-center gap-2">{c.name} <StatusBadge status={c.channel} type="channel" /></span>}
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Campaigns", to: "/campaigns" }, { label: c.name }]}
        actions={<>
          {["draft", "scheduled", "failed", "cancelled"].includes(c.status) && (
            <button className="btn-primary" onClick={() => act(campaignsApi.send, "Campaign started")}><FiSend /> Send</button>
          )}
          {c.status === "running" && <button className="btn-secondary" onClick={() => act(campaignsApi.pause, "Paused")}><FiPause /> Pause</button>}
          {c.status === "paused" && <button className="btn-primary" onClick={() => act(campaignsApi.resume, "Resumed")}><FiPlay /> Resume</button>}
          {["running", "paused", "scheduled"].includes(c.status) && <button className="btn-secondary" onClick={() => act(campaignsApi.cancel, "Cancelled")}><FiX /> Cancel</button>}
          {c.failed_count > 0 && <button className="btn-secondary" onClick={() => act(campaignsApi.retry, "Retrying failed")}><FiRefreshCw /> Retry failed</button>}
          {["draft", "scheduled"].includes(c.status) && <Link to={`/campaigns/${id}/edit`} className="btn-secondary"><FiEdit2 /> Edit</Link>}
          <button className="btn-ghost" onClick={clone}><FiCopy /> Clone</button>
        </>} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={c.status} />
        {LIVE_STATUSES.includes(c.status) && (
          <span className="flex items-center gap-1.5 text-xs text-brand-600"><span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" /> Live updating</span>
        )}
        <span className="text-sm text-ink-500">Created {formatDateTime(c.created_at)}</span>
      </div>

      {/* Progress + stats */}
      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <h3 className="mb-3 font-semibold">Sending Progress</h3>
          <div className="mb-2 flex justify-between text-sm"><span className="text-ink-500">{c.sent_count} of {c.total_recipients} processed</span><span className="font-semibold">{progress}%</span></div>
          <ProgressBar value={progress} className="h-3" />
          <div className="mt-5 grid grid-cols-4 gap-3 text-center">
            <Stat label="Recipients" value={c.total_recipients} color="text-ink-900 dark:text-white" />
            <Stat label="Sent" value={c.sent_count} color="text-blue-600" icon={FiSend} />
            <Stat label="Delivered" value={c.delivered_count} color="text-brand-600" icon={FiCheckCircle} />
            <Stat label="Failed" value={c.failed_count} color="text-red-500" icon={FiXCircle} />
          </div>
        </Card>
        <Card className="flex flex-col items-center justify-center">
          <h3 className="mb-2 self-start font-semibold">Delivery</h3>
          <CircularProgress value={deliveryRate} label="delivered" />
        </Card>
        <Card>
          <h3 className="mb-3 font-semibold">Details</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Read" value={c.read_count} />
            <Row label="Pending" value={c.total_recipients - c.sent_count - c.failed_count} />
            <Row label="Schedule" value={c.schedule_type} />
            {c.scheduled_at && <Row label="Scheduled" value={formatDateTime(c.scheduled_at)} />}
          </dl>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <div className="mb-4 flex gap-2 border-b border-ink-100 dark:border-slate-700">
          {["recipients", "logs"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cx("border-b-2 px-4 py-2 text-sm font-medium capitalize transition",
              tab === t ? "border-brand-500 text-brand-600" : "border-transparent text-ink-500 hover:text-ink-900")}>{t}</button>
          ))}
        </div>

        {tab === "recipients" && (
          <Card className="!p-0">
            <div className="flex items-center gap-2 p-4">
              <select className="input !w-auto" value={rFilter} onChange={(e) => { setRPage(1); setRFilter(e.target.value); }}>
                <option value="">All statuses</option>
                {(c.channel === "email"
                  ? ["pending", "queued", "sent", "delivered", "read", "failed", "bounced", "unsubscribed", "spam_complaint"]
                  : ["pending", "queued", "sent", "delivered", "read", "failed"]
                ).map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
              <span className="text-sm text-ink-500">{recipients.total} recipients</span>
            </div>
            {recipients.items.length === 0 ? (
              <div className="p-6"><EmptyState title="No recipients" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-y border-ink-100 bg-ink-50 text-left text-xs uppercase text-ink-500 dark:border-slate-700 dark:bg-slate-700/40">
                    <tr><th className="px-4 py-2.5">Recipient</th><th className="px-4 py-2.5">Message</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5">Sent</th><th className="px-4 py-2.5">Error</th></tr>
                  </thead>
                  <tbody>
                    {recipients.items.map((r) => (
                      <tr key={r.id} className="border-b border-ink-100 last:border-0 dark:border-slate-700">
                        <td className="px-4 py-2.5">{c.channel === "email" ? (r.email || "—") : `+${r.phone}`}</td>
                        <td className="max-w-xs truncate px-4 py-2.5 text-ink-500" title={r.rendered_message}>{c.channel === "email" ? (r.rendered_subject || r.rendered_message) : r.rendered_message}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={r.status} type="message" /></td>
                        <td className="px-4 py-2.5 text-ink-500">{r.sent_at ? formatDateTime(r.sent_at) : "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-red-500">{r.error_message || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-4"><Pagination page={rPage} pages={recipients.pages} onChange={setRPage} /></div>
          </Card>
        )}

        {tab === "logs" && (
          <Card>
            {logs.length === 0 ? <EmptyState icon={FiClock} title="No logs yet" /> : (
              <div className="space-y-3">
                {logs.map((l) => (
                  <div key={l.id} className="flex gap-3 text-sm">
                    <span className={cx("mt-1.5 h-2 w-2 flex-shrink-0 rounded-full", l.level === "error" ? "bg-red-500" : "bg-brand-500")} />
                    <div>
                      <span className="font-medium capitalize">{l.event.replace(/_/g, " ")}</span>
                      {l.message && <span className="text-ink-500"> — {l.message}</span>}
                      <div className="text-xs text-ink-400">{formatDateTime(l.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color, icon: Icon }) {
  return (
    <div>
      <div className={cx("flex items-center justify-center gap-1 text-xl font-bold", color)}>{Icon && <Icon className="h-4 w-4" />}{value}</div>
      <div className="text-xs text-ink-500">{label}</div>
    </div>
  );
}
function Row({ label, value }) {
  return <div className="flex justify-between"><dt className="text-ink-500">{label}</dt><dd className="font-medium capitalize">{value}</dd></div>;
}
