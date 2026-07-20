import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "./context/AuthContext";
import { PageLoader } from "./components/ui";
import DashboardLayout from "./layouts/DashboardLayout";

// Code-split every route so the initial bundle stays small.
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Groups = lazy(() => import("./pages/Groups"));
const Segments = lazy(() => import("./pages/Segments"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const CampaignBuilder = lazy(() => import("./pages/CampaignBuilder"));
const CampaignDetail = lazy(() => import("./pages/CampaignDetail"));
const Templates = lazy(() => import("./pages/Templates"));
const Media = lazy(() => import("./pages/Media"));
const Reports = lazy(() => import("./pages/Reports"));
const ActivityLogs = lazy(() => import("./pages/ActivityLogs"));
const Users = lazy(() => import("./pages/Users"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center"><PageLoader /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center"><PageLoader /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function RoleGuard({ roles, children }) {
  const { hasRole } = useAuth();
  if (!hasRole(...roles)) return <Navigate to="/dashboard" replace />;
  return children;
}

/* Root: marketing landing for guests, app for authenticated users. */
function Home() {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center"><PageLoader /></div>;
  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
}

export default function App() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<div className="grid min-h-screen place-items-center"><PageLoader /></div>}>
      <Routes location={location} key={location.pathname}>
        {/* Public landing */}
        <Route path="/" element={<Home />} />

        {/* Public auth */}
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Protected */}
        <Route element={<Protected><DashboardLayout /></Protected>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/segments" element={<Segments />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/new" element={<CampaignBuilder />} />
          <Route path="/campaigns/:id/edit" element={<CampaignBuilder />} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/media" element={<Media />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/activity" element={<ActivityLogs />} />
          <Route path="/users" element={<RoleGuard roles={["admin"]}><Users /></RoleGuard>} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </AnimatePresence>
  );
}
