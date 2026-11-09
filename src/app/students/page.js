"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Search,
  Filter,
  Users,
  GraduationCap,
  Mail,
  ArrowRight,
  BookOpen,
  Calendar,
  X,
  Sparkles,
} from "@/components/Icons";
import { studentsList, departments } from "@/data/mockData";

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [viewMode, setViewMode] = useState("cards"); // "cards" | "table"

  // Filter students based on search query and department
  const filteredStudents = useMemo(() => {
    return studentsList.filter((student) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        student.name.toLowerCase().includes(q) ||
        student.id.toLowerCase().includes(q) ||
        student.email.toLowerCase().includes(q);

      const matchesDept =
        selectedDepartment === "All Departments" ||
        student.department === selectedDepartment;

      return matchesSearch && matchesDept;
    });
  }, [searchQuery, selectedDepartment]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("All Departments");
  };

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
              Search, filter, and inspect student academic profiles, enrolled course loads, attendance records, and skill proficiencies.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Total Enrolled
              </p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">
                {studentsList.length} Students
              </p>
            </div>
          </div>
        </div>

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
                placeholder="Search students by name, ID (e.g. STU-2024-0492), or email..."
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
                {departments.map((dept) => (
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
                {filteredStudents.length}
              </span>{" "}
              of {studentsList.length}
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

        {/* Zero Results State */}
        {filteredStudents.length === 0 && (
          <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No students found
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              No student records matched &quot;{searchQuery}&quot; in {selectedDepartment}.
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

        {/* View Mode: Responsive Cards */}
        {filteredStudents.length > 0 && viewMode === "cards" && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredStudents.map((student) => {
              const isHonor = student.academicStatus.includes("Honor");
              const isAlex = student.id === "STU-2024-0492";

              return (
                <div
                  key={student.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Top Row: Avatar & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold text-white shadow-sm ${
                            isAlex
                              ? "bg-gradient-to-tr from-blue-600 to-indigo-600"
                              : "bg-slate-800"
                          }`}
                        >
                          {student.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm">
                              {student.name}
                            </h3>
                          </div>
                          <span className="font-mono text-xs font-medium text-slate-500">
                            {student.id}
                          </span>
                        </div>
                      </div>

                      {isHonor && (
                        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                          Dean&apos;s List
                        </span>
                      )}
                    </div>

                    {/* Department & Semester Pills */}
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <GraduationCap className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="truncate font-medium">{student.department}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                          {student.semester}
                        </span>
                        <span className="text-slate-500 font-medium">
                          CGPA: <strong className="text-slate-900">{student.cgpa.split(" ")[0]}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Contact & Attendance */}
                    <div className="rounded-xl bg-slate-50 p-3 space-y-2 border border-slate-100">
                      <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{student.email}</span>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-slate-200/60">
                        <div className="flex justify-between text-[11px] font-medium">
                          <span className="text-slate-500">Attendance</span>
                          <span
                            className={
                              student.attendance >= 90
                                ? "font-bold text-emerald-600"
                                : "font-bold text-blue-600"
                            }
                          >
                            {student.attendance}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              student.attendance >= 90 ? "bg-emerald-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${student.attendance}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <Link
                      href={`/students/${student.id}`}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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

        {/* View Mode: Clean Responsive Table */}
        {filteredStudents.length > 0 && viewMode === "table" && (
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th scope="col" className="py-3.5 pl-6 pr-3">
                      Student
                    </th>
                    <th scope="col" className="px-3 py-3.5">
                      Student ID
                    </th>
                    <th scope="col" className="px-3 py-3.5">
                      Department
                    </th>
                    <th scope="col" className="px-3 py-3.5">
                      Semester
                    </th>
                    <th scope="col" className="px-3 py-3.5">
                      CGPA
                    </th>
                    <th scope="col" className="px-3 py-3.5">
                      Attendance
                    </th>
                    <th scope="col" className="py-3.5 pl-3 pr-6 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-4 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white text-xs">
                            {student.initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">
                              {student.name}
                            </div>
                            <div className="text-slate-400 text-xs">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 font-mono font-medium text-slate-600">
                        {student.id}
                      </td>
                      <td className="px-3 py-4 font-medium text-slate-800">
                        {student.department}
                      </td>
                      <td className="px-3 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                          {student.semester}
                        </span>
                      </td>
                      <td className="px-3 py-4 font-bold text-slate-900">
                        {student.cgpa.split(" ")[0]}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                student.attendance >= 90 ? "bg-emerald-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${student.attendance}%` }}
                            />
                          </div>
                          <span
                            className={
                              student.attendance >= 90
                                ? "font-bold text-emerald-600"
                                : "font-bold text-blue-600"
                            }
                          >
                            {student.attendance}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 pl-3 pr-6 text-right">
                        <Link
                          href={`/students/${student.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-800 hover:bg-blue-600 hover:text-white transition-colors"
                        >
                          <span>Details</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

