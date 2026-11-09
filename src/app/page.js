import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  FileText,
  Calendar,
  Users,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  BarChart3,
} from "@/components/Icons";

export const metadata = {
  title: "CampusConnect | Modern University Student Portal",
  description:
    "Your Academic Journey, Connected. Unified student management portal for courses, assignments, attendance, and academic performance.",
};

export default function LandingPage() {
  const features = [
    {
      title: "Course Management",
      description:
        "Access structured syllabi, track module progression, view lecture schedules, and connect with course instructors in real time.",
      icon: BookOpen,
      color: "blue",
      badge: "Active Syllabi",
    },
    {
      title: "Assignments & Submissions",
      description:
        "Stay on top of prioritized academic deadlines, manage lab assignments, and receive prompt grading feedback from faculty.",
      icon: FileText,
      color: "amber",
      badge: "Automated Reminders",
    },
    {
      title: "Attendance Tracking",
      description:
        "Monitor your real-time attendance percentage per course, receive eligibility warnings, and maintain Dean's standard compliance.",
      icon: Calendar,
      color: "emerald",
      badge: "Eligibility Alerts",
    },
    {
      title: "Student Management",
      description:
        "Centralized academic record keeping with cumulative GPA metrics, semester transcripts, and official institutional announcements.",
      icon: Users,
      color: "purple",
      badge: "Centralized Records",
    },
  ];

  const highlights = [
    "Instant real-time sync with university academic servers",
    "Clean, distraction-free interface optimized for students",
    "Comprehensive course and attendance threshold analytics",
    "Fully accessible across desktop, tablet, and mobile devices",
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 transition-transform group-hover:scale-105">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                CampusConnect
              </span>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-blue-600">
                Student Portal
              </p>
            </div>
          </Link>

          {/* Nav Links & CTA */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">
              Features
            </a>
            <Link href="/students" className="hover:text-blue-600 transition-colors">
              Student Directory
            </Link>
            <a href="#portal-preview" className="hover:text-blue-600 transition-colors">
              Dashboard Overview
            </a>
            <a href="#about" className="hover:text-blue-600 transition-colors">
              About
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              Login
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32">
          {/* Subtle ambient lighting */}
          <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl" />
          <div className="pointer-events-none absolute top-40 right-10 -z-10 h-72 w-72 rounded-full bg-indigo-100/50 blur-2xl" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 border border-blue-200/80 shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span>Next-Generation Student Management Portal</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl leading-[1.15]">
                Your Academic Journey,{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Connected.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
                CampusConnect unifies courses, assignment deadlines, attendance tracking, and academic performance into one intuitive, professional platform designed for university students.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/35 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <span>Launch Student Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-xs transition-colors hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <span>Student Sign In</span>
                </Link>
              </div>

              {/* Quick Trust / Info Badges */}
              <div className="pt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Live Attendance Thresholds
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Dean&apos;s Honor List Tracking
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Instant Deadline Alerts
                </span>
              </div>
            </div>

            {/* Stylized Dashboard Preview Showcase */}
            <div id="portal-preview" className="mt-14 sm:mt-18 rounded-3xl border border-slate-200/90 bg-white p-3 sm:p-5 shadow-xl shadow-slate-200/50">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 sm:p-6 space-y-6">
                {/* Mock Window Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs font-semibold text-slate-500">
                      campusconnect.edu/dashboard
                    </span>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                    Fall 2026 Session
                  </span>
                </div>

                {/* Dashboard Snapshot Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase text-slate-500">
                      Total Courses
                    </p>
                    <p className="text-xl font-bold text-slate-900 mt-1">6 Active</p>
                    <p className="text-[11px] text-blue-600 font-medium mt-1">
                      18 Credits Registered
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase text-slate-500">
                      Pending Tasks
                    </p>
                    <p className="text-xl font-bold text-amber-600 mt-1">4 Due</p>
                    <p className="text-[11px] text-amber-700 font-medium mt-1">
                      2 Due This Week
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase text-slate-500">
                      Completed
                    </p>
                    <p className="text-xl font-bold text-emerald-600 mt-1">18 Done</p>
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                      94.7% On-Time
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <p className="text-[11px] font-semibold uppercase text-slate-500">
                      Attendance
                    </p>
                    <p className="text-xl font-bold text-purple-600 mt-1">91.5%</p>
                    <p className="text-[11px] text-purple-700 font-medium mt-1">
                      Safe Eligibility
                    </p>
                  </div>
                </div>

                {/* Action CTA within Mock */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-[#0B1528] p-4 text-white">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <p className="text-sm font-bold">
                      Explore the live student portal
                    </p>
                    <p className="text-xs text-slate-300">
                      Preview course rosters, submission portals, and grading analytics.
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    <span>View Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white border-y border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 border border-blue-200">
                Core Capabilities
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Designed for University Excellence
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Everything students and faculty need to organize, monitor, and succeed in modern academia.
              </p>
            </div>

            {/* 4 Feature Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feat) => {
                const Icon = feat.icon;
                const colorStyles = {
                  blue: "bg-blue-50 text-blue-600 border-blue-100",
                  amber: "bg-amber-50 text-amber-600 border-amber-100",
                  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
                  purple: "bg-purple-50 text-purple-600 border-purple-100",
                }[feat.color];

                return (
                  <div
                    key={feat.title}
                    className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-slate-50/50 p-6 transition-all duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-lg hover:border-slate-300"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl border ${colorStyles}`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
                          {feat.badge}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {feat.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200/60">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                        Learn more
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Highlights Row */}
            <div id="about" className="mt-16 rounded-3xl bg-[#0B1528] p-8 sm:p-12 text-white">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-400/20">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Academic Integrity & Security</span>
                  </div>
                  <h3 className="text-2xl font-bold sm:text-3xl tracking-tight">
                    Built for Modern Higher Education Standards
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    CampusConnect integrates essential student management features into a lightweight, high-performance web architecture, making daily academic coordination effortless for both students and instructors.
                  </p>
                </div>

                <div className="space-y-3">
                  {highlights.map((h) => (
                    <div
                      key={h}
                      className="flex items-center gap-3 rounded-xl bg-slate-900/90 border border-slate-800 p-3.5 text-xs sm:text-sm text-slate-200"
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Professional Footer */}
      <footer className="border-t border-slate-800 bg-[#0B1528] text-slate-400">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Col 1: Brand Info */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-lg font-bold text-white">
                    CampusConnect
                  </span>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                    Student Management Portal
                  </p>
                </div>
              </div>
              <p className="max-w-md text-xs text-slate-400 leading-relaxed">
                Empowering university students with centralized academic tracking, automated assignment scheduling, and real-time attendance compliance.
              </p>
            </div>

            {/* Col 2: Quick Links */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Academic Modules
              </h4>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    Student Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/students" className="hover:text-white transition-colors">
                    Student Directory
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Portal Login
                  </Link>
                </li>
                <li>
                  <Link href="/courses" className="hover:text-white transition-colors">
                    Course Directory
                  </Link>
                </li>
                <li>
                  <Link href="/assignments" className="hover:text-white transition-colors">
                    Assignments & Deliverables
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Institutional Resources */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                University Resources
              </h4>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <span className="hover:text-white cursor-pointer transition-colors">
                    Academic Calendar 2026–27
                  </span>
                </li>
                <li>
                  <span className="hover:text-white cursor-pointer transition-colors">
                    Examination Guidelines
                  </span>
                </li>
                <li>
                  <span className="hover:text-white cursor-pointer transition-colors">
                    Dean&apos;s Honor Standards
                  </span>
                </li>
                <li>
                  <span className="hover:text-white cursor-pointer transition-colors">
                    IT Support Helpdesk
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Status */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-slate-800/80 pt-6 text-xs text-slate-500 gap-3">
            <p>© 2026 CampusConnect Student Management Portal. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Portal Systems Operational
              </span>
              <span>•</span>
              <Link href="/login" className="hover:text-slate-300">
                Staff & Student Access
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
