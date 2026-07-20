import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FiCheckCircle, FiMail } from "react-icons/fi";
import AuthLayout from "../../layouts/AuthLayout";
import { authApi } from "../../services/endpoints";
import { getErrorMessage } from "../../services/api";
import { Spinner } from "../../components/ui";

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const [sent, setSent] = useState(false);

  const onSubmit = async ({ email }) => {
    try {
      await authApi.forgot(email);
      setSent(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a reset link">
      {sent ? (
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5 text-brand-800 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-200">
          <FiCheckCircle className="mb-2 h-6 w-6" />
          <p className="font-semibold">Check your inbox</p>
          <p className="mt-1 text-sm">If an account exists for that email, a reset link is on its way.</p>
          <p className="mt-2 text-xs text-brand-700/80 dark:text-brand-300/80">
            (Dev tip: without SMTP configured, the link is printed in the backend console.)
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="fp_email" className="label">Email</label>
            <div className="relative">
              <FiMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input id="fp_email" type="email" className="input-auth" placeholder="you@company.com" {...register("email", { required: true })} />
            </div>
          </div>
          <button className="btn-gradient w-full py-3" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-ink-500">
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
