import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FiPlus, FiEdit2, FiTrash2, FiFilter, FiUsers } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import { Card, Modal, ConfirmDialog, EmptyState, Spinner, Badge } from "../components/ui";
import { segmentsApi, groupsApi, contactsApi } from "../services/endpoints";
import { useFetch } from "../hooks/useFetch";
import { getErrorMessage } from "../services/api";

const STATUSES = ["active", "inactive", "blocked", "unsubscribed"];

function filterSummary(filters) {
  const parts = [];
  if (filters.status) parts.push(`Status: ${filters.status}`);
  if (filters.tag) parts.push(`Tag: ${filters.tag}`);
  if (filters.city) parts.push(`City: ${filters.city}`);
  if (filters.country) parts.push(`Country: ${filters.country}`);
  if (filters.company) parts.push(`Company: ${filters.company}`);
  if (filters.group_ids?.length) parts.push(`${filters.group_ids.length} group(s)`);
  return parts.length ? parts.join(" · ") : "All contacts";
}

export default function Segments() {
  const { data: segments, loading, refetch } = useFetch(() => segmentsApi.list());
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const doDelete = async () => {
    try {
      await segmentsApi.remove(confirm.id);
      toast.success("Segment deleted");
      setConfirm(null);
      refetch();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <div>
      <PageHeader title="Segments" subtitle="Target contacts by criteria — segments stay up to date automatically"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Segments" }]}
        actions={<button className="btn-primary" onClick={() => setEditing({})}><FiPlus /> New Segment</button>} />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-brand-500" /></div>
      ) : segments?.length === 0 ? (
        <EmptyState icon={FiFilter} title="No segments yet"
          description="Create a segment like 'Active Mumbai VIPs' — it will always include every matching contact, even new ones."
          action={<button className="btn-primary" onClick={() => setEditing({})}><FiPlus /> New Segment</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card>
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                    <FiFilter className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1">
                    <button className="btn-ghost p-2" onClick={() => setEditing(s)}><FiEdit2 /></button>
                    <button className="btn-ghost p-2 text-red-500" onClick={() => setConfirm(s)}><FiTrash2 /></button>
                  </div>
                </div>
                <h3 className="mt-3 text-lg font-semibold">{s.name}</h3>
                <p className="text-sm text-ink-500">{s.description || filterSummary(s.filters)}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-ink-500">
                    <FiUsers className="h-4 w-4" /> {s.matching_count} contacts
                  </span>
                  <Badge color="green">Live</Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {editing !== null && <SegmentModal segment={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />}
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete} danger
        title="Delete segment" confirmText="Delete" message={`Delete "${confirm?.name}"? Contacts are not affected — only this saved filter is removed.`} />
    </div>
  );
}

export function SegmentModal({ segment, onClose, onSaved }) {
  const isEdit = !!segment.id;
  const f = segment.filters || {};
  const [groups, setGroups] = useState([]);
  const [groupIds, setGroupIds] = useState(f.group_ids || []);
  const [count, setCount] = useState(null);
  const [counting, setCounting] = useState(false);
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: segment.name || "", description: segment.description || "",
      status: f.status || "", tag: f.tag || "", city: f.city || "", country: f.country || "", company: f.company || "",
    },
  });
  const watched = watch();

  useEffect(() => { groupsApi.list().then(({ data }) => setGroups(data)); }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      setCounting(true);
      try {
        const { data } = await contactsApi.list({
          status: watched.status || undefined, tag: watched.tag || undefined, city: watched.city || undefined,
          country: watched.country || undefined, company: watched.company || undefined,
          group_ids: groupIds.length ? groupIds : undefined, size: 1,
        });
        setCount(data.total);
      } catch { setCount(null); } finally { setCounting(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [watched.status, watched.tag, watched.city, watched.country, watched.company, groupIds]);

  const toggleGroup = (id) => setGroupIds((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  const onSubmit = async (data) => {
    const filters = {};
    if (data.status) filters.status = data.status;
    if (data.tag) filters.tag = data.tag;
    if (data.city) filters.city = data.city;
    if (data.country) filters.country = data.country;
    if (data.company) filters.company = data.company;
    if (groupIds.length) filters.group_ids = groupIds;
    const payload = { name: data.name, description: data.description, filters };
    try {
      if (isEdit) await segmentsApi.update(segment.id, payload);
      else await segmentsApi.create(payload);
      toast.success(isEdit ? "Segment updated" : "Segment created");
      onSaved();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit Segment" : "New Segment"} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div><label className="label">Name *</label><input className="input" placeholder="Active Mumbai VIPs" {...register("name", { required: true })} /></div>
        <div><label className="label">Description</label><input className="input" placeholder="Optional note" {...register("description")} /></div>

        <div className="rounded-xl border border-ink-200 p-4 dark:border-slate-600">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Match contacts where…</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Status</label>
              <select className="input" {...register("status")}>
                <option value="">Any</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Tag contains</label><input className="input" placeholder="vip" {...register("tag")} /></div>
            <div><label className="label">City contains</label><input className="input" placeholder="Mumbai" {...register("city")} /></div>
            <div><label className="label">Country code contains</label><input className="input" placeholder="+91" {...register("country")} /></div>
            <div className="sm:col-span-2"><label className="label">Company contains</label><input className="input" placeholder="Acme" {...register("company")} /></div>
          </div>
          {groups.length > 0 && (
            <div className="mt-3">
              <label className="label">In any of these groups</label>
              <div className="flex flex-wrap gap-1.5">
                {groups.map((g) => (
                  <button type="button" key={g.id} onClick={() => toggleGroup(g.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${groupIds.includes(g.id) ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10" : "border-ink-200 text-ink-500 dark:border-slate-600"}`}>
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-ink-50 p-3 text-sm dark:bg-slate-700/40">
          <FiUsers className="h-4 w-4 text-brand-600" />
          {counting ? <Spinner className="h-4 w-4" /> : <span className="font-semibold">{count ?? "—"}</span>}
          <span className="text-ink-500">contacts match this segment right now</span>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? <Spinner /> : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}
