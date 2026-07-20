import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FiUploadCloud, FiTrash2, FiEdit2, FiImage, FiVideo, FiFile, FiMusic, FiFolder,
} from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import { Card, EmptyState, Spinner, ConfirmDialog, Modal, SearchBar } from "../components/ui";
import { mediaApi } from "../services/endpoints";
import { getErrorMessage } from "../services/api";
import { formatBytes, cx } from "../utils/format";

const ICONS = { image: FiImage, video: FiVideo, audio: FiMusic, document: FiFile };

export default function Media() {
  const [items, setItems] = useState([]);
  const [folders, setFolders] = useState(["General"]);
  const [folder, setFolder] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const inputRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await mediaApi.list({ folder: folder || undefined, search: search || undefined });
      setItems(data);
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setLoading(false); }
  };

  useEffect(() => { mediaApi.folders().then((r) => setFolders(r.data)); }, [items.length]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [folder, search]);

  const upload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const f of files) {
        const form = new FormData();
        form.append("file", f);
        form.append("folder", folder || "General");
        await mediaApi.upload(form);
      }
      toast.success("Upload successful");
      load();
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setUploading(false); }
  };

  const doDelete = async () => {
    try { await mediaApi.remove(confirm.id); toast.success("Deleted"); setConfirm(null); load(); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <div>
      <PageHeader title="Media Library" subtitle="Upload and manage campaign assets"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Media" }]}
        actions={<button className="btn-primary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Spinner /> : <FiUploadCloud />} Upload
        </button>} />
      <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => upload(Array.from(e.target.files))} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search files…" className="sm:max-w-xs" />
        <select className="input !w-auto" value={folder} onChange={(e) => setFolder(e.target.value)}>
          <option value="">All folders</option>
          {folders.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(Array.from(e.dataTransfer.files)); }}>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-brand-500" /></div>
        ) : items.length === 0 ? (
          <EmptyState icon={FiFolder} title="No media yet" description="Drag & drop files here or click Upload."
            action={<button className="btn-primary" onClick={() => inputRef.current?.click()}><FiUploadCloud /> Upload</button>} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((m, i) => {
              const Icon = ICONS[m.media_type] || FiFile;
              return (
                <motion.div key={m.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}>
                  <Card className="!p-0 overflow-hidden">
                    <div className="flex h-32 items-center justify-center bg-ink-50 dark:bg-slate-700/40">
                      {m.media_type === "image" ? (
                        <img src={m.url} alt={m.original_name} className="h-full w-full object-cover" />
                      ) : (
                        <Icon className="h-10 w-10 text-ink-400" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-medium" title={m.original_name}>{m.original_name}</p>
                      <p className="text-xs text-ink-500">{formatBytes(m.size_bytes)} · {m.folder}</p>
                      <div className="mt-2 flex justify-end gap-1">
                        <button className="btn-ghost p-1.5" onClick={() => setRenaming(m)}><FiEdit2 className="h-4 w-4" /></button>
                        <button className="btn-ghost p-1.5 text-red-500" onClick={() => setConfirm(m)}><FiTrash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete} danger title="Delete file" confirmText="Delete" message={`Delete "${confirm?.original_name}"?`} />
      {renaming && <RenameModal media={renaming} folders={folders} onClose={() => setRenaming(null)} onSaved={() => { setRenaming(null); load(); }} />}
    </div>
  );
}

function RenameModal({ media, folders, onClose, onSaved }) {
  const [name, setName] = useState(media.original_name);
  const [folder, setFolder] = useState(media.folder);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try { await mediaApi.rename(media.id, { original_name: name, folder }); toast.success("Saved"); onSaved(); }
    catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title="Rename / Move">
      <div className="space-y-4">
        <div><label className="label">Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div>
          <label className="label">Folder</label>
          <input className="input" value={folder} onChange={(e) => setFolder(e.target.value)} list="folders" />
          <datalist id="folders">{folders.map((f) => <option key={f} value={f} />)}</datalist>
        </div>
        <div className="flex justify-end gap-3"><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={save} disabled={busy}>{busy ? <Spinner /> : "Save"}</button></div>
      </div>
    </Modal>
  );
}
