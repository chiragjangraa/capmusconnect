"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  User,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Edit,
  Save,
  CheckCircle2,
  Sparkles,
  Award,
  ArrowRight,
  Shield,
  X,
} from "@/components/Icons";
import { studentData, coursesList } from "@/data/mockData";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Editable profile state initialized from mock data
  const [profile, setProfile] = useState({
    name: studentData.profile.name,
    id: studentData.profile.id,
    email: studentData.profile.email,
    initials: studentData.profile.initials,
    program: studentData.profile.program,
    semester: studentData.profile.semester,
    department: studentData.profile.department,
    cgpa: studentData.profile.cgpa,
    academicStatus: studentData.profile.academicStatus,
    phone: "+1 (555) 234-5678",
    campusAddress: "Hall C Dormitory, Room 314, North Campus",
    emergencyContact: "Eleanor Morgan (Parent) • +1 (555) 876-5432",
    advisor: "Dr. Evelyn Reed (Computing Complex Room 412)",
    bio: "Passionate about full-stack web architectures, distributed systems, and algorithmic problem solving. Lead developer for the university coding club.",
    github: "https://github.com/alex-morgan",
    portfolio: "https://alexmorgan.dev",
  });

  const [formData, setFormData] = useState({ ...profile });

  const handleStartEdit = () => {
    setFormData({ ...profile });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormData({ ...profile });
    setIsEditing(false);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfile({ ...formData });
    setIsEditing(false);
    setSuccessMessage("Student profile updated successfully! All changes saved to session.");

    setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-14">
        {/* Success Alert */}
        {successMessage && (
          <div
            role="status"
            className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm font-semibold text-emerald-800 shadow-sm animate-fadeIn"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-emerald-700 hover:text-emerald-900"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Profile Header Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Avatar & Main Identity */}
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="relative">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-3xl font-extrabold text-white shadow-lg shadow-blue-500/25">
                  {profile.initials}
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white text-[10px] font-bold">
                  ✓
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {profile.name}
                  </h1>
                  <span className="font-mono rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                    {profile.id}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                    <Sparkles className="h-3 w-3" />
                    {profile.academicStatus}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-600">
                  {profile.program} • {profile.semester}
                </p>

                <p className="max-w-2xl text-xs sm:text-sm text-slate-500 leading-relaxed pt-1">
                  {profile.bio}
                </p>
              </div>
            </div>

            {/* Edit Profile Button */}
            <div className="flex shrink-0 items-center gap-3">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form Card (When Editing) */}
        {isEditing && (
          <form
            onSubmit={handleSaveProfile}
            className="rounded-3xl border-2 border-blue-200 bg-white p-6 sm:p-8 shadow-lg space-y-6 animate-fadeIn"
          >
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Edit Academic & Contact Information
              </h2>
              <p className="text-xs text-slate-500">
                Update your contact details, bio, and student directory visibility
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Student Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Campus Address / Dormitory
                </label>
                <input
                  type="text"
                  value={formData.campusAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, campusAddress: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergencyContact: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Academic Bio / Statement
                </label>
                <textarea
                  rows="3"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
              >
                <Save className="h-4 w-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* Academic Summary Grid (3 Cards) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Cumulative GPA</span>
              <Award className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900">
                {profile.cgpa.split(" ")[0]}
              </span>
              <span className="text-xs text-slate-400">/ 4.0</span>
            </div>
            <p className="text-xs text-emerald-600 font-semibold">
              Top 5% of Engineering Cohort
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Completed Credits</span>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900">72</span>
              <span className="text-xs text-slate-400">/ 128 Total</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              18 Credits registered this term
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Overall Attendance</span>
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900">91.5%</span>
            </div>
            <p className="text-xs text-emerald-600 font-semibold">
              Dean&apos;s Honor Standard Maintained
            </p>
          </div>
        </div>

        {/* Detailed Contact & Institutional Information */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Institutional & Contact Details
            </h2>
            <p className="text-[11px] text-slate-500">
              Official university contact records and faculty liaison
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Official University Email</span>
              <div className="flex items-center gap-1.5 text-slate-900 font-semibold truncate">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{profile.email}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Phone Number</span>
              <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{profile.phone}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Academic Department</span>
              <p className="font-semibold text-slate-900">{profile.department}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Campus Residence</span>
              <p className="font-semibold text-slate-900">{profile.campusAddress}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Academic Advisor</span>
              <p className="font-semibold text-slate-900">{profile.advisor}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Emergency Contact</span>
              <p className="font-semibold text-slate-900">{profile.emergencyContact}</p>
            </div>
          </div>
        </div>

        {/* Enrolled Courses Summary */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Registered Course Load (Semester 5)
              </h2>
            </div>
            <Link
              href="/courses"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Browse Catalog →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {coursesList.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/courses/${c.code}`}
                className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:bg-white hover:border-blue-200 hover:shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700 border border-blue-100">
                      {c.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {c.credits} Credits
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                    {c.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    {c.faculty.name}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Attendance:</span>
                  <span className="font-bold text-emerald-600">{c.attendance}%</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

