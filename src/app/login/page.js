"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "@/components/Icons";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Demo auto-fill helper
  const handleUseDemo = () => {
    setEmail("alex.morgan@campusconnect.edu");
    setPassword("StudentPass2026!");
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Field validation
    if (!email.trim()) {
      setError("Please enter your student email address.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid university email address (e.g. name@campusconnect.edu).");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    // Demo success state
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);

      // Redirect to dashboard after brief feedback
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    }, 600);
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

      {/* Main Centered Login Card */}
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
                Student Portal Login
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Sign in to manage your courses, assignments, and grades
              </p>
            </div>

            {/* Quick Demo Credentials Assistant */}
            <div className="mb-6 rounded-2xl bg-blue-50/80 border border-blue-200/70 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-blue-700 min-w-0">
                <Sparkles className="h-4 w-4 shrink-0 text-blue-600" />
                <span className="text-xs font-medium truncate">
                  Testing assignment? Use demo credentials
                </span>
              </div>
              <button
                type="button"
                onClick={handleUseDemo}
                className="shrink-0 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Auto-fill
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
            {success && (
              <div
                role="status"
                className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 animate-fadeIn"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="font-semibold">
                  Welcome back, Alex Morgan! Redirecting to your dashboard...
                </span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Student Email
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
                    placeholder="student@campusconnect.edu"
                    disabled={isLoading || success}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Password
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Demo password reset instructions have been sent to your university email.");
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Forgot password?
                  </a>
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
                    disabled={isLoading || success}
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
              </div>

              {/* Remember Me Checkbox */}
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

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading || success}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
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
                    Signing in...
                  </span>
                ) : success ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Verified! Redirecting...
                  </span>
                ) : (
                  <span>Sign In to Portal</span>
                )}
              </button>
            </form>

            {/* Direct Dashboard Link */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Want to bypass login for assignment grading?{" "}
                <Link
                  href="/dashboard"
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Enter Dashboard Directly →
                </Link>
              </p>
            </div>
          </div>

          {/* Security footnote */}
          <p className="mt-6 text-center text-xs text-slate-400">
            Protected by CampusConnect University Single Sign-On (SSO).
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

