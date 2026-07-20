import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiPlus, FiSend, FiCopy, FiTrash2, FiArchive, FiPlay, FiPause, FiEye,
} from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { Card, Pagination, SearchBar, EmptyState, Spinner, ProgressBar, ConfirmDialog } from "../components/ui";
import { campaignsApi } from "../services/endpoints";
import { getErrorMessage } from "../services/api";
import { formatDateTime, cx } from "../utils/format";

const STATUSES = ["draft", "scheduled", "running", "paused", "completed", "cancelled", "failed", "archived"];
const CHANNELS = ["whatsapp", "email"];

export default function Campaigns() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [channel, setChannel] = useState("");
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await campaignsApi.list({ page, size: 10, search: search || undefined, status: status || undefined, channel: channel || undefined });
      setRows(data.items);
      setMeta({ total: data.total, pages: data.pages });
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setLoading(false); }
  };

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [page, search, status, channel]);
  useEffect(() => { setPage(1); }, [search, status, channel]);

  const act = async (fn, id, msg) => {
    try { await fn(id); toast.success(msg); load(); } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const doDelete = async () => {
    try { await campaignsApi.remove(confirm.id); toast.success("Deleted"); setConfirm(null); load(); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <div>
      <PageHeader title="Campaigns" subtitle={`${meta.total} campaigns`}
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Campaigns" }]}
        actions={<Link to="/campaigns/new" className="btn-primary"><FiPlus /> New Campaign</Link>} />

      <Card className="!p-0">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Search campaigns…" className="sm:max-w-xs" />
          <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
          <select className="input !w-auto" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="">All channels</option>
            {CHANNELS.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-brand-500" /></div>
        ) : rows.length === 0 ? (
          <div className="p-6"><EmptyState icon={FiSend} title="No campaigns" description="Create a campaign to reach your audience."
            action={<Link to="/campaigns/new" className="btn-primary"><FiPlus /> New Campaign</Link>} /></div>
        ) : (
          <div className="divide-y divide-ink-100 dark:divide-slate-700">
            {rows.map((c) => {
              const progress = c.total_recipients ? Math.round((c.sent_count / c.total_recipients) * 100) : 0;
              return (
                <div key={c.id} className="flex flex-col gap-3 p-4 hover:bg-ink-50 dark:hover:bg-slate-700/30 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/campaigns/${c.id}`} className="truncate font-semibold hover:text-brand-600">{c.name}</Link>
                      <StatusBadge status={c.status} />
                      <StatusBadge status={c.channel} type="channel" />
                    </div>
                    <p className="truncate text-sm text-ink-500">{c.description || "No description"}</p>
                    <div className="mt-2 max-w-md">
                      <div className="mb-1 flex justify-between text-xs text-ink-500">
                        <span>{c.sent_count}/{c.total_recipients} sent</span>
                        <span>{c.delivered_count} delivered · {c.failed_count} failed</span>
                      </div>
                      <ProgressBar value={progress} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {["draft", "scheduled", "failed"].includes(c.status) && (
                      <button className="btn-ghost p-2 text-brand-600" title="Send" onClick={() => act(campaignsApi.send, c.id, "Campaign started")}><FiSend /></button>
                    )}
                    {c.status === "running" && (
                      <button className="btn-ghost p-2 text-amber-500" title="Pause" onClick={() => act(campaignsApi.pause, c.id, "Paused")}><FiPause /></button>
                    )}
                    {c.status === "paused" && (
                      <button className="btn-ghost p-2 text-brand-600" title="Resume" onClick={() => act(campaignsApi.resume, c.id, "Resumed")}><FiPlay /></button>
                    )}
                    <button className="btn-ghost p-2" title="View" onClick={() => navigate(`/campaigns/${c.id}`)}><FiEye /></button>
                    <button className="btn-ghost p-2" title="Clone" onClick={() => act(campaignsApi.clone, c.id, "Cloned")}><FiCopy /></button>
                    <button className="btn-ghost p-2" title="Archive" onClick={() => act(campaignsApi.archive, c.id, "Archived")}><FiArchive /></button>
                    <button className="btn-ghost p-2 text-red-500" title="Delete" onClick={() => setConfirm(c)}><FiTrash2 /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="p-4"><Pagination page={page} pages={meta.pages} onChange={setPage} /></div>
      </Card>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete} danger title="Delete campaign" confirmText="Delete" message={`Delete "${confirm?.name}"? This cannot be undone.`} />
    </div>
  );
}
