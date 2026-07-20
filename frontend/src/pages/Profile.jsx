import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FiCamera, FiLock, FiTrash2, FiUser } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import { Card, Spinner, Badge, ConfirmDialog } from "../components/ui";
import { authApi } from "../services/endpoints";
import { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { initials, prettyRole, formatDate } from "../utils/format";

export default function Profile() {
  const { user, reload } = useAuth();
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  // ---- Change password ----
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm();
  const pw = watch("new_password");

  const onChangePassword = async (data) => {
    if (data.new_password !== data.confirm) { toast.error("Passwords do not match"); return; }
    try {
      await authApi.changePassword(data.current_password, data.new_password);
      toast.success("Password changed");
      reset();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  // ---- Profile details ----
  const {
    register: registerDetails,
    handleSubmit: handleSubmitDetails,
    reset: resetDetails,
    formState: { isSubmitting: savingDetails },
  } = useForm();

  useEffect(() => {
    if (user) resetDetails({ full_name: user.full_name || "", phone: user.phone || "" });
  }, [user, resetDetails]);

  const onSaveDetails = async (data) => {
    try {
      await authApi.updateProfile({ full_name: data.full_name, phone: data.phone });
      await reload();
      toast.success("Profile updated");
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  // ---- Avatar ----
  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be 5 MB or smaller"); return; }
    const form = new FormData();
    form.append("file", file);
    setUploading(true);
    try {
      await authApi.uploadAvatar(form);
      await reload();
      toast.success("Profile picture updated");
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUploading(false); }
  };

  const onRemoveAvatar = async () => {
    setConfirmRemove(false);
    setUploading(true);
    try {
      await authApi.removeAvatar();
      await reload();
      toast.success("Profile picture removed");
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <PageHeader title="My Profile" breadcrumbs={[{ label: "Home", to: "/" }, { label: "Profile" }]} />
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar + summary */}
        <Card className="flex flex-col items-center text-center">
          <div className="relative">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="h-24 w-24 rounded-full object-cover ring-2 ring-brand-500/30"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-500 text-3xl font-bold text-white">
                {initials(user?.full_name)}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Change picture"
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white shadow-card transition hover:bg-brand-600 disabled:opacity-60"
            >
              {uploading ? <Spinner className="h-4 w-4" /> : <FiCamera className="h-4 w-4" />}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />

          <h3 className="mt-4 text-lg font-semibold">{user?.full_name}</h3>
          <p className="text-sm text-ink-500">{user?.email}</p>
          <Badge color="purple" className="mt-2">{prettyRole(user?.role?.name)}</Badge>

          <div className="mt-4 flex gap-2">
            <button type="button" className="btn-secondary text-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {user?.avatar_url ? "Change photo" : "Upload photo"}
            </button>
            {user?.avatar_url && (
              <button type="button" className="btn-ghost text-sm text-red-600" onClick={() => setConfirmRemove(true)} disabled={uploading}>
                <FiTrash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-4 w-full space-y-2 border-t border-ink-100 pt-4 text-sm dark:border-slate-700">
            <div className="flex justify-between"><span className="text-ink-500">Verified</span><span>{user?.is_verified ? "Yes" : "No"}</span></div>
            <div className="flex justify-between"><span className="text-ink-500">Member since</span><span>{formatDate(user?.created_at)}</span></div>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {/* Edit details */}
          <Card>
            <h3 className="mb-4 flex items-center gap-2 font-semibold"><FiUser /> Profile Details</h3>
            <form onSubmit={handleSubmitDetails(onSaveDetails)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Full name</label>
                  <input className="input" {...registerDetails("full_name", { required: true, maxLength: 150 })} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" placeholder="e.g. +91 98765 43210" {...registerDetails("phone", { maxLength: 30 })} />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input opacity-60" value={user?.email || ""} disabled readOnly />
                <p className="mt-1 text-xs text-ink-500">Email cannot be changed here. Contact an administrator to update it.</p>
              </div>
              <div className="flex justify-end">
                <button className="btn-primary" disabled={savingDetails}>{savingDetails ? <Spinner /> : "Save changes"}</button>
              </div>
            </form>
          </Card>

          {/* Change password */}
          <Card>
            <h3 className="mb-4 flex items-center gap-2 font-semibold"><FiLock /> Change Password</h3>
            <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
              <div><label className="label">Current password</label><input type="password" className="input" {...register("current_password", { required: true })} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label">New password</label><input type="password" className="input" {...register("new_password", { required: true, minLength: 8 })} /></div>
                <div><label className="label">Confirm password</label><input type="password" className="input" {...register("confirm", { validate: (v) => v === pw || "Mismatch" })} /></div>
              </div>
              <div className="flex justify-end"><button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? <Spinner /> : "Update password"}</button></div>
            </form>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={onRemoveAvatar}
        title="Remove profile picture"
        message="Are you sure you want to remove your profile picture?"
        confirmText="Remove"
        danger
      />
    </div>
  );
}
