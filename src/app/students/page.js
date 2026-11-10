"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Search,
  Filter,
  Users,
  GraduationCap,
  Mail,
  ArrowRight,
  Calendar,
  X,
  Shield,
  AlertCircle,
  FileText,
} from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import { adminAPI } from "@/lib/api";

const DEFAULT_DEPARTMENTS = [
  "All Departments",
  "Computer Science",
  "Information Technology",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Administrative Services",
];

export default function StudentsPage() {
  const { user, role, isLoading: isAuthLoading } = useAuth();

  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [viewMode, setViewMode] = useState("cards"); // "cards" | "table"
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Student Directory | CampusConnect";
  }, []);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getStudents({
        search: searchQuery.trim(),
        department: selectedDepartment,
      });
      if (res?.success) {
        setStudents(res.data || []);
      }
    } catch (err) {
      if (err.status !== 403) {
        setError(err.message || "Failed to load student records from database.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedDepartment]);

  useEffect(() => {
    let isCancelled = false;

    if (!isAuthLoading && role === "admin") {
      const load = async () => {
        try {
          const res = await adminAPI.getStudents({
            search: searchQuery.trim(),
            department: selectedDepartment,
          });
          if (!isCancelled && res?.success) {
            setStudents(res.data || []);
          }
        } catch (err) {
          if (!isCancelled && err.status !== 403) {
            setError(err.message || "Failed to load student records from database.");
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
  }, [isAuthLoading, role, searchQuery, selectedDepartment]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("All Departments");
  };

  const getInitials = (name) => {
    if (!name) return "S";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Build dynamic list of departments from database results
  const availableDepartments = useMemo(() => {
    const set = new Set(DEFAULT_DEPARTMENTS);
    students.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set);
  }, [students]);

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
              The CampusConnect student directory contains university institutional records. Access is restricted to authorized campus administrators and faculty advisors.
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

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header Banner */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
              <Users className="h-3.5 w-3.5" />
              <span>CampusConnect Academic Directory</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Student Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              Search, filter, and inspect registered student profiles and their institutional service records in MongoDB Atlas.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Registered Students
              </p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {isLoading ? "..." : `${students.length} Students`}
              </p>
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
              onClick={fetchStudents}
              className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="flex flex-col gap-3 rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students by name, email, or department..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Department Dropdown Filter */}
            <div className="relative w-full sm:w-64">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Filter className="h-4 w-4" />
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-xs sm:text-sm font-medium text-slate-700 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="Filter by department"
              >
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* View Toggle & Count Indicator */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-slate-100 sm:border-t-0">
            <span className="text-xs font-semibold text-slate-500">
              Showing{" "}
              <span className="text-slate-900 font-bold">
                {students.length}
              </span>{" "}
              students
            </span>

            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  viewMode === "cards"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  viewMode === "table"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
            <p className="mt-3 text-xs sm:text-sm font-semibold text-slate-600">
              Loading registered students from MongoDB Atlas...
            </p>
          </div>
        )}

        {/* Zero Results State */}
        {!isLoading && students.length === 0 && (
          <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No students found
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              No registered student records matched &quot;{searchQuery}&quot; in {selectedDepartment}.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* View Mode: Cards */}
        {!isLoading && students.length > 0 && viewMode === "cards" && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {students.map((student) => {
              const studentInitials = getInitials(student.name);

              return (
                <div
                  key={student._id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Top Row: Avatar & Identity */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold text-white shadow-sm bg-gradient-to-tr from-blue-600 to-indigo-600">
                          {studentInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm truncate">
                            {student.name}
                          </h3>
                          <span className="font-mono text-xs font-medium text-slate-400 truncate block">
                            ID: {student._id.slice(-8)}
                          </span>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                        Student
                      </span>
                    </div>

                    {/* Department */}
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <GraduationCap className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="truncate font-medium">{student.department}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </div>
                    </div>

                    {/* Registration Date Info */}
                    <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Registered</span>
                      <span className="font-semibold text-slate-700">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Link to Student Detail Page */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Link
                      href={`/students/${student._id}`}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-600 hover:text-white"
                    >
                      <span>View Details</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View Mode: Table */}
        {!isLoading && students.length > 0 && viewMode === "table" && (
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Record ID</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Registered</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {students.map((student) => {
                    const initials = getInitials(student.name);

                    return (
                      <tr
                        key={student._id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 font-bold text-white text-xs">
                              {initials}
                            </div>
                            <span className="font-bold text-slate-900">
                              {student.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {student._id.slice(-8)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {student.email}
                        </td>
                        <td className="py-3 px-4">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800">
                            {student.department}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/students/${student._id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 hover:bg-blue-600 hover:text-white transition-colors text-xs"
                          >
                            <span>Details</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
