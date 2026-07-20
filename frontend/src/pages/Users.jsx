import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiUserCheck } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import { Card, Modal, ConfirmDialog, EmptyState, Spinner, Badge } from "../components/ui";
import { usersApi } from "../services/endpoints";
import { useFetch } from "../hooks/useFetch";
import { getErrorMessage } from "../services/api";
import { initials, prettyRole, formatDate } from "../utils/format";
import { useAuth } from "../context/AuthContext";

const ROLES = ["admin", "marketing_manager", "executive"];

export default function Users() {
  const { user: me } = useAuth();
  const { data: users, loading, refetch } = useFetch(() => usersApi.list());
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const doDelete = async () => {
    try { await usersApi.remove(confirm.id); toast.success("User deleted"); setConfirm(null); refetch(); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const toggleActive = async (u) => {
    try { await usersApi.update(u.id, { is_active: !u.is_active }); refetch(); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <div>
      <PageHeader title="User Management" subtitle="Manage team members and their roles"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Users" }]}
        actions={<button className="btn-primary" onClick={() => setEditing({})}><FiPlus /> Add User</button>} />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-brand-500" /></div>
      ) : users?.length === 0 ? (
        <EmptyState icon={FiUserCheck} title="No users" />
      ) : (
        <Card className="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase text-ink-500 dark:border-slate-700 dark:bg-slate-700/40">
                <tr>{["User", "Role", "Status", "Joined", ""].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50 dark:border-slate-700 dark:hover:bg-slate-700/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">{initials(u.full_name)}</div>
                        <div><div className="font-medium">{u.full_name}</div><div className="text-xs text-ink-500">{u.email}</div></div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><Badge color={u.role.name === "admin" ? "purple" : u.role.name === "marketing_manager" ? "blue" : "gray"}>{prettyRole(u.role.name)}</Badge></td>
                    <td className="px-5 py-3">
                      <button onClick={() => toggleActive(u)} disabled={u.id === me.id}
                        className={u.is_active ? "text-brand-600" : "text-ink-400"}>
                        <Badge color={u.is_active ? "green" : "gray"}>{u.is_active ? "Active" : "Inactive"}</Badge>
                      </button>
                    </td>
                    <td className="px-5 py-3 text-ink-500">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost p-2" onClick={() => setEditing(u)}><FiEdit2 /></button>
                        {u.id !== me.id && <button className="btn-ghost p-2 text-red-500" onClick={() => setConfirm(u)}><FiTrash2 /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {editing !== null && <UserModal user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />}
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete} danger title="Delete user" confirmText="Delete" message={`Delete ${confirm?.full_name}?`} />
    </div>
  );
}

function UserModal({ user, onClose, onSaved }) {
  const isEdit = !!user.id;
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      full_name: user.full_name || "", email: user.email || "", phone: user.phone || "",
      role: user.role?.name || "executive", password: "", is_active: user.is_active ?? true,
    },
  });

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await usersApi.update(user.id, { full_name: data.full_name, phone: data.phone, role: data.role, is_active: data.is_active });
      } else {
        await usersApi.create(data);
      }
      toast.success(isEdit ? "User updated" : "User created");
      onSaved();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit User" : "Add User"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div><label className="label">Full name *</label><input className="input" {...register("full_name", { required: true })} /></div>
        <div><label className="label">Email *</label><input className="input" disabled={isEdit} {...register("email", { required: true })} /></div>
        <div><label className="label">Phone</label><input className="input" {...register("phone")} /></div>
        <div><label className="label">Role</label><select className="input" {...register("role")}>{ROLES.map((r) => <option key={r} value={r}>{prettyRole(r)}</option>)}</select></div>
        {!isEdit && <div><label className="label">Password *</label><input type="password" className="input" {...register("password", { required: true, minLength: 8 })} /></div>}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register("is_active")} /> Active</label>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? <Spinner /> : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}
