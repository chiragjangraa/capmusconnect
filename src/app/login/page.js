"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  BookOpen,
} from "@/components/Icons";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, user } = useAuth();

  // Active form mode: "login" or "register"
  const [mode, setMode] = useState("login");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Status & Feedback States
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    resetMessages();
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    // Client-side Validations
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }

      if (!department.trim()) {
        setError("Please enter your academic department.");
        return;
      }

      if (password.length < 12) {
        setError("Password must be at least 12 characters long. Passphrases are encouraged.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const res = await login({
          email: email.trim(),
          password,
        });

        if (res.success) {
          const displayName = res.user?.name || "Student";
          setSuccessMessage(`Welcome back, ${displayName}! Redirecting to dashboard...`);
          setTimeout(() => {
            router.push("/dashboard");
          }, 800);
        } else {
          setError(res.error || "Authentication failed. Please verify your credentials.");
          setIsSubmitting(false);
        }
      } else {
        // Register mode
        const res = await register({
          name: name.trim(),
          email: email.trim(),
          password,
          department: department.trim(),
        });

        if (res.success) {
          const displayName = res.user?.name || "Student";
          setSuccessMessage(
            `Account created successfully! Welcome to CampusConnect, ${displayName}. Redirecting...`
          );
          setTimeout(() => {
            router.push("/dashboard");
          }, 800);
        } else {
          setError(res.error || "Registration failed. Please try again.");
          setIsSubmitting(false);
        }
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-900 antialiased">
      {/* Top Bar with Back to Home Link */}
      <div className="w-full mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main Centered Auth Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

            {/* Brand Logo & Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {mode === "login" ? "Portal Sign In" : "Student Registration"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {mode === "login"
                  ? "Sign in with your student or administrative credentials"
                  : "Create a new student account to access the portal"}
              </p>
            </div>

            {/* Mode Tabs (Sign In vs Register) */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleModeChange("login")}
                className={`rounded-xl py-2 transition-all ${
                  mode === "login"
                    ? "bg-white text-blue-600 shadow-sm shadow-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("register")}
                className={`rounded-xl py-2 transition-all ${
                  mode === "register"
                    ? "bg-white text-blue-600 shadow-sm shadow-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Register
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 animate-fadeIn"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div
                role="status"
                className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 animate-fadeIn"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Register-only: Full Name */}
              {mode === "register" && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label
                    htmlFor="name"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="e.g. Aarav Sharma"
                      disabled={isSubmitting || !!successMessage}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  {mode === "login" ? "University Email" : "Student Email"}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder={
                      mode === "login"
                        ? "student@campus.edu or admin@campus.edu"
                        : "name@campus.edu"
                    }
                    disabled={isSubmitting || !!successMessage}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Register-only: Department */}
              {mode === "register" && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label
                    htmlFor="department"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Academic Department
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <input
                      id="department"
                      type="text"
                      value={department}
                      onChange={(e) => {
                        setDepartment(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="e.g. Computer Science & Engineering"
                      disabled={isSubmitting || !!successMessage}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Password
                  </label>
                  {mode === "login" && (
                    <a
                      href="#forgot"
                      onClick={(e) => {
                        e.preventDefault();
                        alert("Password reset instructions will be sent to your registered university email.");
                      }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="••••••••"
                    disabled={isSubmitting || !!successMessage}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {mode === "register" && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Minimum 12 characters. Passphrases and password managers are supported.
                  </p>
                )}
              </div>

              {/* Remember Me Checkbox (Login mode only) */}
              {mode === "login" && (
                <div className="flex items-center pt-1">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-xs font-medium text-slate-600 cursor-pointer"
                  >
                    Remember this device for 30 days
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !!successMessage}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
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
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </span>
                ) : successMessage ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Verified! Redirecting...
                  </span>
                ) : (
                  <span>
                    {mode === "login"
                      ? "Sign In to Portal"
                      : "Register Student Account"}
                  </span>
                )}
              </button>
            </form>

            {/* Toggle footer between sign in and register */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              {mode === "login" ? (
                <p className="text-xs text-slate-500">
                  New to CampusConnect?{" "}
                  <button
                    type="button"
                    onClick={() => handleModeChange("register")}
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Create student account →
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleModeChange("login")}
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Sign in here →
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Security footnote */}
          <p className="mt-6 text-center text-xs text-slate-400">
            Protected by CampusConnect University Authentication.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="py-4 text-center text-xs text-slate-400">
        © 2026 CampusConnect Student Management Portal
      </div>
    </div>
  );
}
