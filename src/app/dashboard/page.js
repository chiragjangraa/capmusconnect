import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Activity,
  ArrowUpRight,
  GraduationCap,
  Sparkles,
} from "@/components/Icons";
import { studentData } from "@/data/mockData";

export const metadata = {
  title: "Dashboard | CampusConnect Student Portal",
  description: "CampusConnect Student Management Portal - Academic Overview and Analytics",
};

export default function DashboardPage() {
  const { profile, stats, upcomingDeadlines, recentActivities, activeCourses } = studentData;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-10">
        {/* Welcome & Announcement Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B1528] via-[#10203f] to-blue-900 p-6 sm:p-8 text-white shadow-lg shadow-blue-950/10">
          {/* Subtle background decoration */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute right-1/4 -bottom-12 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl" />

          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300 border border-blue-400/20">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Academic Session 2026–2027</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Welcome back, {profile.name}!
              </h1>
              <p className="max-w-xl text-sm text-slate-300 leading-relaxed">
                {profile.program} • {profile.semester}. You have{" "}
                <span className="font-semibold text-amber-300">
                  {stats.pendingAssignments.value} assignments pending
                </span>
                , with 2 due in the next 48 hours.
              </p>
            </div>

            {/* Quick CGPA / Academic badge */}
            <div className="flex shrink-0 items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10 sm:self-start md:self-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-inner">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Cumulative GPA
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-white">
                    {profile.cgpa.split(" ")[0]}
                  </span>
                  <span className="text-xs font-medium text-slate-300">/ 4.0</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400">
                  {profile.academicStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Stat Cards */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            Key Academic Statistics
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Courses"
              value={stats.totalCourses.value}
              subtext={stats.totalCourses.subtext}
              trend={stats.totalCourses.trend}
              trendType={stats.totalCourses.trendType}
              icon={BookOpen}
              color="blue"
            />
            <StatCard
              title="Pending Assignments"
              value={stats.pendingAssignments.value}
              subtext={stats.pendingAssignments.subtext}
              trend={stats.pendingAssignments.trend}
              trendType={stats.pendingAssignments.trendType}
              icon={Clock}
              color="amber"
            />
            <StatCard
              title="Completed Assignments"
              value={stats.completedAssignments.value}
              subtext={stats.completedAssignments.subtext}
              trend={stats.completedAssignments.trend}
              trendType={stats.completedAssignments.trendType}
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              title="Attendance Percentage"
              value={stats.attendance.value}
              subtext={stats.attendance.subtext}
              trend={stats.attendance.trend}
              trendType={stats.attendance.trendType}
              icon={Calendar}
              color="purple"
            />
          </div>
        </section>

        {/* Active Courses Summary Carousel / Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Active Enrolled Courses
              </h2>
              <p className="text-xs text-slate-500">
                Ongoing modules for Semester 5
              </p>
            </div>
            <Link
              href="/courses"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              View All Courses →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activeCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.code}`}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-100">
                      {course.code}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {course.attendance}% att.
                    </span>
                  </div>

                  <div>
                    <h3 className="line-clamp-1 text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {course.instructor}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Syllabus Covered</span>
                    <span className="font-semibold text-slate-800">
                      {course.progress}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 truncate pt-1">
                    📍 {course.room} • {course.schedule.split("•")[0]}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Main Content Split: Upcoming Deadlines & Recent Activities */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Upcoming Deadlines (7 Cols on LG) */}
          <section className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Upcoming Deadlines
                    </h2>
                    <p className="text-xs text-slate-500">
                      Assignments awaiting your submission
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                  {upcomingDeadlines.length} Due Soon
                </span>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {upcomingDeadlines.map((item) => {
                  const isHighPriority = item.priority === "high";
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-slate-50/70 -mx-2 px-2 rounded-xl"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                            {item.courseCode}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                              isHighPriority
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.priority} Priority
                          </span>
                          <span className="text-xs text-slate-400">
                            • {item.points}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <AlertCircle
                            className={`h-3.5 w-3.5 ${
                              isHighPriority ? "text-rose-500" : "text-amber-500"
                            }`}
                          />
                          <span
                            className={
                              isHighPriority
                                ? "font-semibold text-rose-600"
                                : "text-slate-600"
                            }
                          >
                            {item.dueDate}
                          </span>
                          <span>({item.daysLeft})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center">
                        <Link
                          href="/assignments"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          Submit
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Recent Activities & Quick Attendance (5 Cols on LG) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Recent Activities */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Recent Activities
                    </h2>
                    <p className="text-xs text-slate-500">
                      Submissions, grades & updates
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {recentActivities.map((act) => {
                  const badgeStyle =
                    act.statusColor === "emerald"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : act.statusColor === "blue"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : act.statusColor === "amber"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-purple-50 text-purple-700 border-purple-200";

                  return (
                    <div
                      key={act.id}
                      className="flex items-start gap-3 text-left"
                    >
                      <div className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs font-semibold text-slate-800 leading-snug">
                          {act.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-slate-400">
                            {act.course}
                          </span>
                          <span className="text-[10px] text-slate-400">•</span>
                          <span className="text-[11px] text-slate-400">
                            {act.timestamp}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeStyle}`}
                      >
                        {act.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Quick Attendance Summary Card */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Attendance Standing
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  91.5% Average
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <p className="text-xs text-slate-500">
                  Minimum university requirement is{" "}
                  <span className="font-semibold text-slate-800">75%</span>. All
                  courses are currently in the safe eligibility zone.
                </p>

                <div className="space-y-2 pt-1">
                  {activeCourses.map((c) => (
                    <div key={c.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700">{c.code}</span>
                        <span
                          className={`font-semibold ${
                            c.attendance >= 90
                              ? "text-emerald-600"
                              : "text-blue-600"
                          }`}
                        >
                          {c.attendance}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.attendance >= 90
                              ? "bg-emerald-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${c.attendance}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

