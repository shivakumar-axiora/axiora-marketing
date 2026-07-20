import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import AuthLayout from "../../layouts/AuthLayout";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/api";
import { Spinner } from "../../components/ui";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { email: "admin@axiora.com", password: "", remember: true },
  });

  const onSubmit = async ({ email, password }) => {
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err, "Login failed"));
    }
  };

  const soon = (provider) => toast(`${provider} sign-in is coming soon`, { icon: "🔒" });

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your marketing dashboard.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <div className="relative">
            <FiMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input-auth"
              placeholder="you@company.com"
              aria-invalid={!!errors.email}
              {...register("email", { required: "Email is required" })}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <FiLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              className="input-auth pr-11"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              {...register("password", { required: "Password is required" })}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 transition hover:text-ink-700 dark:hover:text-ink-100"
            >
              {show ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {/* Remember + forgot */}
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-600 dark:text-ink-200">
            <input type="checkbox" className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-400" {...register("remember")} />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          className="btn-gradient w-full py-3 text-[15px]"
        >
          {isSubmitting ? <Spinner /> : <>Sign In <FiArrowRight className="h-4 w-4" /></>}
        </motion.button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-ink-200 dark:bg-slate-700" />
        or continue with
        <span className="h-px flex-1 bg-ink-200 dark:bg-slate-700" />
      </div>

      {/* Social */}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => soon("Google")} className="btn-secondary py-2.5">
          <FcGoogle className="h-5 w-5" /> Google
        </button>
        <button type="button" onClick={() => soon("Microsoft")} className="btn-secondary py-2.5">
          <MicrosoftIcon /> Microsoft
        </button>
      </div>

      {/* Register */}
      <p className="mt-7 text-center text-sm text-ink-500">
        Don't have an account?{" "}
        <Link to="/register" className="link-underline font-semibold text-brand-600 dark:text-brand-400">
          Create account
        </Link>
      </p>
    </AuthLayout>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 23 23" aria-hidden="true">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  );
}
