import { Navigate, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import AppLayout from "./layout/AppLayout";
import AdminShell from "./layout/AdminShell";
import TenantShell from "./layout/TenantShell";
import StaffShell from "./layout/StaffShell";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import AdminTenantsPage from "./pages/admin/AdminTenantsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";
import AdminSystemPage from "./pages/admin/AdminSystemPage";
import AiHairSuggestPage from "./pages/AiHairSuggestPage";
import BeautyCoachPage from "./pages/BeautyCoachPage";
import BookingSuccessPage from "./pages/BookingSuccessPage";
import BookPage from "./pages/BookPage";
import CustomerBookingsPage from "./pages/CustomerBookingsPage";
import FindBusinessPage from "./pages/FindBusinessPage";
import HairHealthPage from "./pages/HairHealthPage";
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
import TenantAnalyticsPage from "./pages/tenant/TenantAnalyticsPage";
import TenantCustomersPage from "./pages/tenant/TenantCustomersPage";
import TenantPortfolioPage from "./pages/tenant/TenantPortfolioPage";
import TenantProductsPage from "./pages/tenant/TenantProductsPage";
import TenantSettingsPage from "./pages/tenant/TenantSettingsPage";
import TenantTrendingStylesPage from "./pages/tenant/TenantTrendingStylesPage";
import StaffSchedulePage from "./pages/staff/StaffSchedulePage";
import StaffRequestsPage from "./pages/staff/StaffRequestsPage";
import StaffPortfolioPage from "./pages/staff/StaffPortfolioPage";
import StaffEarningsPage from "./pages/staff/StaffEarningsPage";
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
            <Route path="analytics" element={<TenantAnalyticsPage />} />
            <Route path="customers" element={<TenantCustomersPage />} />
            <Route path="portfolio" element={<TenantPortfolioPage />} />
            <Route path="products" element={<TenantProductsPage />} />
            <Route path="settings" element={<TenantSettingsPage />} />
            <Route path="trending" element={<TenantTrendingStylesPage />} />
          </Route>
          <Route path="admin" element={<AdminShell />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="tenants" element={<AdminTenantsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="system" element={<AdminSystemPage />} />
          </Route>
          <Route path="my-bookings" element={<CustomerBookingsPage />} />
          <Route path="bookings" element={<Navigate to="/my-bookings" replace />} />
          <Route path="ai-hair" element={<AiHairSuggestPage />} />
          <Route path="hair-health" element={<HairHealthPage />} />
          <Route path="skin" element={<SkinFacialPage />} />
          <Route path="coach" element={<BeautyCoachPage />} />
          <Route path="salon/:slug" element={<SalonDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="staff" element={<StaffShell />}>
            <Route index element={<Navigate to="schedule" replace />} />
            <Route path="schedule" element={<StaffSchedulePage />} />
            <Route path="requests" element={<StaffRequestsPage />} />
            <Route path="portfolio" element={<StaffPortfolioPage />} />
            <Route path="earnings" element={<StaffEarningsPage />} />
            <Route path="availability" element={<StaffAvailabilityPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
