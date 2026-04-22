import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router";

import { AdminPage } from "../pages/AdminPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { HomePage } from "../pages/HomePage";
import { NewsPage } from "../pages/NewsPage";
import { LoginPage } from "../pages/LoginPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterPage } from "../pages/RegisterPage";
import { ResendVerificationPage } from "../pages/ResendVerificationPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { VerifyAccountPage } from "../pages/VerifyAccountPage";
import { ProtectedAuthRoute, PublicOnlyRoute, SuperuserRoute } from "./routes/route-guards";

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/news" element={<NewsPage />} />
      <Route
        path="/admin"
        element={
          <SuperuserRoute>
            <AdminPage />
          </SuperuserRoute>
        }
      />
      <Route
        path="/me"
        element={
          <ProtectedAuthRoute>
            <ProfilePage />
          </ProtectedAuthRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/resend-verification" element={<ResendVerificationPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-account" element={<VerifyAccountPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
