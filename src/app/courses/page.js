"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BookOpen,
  Search,
  Filter,
  GraduationCap,
  ArrowRight,
  Clock,
  Calendar,
  CheckCircle2,
  X,
  Sparkles,
} from "@/components/Icons";
import { coursesList, courseCategories } from "@/data/mockData";

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  // Filter courses based on search query and category/department
  const filteredCourses = useMemo(() => {
    return coursesList.filter((course) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.code.toLowerCase().includes(q) ||
        course.faculty.name.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === "All Categories" ||
        course.category === selectedCategory ||
        course.department === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  const totalCoursesCount = coursesList.length;
  const totalCreditsSum = coursesList.reduce((sum, c) => sum + c.credits, 0);
  const enrolledCoursesCount = 6;
  const enrolledCreditsSum = 20;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All Categories");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Header Banner & Summary Stats */}
        <div className="flex flex-col gap-6 rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Academic Curriculum Directory</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Course Catalog & Enrollment
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
                Explore registered curriculum coursework, syllabus progression, faculty office hours, and lecture schedules.
              </p>
            </div>

            {/* Total Courses & Credits Summary Badges */}
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center min-w-[120px]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Total Courses
                </p>
                <div className="flex items-baseline justify-center gap-1 mt-0.5">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {totalCoursesCount}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    Modules
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-blue-600">
                  {enrolledCoursesCount} Registered
                </span>
              </div>

              <div className="rounded-2xl bg-blue-50/70 border border-blue-200/80 p-4 text-center min-w-[120px]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                  Total Credits
                </p>
                <div className="flex items-baseline justify-center gap-1 mt-0.5">
                  <span className="text-2xl font-extrabold text-blue-900">
                    {totalCreditsSum}
                  </span>
                  <span className="text-xs font-medium text-blue-700">
                    Credits
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-blue-700">
                  {enrolledCreditsSum} Term Credits
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar & Category Filter */}
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
                placeholder="Search courses by title or code (e.g. CS301, Database)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  aria-label="Clear course search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category Filter Dropdown */}
            <div className="relative w-full sm:w-64">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Filter className="h-4 w-4" />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-xs sm:text-sm font-medium text-slate-700 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="Filter courses by category"
              >
                {courseCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
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

          {/* Result Count Indicator */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-slate-100 sm:border-t-0">
            <span className="text-xs font-semibold text-slate-500">
              Showing{" "}
              <span className="text-slate-900 font-bold">
                {filteredCourses.length}
              </span>{" "}
              of {coursesList.length} courses
            </span>
          </div>
        </div>

        {/* Zero Results State */}
        {filteredCourses.length === 0 && (
          <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No matching courses found
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              We couldn&apos;t find any course matching &quot;{searchQuery}&quot; in {selectedCategory}.
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

        {/* Responsive Course Cards Grid */}
        {filteredCourses.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCourses.map((course) => {
              return (
                <div
                  key={course.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="space-y-4">
                    {/* Top Row: Course Code & Credits Badge */}
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-xs font-bold text-blue-700 border border-blue-100">
                        {course.code}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200/60">
                        {course.credits} Credits
                      </span>
                    </div>

                    {/* Course Title & Category */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {course.category}
                      </span>
                      <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-0.5">
                        {course.title}
                      </h3>
                    </div>

                    {/* Faculty Info */}
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <GraduationCap className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="font-medium truncate">{course.faculty.name}</span>
                    </div>

                    {/* Schedule & Location */}
                    <div className="rounded-xl bg-slate-50 p-3 space-y-1.5 border border-slate-100 text-xs">
                      <div className="flex items-center gap-2 text-slate-600 truncate">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{course.schedule.split("•")[0]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 truncate text-[11px]">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>📍 {course.room}</span>
                      </div>
                    </div>

                    {/* Progress Bar & Percentage */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-500">Syllabus Progress</span>
                        <span className="font-bold text-slate-800">
                          {course.progress}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <Link
                      href={`/courses/${course.id}`}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <span>View Course</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

