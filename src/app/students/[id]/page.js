import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  AlertCircle,
  Users,
} from "@/components/Icons";
import { getStudentById, studentsList } from "@/data/mockData";

export function generateStaticParams() {
  return studentsList.map((student) => ({
    id: student.id,
  }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const student = getStudentById(id);

  if (!student) {
    return {
      title: "Student Not Found | CampusConnect",
    };
  }

  return {
    title: `${student.name} (${student.id}) | CampusConnect`,
    description: `Academic profile, courses, and attendance records for ${student.name}.`,
  };
}

export default async function StudentDetailPage({ params }) {
  const { id } = await params;
  const student = getStudentById(id);

  // Friendly Not Found State
  if (!student) {
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
              We could not find any active student profile matching this identifier in the CampusConnect university registry.
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

  const completionRate = Math.round(
    (student.completedAssignments / student.totalAssignments) * 100
  );
  const isDeanHonor = student.academicStatus.includes("Honor");

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
                {student.initials}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {student.name}
                  </h1>
                  <span className="font-mono rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                    {student.id}
                  </span>
                  {isDeanHonor && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                      <Sparkles className="h-3 w-3" />
                      Dean&apos;s Honor List
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-slate-600">
                  {student.program} • {student.semester}
                </p>

                <p className="max-w-2xl text-xs sm:text-sm text-slate-500 leading-relaxed pt-1">
                  {student.bio}
                </p>
              </div>
            </div>

            {/* Right: Academic Status Badge */}
            <div className="flex shrink-0 items-center gap-4 rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:self-start">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Cumulative GPA
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-slate-900">
                    {student.cgpa.split(" ")[0]}
                  </span>
                  <span className="text-xs text-slate-500">/ 4.0</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600">
                  {student.academicStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Department</span>
              <p className="font-semibold text-slate-800">{student.department}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">University Email</span>
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{student.email}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Contact Phone</span>
              <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{student.phone}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Faculty Advisor</span>
              <p className="font-semibold text-slate-800">{student.advisor}</p>
            </div>
          </div>
        </div>

        {/* 3 Academic Metrics: Attendance, Assignment Completion, Course Load */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Attendance Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span>Attendance Standing</span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  student.attendance >= 85
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {student.attendance >= 85 ? "Safe Standing" : "Near Threshold"}
              </span>
            </div>

            <div>
              <div className="text-3xl font-extrabold text-slate-900">
                {student.attendance}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                University requirement: {student.attendanceRequired}% minimum
              </p>
            </div>

            {/* Visual Attendance Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    student.attendance >= 85
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                      : "bg-gradient-to-r from-amber-500 to-orange-500"
                  }`}
                  style={{ width: `${student.attendance}%` }}
                />
              </div>
            </div>
          </div>

          {/* Assignments Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Assignments Status</span>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                {completionRate}% Completed
              </span>
            </div>

            <div>
              <div className="text-3xl font-extrabold text-slate-900">
                {student.completedAssignments}{" "}
                <span className="text-base font-normal text-slate-400">
                  / {student.totalAssignments}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {student.totalAssignments - student.completedAssignments} remaining assignments
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Enrolled Courses Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span>Registered Courses</span>
              </div>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                {student.enrolledCourses.length} Modules
              </span>
            </div>

            <div>
              <div className="text-3xl font-extrabold text-slate-900">
                {student.enrolledCourses.reduce((sum, c) => sum + c.credits, 0)}{" "}
                <span className="text-base font-normal text-slate-400">
                  Credits
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                All credits registered for {student.semester}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-slate-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Full-time Academic Load</span>
            </div>
          </div>
        </div>

        {/* Student Skills & Competencies */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Technical Skills & Competencies
                </h2>
                <p className="text-[11px] text-slate-500">
                  Verified coursework and project proficiencies
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {student.skills.length} Skills Listed
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {student.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Enrolled Courses Section */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Enrolled Coursework
                </h2>
                <p className="text-[11px] text-slate-500">
                  Class schedules, attendance and academic standing
                </p>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {student.semester}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="py-3 px-3">
                    Course Code
                  </th>
                  <th scope="col" className="py-3 px-3">
                    Course Title
                  </th>
                  <th scope="col" className="py-3 px-3">
                    Instructor
                  </th>
                  <th scope="col" className="py-3 px-3">
                    Schedule
                  </th>
                  <th scope="col" className="py-3 px-3 text-center">
                    Credits
                  </th>
                  <th scope="col" className="py-3 px-3">
                    Attendance
                  </th>
                  <th scope="col" className="py-3 px-3 text-center">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {student.enrolledCourses.map((c) => (
                  <tr key={c.code} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-3">
                      <span className="rounded-md bg-blue-50 px-2 py-1 font-bold text-blue-700 border border-blue-100 font-mono">
                        {c.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-900">
                      {c.title}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {c.instructor}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                      {c.schedule}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      {c.credits}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              c.attendance >= 90 ? "bg-emerald-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${c.attendance}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800">
                          {c.attendance}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-block min-w-7 rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-900">
                        {c.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assignments Status & Submission History */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Recent Assignments & Lab Submissions
                </h2>
                <p className="text-[11px] text-slate-500">
                  Evaluation status and coursework deliverables
                </p>
              </div>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
              {student.assignments.length} Logged
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {student.assignments.map((item) => {
              const isPending = item.status === "Pending";
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3.5 gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 font-mono">
                        {item.courseCode}
                      </span>
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400">
                      Due: {item.dueDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.score && (
                      <span className="text-xs font-bold text-slate-700">
                        Score: {item.score}
                      </span>
                    )}
                    {item.points && (
                      <span className="text-xs text-slate-400">
                        {item.points}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        isPending
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

