"use client";

import Link from "next/link";
import { Menu, Search, Bell, Calendar } from "./Icons";
import { useAuth } from "@/context/AuthContext";

export default function Header({ onMenuClick }) {
  const { user } = useAuth();

  // Compute initials safely from authenticated user name
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

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center gap-3 sm:gap-4 lg:w-96">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden w-full sm:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search portal, requests, notices..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Right: Academic Status, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Academic Session badge for tablet/desktop */}
        <div className="hidden items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-1.5 text-xs font-medium text-blue-700 md:flex">
          <Calendar className="h-3.5 w-3.5 text-blue-600" />
          <span>Session 2026–2027</span>
          <span className="h-1 w-1 rounded-full bg-blue-500" />
          <span className="font-semibold text-blue-900">
            {user?.role === "admin" ? "Admin Portal" : "Student Portal"}
          </span>
        </div>

        {/* Notifications button */}
        <div className="relative">
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
            </span>
          </button>
        </div>

        {/* Vertical divider */}
        <div className="hidden h-7 w-px bg-slate-200 sm:block" />

        {/* User Avatar & Identity */}
        <Link
          href="/profile"
          className="flex items-center gap-3 pl-1 group rounded-xl p-1 hover:bg-slate-50 transition-colors"
          title="View Profile"
        >
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white shadow-sm transition-transform group-hover:scale-105">
              {userInitials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          </div>

          <div className="hidden text-left sm:block">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {displayName}
              </p>
            </div>
            <p className="text-[11px] font-medium text-slate-500 truncate max-w-[140px]">
              {displayRoleDept}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
