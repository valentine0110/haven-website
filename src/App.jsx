import React, { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Header, Footer } from "./components/Chrome";
import RequireAuth from "./components/RequireAuth";
import RequireRole from "./components/RequireRole";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider } from "./lib/auth";
import { ToastProvider } from "./components/Toast";
import { PageLoading } from "./components/DataState";
import { PreferencesProvider } from "./lib/preferences";

/* ── Lazy-loaded pages (code splitting) ───────────────── */
const Home = lazy(() => import("./pages/Home"));
const Properties = lazy(() => import("./pages/Properties"));
const Buy = lazy(() => import("./pages/Buy"));
const Rent = lazy(() => import("./pages/Rent"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const Contact = lazy(() => import("./pages/Contact"));
const Team = lazy(() => import("./pages/Team"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Saved = lazy(() => import("./pages/Saved"));

/* ── Admin (separate chunk — not downloaded by public visitors) ── */
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminPropertyForm = lazy(() => import("./pages/admin/PropertyForm"));
const AdminAgents = lazy(() => import("./pages/admin/Agents"));
const AdminEnquiries = lazy(() => import("./pages/admin/Enquiries"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminStaff = lazy(() => import("./pages/admin/Staff"));

function SiteLayout({ children }) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header />
      <div id="main-content">
        <Suspense fallback={<PageLoading label="Loading..." />}>
          {children}
        </Suspense>
      </div>
      <Footer />
      <ScrollToTop />
    </>
  );
}

function AdminSuspense({ children }) {
  return (
    <Suspense fallback={<PageLoading label="Loading admin..." />}>
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
    <AuthProvider>
    <PreferencesProvider>
    <ToastProvider>
      <Routes>
        <Route path="/" element={<SiteLayout><Home /></SiteLayout>} />
        <Route path="/properties" element={<SiteLayout><Properties /></SiteLayout>} />
        <Route path="/properties/:slug" element={<SiteLayout><PropertyDetail /></SiteLayout>} />
        <Route path="/buy" element={<SiteLayout><Buy /></SiteLayout>} />
        <Route path="/rent" element={<SiteLayout><Rent /></SiteLayout>} />
        <Route path="/about" element={<SiteLayout><About /></SiteLayout>} />
        <Route path="/services" element={<SiteLayout><Services /></SiteLayout>} />
        <Route path="/team" element={<SiteLayout><Team /></SiteLayout>} />
        <Route path="/agents" element={<SiteLayout><Team /></SiteLayout>} />
        <Route path="/contact" element={<SiteLayout><Contact /></SiteLayout>} />
        <Route path="/faq" element={<SiteLayout><FAQ /></SiteLayout>} />
        <Route path="/saved" element={<SiteLayout><Saved /></SiteLayout>} />
        <Route path="/privacy" element={<SiteLayout><Privacy /></SiteLayout>} />
        <Route path="/terms" element={<SiteLayout><Terms /></SiteLayout>} />

        {/* Admin / staff CMS — not part of the public site chrome */}
        <Route path="/admin" element={<AdminSuspense><AdminLogin /></AdminSuspense>} />
        <Route path="/admin/dashboard" element={<AdminSuspense><RequireAuth><AdminDashboard /></RequireAuth></AdminSuspense>} />
        <Route path="/admin/properties/new" element={<AdminSuspense><RequireAuth><AdminPropertyForm /></RequireAuth></AdminSuspense>} />
        <Route path="/admin/properties/:id" element={<AdminSuspense><RequireAuth><AdminPropertyForm /></RequireAuth></AdminSuspense>} />
        <Route path="/admin/agents" element={<AdminSuspense><RequireAuth><RequireRole roles={["owner", "admin"]}><AdminAgents /></RequireRole></RequireAuth></AdminSuspense>} />
        <Route path="/admin/enquiries" element={<AdminSuspense><RequireAuth><AdminEnquiries /></RequireAuth></AdminSuspense>} />
        <Route path="/admin/settings" element={<AdminSuspense><RequireAuth><AdminSettings /></RequireAuth></AdminSuspense>} />
        <Route path="/admin/staff" element={<AdminSuspense><RequireAuth><RequireRole roles={["owner"]}><AdminStaff /></RequireRole></RequireAuth></AdminSuspense>} />

        <Route path="*" element={<SiteLayout><NotFound /></SiteLayout>} />
      </Routes>
    </ToastProvider>
    </PreferencesProvider>
    </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
