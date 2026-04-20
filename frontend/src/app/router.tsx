import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router";

import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { ResendVerificationPage } from "../pages/ResendVerificationPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { VerifyAccountPage } from "../pages/VerifyAccountPage";
import { ProtectedAuthRoute, PublicOnlyRoute } from "./routes/route-guards";

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
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
      <Route
        path="/me"
        element={
          <ProtectedAuthRoute>
            <Navigate to="/" replace />
          </ProtectedAuthRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
