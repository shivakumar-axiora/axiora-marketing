import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  FiPlus, FiEdit2, FiTrash2, FiUpload, FiDownload, FiUsers, FiFilter, FiCheckSquare, FiSave, FiSliders,
} from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import {
  Card, Modal, ConfirmDialog, Pagination, SearchBar, EmptyState, Spinner, Badge,
} from "../components/ui";
import { contactsApi, groupsApi } from "../services/endpoints";
import { SegmentModal } from "./Segments";
import api, { getErrorMessage, TOKEN_KEY } from "../services/api";
import { formatDate, cx } from "../utils/format";

const STATUSES = ["active", "inactive", "blocked", "unsubscribed"];

export default function Contacts() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [groupId, setGroupId] = useState("");
  const [tag, setTag] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [company, setCompany] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState([]);
  const [editing, setEditing] = useState(null); // null | {} | contact
  const [confirm, setConfirm] = useState(null); // {ids} | contact
  const [importOpen, setImportOpen] = useState(false);
  const [savingSegment, setSavingSegment] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {
        page, size: 10, search: search || undefined, status: status || undefined, group_id: groupId || undefined,
        tag: tag || undefined, city: city || undefined, country: country || undefined, company: company || undefined,
      };
      const { data } = await contactsApi.list(params);
      setRows(data.items);
      setMeta({ total: data.total, pages: data.pages });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { groupsApi.list().then((r) => setGroups(r.data)); }, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [page, search, status, groupId, tag, city, country, company]);
  useEffect(() => { setPage(1); /* eslint-disable-next-line */ }, [search, status, groupId, tag, city, country, company]);

  const toggleAll = (e) => setSelected(e.target.checked ? rows.map((r) => r.id) : []);
  const toggleOne = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const doDelete = async () => {
    try {
      if (confirm.ids) await contactsApi.bulkDelete(confirm.ids);
      else await contactsApi.remove(confirm.id);
      toast.success("Deleted");
      setConfirm(null);
      setSelected([]);
      load();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const bulkAddToGroup = async (gid) => {
    if (!gid) return;
    try {
      await contactsApi.bulkUpdate({ ids: selected, add_group_ids: [Number(gid)] });
      toast.success(`Added ${selected.length} contact(s) to group`);
      setSelected([]);
      load();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const bulkRemoveFromGroup = async (gid) => {
    if (!gid) return;
    try {
      await contactsApi.bulkUpdate({ ids: selected, remove_group_ids: [Number(gid)] });
      toast.success(`Removed ${selected.length} contact(s) from group`);
      setSelected([]);
      load();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const activeFilters = { status, tag, city, country, company, group_ids: groupId ? [Number(groupId)] : [] };
  const hasActiveFilters = Object.values(activeFilters).some((v) => (Array.isArray(v) ? v.length : v));

  const exportFile = (format) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const url = `${api.defaults.baseURL}${contactsApi.exportUrl(format)}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((b) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = format === "excel" ? "contacts.xlsx" : "contacts.csv";
        a.click();
      });
  };

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle={`${meta.total} contacts in your audience`}
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Contacts" }]}
        actions={
          <>
            <button className="btn-secondary" onClick={() => setImportOpen(true)}><FiDownload /> Import</button>
            <div className="group relative">
              <button className="btn-secondary"><FiUpload /> Export</button>
              <div className="absolute right-0 z-10 hidden w-32 overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card group-hover:block dark:border-slate-700 dark:bg-slate-800">
                <button className="block w-full px-4 py-2 text-left text-sm hover:bg-ink-50 dark:hover:bg-slate-700" onClick={() => exportFile("csv")}>CSV</button>
                <button className="block w-full px-4 py-2 text-left text-sm hover:bg-ink-50 dark:hover:bg-slate-700" onClick={() => exportFile("excel")}>Excel</button>
              </div>
            </div>
            <button className="btn-primary" onClick={() => setEditing({})}><FiPlus /> Add Contact</button>
          </>
        }
      />

      <Card className="!p-0">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBar value={search} onChange={setSearch} placeholder="Search name, phone, email…" className="sm:max-w-xs" />
            <div className="flex flex-wrap items-center gap-2">
              <FiFilter className="text-ink-500" />
              <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="input !w-auto" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                <option value="">All groups</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <button type="button" className="btn-ghost" onClick={() => setShowMoreFilters((s) => !s)}>
                <FiSliders /> {showMoreFilters ? "Fewer filters" : "More filters"}
              </button>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button" className="btn-secondary" disabled={!hasActiveFilters}
                title={hasActiveFilters ? "Save the current filters as a reusable segment" : "Set at least one filter first"}
                onClick={() => setSavingSegment(true)}
              >
                <FiSave /> Save as Segment
              </button>
              {selected.length > 0 && (
                <>
                  <select className="input !w-auto" defaultValue="" onChange={(e) => { bulkAddToGroup(e.target.value); e.target.value = ""; }}>
                    <option value="" disabled>+ Add to group…</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <select className="input !w-auto" defaultValue="" onChange={(e) => { bulkRemoveFromGroup(e.target.value); e.target.value = ""; }}>
                    <option value="" disabled>− Remove from group…</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <button className="btn-danger" onClick={() => setConfirm({ ids: selected })}>
                    <FiTrash2 /> Delete ({selected.length})
                  </button>
                </>
              )}
            </div>
          </div>
          {showMoreFilters && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <input className="input" placeholder="Tag" value={tag} onChange={(e) => setTag(e.target.value)} />
              <input className="input" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <input className="input" placeholder="Country code" value={country} onChange={(e) => setCountry(e.target.value)} />
              <input className="input" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-brand-500" /></div>
        ) : rows.length === 0 ? (
          <div className="p-6"><EmptyState icon={FiUsers} title="No contacts found" description="Add a contact or import from CSV/Excel to get started."
            action={<button className="btn-primary" onClick={() => setEditing({})}><FiPlus /> Add Contact</button>} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500 dark:border-slate-700 dark:bg-slate-700/40">
                <tr>
                  <th className="px-4 py-3"><input type="checkbox" checked={selected.length === rows.length} onChange={toggleAll} /></th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Groups</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className={cx("border-b border-ink-100 last:border-0 hover:bg-ink-50 dark:border-slate-700 dark:hover:bg-slate-700/30", selected.includes(c.id) && "bg-brand-50/40")}>
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleOne(c.id)} /></td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.name}</div>
                      {c.email && <div className="text-xs text-ink-500">{c.email}</div>}
                    </td>
                    <td className="px-4 py-3">+{c.phone}</td>
                    <td className="px-4 py-3">{c.company || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.groups?.slice(0, 2).map((g) => <Badge key={g.id} color="green">{g.name}</Badge>)}
                        {c.groups?.length > 2 && <Badge>+{c.groups.length - 2}</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} type="contact" /></td>
                    <td className="px-4 py-3 text-ink-500">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost p-2" onClick={() => setEditing(c)}><FiEdit2 /></button>
                        <button className="btn-ghost p-2 text-red-500" onClick={() => setConfirm(c)}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4"><Pagination page={page} pages={meta.pages} onChange={setPage} /></div>
      </Card>

      {editing !== null && (
        <ContactModal contact={editing} groups={groups} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete} danger
        title="Delete contact(s)" confirmText="Delete"
        message={confirm?.ids ? `Delete ${confirm.ids.length} selected contacts? This cannot be undone.` : `Delete ${confirm?.name}? This cannot be undone.`} />
      {importOpen && <ImportModal onClose={() => setImportOpen(false)} onDone={() => { setImportOpen(false); load(); }} />}
      {savingSegment && (
        <SegmentModal segment={{ filters: activeFilters }} onClose={() => setSavingSegment(false)}
          onSaved={() => { setSavingSegment(false); toast.success("You can find it under Segments"); }} />
      )}
    </div>
  );
}

function ContactModal({ contact, groups, onClose, onSaved }) {
  const isEdit = !!contact.id;
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: contact.name || "", phone: contact.phone ? `+${contact.phone}` : "", email: contact.email || "",
      company: contact.company || "", city: contact.city || "", state: contact.state || "",
      tags: contact.tags || "", notes: contact.notes || "", status: contact.status || "active",
    },
  });
  const [groupIds, setGroupIds] = useState(contact.groups?.map((g) => g.id) || []);

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, group_ids: groupIds };
      if (isEdit) await contactsApi.update(contact.id, payload);
      else await contactsApi.create(payload);
      toast.success(isEdit ? "Contact updated" : "Contact added");
      onSaved();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit Contact" : "Add Contact"} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Name *</label><input className="input" {...register("name", { required: true })} /></div>
          <div><label className="label">Phone (with country code) *</label><input className="input" placeholder="+91 98765 43210" {...register("phone", { required: true })} /></div>
          <div><label className="label">Email</label><input className="input" {...register("email")} /></div>
          <div><label className="label">Company</label><input className="input" {...register("company")} /></div>
          <div><label className="label">City</label><input className="input" {...register("city")} /></div>
          <div><label className="label">State</label><input className="input" {...register("state")} /></div>
          <div><label className="label">Tags (comma separated)</label><input className="input" placeholder="vip, customer" {...register("tags")} /></div>
          <div><label className="label">Status</label>
            <select className="input" {...register("status")}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          </div>
        </div>
        <div>
          <label className="label">Groups</label>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <button type="button" key={g.id} onClick={() => setGroupIds((s) => s.includes(g.id) ? s.filter((x) => x !== g.id) : [...s, g.id])}
                className={cx("rounded-full border px-3 py-1 text-sm transition", groupIds.includes(g.id) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-500 hover:border-brand-300")}>
                {g.name}
              </button>
            ))}
            {groups.length === 0 && <span className="text-sm text-ink-500">No groups yet.</span>}
          </div>
        </div>
        <div><label className="label">Notes</label><textarea className="input" rows={2} {...register("notes")} /></div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? <Spinner /> : (isEdit ? "Save changes" : "Add contact")}</button>
        </div>
      </form>
    </Modal>
  );
}

function ImportModal({ onClose, onDone }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef();

  const pick = async (f) => {
    if (!f) return;
    setFile(f);
    const form = new FormData();
    form.append("file", f);
    try {
      const { data } = await contactsApi.importPreview(form);
      setPreview(data);
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const doImport = async () => {
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const { data } = await contactsApi.import(form);
      toast.success(`Imported ${data.imported} · ${data.duplicates} duplicates · ${data.invalid} invalid`);
      onDone();
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title="Import Contacts" size="xl">
      {!preview ? (
        <div onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 py-16 text-center hover:border-brand-400 dark:border-slate-600">
          <FiUpload className="mb-3 h-8 w-8 text-brand-500" />
          <p className="font-medium">Drag & drop CSV / Excel here</p>
          <p className="text-sm text-ink-500">or click to browse. Columns: name, phone, email, company, city, state, tags</p>
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => pick(e.target.files[0])} />
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm text-ink-500">Previewing first {preview.rows.length} of <b>{preview.total}</b> rows.</p>
          <div className="overflow-x-auto rounded-xl border border-ink-100 dark:border-slate-700">
            <table className="w-full text-xs">
              <thead className="bg-ink-50 dark:bg-slate-700/40">
                <tr>{preview.columns.map((c) => <th key={c} className="px-3 py-2 text-left font-medium">{c}</th>)}</tr>
              </thead>
              <tbody>
                {preview.rows.map((r, i) => (
                  <tr key={i} className="border-t border-ink-100 dark:border-slate-700">
                    {preview.columns.map((c) => <td key={c} className="px-3 py-1.5">{r[c]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setPreview(null)}>Choose another file</button>
            <button className="btn-primary" onClick={doImport} disabled={busy}>{busy ? <Spinner /> : <><FiCheckSquare /> Import {preview.total} contacts</>}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
