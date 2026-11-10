"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Calendar,
  GraduationCap,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  X,
  Sparkles,
  User,
} from "./Icons";

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = user?.name || "CampusConnect User";
  const userInitials = getInitials(user?.name);
  const displayRoleDept =
    user?.department || (user?.role === "admin" ? "Administrative Services" : "Student");

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    router.push("/login");
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
      badge: null,
    },
    {
      name: "Students",
      href: "/students",
      icon: Users,
      active: pathname?.startsWith("/students"),
      badge: "8 Total",
      badgeColor: "blue",
    },
    {
      name: "My Courses",
      href: "/courses",
      icon: BookOpen,
      active: pathname?.startsWith("/courses"),
      badge: "6 Active",
    },
    {
      name: "Assignments",
      href: "/assignments",
      icon: FileText,
      active: pathname === "/assignments",
      badge: "4 Pending",
      badgeColor: "amber",
    },
    {
      name: "My Profile",
      href: "/profile",
      icon: User,
      active: pathname === "/profile",
      badge: null,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      active: pathname === "/settings",
      badge: null,
    },
    {
      name: "Attendance & Grades",
      href: "#",
      icon: BarChart3,
      active: false,
      badge: "91.5%",
      badgeColor: "emerald",
    },
    {
      name: "Class Schedule",
      href: "#",
      icon: Calendar,
      active: false,
      badge: null,
    },
    {
      name: "Announcements",
      href: "#",
      icon: Bell,
      active: false,
      badge: "3 New",
      badgeColor: "blue",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-[#0B1528] text-slate-200 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          } border-r border-slate-800/80 shadow-xl lg:shadow-none`}
      >
        {/* Brand / Logo Header */}
        <div className="flex h-20 items-center justify-between border-b border-slate-800/80 px-6">
          <Link href="/" className="flex items-center gap-3 group" title="Return to Home">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/25 transition-transform group-hover:scale-105">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white group-hover:text-blue-300 transition-colors">
                  CampusConnect
                </span>
                <span className="inline-flex rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] font-medium tracking-wide uppercase text-slate-400">
                University Portal
              </p>
            </div>
          </Link>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Academic Session Pill */}
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center justify-between rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-300">
                Fall Semester 2026
              </span>
            </div>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
              Week 9
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="px-3 pb-2 text-[11px] font-bold tracking-wider uppercase text-slate-400">
            Main Navigation
          </p>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${item.active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  onClick={() => {
                    if (item.active && onClose) onClose();
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-5 w-5 transition-transform group-hover:scale-105 ${item.active ? "text-white" : "text-slate-400 group-hover:text-blue-400"
                        }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.badgeColor === "amber"
                          ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                          : item.badgeColor === "emerald"
                            ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                            : "bg-blue-400/20 text-blue-300 border border-blue-400/30"
                        }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Academic Support Card */}
          <div className="mt-8 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950/60 p-4 border border-blue-900/30">
            <div className="flex items-center gap-2 text-blue-400 mb-1.5">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Exam Alert
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Mid-term grade validation opens on Nov 20. Confirm lab marks with your advisors.
            </p>
          </div>
        </div>

        {/* User Profile Card in Footer */}
        <div className="border-t border-slate-800/80 p-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-900/90 border border-slate-800/90 p-3">
            <Link
              href="/profile"
              className="flex items-center gap-3 min-w-0 group"
              title="View Profile"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white text-sm shadow-inner group-hover:scale-105 transition-transform">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                  {displayName}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {displayRoleDept}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              <Link
                href="/settings"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                title="Settings"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition-colors"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

