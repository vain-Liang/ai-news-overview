import appEn from "./locales/shared/ui/app-shell/en.ts";
import appZhCN from "./locales/shared/ui/app-shell/zh-CN.ts";
import httpEn from "./locales/shared/api/http/en.ts";
import httpZhCN from "./locales/shared/api/http/zh-CN.ts";
import languageSwitcherEn from "./locales/shared/ui/language-switcher/en.ts";
import languageSwitcherZhCN from "./locales/shared/ui/language-switcher/zh-CN.ts";
import themeToggleEn from "./locales/shared/ui/theme-toggle/en.ts";
import themeToggleZhCN from "./locales/shared/ui/theme-toggle/zh-CN.ts";
import adminUserManagementCardEn from "./locales/features/admin/components/AdminUserManagementCard/en.ts";
import adminUserManagementCardZhCN from "./locales/features/admin/components/AdminUserManagementCard/zh-CN.ts";
import adminWorkflowManagementCardEn from "./locales/features/admin/components/AdminWorkflowManagementCard/en.ts";
import adminWorkflowManagementCardZhCN from "./locales/features/admin/components/AdminWorkflowManagementCard/zh-CN.ts";
import authLayoutEn from "./locales/features/auth/components/AuthLayout/en.ts";
import authLayoutZhCN from "./locales/features/auth/components/AuthLayout/zh-CN.ts";
import authProviderEn from "./locales/features/auth/context/AuthProvider/en.ts";
import authProviderZhCN from "./locales/features/auth/context/AuthProvider/zh-CN.ts";
import forgotPasswordFormEn from "./locales/features/auth/components/ForgotPasswordForm/en.ts";
import forgotPasswordFormZhCN from "./locales/features/auth/components/ForgotPasswordForm/zh-CN.ts";
import loginFormEn from "./locales/features/auth/components/LoginForm/en.ts";
import loginFormZhCN from "./locales/features/auth/components/LoginForm/zh-CN.ts";
import registerFormEn from "./locales/features/auth/components/RegisterForm/en.ts";
import registerFormZhCN from "./locales/features/auth/components/RegisterForm/zh-CN.ts";
import resendVerificationFormEn from "./locales/features/auth/components/ResendVerificationForm/en.ts";
import resendVerificationFormZhCN from "./locales/features/auth/components/ResendVerificationForm/zh-CN.ts";
import resetPasswordFormEn from "./locales/features/auth/components/ResetPasswordForm/en.ts";
import resetPasswordFormZhCN from "./locales/features/auth/components/ResetPasswordForm/zh-CN.ts";
import userMenuEn from "./locales/features/auth/components/UserMenu/en.ts";
import userMenuZhCN from "./locales/features/auth/components/UserMenu/zh-CN.ts";
import userProfileCardEn from "./locales/features/auth/components/UserProfileCard/en.ts";
import userProfileCardZhCN from "./locales/features/auth/components/UserProfileCard/zh-CN.ts";
import verificationReminderBannerEn from "./locales/features/auth/components/VerificationReminderBanner/en.ts";
import verificationReminderBannerZhCN from "./locales/features/auth/components/VerificationReminderBanner/zh-CN.ts";
import verifyAccountCardEn from "./locales/features/auth/components/VerifyAccountCard/en.ts";
import verifyAccountCardZhCN from "./locales/features/auth/components/VerifyAccountCard/zh-CN.ts";
import homepageNewsSectionEn from "./locales/features/news/components/HomepageNewsSection/en.ts";
import homepageNewsSectionZhCN from "./locales/features/news/components/HomepageNewsSection/zh-CN.ts";
import newsIngestSectionEn from "./locales/features/news/components/NewsIngestSection/en.ts";
import newsIngestSectionZhCN from "./locales/features/news/components/NewsIngestSection/zh-CN.ts";
import newsSearchSectionEn from "./locales/features/news/components/NewsSearchSection/en.ts";
import newsSearchSectionZhCN from "./locales/features/news/components/NewsSearchSection/zh-CN.ts";
import newsSummarySectionEn from "./locales/features/news/components/NewsSummarySection/en.ts";
import newsSummarySectionZhCN from "./locales/features/news/components/NewsSummarySection/zh-CN.ts";
import runtimeStatusCardEn from "./locales/features/system/components/RuntimeStatusCard/en.ts";
import runtimeStatusCardZhCN from "./locales/features/system/components/RuntimeStatusCard/zh-CN.ts";
import adminPageEn from "./locales/pages/AdminPage/en.ts";
import adminPageZhCN from "./locales/pages/AdminPage/zh-CN.ts";
import forgotPasswordPageEn from "./locales/pages/ForgotPasswordPage/en.ts";
import forgotPasswordPageZhCN from "./locales/pages/ForgotPasswordPage/zh-CN.ts";
import homePageEn from "./locales/pages/HomePage/en.ts";
import homePageZhCN from "./locales/pages/HomePage/zh-CN.ts";
import loginPageEn from "./locales/pages/LoginPage/en.ts";
import loginPageZhCN from "./locales/pages/LoginPage/zh-CN.ts";
import newsPageEn from "./locales/pages/NewsPage/en.ts";
import newsPageZhCN from "./locales/pages/NewsPage/zh-CN.ts";
import profilePageEn from "./locales/pages/ProfilePage/en.ts";
import profilePageZhCN from "./locales/pages/ProfilePage/zh-CN.ts";
import registerPageEn from "./locales/pages/RegisterPage/en.ts";
import registerPageZhCN from "./locales/pages/RegisterPage/zh-CN.ts";
import resendVerificationPageEn from "./locales/pages/ResendVerificationPage/en.ts";
import resendVerificationPageZhCN from "./locales/pages/ResendVerificationPage/zh-CN.ts";
import resetPasswordPageEn from "./locales/pages/ResetPasswordPage/en.ts";
import resetPasswordPageZhCN from "./locales/pages/ResetPasswordPage/zh-CN.ts";
import verifyAccountPageEn from "./locales/pages/VerifyAccountPage/en.ts";
import verifyAccountPageZhCN from "./locales/pages/VerifyAccountPage/zh-CN.ts";

