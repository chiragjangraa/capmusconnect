"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Shield,
  FileText,
} from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import { adminAPI } from "@/lib/api";

function getInitials(name) {
  if (!name) return "ST";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
}

function getPriorityBadge(priority) {
  switch (priority?.toLowerCase()) {
    case "urgent":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "high":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "medium":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "low":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function getStatusBadge(status) {
  switch (status) {
    case "Resolved":
    case "Closed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "In Progress":
    case "Assigned":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Under Review":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "Rejected":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Pending":
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

export default function StudentDetailPage() {
  const routeParams = useParams();
  const id = routeParams?.id;

  const { role, isLoading: isAuthLoading } = useAuth();

  const [student, setStudent] = useState(null);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const fetchStudentData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const res = await adminAPI.getStudentById(id);
      if (res?.success && res.data?.student) {
        setStudent(res.data.student);
        setRequests(res.data.requests || []);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      if (err.status === 404 || err.status === 400) {
        setNotFound(true);
      } else if (err.status !== 403) {
        setError(err.message || "Failed to retrieve student record from database.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isCancelled = false;

    if (!isAuthLoading && role === "admin" && id) {
      const load = async () => {
        try {
          const res = await adminAPI.getStudentById(id);
          if (!isCancelled) {
            if (res?.success && res.data?.student) {
              setStudent(res.data.student);
              setRequests(res.data.requests || []);
            } else {
              setNotFound(true);
            }
          }
        } catch (err) {
          if (!isCancelled) {
            if (err.status === 404 || err.status === 400) {
              setNotFound(true);
            } else if (err.status !== 403) {
              setError(err.message || "Failed to retrieve student record from database.");
            }
          }
        } finally {
          if (!isCancelled) {
            setIsLoading(false);
          }
        }
      };

      load();
    }

    return () => {
      isCancelled = true;
    };
  }, [isAuthLoading, role, id]);

  useEffect(() => {
    if (student?.name) {
      document.title = `${student.name} | Student Record | CampusConnect`;
    } else {
      document.title = "Student Details | CampusConnect";
    }
  }, [student]);

  // Unauthorized State for non-admin students
  if (!isAuthLoading && role !== "admin") {
    return (
      <DashboardLayout>
        <div className="py-12 px-4 sm:px-6">
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 text-center shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-5 border border-amber-200">
              <Shield className="h-8 w-8" />
            </div>

            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Restricted Area
            </span>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Administrative Access Required
            </h1>

            <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              Student record profiles contain confidential university institutional data. Access is restricted to authorized campus administrators and faculty advisors.
            </p>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                Return to Dashboard
              </Link>
              <Link
                href="/profile"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                View My Profile
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Loading State
  if (isAuthLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">
            Loading student record from database...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Friendly Not Found State
  if (notFound || !student) {
    return (
      <DashboardLayout>
        <div className="py-12 px-4 sm:px-6">
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 text-center shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-5 border border-amber-200">
              <AlertCircle className="h-8 w-8" />
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 font-mono">
              ID: {id || "Unknown"}
            </span>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Student Record Not Found
            </h1>

            <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              We could not find any active student profile matching this identifier in MongoDB Atlas.
            </p>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/students"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Students Directory</span>
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error State
  if (error) {
    return (
      <DashboardLayout>
        <div className="py-12 px-4 sm:px-6">
          <div className="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-rose-50/50 p-8 sm:p-10 text-center shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-5 border border-rose-200">
              <AlertCircle className="h-8 w-8" />
            </div>

            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Unable to Load Student Record
            </h1>

            <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              {error}
            </p>

            <div className="mt-8 pt-6 border-t border-rose-100 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={fetchStudentData}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                Retry Connection
              </button>
              <Link
                href="/students"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Return to Directory
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate real support statistics from requests
  const activeRequestsCount = requests.filter((r) =>
    ["Pending", "Under Review", "Assigned", "In Progress"].includes(r.status)
  ).length;

  const resolvedRequestsCount = requests.filter((r) =>
    ["Resolved", "Closed"].includes(r.status)
  ).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-14">
        {/* Breadcrumb & Navigation Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/students"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Students Directory</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/dashboard" className="hover:text-blue-600">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/students" className="hover:text-blue-600">
              Students
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-900 truncate max-w-[150px]">
              {student.name}
            </span>
          </div>
        </div>

        {/* Student Profile Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
          {/* Top accent banner */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Left: Avatar & Identity */}
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-extrabold text-white text-2xl shadow-md shadow-blue-500/20">
                {getInitials(student.name)}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {student.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Enrolled Student
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-600">
                  {student.department || "General Studies"} Department
                </p>

                <p className="max-w-2xl text-xs sm:text-sm text-slate-500 leading-relaxed pt-1">
                  Verified student record managed within the CampusConnect academic institutional database.
                </p>
              </div>
            </div>

            {/* Right: Record Badge */}
            <div className="flex shrink-0 items-center gap-4 rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:self-start">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Account Standing
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-base font-bold text-slate-900">
                    Active Institutional Account
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  Role: Standard Student
                </span>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Department</span>
              <p className="font-semibold text-slate-800">
                {student.department || "Unassigned"}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">University Email</span>
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{student.email}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Member Since</span>
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{formatDate(student.createdAt)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Database Record ID</span>
              <p className="font-mono text-[11px] font-semibold text-slate-700 truncate">
                {student._id}
              </p>
            </div>
          </div>
        </div>

        {/* 3 Real Support Activity Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Card 1: Total Service Requests */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Total Service Requests</span>
              </div>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                {requests.length} Logged
              </span>
            </div>

            <div>
              <div className="text-3xl font-extrabold text-slate-900">
                {requests.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Campus requests submitted by student
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-slate-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Full lifecycle tracked in MongoDB</span>
            </div>
          </div>

          {/* Card 2: Active / In Progress Tickets */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>Active Tickets</span>
              </div>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                {activeRequestsCount} Active
              </span>
            </div>

            <div>
              <div className="text-3xl font-extrabold text-slate-900">
                {activeRequestsCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pending, review, or in progress tickets
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                  style={{
                    width: `${
                      requests.length > 0
                        ? Math.round((activeRequestsCount / requests.length) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Resolved & Closed Tickets */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Resolved Tickets</span>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                {resolvedRequestsCount} Resolved
              </span>
            </div>

            <div>
              <div className="text-3xl font-extrabold text-slate-900">
                {resolvedRequestsCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Completed and closed campus tickets
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  style={{
                    width: `${
                      requests.length > 0
                        ? Math.round((resolvedRequestsCount / requests.length) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Real Service Requests History Section */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Service Requests & Support History
                </h2>
                <p className="text-[11px] text-slate-500">
                  All service tickets and campus inquiries submitted by this student
                </p>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {requests.length} Requests
            </span>
          </div>

          {requests.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <FileText className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                No Service Requests Found
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                This student has not submitted any service tickets or support requests yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((item) => (
                <div
                  key={item._id}
                  className="py-4 space-y-2 hover:bg-slate-50/50 -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                          {item.category || "General"}
                        </span>
                        <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                          {item.title}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getPriorityBadge(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  {item.adminResponse && (
                    <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700 text-[11px]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                        <span>Administrative Response:</span>
                      </div>
                      <p className="text-slate-600 pl-5">
                        {item.adminResponse}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
