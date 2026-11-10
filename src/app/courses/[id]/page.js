"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Mail,
  Calendar,
  Clock,
  AlertCircle,
  Sparkles,
  Shield,
} from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import { coursesAPI } from "@/lib/api";

export default function CourseDetailPage() {
  const routeParams = useParams();
  const id = routeParams?.id;

  const { user, isLoading: isAuthLoading } = useAuth();

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const fetchCourseData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const res = await coursesAPI.getById(id);
      if (res?.success && res.data) {
        setCourse(res.data);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      if (err.status === 404 || err.status === 400) {
        setNotFound(true);
      } else {
        setError(err.message || "Failed to retrieve course details from database.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isCancelled = false;

    if (!isAuthLoading && user && id) {
      const load = async () => {
        try {
          const res = await coursesAPI.getById(id);
          if (!isCancelled) {
            if (res?.success && res.data) {
              setCourse(res.data);
            } else {
              setNotFound(true);
            }
          }
        } catch (err) {
          if (!isCancelled) {
            if (err.status === 404 || err.status === 400) {
              setNotFound(true);
            } else {
              setError(err.message || "Failed to retrieve course details from database.");
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
  }, [isAuthLoading, user, id]);

  useEffect(() => {
    if (course?.code && course?.title) {
      document.title = `${course.code} - ${course.title} | CampusConnect`;
    } else {
      document.title = "Course Details | CampusConnect";
    }
  }, [course]);

  // Unauthorized State if unauthenticated
  if (!isAuthLoading && !user) {
    return (
      <DashboardLayout>
        <div className="py-12 px-4 sm:px-6">
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 text-center shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-5 border border-amber-200">
              <Shield className="h-8 w-8" />
            </div>

            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Authentication Required
            </span>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Course Details Access
            </h1>

            <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              Please sign in to your CampusConnect account to access this course syllabus, module progression, and faculty details.
            </p>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                Sign In to CampusConnect
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
            Loading course details from database...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Friendly Not Found State
  if (notFound || !course) {
    return (
      <DashboardLayout>
        <div className="py-12 px-4 sm:px-6">
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-10 text-center shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-5 border border-amber-200">
              <AlertCircle className="h-8 w-8" />
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 font-mono">
              Code: {id || "Unknown"}
            </span>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Course Not Found
            </h1>

            <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              We could not find any active university course matching this identifier in the curriculum database.
            </p>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/courses"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Courses</span>
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
              Unable to Load Course Record
            </h1>

            <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              {error}
            </p>

            <div className="mt-8 pt-6 border-t border-rose-100 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={fetchCourseData}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                Retry Connection
              </button>
              <Link
                href="/courses"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Return to Courses
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const syllabus = course.syllabus || [];
  const completedModules = syllabus.filter((m) => m.status === "Completed").length;
  const progressPercent = Number(course.progress) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-14">
        {/* Breadcrumb & Navigation Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Courses</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/dashboard" className="hover:text-blue-600">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/courses" className="hover:text-blue-600">
              Courses
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-900 truncate max-w-[150px]">
              {course.code}
            </span>
          </div>
        </div>

        {/* Course Header Banner Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
          {/* Top accent line */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-lg bg-blue-50 px-3 py-1 font-mono text-sm font-bold text-blue-700 border border-blue-100">
                  {course.code}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-700">
                  {course.category}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  {course.semester || "Academic Year 2026"}
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                {course.title}
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed">
                {course.description}
              </p>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
                  {course.schedule || "Schedule TBA"}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                  Room: {course.room || "Room TBA"}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <BookOpen className="h-4 w-4 text-indigo-600 shrink-0" />
                  {course.department}
                </span>
              </div>
            </div>

            {/* Quick Credits & Course Stat Card */}
            <div className="flex shrink-0 items-center gap-4 rounded-2xl bg-slate-50 border border-slate-200 p-5 sm:self-start">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Academic Value
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-3xl font-black text-slate-900">
                    {course.credits}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Credits
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-blue-600">
                  Curriculum Module
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2 Academic Standing Metrics: Curriculum Progress & Course Specifications */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Course Syllabus Progress Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>Curriculum Progress</span>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                {progressPercent}% Covered
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  {completedModules} of {syllabus.length} Modules Completed
                </span>
                <span className="text-slate-900 font-bold">
                  {syllabus.length - completedModules} Remaining
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Departmental syllabus progression tracked within the CampusConnect academic curriculum.
            </p>
          </div>

          {/* Course Specifications Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span>Course Specifications</span>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                Active Term
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Instructional Category</span>
                <span className="font-semibold text-slate-800">{course.category}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Academic Department</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                  {course.department}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Scheduled Venue</span>
                <span className="font-semibold text-slate-800">
                  {course.room ? `📍 ${course.room}` : "Classroom TBA"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Faculty Information Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Course Faculty Information
              </h2>
              <p className="text-[11px] text-slate-500">
                Primary instructor and academic consultation details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs pt-1">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Instructor Name</span>
              <p className="font-bold text-slate-900 text-sm">
                {course.faculty?.name || "Department Faculty"}
              </p>
              <p className="text-slate-500 text-[11px]">
                {course.faculty?.role || "Course Instructor"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Faculty Email</span>
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate pt-0.5">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {course.faculty?.email || "faculty@campusconnect.edu"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Office Location</span>
              <p className="font-semibold text-slate-800 pt-0.5">
                {course.faculty?.office || "Faculty Office Block"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Consultation Hours</span>
              <p className="font-semibold text-slate-800 pt-0.5">
                {course.faculty?.officeHours || "By Appointment"}
              </p>
            </div>
          </div>
        </div>

        {/* Course Syllabus / Modules Section */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Course Syllabus & Module Breakdown
                </h2>
                <p className="text-[11px] text-slate-500">
                  Weekly topics, theoretical foundations, and practical learning objectives
                </p>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {syllabus.length} Units
            </span>
          </div>

          {syllabus.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Module breakdown will be published by course faculty.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {syllabus.map((mod, index) => {
                const isCompleted = mod.status === "Completed";
                const isInProgress = mod.status === "In Progress";

                return (
                  <div
                    key={`${mod.title}-${index}`}
                    className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-4 gap-3 transition-colors hover:bg-slate-50/50 -mx-2 px-2 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-800"
                            : isInProgress
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {mod.week && (
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 font-mono">
                              {mod.week}
                            </span>
                          )}
                          <h3 className="text-sm font-bold text-slate-900">
                            {mod.title}
                          </h3>
                        </div>
                        {mod.description && (
                          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                            {mod.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`self-start sm:self-center shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        isCompleted
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isInProgress
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {mod.status || "Upcoming"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
