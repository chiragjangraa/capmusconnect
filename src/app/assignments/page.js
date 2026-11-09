"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Upload,
  Calendar,
  X,
  Sparkles,
  AlertCircle,
  FileCheck,
} from "@/components/Icons";
import { initialAssignmentsList } from "@/data/mockData";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState(initialAssignmentsList);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // "All" | "Pending" | "Submitted" | "Completed"

  // Modal demo state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [submissionFileName, setSubmissionFileName] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState("");

  // Summary counts
  const totalCount = assignments.length;
  const pendingCount = assignments.filter((a) => a.status === "Pending").length;
  const submittedCount = assignments.filter((a) => a.status === "Submitted").length;
  const completedCount = assignments.filter((a) => a.status === "Completed").length;

  // Filtered list
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.courseCode.toLowerCase().includes(q) ||
        item.courseName.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assignments, searchQuery, statusFilter]);

  // Open modal for a specific assignment
  const handleOpenSubmit = (asgnId = "") => {
    setSelectedAssignmentId(asgnId || (assignments.find((a) => a.status === "Pending")?.id || ""));
    setSubmissionFileName("");
    setSubmissionNotes("");
    setIsSubmitModalOpen(true);
  };

  // Demo file upload simulation
  const handleSimulateFileSelect = (name) => {
    setSubmissionFileName(name);
  };

  // Submit action (demo interaction)
  const handleSubmitAssignment = (e) => {
    e.preventDefault();
    if (!selectedAssignmentId) return;

    const targetAsgn = assignments.find((a) => a.id === selectedAssignmentId);
    const fileName = submissionFileName || `${targetAsgn?.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_solution.pdf`;

    setAssignments((prev) =>
      prev.map((item) => {
        if (item.id === selectedAssignmentId) {
          return {
            ...item,
            status: "Submitted",
            submittedDate: "Just now (Nov 9, 2026)",
            submissionFile: fileName,
            feedback: submissionNotes || "Submitted successfully via student portal. Awaiting instructor review.",
          };
        }
        return item;
      })
    );

    setIsSubmitModalOpen(false);
    setSubmitSuccessMsg(
      `Assignment "${targetAsgn?.title}" submitted successfully for ${targetAsgn?.courseCode}!`
    );

    setTimeout(() => {
      setSubmitSuccessMsg("");
    }, 5000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-14">
        {/* Success Toast / Notification */}
        {submitSuccessMsg && (
          <div
            role="status"
            className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm font-semibold text-emerald-800 shadow-sm animate-fadeIn"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{submitSuccessMsg}</span>
            </div>
            <button
              onClick={() => setSubmitSuccessMsg("")}
              className="text-emerald-700 hover:text-emerald-900"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
              <FileText className="h-3.5 w-3.5" />
              <span>Academic Deliverables Hub</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Coursework & Assignments
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              Track course deliverables, upload lab submissions, monitor grading evaluation criteria, and review faculty feedback.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <button
              type="button"
              onClick={() => handleOpenSubmit()}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Submit Assignment</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => setStatusFilter("All")}
            className={`text-left rounded-2xl p-4 border transition-all ${
              statusFilter === "All"
                ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs"
                : "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total
              </span>
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {totalCount}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              All term tasks
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("Pending")}
            className={`text-left rounded-2xl p-4 border transition-all ${
              statusFilter === "Pending"
                ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-xs"
                : "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Pending
              </span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-700 mt-1">
              {pendingCount}
            </p>
            <p className="text-[11px] text-amber-600 font-medium mt-1">
              Action required
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("Submitted")}
            className={`text-left rounded-2xl p-4 border transition-all ${
              statusFilter === "Submitted"
                ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs"
                : "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Submitted
              </span>
              <FileCheck className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-indigo-700 mt-1">
              {submittedCount}
            </p>
            <p className="text-[11px] text-indigo-600 font-medium mt-1">
              Under evaluation
            </p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("Completed")}
            className={`text-left rounded-2xl p-4 border transition-all ${
              statusFilter === "Completed"
                ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                : "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Completed
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {completedCount}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              Graded & recorded
            </p>
          </button>
        </div>

        {/* Search Bar & Filter Tabs */}
        <div className="flex flex-col gap-3 rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by assignment title or course (e.g. B-Tree, CS304)..."
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

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-0">
            {["All", "Pending", "Submitted", "Completed"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  statusFilter === status
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredAssignments.length === 0 && (
          <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No assignments found
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              No assignment deliverables matched your current search and status filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Assignment Cards List */}
        {filteredAssignments.length > 0 && (
          <div className="space-y-4">
            {filteredAssignments.map((item) => {
              const isPending = item.status === "Pending";
              const isSubmitted = item.status === "Submitted";
              const isCompleted = item.status === "Completed";

              const badgeStyle = isPending
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : isSubmitted
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200";

              return (
                <div
                  key={item.id}
                  className="group relative rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Left: Info */}
                    <div className="space-y-2 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-xs font-bold text-blue-700 border border-blue-100">
                          {item.courseCode}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {item.courseName}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-400">
                          Instructor: {item.instructor}
                        </span>
                      </div>

                      <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h2>

                      <p className="text-xs text-slate-500 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock
                            className={`h-3.5 w-3.5 ${
                              isPending ? "text-amber-500" : "text-slate-400"
                            }`}
                          />
                          Due: {item.dueDate}
                        </span>
                        {item.type && (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {item.type}
                          </span>
                        )}
                        {item.submittedDate && (
                          <span className="text-emerald-700 font-medium">
                            Submitted: {item.submittedDate}
                          </span>
                        )}
                      </div>

                      {item.feedback && (
                        <div className="mt-2 rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs text-slate-600">
                          <strong className="text-slate-800">Feedback:</strong>{" "}
                          {item.feedback}
                        </div>
                      )}
                    </div>

                    {/* Right: Status, Score & Action Button */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold border ${badgeStyle}`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <div className="text-right">
                        {item.score ? (
                          <div>
                            <span className="text-xs text-slate-400 block">
                              Awarded Marks
                            </span>
                            <span className="text-sm font-extrabold text-emerald-700">
                              {item.score}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">
                            {item.points}
                          </span>
                        )}
                      </div>

                      {/* Action */}
                      <div>
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleOpenSubmit(item.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>Submit Now</span>
                          </button>
                        )}
                        {isSubmitted && (
                          <button
                            type="button"
                            onClick={() => handleOpenSubmit(item.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <span>Re-upload</span>
                          </button>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Graded</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Submit Assignment Modal Dialog */}
        {isSubmitModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Submit Coursework Assignment
                    </h3>
                    <p className="text-xs text-slate-500">
                      Upload lab deliverable or source code archive
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitAssignment} className="mt-5 space-y-4">
                {/* Select Assignment */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="select-assignment"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Select Assignment
                  </label>
                  <select
                    id="select-assignment"
                    value={selectedAssignmentId}
                    onChange={(e) => setSelectedAssignmentId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs sm:text-sm text-slate-800 font-medium focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {assignments.map((a) => (
                      <option key={a.id} value={a.id}>
                        [{a.courseCode}] {a.title} ({a.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* File Dropzone Simulation */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Deliverable File
                  </label>
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-6 text-center hover:border-blue-400 transition-colors">
                    <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-xs font-semibold text-slate-700">
                      {submissionFileName ? (
                        <span className="text-blue-600 font-bold">
                          Selected: {submissionFileName}
                        </span>
                      ) : (
                        "Click quick simulation buttons below or drag files here"
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      PDF, ZIP, TAR.GZ or Jupyter Notebook up to 50MB
                    </p>

                    {/* Quick Simulation Pills */}
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleSimulateFileSelect("solution_code_v1.zip")
                        }
                        className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-600 shadow-2xs"
                      >
                        + solution_code_v1.zip
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSimulateFileSelect("lab_final_report.pdf")
                        }
                        className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-600 shadow-2xs"
                      >
                        + lab_final_report.pdf
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submission Notes */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="submission-notes"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Submission Notes (Optional)
                  </label>
                  <textarea
                    id="submission-notes"
                    rows="2"
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    placeholder="Include repository link, execution instructions, or group member contributions..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm Submission</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