export const namespaces = [
  "appShell",
  "http",
  "authProvider",
  "languageSwitcher",
  "themeToggle",
  "adminPage",
  "homePage",
  "profilePage",
  "newsPage",
  "loginPage",
  "registerPage",
  "forgotPasswordPage",
  "resetPasswordPage",
  "resendVerificationPage",
  "verifyAccountPage",
  "authLayout",
  "loginForm",
  "registerForm",
  "forgotPasswordForm",
  "resetPasswordForm",
  "resendVerificationForm",
  "verifyAccountCard",
  "userMenu",
  "userProfileCard",
  "verificationReminderBanner",
  "homepageNewsSection",
  "newsSearchSection",
  "newsSummarySection",
  "newsIngestSection",
  "runtimeStatusCard",
  "adminUserManagementCard",
  "adminWorkflowManagementCard",
] as const;

export const resources = {
  en: {
    appShell: appEn,
    http: httpEn,
    authProvider: authProviderEn,
    languageSwitcher: languageSwitcherEn,
    themeToggle: themeToggleEn,
    adminPage: adminPageEn,
    homePage: homePageEn,
    profilePage: profilePageEn,
    newsPage: newsPageEn,
    loginPage: loginPageEn,
    registerPage: registerPageEn,
    forgotPasswordPage: forgotPasswordPageEn,
    resetPasswordPage: resetPasswordPageEn,
    resendVerificationPage: resendVerificationPageEn,
    verifyAccountPage: verifyAccountPageEn,
    authLayout: authLayoutEn,
    loginForm: loginFormEn,
    registerForm: registerFormEn,
    forgotPasswordForm: forgotPasswordFormEn,
    resetPasswordForm: resetPasswordFormEn,
    resendVerificationForm: resendVerificationFormEn,
    verifyAccountCard: verifyAccountCardEn,
    userMenu: userMenuEn,
    userProfileCard: userProfileCardEn,
    verificationReminderBanner: verificationReminderBannerEn,
    homepageNewsSection: homepageNewsSectionEn,
    newsSearchSection: newsSearchSectionEn,
    newsSummarySection: newsSummarySectionEn,
    newsIngestSection: newsIngestSectionEn,
    runtimeStatusCard: runtimeStatusCardEn,
    adminUserManagementCard: adminUserManagementCardEn,
    adminWorkflowManagementCard: adminWorkflowManagementCardEn,
  },
  "zh-CN": {
    appShell: appZhCN,
    http: httpZhCN,
    authProvider: authProviderZhCN,
    languageSwitcher: languageSwitcherZhCN,
    themeToggle: themeToggleZhCN,
    adminPage: adminPageZhCN,
    homePage: homePageZhCN,
    profilePage: profilePageZhCN,
    newsPage: newsPageZhCN,
    loginPage: loginPageZhCN,
    registerPage: registerPageZhCN,
    forgotPasswordPage: forgotPasswordPageZhCN,
    resetPasswordPage: resetPasswordPageZhCN,
    resendVerificationPage: resendVerificationPageZhCN,
    verifyAccountPage: verifyAccountPageZhCN,
    authLayout: authLayoutZhCN,
    loginForm: loginFormZhCN,
    registerForm: registerFormZhCN,
    forgotPasswordForm: forgotPasswordFormZhCN,
    resetPasswordForm: resetPasswordFormZhCN,
    resendVerificationForm: resendVerificationFormZhCN,
    verifyAccountCard: verifyAccountCardZhCN,
    userMenu: userMenuZhCN,
    userProfileCard: userProfileCardZhCN,
    verificationReminderBanner: verificationReminderBannerZhCN,
    homepageNewsSection: homepageNewsSectionZhCN,
    newsSearchSection: newsSearchSectionZhCN,
    newsSummarySection: newsSummarySectionZhCN,
    newsIngestSection: newsIngestSectionZhCN,
    runtimeStatusCard: runtimeStatusCardZhCN,
    adminUserManagementCard: adminUserManagementCardZhCN,
    adminWorkflowManagementCard: adminWorkflowManagementCardZhCN,
  },
} as const;
