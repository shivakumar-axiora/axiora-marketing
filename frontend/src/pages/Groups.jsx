import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FiPlus, FiEdit2, FiTrash2, FiTag, FiUsers, FiSearch, FiX, FiUpload, FiCheckSquare, FiCheck,
} from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import { Card, Modal, ConfirmDialog, EmptyState, Spinner } from "../components/ui";
import { groupsApi, contactsApi } from "../services/endpoints";
import { useFetch } from "../hooks/useFetch";
import { getErrorMessage } from "../services/api";
import { cx } from "../utils/format";
import { IMPORT_REGIONS, NAME_ALIASES, PHONE_ALIASES, guessColumn } from "./Contacts";

const COLORS = ["#25D366", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444", "#10B981", "#EC4899", "#0EA5E9"];

export default function Groups() {
  const { data: groups, loading, refetch } = useFetch(() => groupsApi.list());
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const doDelete = async () => {
    try {
      await groupsApi.remove(confirm.id);
      toast.success("Group deleted");
      setConfirm(null);
      refetch();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <div>
      <PageHeader title="Groups" subtitle="Organize contacts into segments"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Groups" }]}
        actions={<button className="btn-primary" onClick={() => setEditing({})}><FiPlus /> New Group</button>} />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-brand-500" /></div>
      ) : groups?.length === 0 ? (
        <EmptyState icon={FiTag} title="No groups yet" description="Create groups like VIP, Leads, or Dealers to target campaigns."
          action={<button className="btn-primary" onClick={() => setEditing({})}><FiPlus /> New Group</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, i) => (
            <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card>
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${g.color}22`, color: g.color }}>
                    <FiTag className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1">
                    <button className="btn-ghost p-2" onClick={() => setEditing(g)}><FiEdit2 /></button>
                    <button className="btn-ghost p-2 text-red-500" onClick={() => setConfirm(g)}><FiTrash2 /></button>
                  </div>
                </div>
                <h3 className="mt-3 text-lg font-semibold">{g.name}</h3>
                <p className="text-sm text-ink-500">{g.description || "No description"}</p>
                <div className="mt-3 flex items-center gap-1.5 text-sm text-ink-500">
                  <FiUsers className="h-4 w-4" /> {g.contact_count} contacts
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {editing !== null && <GroupModal group={editing} onClose={() => setEditing(null)} onSaved={refetch} />}
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete} danger
        title="Delete group" confirmText="Delete" message={`Delete "${confirm?.name}"? Contacts will remain but lose this group.`} />
    </div>
  );
}

function GroupModal({ group, onClose, onSaved }) {
  const isEdit = !!group.id;
  const [savedGroup, setSavedGroup] = useState(isEdit ? group : null); // set once the group exists server-side
  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: { name: group.name || "", description: group.description || "", color: group.color || COLORS[0] },
  });
  const color = watch("color");

  const onSubmitDetails = async (data) => {
    try {
      if (isEdit) {
        const { data: updated } = await groupsApi.update(group.id, data);
        setSavedGroup(updated);
        toast.success("Group updated");
        onSaved();
      } else {
        const { data: created } = await groupsApi.create(data);
        setSavedGroup(created);
        toast.success("Group created — now add some contacts");
        onSaved();
      }
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit Group" : "New Group"} size="lg">
      <form onSubmit={handleSubmit(onSubmitDetails)} className="space-y-4">
        <div><label className="label">Name *</label><input className="input" placeholder="VIP Customers" {...register("name", { required: true })} /></div>
        <div><label className="label">Description</label><input className="input" {...register("description")} /></div>
        <div>
          <label className="label">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button type="button" key={c} onClick={() => setValue("color", c)}
                className="h-8 w-8 rounded-full ring-offset-2 transition" style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}` : "none" }} />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          {!savedGroup && <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>}
          <button className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : savedGroup ? "Save details" : "Create & continue"}
          </button>
        </div>
      </form>

      {savedGroup && (
        <div className="mt-6 border-t border-ink-100 pt-5 dark:border-slate-700">
          <h3 className="mb-1 font-semibold">Add contacts to "{savedGroup.name}"</h3>
          <p className="mb-4 text-sm text-ink-500">Pick existing contacts, or import a CSV/Excel file straight into this group.</p>
          <AddContactsPanel group={savedGroup} />
          <div className="mt-5 flex justify-end">
            <button className="btn-primary" onClick={() => { onSaved(); onClose(); }}><FiCheck /> Done</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function AddContactsPanel({ group }) {
  const [tab, setTab] = useState("existing");
  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button type="button" onClick={() => setTab("existing")}
          className={cx("rounded-full px-3 py-1.5 text-sm font-medium", tab === "existing" ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-600 dark:bg-slate-700 dark:text-ink-200")}>
          Pick existing contacts
        </button>
        <button type="button" onClick={() => setTab("import")}
          className={cx("rounded-full px-3 py-1.5 text-sm font-medium", tab === "import" ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-600 dark:bg-slate-700 dark:text-ink-200")}>
          Import CSV / Excel
        </button>
      </div>
      {tab === "existing" ? <ExistingContactPicker group={group} /> : <GroupImportPanel group={group} />}
    </div>
  );
}

function ExistingContactPicker({ group }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [added, setAdded] = useState([]); // [{id, name}]
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await contactsApi.list({ search, size: 8 });
        setResults(data.items.filter((c) => !added.some((a) => a.id === c.id) && !c.groups?.some((g) => g.id === group.id)));
      } catch { setResults([]); }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const addContact = async (c) => {
    setBusy(true);
    try {
      await contactsApi.bulkUpdate({ ids: [c.id], add_group_ids: [group.id] });
      setAdded((a) => [...a, c]);
      setResults((r) => r.filter((x) => x.id !== c.id));
      setSearch("");
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="relative">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input className="input pl-9" placeholder="Search by name, phone, or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card dark:border-slate-600 dark:bg-slate-800">
            {results.map((c) => (
              <button key={c.id} type="button" disabled={busy} onClick={() => addContact(c)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ink-50 dark:hover:bg-slate-700">
                <span>{c.name}</span>
                <span className="text-xs text-ink-400">{c.email || `+${c.phone}`}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {added.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {added.map((c) => (
            <span key={c.id} className="flex items-center gap-1.5 rounded-full bg-brand-50 py-1 pl-3 pr-2 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
              <FiCheck className="h-3 w-3" /> {c.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupImportPanel({ group }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [region, setRegion] = useState("IN");
  const [nameCol, setNameCol] = useState("");
  const [phoneCol, setPhoneCol] = useState("");
  const inputRef = useRef();

  const pick = async (f) => {
    if (!f) return;
    setFile(f);
    setDone(null);
    const form = new FormData();
    form.append("file", f);
    try {
      const { data } = await contactsApi.importPreview(form);
      setPreview(data);
      setNameCol(guessColumn(data.columns, NAME_ALIASES));
      setPhoneCol(guessColumn(data.columns, PHONE_ALIASES));
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const doImport = async () => {
    if (!phoneCol) { toast.error("Select which column has the phone number"); return; }
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    form.append("group_id", group.id);
    form.append("default_region", region);
    form.append("name_column", nameCol);
    form.append("phone_column", phoneCol);
    try {
      const { data } = await contactsApi.import(form);
      toast.success(`Imported ${data.imported} · ${data.duplicates} duplicates · ${data.invalid} invalid`);
      setDone(data);
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
        <FiCheck className="mb-1 h-5 w-5" /> Imported {done.imported} contact(s) into "{group.name}" ({done.duplicates} already existed and were added to the group too).
        <button type="button" className="btn-secondary mt-3" onClick={() => { setPreview(null); setFile(null); setDone(null); }}>Import another file</button>
      </div>
    );
  }

  return !preview ? (
    <div onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
      className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 py-12 text-center hover:border-brand-400 dark:border-slate-600">
      <FiUpload className="mb-3 h-7 w-7 text-brand-500" />
      <p className="font-medium">Drag & drop CSV / Excel here</p>
      <p className="text-sm text-ink-500">or click to browse. Columns: name, phone, email, company, city, state, tags</p>
      <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => pick(e.target.files[0])} />
    </div>
  ) : (
    <div>
      <p className="mb-3 text-sm text-ink-500">Previewing first {preview.rows.length} of <b>{preview.total}</b> rows.</p>
      <div className="mb-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Name column</label>
          <select className="input" value={nameCol} onChange={(e) => setNameCol(e.target.value)}>
            <option value="">(none)</option>
            {preview.columns.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Phone column *</label>
          <select className="input" value={phoneCol} onChange={(e) => setPhoneCol(e.target.value)}>
            <option value="">Select…</option>
            {preview.columns.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Phone format (no country code)</label>
          <select className="input" value={region} onChange={(e) => setRegion(e.target.value)}>
            {IMPORT_REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>
      <div className="max-h-56 overflow-auto rounded-xl border border-ink-100 dark:border-slate-700">
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
      <div className="mt-4 flex justify-end gap-3">
        <button className="btn-secondary" onClick={() => setPreview(null)}>Choose another file</button>
        <button className="btn-primary" onClick={doImport} disabled={busy}>
          {busy ? <Spinner /> : <><FiCheckSquare /> Import {preview.total} into "{group.name}"</>}
        </button>
      </div>
    </div>
  );
}
