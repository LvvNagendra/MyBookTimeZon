import { Navigate, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./layout/AppLayout";
import AdminShell from "./layout/AdminShell";
import TenantShell from "./layout/TenantShell";
import StaffShell from "./layout/StaffShell";
import ComingSoonPage from "./pages/ComingSoonPage";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import AdminTenantsPage from "./pages/admin/AdminTenantsPage";
import AdminSectorsPage from "./pages/admin/AdminSectorsPage";
import AdminRolesPage from "./pages/admin/AdminRolesPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";
import AdminSystemPage from "./pages/admin/AdminSystemPage";
import AiHairSuggestPage from "./pages/AiHairSuggestPage";
import BeautyCoachPage from "./pages/BeautyCoachPage";
import BookingSuccessPage from "./pages/BookingSuccessPage";
import BookPage from "./pages/BookPage";
import CustomerBookingsPage from "./pages/CustomerBookingsPage";
import FindBusinessPage from "./pages/FindBusinessPage";
import HelpPage from "./pages/HelpPage";
import IntroGate from "./pages/IntroGate";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import ProfilePage from "./pages/ProfilePage";
import SalonDetailPage from "./pages/SalonDetailPage";
import SkinFacialPage from "./pages/SkinFacialPage";
import NotFoundPage from "./pages/NotFoundPage";
import SplashPage from "./pages/SplashPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import TenantOverviewPage from "./pages/tenant/TenantOverviewPage";
import TenantServicesPage from "./pages/tenant/TenantServicesPage";
import TenantStaffPage from "./pages/tenant/TenantStaffPage";
import TenantBookingsPage from "./pages/tenant/TenantBookingsPage";
import TenantCustomersPage from "./pages/tenant/TenantCustomersPage";
import TenantSettingsPage from "./pages/tenant/TenantSettingsPage";
import TenantTrendingStylesPage from "./pages/tenant/TenantTrendingStylesPage";
import StaffSchedulePage from "./pages/staff/StaffSchedulePage";
import StaffAvailabilityPage from "./pages/staff/StaffAvailabilityPage";

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/splash" element={<SplashPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<IntroGate />} />
          <Route path="home" element={<IntroGate />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="unauthorized" element={<UnauthorizedPage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="find" element={<Navigate to="/nearby" replace />} />
          <Route path="nearby" element={<FindBusinessPage />} />
          <Route path="book/:businessType/:slug" element={<BookPage />} />
          <Route path="booking-success" element={<BookingSuccessPage />} />
          <Route path="dashboard" element={<TenantShell />}>
            <Route index element={<TenantOverviewPage />} />
            <Route path="services" element={<TenantServicesPage />} />
            <Route path="staff" element={<TenantStaffPage />} />
            <Route path="bookings" element={<TenantBookingsPage />} />
            <Route
              path="analytics"
              element={<ComingSoonPage title="Analytics" feature="Business analytics" backTo="/dashboard" backLabel="Overview" />}
            />
            <Route path="customers" element={<TenantCustomersPage />} />
            <Route
              path="portfolio"
              element={<ComingSoonPage title="AI portfolio" feature="Portfolio gallery" backTo="/dashboard" backLabel="Overview" />}
            />
            <Route
              path="products"
              element={<ComingSoonPage title="Products" feature="Retail inventory" backTo="/dashboard" backLabel="Overview" />}
            />
            <Route path="settings" element={<TenantSettingsPage />} />
            <Route path="trending" element={<TenantTrendingStylesPage />} />
          </Route>
          <Route path="admin" element={<AdminShell />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="tenants" element={<AdminTenantsPage />} />
            <Route path="sectors" element={<AdminSectorsPage />} />
            <Route path="roles" element={<AdminRolesPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="system" element={<AdminSystemPage />} />
          </Route>
          <Route path="my-bookings" element={<CustomerBookingsPage />} />
          <Route path="bookings" element={<Navigate to="/my-bookings" replace />} />
          <Route path="ai-hair" element={<AiHairSuggestPage />} />
          <Route
            path="hair-health"
            element={<ComingSoonPage title="Hair health" feature="Hair health scan" backTo="/ai-hair" backLabel="AI hair" />}
          />
          <Route path="skin" element={<SkinFacialPage />} />
          <Route path="coach" element={<BeautyCoachPage />} />
          <Route path="salon/:slug" element={<SalonDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="staff" element={<StaffShell />}>
            <Route index element={<Navigate to="schedule" replace />} />
            <Route path="schedule" element={<StaffSchedulePage />} />
            <Route
              path="requests"
              element={<ComingSoonPage title="Style requests" feature="Style request workflow" backTo="/staff/schedule" backLabel="Schedule" />}
            />
            <Route
              path="portfolio"
              element={<ComingSoonPage title="Portfolio" feature="Staff portfolio" backTo="/staff/schedule" backLabel="Schedule" />}
            />
            <Route
              path="earnings"
              element={<ComingSoonPage title="Earnings" feature="Staff earnings" backTo="/staff/schedule" backLabel="Schedule" />}
            />
            <Route path="availability" element={<StaffAvailabilityPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
