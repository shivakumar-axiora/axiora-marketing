import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import AuthLayout from "../../layouts/AuthLayout";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/api";
import { Spinner } from "../../components/ui";
import { cx } from "../../utils/format";

function strength(pw = "") {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0..4
}
const STRENGTH_META = [
  { label: "", color: "" },
  { label: "Weak", color: "bg-red-500" },
  { label: "Fair", color: "bg-amber-500" },
  { label: "Good", color: "bg-brand-400" },
  { label: "Strong", color: "bg-brand-600" },
];

export default function Register() {
  const { register: signup, login } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const password = watch("password") || "";
  const score = strength(password);

  const onSubmit = async (data) => {
    try {
      await signup({ full_name: data.full_name, email: data.email, password: data.password });
      toast.success("Account created! Signing you in…");
      try {
        await login(data.email, data.password);
        navigate("/dashboard");
      } catch {
        navigate("/login");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Registration failed"));
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start reaching customers in minutes." backTo="/login" backLabel="Back to sign in">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="full_name" className="label">Full name</label>
          <div className="relative">
            <FiUser className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input id="full_name" className="input-auth" placeholder="Jane Cooper"
              {...register("full_name", { required: "Name is required", minLength: { value: 2, message: "Too short" } })} />
          </div>
          {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
        </div>

        <div>
          <label htmlFor="reg_email" className="label">Email</label>
          <div className="relative">
            <FiMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input id="reg_email" type="email" autoComplete="email" className="input-auth" placeholder="you@company.com"
              {...register("email", { required: "Email is required" })} />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="reg_password" className="label">Password</label>
          <div className="relative">
            <FiLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input id="reg_password" type={show ? "text" : "password"} autoComplete="new-password" className="input-auth pr-11" placeholder="At least 8 characters"
              {...register("password", { required: "Password is required", minLength: { value: 8, message: "Min 8 characters" } })} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 transition hover:text-ink-700 dark:hover:text-ink-100">
              {show ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {/* Strength meter */}
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={cx("h-1.5 flex-1 rounded-full transition-colors", i <= score ? STRENGTH_META[score].color : "bg-ink-200 dark:bg-slate-700")} />
                ))}
              </div>
              <span className="w-12 text-right text-[11px] font-medium text-ink-500">{STRENGTH_META[score].label}</span>
            </div>
          )}
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="confirm" className="label">Confirm password</label>
          <div className="relative">
            <FiLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input id="confirm" type="password" autoComplete="new-password" className="input-auth" placeholder="Re-enter password"
              {...register("confirm", { validate: (v) => v === password || "Passwords do not match" })} />
          </div>
          {errors.confirm && <p className="mt-1 text-xs text-red-500">{errors.confirm.message}</p>}
        </div>

        <motion.button type="submit" disabled={isSubmitting} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
          className="btn-gradient w-full py-3 text-[15px]">
          {isSubmitting ? <Spinner /> : <>Create account <FiArrowRight className="h-4 w-4" /></>}
        </motion.button>
      </form>

      <p className="mt-7 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link to="/login" className="link-underline font-semibold text-brand-600 dark:text-brand-400">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
