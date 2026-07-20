import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import AuthLayout from "../../layouts/AuthLayout";
import { authApi } from "../../services/endpoints";
import { getErrorMessage } from "../../services/api";
import { Spinner } from "../../components/ui";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const pw = watch("new_password");

  const onSubmit = async ({ new_password }) => {
    try {
      await authApi.reset(token, new_password);
      toast.success("Password updated. Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This reset link is missing or expired.">
        <Link to="/forgot-password" className="btn-primary w-full">Request a new link</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">New password</label>
          <input type="password" className="input"
            {...register("new_password", { required: "Required", minLength: { value: 8, message: "Min 8 characters" } })} />
          {errors.new_password && <p className="mt-1 text-xs text-red-500">{errors.new_password.message}</p>}
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input type="password" className="input"
            {...register("confirm", { validate: (v) => v === pw || "Passwords do not match" })} />
          {errors.confirm && <p className="mt-1 text-xs text-red-500">{errors.confirm.message}</p>}
        </div>
        <button className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : "Reset password"}
        </button>
      </form>
    </AuthLayout>
  );
}
