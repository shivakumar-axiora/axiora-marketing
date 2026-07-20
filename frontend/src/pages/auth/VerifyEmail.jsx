import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import AuthLayout from "../../layouts/AuthLayout";
import { authApi } from "../../services/endpoints";
import { Spinner } from "../../components/ui";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState("loading"); // loading | ok | error

  useEffect(() => {
    if (!token) { setState("error"); return; }
    authApi.verifyEmail(token).then(() => setState("ok")).catch(() => setState("error"));
  }, [token]);

  return (
    <AuthLayout title="Email verification">
      <div className="flex flex-col items-center py-6 text-center">
        {state === "loading" && <Spinner className="h-8 w-8 text-brand-500" />}
        {state === "ok" && (
          <>
            <FiCheckCircle className="h-14 w-14 text-brand-500" />
            <p className="mt-4 font-semibold">Your email is verified!</p>
            <Link to="/login" className="btn-primary mt-6">Continue to sign in</Link>
          </>
        )}
        {state === "error" && (
          <>
            <FiXCircle className="h-14 w-14 text-red-500" />
            <p className="mt-4 font-semibold">Verification failed</p>
            <p className="mt-1 text-sm text-ink-500">The link is invalid or has expired.</p>
            <Link to="/login" className="btn-secondary mt-6">Back to sign in</Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
