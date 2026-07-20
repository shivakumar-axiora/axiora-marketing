import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 px-6 dark:bg-slate-900">
      <div className="text-center">
        <p className="text-7xl font-extrabold text-brand-500">404</p>
        <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
        <p className="mt-1 text-ink-500">The page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="btn-primary mt-6">Back to dashboard</Link>
      </div>
    </div>
  );
}
