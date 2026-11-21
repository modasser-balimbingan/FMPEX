import { Route, Routes } from 'react-router-dom';
import PublicLayout from './layout/PublicLayout';
import DashboardLayout from './layout/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Toast from './components/ui/Toast';

// ADDED: SearchMetadata from partner's App.jsx
import SearchMetadata from './components/common/SearchMetadata';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import RegisterPage from './pages/RegisterPage';
import ListingsPage from './pages/ListingsPage';
import FavoritesPage from './pages/FavoritesPage';
import MarketPage from './pages/MarketPage';
import AlertsPage from './pages/AlertsPage';
import FarmerDashboardPage from './pages/FarmerDashboardPage';
import BuyerDashboardPage from './pages/BuyerDashboardPage';
import WeatherPage from './pages/WeatherPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminModulePage from './pages/AdminModulePage';
import NotFoundPage from './pages/NotFoundPage';
import AccountPage from './pages/AccountPage';
import ThemeControl from './components/common/ThemeControl';

export default function App() {
  return (
    <>
      {/* ADDED: SearchMetadata from partner's App.jsx */}
      <SearchMetadata />
      <ThemeControl />

      <Routes>

        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/listings" element={<ListingsPage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/weather" element={<WeatherPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/login" element={<LoginPage admin />} />

        <Route element={<ProtectedRoute role="farmer" />}>
          <Route element={<DashboardLayout role="farmer" />}>
            <Route
              path="/dashboard"
              element={<FarmerDashboardPage />}
            />
            <Route
              path="/dashboard/listings"
              element={<ListingsPage />}
            />
            <Route path="/dashboard/favorites" element={<FavoritesPage />} />
            <Route path="/dashboard/produce" element={<ListingsPage />} />
            <Route
              path="/dashboard/market"
              element={<MarketPage />}
            />
            <Route
              path="/dashboard/weather"
              element={<WeatherPage />}
            />
            <Route
              path="/dashboard/alerts"
              element={<AlertsPage />}
            />
            <Route
              path="/dashboard/notifications"
              element={<NotificationsPage />}
            />
            <Route
              path="/dashboard/settings"
              element={<AccountPage />}
            />
            <Route
              path="/dashboard/help"
              element={<AccountPage type="help" />}
            />
          </Route>
        </Route>

        <Route element={<ProtectedRoute role="buyer" />}>
          <Route element={<DashboardLayout role="buyer" />}>
            <Route
              path="/buyer"
              element={<BuyerDashboardPage />}
            />
            <Route
              path="/buyer/listings"
              element={<ListingsPage />}
            />
            <Route path="/buyer/favorites" element={<FavoritesPage />} />
            <Route
              path="/buyer/market"
              element={<MarketPage />}
            />
            <Route
              path="/buyer/weather"
              element={<WeatherPage />}
            />
            <Route
              path="/buyer/alerts"
              element={<AlertsPage />}
            />
            <Route
              path="/buyer/notifications"
              element={<NotificationsPage />}
            />
            <Route
              path="/buyer/settings"
              element={<AccountPage />}
            />
            <Route
              path="/buyer/help"
              element={<AccountPage type="help" />}
            />
          </Route>
        </Route>

        <Route element={<ProtectedRoute role="admin" />}>
          <Route element={<DashboardLayout role="admin" />}>
            <Route
              path="/admin"
              element={<AdminDashboardPage />}
            />
            <Route
              path="/admin/users"
              element={<AdminModulePage module="users" />}
            />
            <Route
              path="/admin/categories"
              element={<AdminModulePage module="categories" />}
            />
            <Route
              path="/admin/listings"
              element={<AdminModulePage module="listings" />}
            />
            <Route
              path="/admin/market"
              element={<AdminModulePage module="market" />}
            />
            <Route
              path="/admin/alerts"
              element={<AdminModulePage module="alerts" />}
            />
            <Route
              path="/admin/notifications"
              element={<AdminModulePage module="notifications" />}
            />
            <Route
              path="/admin/audit"
              element={<AdminModulePage module="audit" />}
            />
            <Route
              path="/admin/integrations"
              element={<AdminModulePage module="integrations" />}
            />
            <Route
              path="/admin/settings"
              element={<AccountPage />}
            />
            <Route
              path="/admin/help"
              element={<AccountPage type="help" />}
            />
          </Route>
        </Route>

        <Route
          path="*"
          element={<NotFoundPage />}
        />

      </Routes>

      <Toast />
    </>
  );
}
