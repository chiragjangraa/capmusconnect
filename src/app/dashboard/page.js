"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import {
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Activity,
  ArrowUpRight,
  GraduationCap,
  Sparkles,
  BookOpen,
} from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import { requestsAPI, adminAPI } from "@/lib/api";

export default function DashboardPage() {
  const { user, role, isLoading: isAuthLoading } = useAuth();

  const [requests, setRequests] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);

  // Set document title
  useEffect(() => {
    document.title = "Dashboard | CampusConnect Student Portal";
  }, []);

  useEffect(() => {
    let isCancelled = false;

    if (!isAuthLoading && user) {
      const loadData = async () => {
        try {
          if (role === "admin") {
            const res = await adminAPI.getDashboard();
            if (!isCancelled && res?.success) {
              setAdminStats(res.stats);
              setRequests(res.recentRequests || []);
            }
          } else {
            const res = await requestsAPI.getAll();
            if (!isCancelled && res?.success) {
              setRequests(res.data || []);
            }
          }
        } catch (err) {
          if (!isCancelled) {
            setError(err.message || "Failed to load dashboard data. Please try again.");
          }
        } finally {
          if (!isCancelled) {
            setIsLoadingData(false);
          }
        }
      };

      loadData();
    }

    return () => {
      isCancelled = true;
    };
  }, [isAuthLoading, user, role]);

  const handleRetry = async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      if (role === "admin") {
        const res = await adminAPI.getDashboard();
        if (res?.success) {
          setAdminStats(res.stats);
          setRequests(res.recentRequests || []);
        }
      } else {
        const res = await requestsAPI.getAll();
        if (res?.success) {
          setRequests(res.data || []);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Compute student metrics from real requests
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(
    (r) => r.status === "Pending" || r.status === "Under Review"
  ).length;
  const inProgressRequests = requests.filter(
    (r) => r.status === "Assigned" || r.status === "In Progress"
  ).length;
  const resolvedRequests = requests.filter(
    (r) => r.status === "Resolved" || r.status === "Closed"
  ).length;

  const displayName = user?.name || "Student";
  const departmentName = user?.department || "Academic Department";
  const userRole = user?.role === "admin" ? "System Administrator" : "Student";
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : "2026";

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Under Review":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Assigned":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "In Progress":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Closed":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Urgent":
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Low":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-10">
        {/* Welcome & Announcement Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B1528] via-[#10203f] to-blue-900 p-6 sm:p-8 text-white shadow-lg shadow-blue-950/10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute right-1/4 -bottom-12 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl" />

          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300 border border-blue-400/20">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Academic Session 2026–2027</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Welcome back, {displayName}!
              </h1>
              <p className="max-w-xl text-sm text-slate-300 leading-relaxed">
                {departmentName} • {userRole}.{" "}
                {role === "admin"
                  ? `Central administrative overview. ${
                      adminStats?.pendingCount || 0
                    } requests require review.`
                  : `You have ${pendingRequests} active service requests in review.`}
              </p>
            </div>

            {/* Account Status Badge */}
            <div className="flex shrink-0 items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10 sm:self-start md:self-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-inner">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Account Status
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-extrabold text-white">
                    {userRole}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400">
                  Active • Session {memberSince}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRetry}
              className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* 4 Core Stat Cards */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            Portal Statistics
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {role === "admin" ? (
              <>
                <StatCard
                  title="Total Campus Requests"
                  value={isLoadingData ? "..." : adminStats?.totalRequests ?? 0}
                  subtext="Campus-wide submissions"
                  trend="Real-time"
                  trendType="up"
                  icon={FileText}
                  color="blue"
                />
                <StatCard
                  title="Pending & In Review"
                  value={
                    isLoadingData
                      ? "..."
                      : (adminStats?.pendingCount || 0) +
                        (adminStats?.underReviewCount || 0)
                  }
                  subtext="Awaiting initial processing"
                  trend="Action required"
                  trendType="neutral"
                  icon={Clock}
                  color="amber"
                />
                <StatCard
                  title="In Progress / Assigned"
                  value={
                    isLoadingData
                      ? "..."
                      : (adminStats?.inProgressCount || 0) +
                        (adminStats?.assignedCount || 0)
                  }
                  subtext="Assigned to staff"
                  trend="Active tickets"
                  trendType="up"
                  icon={Activity}
                  color="purple"
                />
                <StatCard
                  title="Resolved & Closed"
                  value={
                    isLoadingData
                      ? "..."
                      : (adminStats?.resolvedCount || 0) +
                        (adminStats?.closedCount || 0)
                  }
                  subtext="Completed tickets"
                  trend="Verified"
                  trendType="up"
                  icon={CheckCircle2}
                  color="emerald"
                />
              </>
            ) : (
              <>
                <StatCard
                  title="My Service Requests"
                  value={isLoadingData ? "..." : totalRequests}
                  subtext="Total tickets submitted"
                  trend="Active"
                  trendType="up"
                  icon={FileText}
                  color="blue"
                />
                <StatCard
                  title="Pending / Under Review"
                  value={isLoadingData ? "..." : pendingRequests}
                  subtext="Awaiting admin action"
                  trend={pendingRequests > 0 ? "In queue" : "Clear"}
                  trendType={pendingRequests > 0 ? "neutral" : "up"}
                  icon={Clock}
                  color="amber"
                />
                <StatCard
                  title="In Progress"
                  value={isLoadingData ? "..." : inProgressRequests}
                  subtext="Under staff resolution"
                  trend="Processing"
                  trendType="up"
                  icon={Activity}
                  color="purple"
                />
                <StatCard
                  title="Resolved Requests"
                  value={isLoadingData ? "..." : resolvedRequests}
                  subtext="Completed tickets"
                  trend="Resolved"
                  trendType="up"
                  icon={CheckCircle2}
                  color="emerald"
                />
              </>
            )}
          </div>
        </section>

        {/* Main Content Split: Recent Requests & Quick Navigation */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Recent Service Requests Section (8 cols on LG) */}
          <section className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {role === "admin"
                        ? "Recent Campus Requests"
                        : "My Recent Service Requests"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Real-time support tickets & admin resolution status
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                  {requests.length} {requests.length === 1 ? "Request" : "Requests"}
                </span>
              </div>

              {/* Request List or States */}
              {isLoadingData ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  <p className="mt-2 font-medium">Loading live requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      No service requests found
                    </h3>
                    <p className="max-w-md mx-auto text-xs text-slate-500 mt-1">
                      {role === "admin"
                        ? "There are currently no service requests in the system."
                        : "You haven't submitted any service requests yet. Use the portal to submit requests for IT, academic, hostel, or maintenance needs."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 divide-y divide-slate-100">
                  {requests.slice(0, 5).map((item) => (
                    <div
                      key={item._id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between transition-colors hover:bg-slate-50/70 -mx-2 px-2 rounded-xl"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                            {item.category}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${getPriorityColor(
                              item.priority
                            )}`}
                          >
                            {item.priority}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                          {item.title}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-2">
                          {item.description}
                        </p>

                        {/* Admin response snippet if present */}
                        {item.adminResponse && (
                          <div className="mt-2 rounded-lg bg-blue-50/80 border border-blue-100 p-2 text-xs text-blue-900">
                            <span className="font-semibold text-blue-700">
                              Admin Response:{" "}
                            </span>
                            {item.adminResponse}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Submitted on{" "}
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                          {item.createdBy?.name && role === "admin" && (
                            <span>• By {item.createdBy.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Quick Academic Navigation & Support Overview (4 cols on LG) */}
          <div className="lg:col-span-4 space-y-6">
            <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Portal Navigation
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Quick academic resources
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href="/students"
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Student Directory
                      </p>
                      <p className="text-[11px] text-slate-500">
                        View campus cohort
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/courses"
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        University Courses
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Browse active modules
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        My Profile & Account
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Manage contact information
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </Link>
              </div>
            </section>

            {/* Support Notice */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 p-5 text-white shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-blue-400">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Campus Support Desk
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Service requests are reviewed during academic working hours
                (09:00 - 17:00 IST). High-priority requests receive prompt desk
                escalation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
