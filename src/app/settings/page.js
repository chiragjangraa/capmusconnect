"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/lib/api";
import {
  Settings,
  Bell,
  Lock,
  User,
  Shield,
  Save,
  CheckCircle2,
  Sliders,
  Sparkles,
  X,
  AlertCircle,
} from "@/components/Icons";

export default function SettingsPage() {
  const { user, role, isLoading: authLoading, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("account"); // "account" | "notifications" | "appearance"
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [saveErrorMsg, setSaveErrorMsg] = useState("");

  // Account profile state (supports user override without redundant sync effect)
  const [nameInput, setNameInput] = useState(null);
  const [deptInput, setDeptInput] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const name = nameInput !== null ? nameInput : (user?.name || "");
  const department = deptInput !== null ? deptInput : (user?.department || "");

  // Password settings state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    deadlineReminders: true,
    gradeAlerts: true,
    scheduleChanges: true,
    weeklyDigest: false,
    smsAlerts: true,
    announcements: true,
  });

  // Appearance preferences state
  const [appearance, setAppearance] = useState({
    theme: "navy", // "navy" | "light" | "system"
    density: "comfortable", // "comfortable" | "compact"
    highContrast: false,
    defaultRoute: "/dashboard",
  });

  // Profile Update Handler (name and department)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveSuccessMsg("");
    setSaveErrorMsg("");

    if (!name.trim()) {
      setSaveErrorMsg("Full name is required.");
      return;
    }
    if (!department.trim()) {
      setSaveErrorMsg("Department is required.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await authAPI.updateProfile({
        name: name.trim(),
        department: department.trim(),
      });

      if (res?.success) {
        setNameInput(null);
        setDeptInput(null);
        await refreshUser();
        setSaveSuccessMsg("Account profile details updated successfully!");
        setTimeout(() => {
          setSaveSuccessMsg("");
        }, 4500);
      } else {
        setSaveErrorMsg(res?.message || "Failed to update profile settings.");
      }
    } catch (err) {
      setSaveErrorMsg(err.message || "Failed to update profile settings.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password Change Handler
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setSaveSuccessMsg("");
    setSaveErrorMsg("");

    if (!currentPassword) {
      setSaveErrorMsg("Please enter your current password.");
      return;
    }
    if (!newPassword) {
      setSaveErrorMsg("Please enter your new password.");
      return;
    }
    if (newPassword.length < 12) {
      setSaveErrorMsg("New password must be at least 12 characters long. Passphrases are encouraged.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSaveErrorMsg("New password and confirm password do not match.");
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await authAPI.updatePassword({
        currentPassword,
        newPassword,
      });

      if (res?.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSaveSuccessMsg("Password changed successfully!");
        setTimeout(() => {
          setSaveSuccessMsg("");
        }, 4500);
      } else {
        setSaveErrorMsg(res?.message || "Failed to change password.");
      }
    } catch (err) {
      setSaveErrorMsg(err.message || "Failed to change password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Notification Preferences Handler
  const handleSaveNotifications = (e) => {
    e.preventDefault();
    setSaveErrorMsg("");
    setSaveSuccessMsg("Notification preferences saved successfully for this session.");
    setTimeout(() => {
      setSaveSuccessMsg("");
    }, 4500);
  };

  // Appearance Preferences Handler
  const handleSaveAppearance = (e) => {
    e.preventDefault();
    setSaveErrorMsg("");
    setSaveSuccessMsg("Appearance and display preferences saved successfully for this session.");
    setTimeout(() => {
      setSaveSuccessMsg("");
    }, 4500);
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-600">
            Loading portal settings...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center shadow-xs">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-600" />
          <h2 className="mt-3 text-lg font-bold text-amber-900">
            Authentication Required
          </h2>
          <p className="mt-1 text-sm text-amber-700">
            Please sign in to access and customize your account and portal settings.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-14">
        {/* Success Alert */}
        {saveSuccessMsg && (
          <div
            role="status"
            className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm font-semibold text-emerald-800 shadow-sm animate-fadeIn"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button
              onClick={() => setSaveSuccessMsg("")}
              className="text-emerald-700 hover:text-emerald-900"
              aria-label="Close success message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {saveErrorMsg && (
          <div
            role="alert"
            className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm font-semibold text-red-800 shadow-sm animate-fadeIn"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <span>{saveErrorMsg}</span>
            </div>
            <button
              onClick={() => setSaveErrorMsg("")}
              className="text-red-700 hover:text-red-900"
              aria-label="Close error message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
              <Settings className="h-3.5 w-3.5" />
              <span>Preferences & Configurations</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Portal Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              Customize security preferences, notification delivery channels, and personalized dashboard display settings.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Active Account:</span>
            <span className="font-bold text-slate-900">{user.email}</span>
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
              {role || "student"}
            </span>
          </div>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs sm:text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 transition-colors whitespace-nowrap ${
              activeTab === "account"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Account & Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 transition-colors whitespace-nowrap ${
              activeTab === "notifications"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Notification Preferences</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("appearance")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 transition-colors whitespace-nowrap ${
              activeTab === "appearance"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Appearance & Display</span>
          </button>
        </div>

        {/* Tab 1: Account & Security */}
        {activeTab === "account" && (
          <div className="space-y-6">
            {/* Account Credentials Card */}
            <form onSubmit={handleSaveProfile}>
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900">
                    {role === "admin"
                      ? "Administrator Account Details"
                      : "Student Account Credentials"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {role === "admin"
                      ? "CampusConnect administrative staff identity and departmental assignment"
                      : "University Single Sign-On (SSO) credentials and student identity"}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      {role === "admin" ? "Administrator Name" : "Student Full Name"}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Enter full name"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Academic Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDeptInput(e.target.value)}
                      placeholder="e.g. Computer Science & Engineering"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Institutional Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 px-3 text-sm text-slate-500 cursor-not-allowed"
                    />
                    <span className="text-[11px] text-slate-400">
                      Email address is managed by university registrar.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      {role === "admin" ? "Staff Account ID" : "Student Account ID"}
                    </label>
                    <input
                      type="text"
                      value={user._id}
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 px-3 text-sm font-mono text-slate-500 cursor-not-allowed"
                    />
                    <span className="text-[11px] text-slate-400">
                      Permanent database account identifier.
                    </span>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Account Role & Access Level
                    </label>
                    <div className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 px-3 text-sm text-slate-700 font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="capitalize">
                          {role === "admin"
                            ? "Administrator (Elevated System Privileges)"
                            : "Student (Standard Academic Portal Access)"}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        {role || "student"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Role elevation is strictly restricted to university central administration.
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingProfile ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Profile Details</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Password & Security Section */}
            <form onSubmit={handleSavePassword}>
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900">
                    Password & Multi-Factor Security
                  </h2>
                  <p className="text-xs text-slate-500">
                    Update your campus portal password and authentication credentials
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-[11px] text-slate-400">
                      Minimum 12 characters. Passphrases and password managers are supported.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* 2FA Toggle */}
                <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-900">
                        Two-Factor Authentication (2FA)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Require verification confirmation on unrecognized browser sign-ins
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingPassword ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Notification Preferences */}
        {activeTab === "notifications" && (
          <form onSubmit={handleSaveNotifications} className="space-y-6">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Notification Delivery Channels
                </h2>
                <p className="text-xs text-slate-500">
                  Configure real-time alerts for assignments, grade publications, and campus notices
                </p>
              </div>

              <div className="space-y-4 divide-y divide-slate-100">
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Assignment Deadline Alerts
                    </h3>
                    <p className="text-xs text-slate-500">
                      Receive reminders 48 hours and 24 hours prior to assignment submission deadlines
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.deadlineReminders}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        deadlineReminders: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Grade & Feedback Publication
                    </h3>
                    <p className="text-xs text-slate-500">
                      Immediate email notification when a professor publishes marks or assignment feedback
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.gradeAlerts}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        gradeAlerts: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Lecture Schedule & Room Changes
                    </h3>
                    <p className="text-xs text-slate-500">
                      Instant updates when a course lecture is rescheduled or relocated to a new hall
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.scheduleChanges}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        scheduleChanges: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Weekly Academic Performance Digest
                    </h3>
                    <p className="text-xs text-slate-500">
                      Summary report every Monday summarizing attendance trends, upcoming quizzes, and tasks
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.weeklyDigest}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        weeklyDigest: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Urgent Emergency SMS Broadcasts
                    </h3>
                    <p className="text-xs text-slate-500">
                      Severe weather, campus security, or immediate university emergency notices sent to mobile
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.smsAlerts}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        smsAlerts: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Notification Preferences</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 3: Appearance Preferences */}
        {activeTab === "appearance" && (
          <form onSubmit={handleSaveAppearance} className="space-y-6">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Interface & Visual Layout
                </h2>
                <p className="text-xs text-slate-500">
                  Personalize portal theme styling, layout density, and navigation defaults
                </p>
              </div>

              {/* Theme Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Portal Theme Preset
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setAppearance({ ...appearance, theme: "navy" })}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      appearance.theme === "navy"
                        ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-slate-50 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900">
                        Default Navy
                      </span>
                      {appearance.theme === "navy" && (
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Classic navy blue sidebar with clean light-grey workspace canvas.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAppearance({ ...appearance, theme: "light" })}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      appearance.theme === "light"
                        ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-slate-50 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900">
                        Clean Slate
                      </span>
                      {appearance.theme === "light" && (
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      High-contrast minimal border framework optimized for document review.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAppearance({ ...appearance, theme: "system" })}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      appearance.theme === "system"
                        ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-slate-50 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900">
                        System Sync
                      </span>
                      {appearance.theme === "system" && (
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Follow operating system color mode and accessibility preferences.
                    </p>
                  </button>
                </div>
              </div>

              {/* Layout Density */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Data Density
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="density"
                      value="comfortable"
                      checked={appearance.density === "comfortable"}
                      onChange={() =>
                        setAppearance({ ...appearance, density: "comfortable" })
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Comfortable (Spacious cards & tables)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="density"
                      value="compact"
                      checked={appearance.density === "compact"}
                      onChange={() =>
                        setAppearance({ ...appearance, density: "compact" })
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Compact (High data density)</span>
                  </label>
                </div>
              </div>

              {/* Default Sign-In Route */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Default Destination on Portal Sign-in
                </label>
                <select
                  value={appearance.defaultRoute}
                  onChange={(e) =>
                    setAppearance({
                      ...appearance,
                      defaultRoute: e.target.value,
                    })
                  }
                  className="w-full sm:w-72 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs sm:text-sm text-slate-800 font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="/dashboard">Student Dashboard (/dashboard)</option>
                  <option value="/courses">Course Catalog (/courses)</option>
                  <option value="/assignments">Assignments Hub (/assignments)</option>
                </select>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Appearance Preferences</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
