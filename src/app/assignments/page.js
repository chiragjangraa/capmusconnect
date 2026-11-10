"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Upload,
  X,
  AlertCircle,
  FileCheck,
  Shield,
  Edit,
  Users,
} from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import { assignmentsAPI } from "@/lib/api";

const INITIAL_NEW_ASSIGNMENT = {
  title: "",
  courseCode: "",
  courseName: "",
  instructor: "",
  dueDate: "",
  priority: "medium",
  points: "100 pts",
  type: "Programming Lab",
  description: "",
};

export default function AssignmentsPage() {
  const { user, role, isLoading: isAuthLoading } = useAuth();
  const isAdmin = role === "admin";

  const [assignments, setAssignments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // "All" | "Pending" | "Submitted" | "Completed"
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState("");

  // Student Submission Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [submissionFileName, setSubmissionFileName] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Admin Create Assignment Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState(INITIAL_NEW_ASSIGNMENT);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Admin Delete Confirmation Dialog State
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Admin Submissions Review & Grading Modal State
  const [reviewAssignment, setReviewAssignment] = useState(null);
  const [gradingStudentId, setGradingStudentId] = useState(null);
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [gradeError, setGradeError] = useState(null);

  useEffect(() => {
    document.title = "Coursework Assignments | CampusConnect";
  }, []);

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await assignmentsAPI.getAll();
      if (res?.success) {
        setAssignments(res.data || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load assignments from database.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    if (!isAuthLoading && user) {
      const load = async () => {
        try {
          const res = await assignmentsAPI.getAll();
          if (!isCancelled && res?.success) {
            setAssignments(res.data || []);
          }
        } catch (err) {
          if (!isCancelled) {
            setError(err.message || "Failed to load assignments from database.");
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
  }, [isAuthLoading, user]);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast("");
    }, 5000);
  };

  // Summary counts from real data
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
        item.courseName.toLowerCase().includes(q) ||
        (item.instructor && item.instructor.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assignments, searchQuery, statusFilter]);

  // --------------------------------------------------------------------------
  // Student Submission Handlers
  // --------------------------------------------------------------------------
  const handleOpenSubmit = (asgnId = "") => {
    const defaultId =
      asgnId ||
      assignments.find((a) => a.status === "Pending")?._id ||
      assignments.find((a) => a.status === "Pending")?.id ||
      assignments[0]?._id ||
      assignments[0]?.id ||
      "";

    setSelectedAssignmentId(defaultId);
    setSubmissionFileName("");
    setSubmissionNotes("");
    setSubmitError(null);
    setIsSubmitModalOpen(true);
  };

  const handleSimulateFileSelect = (name) => {
    setSubmissionFileName(name);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!selectedAssignmentId) return;

    const targetAsgn = assignments.find(
      (a) => a._id === selectedAssignmentId || a.id === selectedAssignmentId
    );
    const fileName =
      submissionFileName.trim() ||
      `${targetAsgn?.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_solution.pdf`;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await assignmentsAPI.submit(selectedAssignmentId, {
        fileName,
        notes: submissionNotes.trim(),
      });

      if (res?.success) {
        setIsSubmitModalOpen(false);
        showToast(
          `Assignment "${targetAsgn?.title}" deliverable reference recorded successfully for ${targetAsgn?.courseCode}!`
        );

        // Refresh live data from backend
        const refreshed = await assignmentsAPI.getAll();
        if (refreshed?.success) {
          setAssignments(refreshed.data || []);
        }
      }
    } catch (err) {
      setSubmitError(err.message || "Failed to record assignment deliverable reference.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // Admin Create Assignment Handlers
  // --------------------------------------------------------------------------
  const handleOpenCreate = () => {
    setNewAssignment(INITIAL_NEW_ASSIGNMENT);
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (
      !newAssignment.title.trim() ||
      !newAssignment.courseCode.trim() ||
      !newAssignment.courseName.trim() ||
      !newAssignment.instructor.trim() ||
      !newAssignment.dueDate.trim() ||
      !newAssignment.description.trim()
    ) {
      setCreateError("Please fill in all required fields.");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await assignmentsAPI.create(newAssignment);
      if (res?.success) {
        setIsCreateModalOpen(false);
        showToast(`Assignment "${newAssignment.title}" created successfully!`);
        const refreshed = await assignmentsAPI.getAll();
        if (refreshed?.success) {
          setAssignments(refreshed.data || []);
        }
      }
    } catch (err) {
      setCreateError(err.message || "Failed to create assignment.");
    } finally {
      setIsCreating(false);
    }
  };

  // --------------------------------------------------------------------------
  // Admin Delete Assignment Handlers
  // --------------------------------------------------------------------------
  const handleOpenDelete = (item) => {
    setDeleteTarget({
      id: item._id || item.id,
      title: item.title,
    });
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await assignmentsAPI.delete(deleteTarget.id);
      if (res?.success) {
        showToast(`Assignment "${deleteTarget.title}" deleted successfully.`);
        setDeleteTarget(null);
        const refreshed = await assignmentsAPI.getAll();
        if (refreshed?.success) {
          setAssignments(refreshed.data || []);
        }
      }
    } catch (err) {
      setDeleteError(err.message || "Failed to delete assignment.");
    } finally {
      setIsDeleting(false);
    }
  };

  // --------------------------------------------------------------------------
  // Admin Submissions Review & Grading Handlers
  // --------------------------------------------------------------------------
  const handleOpenReview = (item) => {
    setReviewAssignment(item);
    setGradingStudentId(null);
    setGradeScore("");
    setGradeFeedback("");
    setGradeError(null);
  };

  const handleStartGrade = (sub) => {
    setGradingStudentId(sub.student?.toString() || sub.student);
    setGradeScore(sub.score || "");
    setGradeFeedback(sub.feedback || "");
    setGradeError(null);
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!reviewAssignment || !gradingStudentId) return;

    if (!gradeScore.trim()) {
      setGradeError("Please enter an awarded score (e.g. 95/100).");
      return;
    }

    setIsGrading(true);
    setGradeError(null);

    try {
      const asgnId = reviewAssignment._id || reviewAssignment.id;
      const res = await assignmentsAPI.grade(asgnId, {
        studentId: gradingStudentId,
        score: gradeScore.trim(),
        feedback: gradeFeedback.trim() || "Evaluated by campus instructor.",
        status: "Completed",
      });

      if (res?.success) {
        showToast("Student submission evaluated and recorded successfully.");

        // Refresh live assignment list
        const refreshed = await assignmentsAPI.getAll();
        if (refreshed?.success) {
          setAssignments(refreshed.data || []);
          const updatedReview = refreshed.data.find(
            (a) => (a._id || a.id) === asgnId
          );
          if (updatedReview) {
            setReviewAssignment(updatedReview);
          }
        }
        setGradingStudentId(null);
      }
    } catch (err) {
      setGradeError(err.message || "Failed to evaluate student submission.");
    } finally {
      setIsGrading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Unauthenticated Guard
  // --------------------------------------------------------------------------
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
              Coursework & Assignments
            </h1>

            <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              Please sign in to your CampusConnect account to access coursework assignments, track deliverables, and submit lab deliverables.
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

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-14">
        {/* Success Toast / Notification */}
        {successToast && (
          <div
            role="status"
            className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm font-semibold text-emerald-800 shadow-sm animate-fadeIn"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast("")}
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
              <span>Sample Coursework Deliverables</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Coursework & Assignments
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              Coursework &amp; Sample Deliverables — Track sample deliverables and record submission metadata.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Create Assignment</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenSubmit()}
              disabled={isLoading || assignments.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors disabled:opacity-50"
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
              All coursework tasks
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
              Graded &amp; recorded
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
              placeholder="Search by assignment title, course, or instructor (e.g. B-Tree, CS304)..."
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

        {/* Loading State */}
        {(isAuthLoading || isLoading) && (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm font-medium text-slate-500">
              Loading assignments from database...
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-8 text-center shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 mb-3 border border-rose-200">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Unable to Load Assignments
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
              {error}
            </p>
            <button
              type="button"
              onClick={fetchAssignments}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredAssignments.length === 0 && (
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
        {!isLoading && !error && filteredAssignments.length > 0 && (
          <div className="space-y-4">
            {filteredAssignments.map((item) => {
              const asgnKey = item._id || item.id;
              const isPending = item.status === "Pending";
              const isSubmitted = item.status === "Submitted";
              const isCompleted = item.status === "Completed";
              const totalSubs = item.totalSubmissions || item.submissions?.length || 0;

              const badgeStyle = isPending
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : isSubmitted
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200";

              return (
                <div
                  key={asgnKey}
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
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          Sample Deliverable
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
                          Target Date: {item.dueDate}
                        </span>
                        {item.type && (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {item.type}
                          </span>
                        )}
                        {!isAdmin && item.submittedDate && (
                          <span className="text-emerald-700 font-medium">
                            Submitted: {item.submittedDate}
                          </span>
                        )}
                        {!isAdmin && item.submissionFile && (
                          <span className="font-mono text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            📎 {item.submissionFile}
                          </span>
                        )}
                      </div>

                      {!isAdmin && item.feedback && (
                        <div className="mt-2 rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs text-slate-600">
                          <strong className="text-slate-800">Faculty Feedback:</strong>{" "}
                          {item.feedback}
                        </div>
                      )}
                    </div>

                    {/* Right: Status, Score & Action Buttons */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                      <div className="flex items-center gap-2.5">
                        {!isAdmin ? (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold border ${badgeStyle}`}
                          >
                            {item.status}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                            {totalSubs} Submissions
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        {!isAdmin && item.score ? (
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

                      {/* Action Buttons: Role-Aware */}
                      <div className="flex items-center gap-2">
                        {/* Student Actions */}
                        {!isAdmin && isPending && (
                          <button
                            type="button"
                            onClick={() => handleOpenSubmit(asgnKey)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>Submit Now</span>
                          </button>
                        )}
                        {!isAdmin && isSubmitted && (
                          <button
                            type="button"
                            onClick={() => handleOpenSubmit(asgnKey)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <span>Re-upload</span>
                          </button>
                        )}
                        {!isAdmin && isCompleted && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Graded</span>
                          </span>
                        )}

                        {/* Admin-Only Management Actions */}
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenReview(item)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              <Users className="h-3.5 w-3.5" />
                              <span>Submissions ({totalSubs})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenDelete(item)}
                              className="inline-flex items-center gap-1 rounded-xl bg-rose-50 border border-rose-200 px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                              title="Delete Assignment"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Student Submission Modal Dialog */}
        {/* ------------------------------------------------------------------ */}
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
                      Submit Coursework Deliverable
                    </h3>
                    <p className="text-xs text-slate-500">
                      Record deliverable filename reference and submission notes
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

              {submitError && (
                <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                  {submitError}
                </div>
              )}

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
                    {assignments.map((a) => {
                      const asgnKey = a._id || a.id;
                      return (
                        <option key={asgnKey} value={asgnKey}>
                          [{a.courseCode}] {a.title} ({a.status})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Deliverable File Reference (Filename Record) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Deliverable File Reference (Filename Record)
                  </label>
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-5 text-center hover:border-blue-400 transition-colors">
                    <Upload className="mx-auto h-7 w-7 text-slate-400 mb-2" />
                    <p className="text-xs font-semibold text-slate-700">
                      {submissionFileName ? (
                        <span className="text-blue-600 font-bold">
                          Selected Reference: {submissionFileName}
                        </span>
                      ) : (
                        "Select a quick simulation reference below or enter filename"
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                      Note: The current system records deliverable filename references and submission notes. Actual binary files are not uploaded or stored on the server.
                    </p>

                    {/* Quick Simulation Pills */}
                    <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
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
                    disabled={isSubmitting}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Recording...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Confirm Submission</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Admin Create Assignment Modal Dialog */}
        {/* ------------------------------------------------------------------ */}
        {isAdmin && isCreateModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative w-full max-w-xl rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <Edit className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Create Coursework Assignment
                    </h3>
                    <p className="text-xs text-slate-500">
                      Add a new assignment deliverable to the university curriculum
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {createError && (
                <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateAssignment} className="mt-5 space-y-4 text-xs">
                {/* Title */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                    Assignment Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAssignment.title}
                    onChange={(e) =>
                      setNewAssignment({ ...newAssignment, title: e.target.value })
                    }
                    placeholder="e.g. Distributed Consensus Engine"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Course Code & Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                      Course Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAssignment.courseCode}
                      onChange={(e) =>
                        setNewAssignment({
                          ...newAssignment,
                          courseCode: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="e.g. CS401"
                      className="w-full font-mono rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                      Course Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAssignment.courseName}
                      onChange={(e) =>
                        setNewAssignment({
                          ...newAssignment,
                          courseName: e.target.value,
                        })
                      }
                      placeholder="e.g. Cloud Architecture"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Instructor & Due Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                      Primary Instructor *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAssignment.instructor}
                      onChange={(e) =>
                        setNewAssignment({
                          ...newAssignment,
                          instructor: e.target.value,
                        })
                      }
                      placeholder="e.g. Prof. David Vance"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                      Target Due Date *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAssignment.dueDate}
                      onChange={(e) =>
                        setNewAssignment({
                          ...newAssignment,
                          dueDate: e.target.value,
                        })
                      }
                      placeholder="e.g. Dec 15, 2026, 11:59 PM"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Priority, Points, Type */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                      Priority
                    </label>
                    <select
                      value={newAssignment.priority}
                      onChange={(e) =>
                        setNewAssignment({
                          ...newAssignment,
                          priority: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                      Points
                    </label>
                    <input
                      type="text"
                      value={newAssignment.points}
                      onChange={(e) =>
                        setNewAssignment({
                          ...newAssignment,
                          points: e.target.value,
                        })
                      }
                      placeholder="100 pts"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                      Type
                    </label>
                    <input
                      type="text"
                      value={newAssignment.type}
                      onChange={(e) =>
                        setNewAssignment({
                          ...newAssignment,
                          type: e.target.value,
                        })
                      }
                      placeholder="Programming Lab"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                    Description &amp; Task Requirements *
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={newAssignment.description}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe deliverable expectations, unit tests, and submission instructions..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isCreating}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {isCreating ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Create Assignment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Admin Delete Confirmation Dialog */}
        {/* ------------------------------------------------------------------ */}
        {isAdmin && deleteTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 border border-rose-200">
                <AlertCircle className="h-7 w-7" />
              </div>

              <h3 className="text-base font-bold text-slate-900">
                Confirm Assignment Deletion
              </h3>

              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Are you sure you want to remove{" "}
                <span className="font-bold text-slate-900">
                  &ldquo;{deleteTarget.title}&rdquo;
                </span>
                ? This will permanently delete the assignment and all associated student submission records from MongoDB Atlas.
              </p>

              {deleteError && (
                <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                  {deleteError}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Admin Submissions Review & Grading Modal Dialog */}
        {/* ------------------------------------------------------------------ */}
        {isAdmin && reviewAssignment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-blue-50 px-2 py-0.5 font-mono text-xs font-bold text-blue-700 border border-blue-100">
                      {reviewAssignment.courseCode}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Submissions: {reviewAssignment.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Review student deliverable references, notes, and record faculty evaluations
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewAssignment(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {gradeError && (
                <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                  {gradeError}
                </div>
              )}

              {/* Submissions List */}
              <div className="mt-5 space-y-4">
                {(!reviewAssignment.submissions ||
                  reviewAssignment.submissions.length === 0) ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                      <Users className="h-6 w-6" />
                    </div>
                    <p className="font-semibold text-slate-700">
                      No Student Submissions Yet
                    </p>
                    <p className="text-slate-400 mt-1 max-w-xs mx-auto">
                      Enrolled students have not submitted deliverables for this assignment yet.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
                    {reviewAssignment.submissions.map((sub, idx) => {
                      const studentKey = sub.student?.toString() || idx;
                      const isGraded = sub.status === "Completed" && sub.score;
                      const isCurrentGrading = gradingStudentId === studentKey;

                      return (
                        <div key={studentKey} className="p-4 bg-white space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {sub.studentName || "Student"}
                                </span>
                                <span className="text-xs text-slate-400">
                                  ({sub.studentEmail || "Email N/A"})
                                </span>
                              </div>
                              <p className="font-mono text-xs text-blue-600 mt-0.5">
                                📎 {sub.fileName}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                                  isGraded
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                }`}
                              >
                                {sub.status || "Submitted"}
                              </span>

                              {sub.score && (
                                <span className="text-xs font-extrabold text-emerald-700">
                                  {sub.score}
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleStartGrade(sub)}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              >
                                {isGraded ? "Edit Grade" : "Evaluate"}
                              </button>
                            </div>
                          </div>

                          {sub.notes && (
                            <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <strong className="text-slate-700">Student Notes:</strong>{" "}
                              {sub.notes}
                            </p>
                          )}

                          {sub.feedback && (
                            <p className="text-xs text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                              <strong className="text-emerald-900">Faculty Feedback:</strong>{" "}
                              {sub.feedback}
                            </p>
                          )}

                          {/* Inline Grading Form */}
                          {isCurrentGrading && (
                            <form
                              onSubmit={handleSaveGrade}
                              className="mt-3 p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3 animate-fadeIn"
                            >
                              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                                <span className="font-bold text-xs text-blue-900">
                                  Evaluate Submission: {sub.studentName || "Student"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setGradingStudentId(null)}
                                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                                >
                                  Cancel
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold uppercase text-slate-700">
                                    Awarded Score *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={gradeScore}
                                    onChange={(e) => setGradeScore(e.target.value)}
                                    placeholder="e.g. 96/100"
                                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                                  />
                                </div>

                                <div className="sm:col-span-2 space-y-1">
                                  <label className="text-[11px] font-semibold uppercase text-slate-700">
                                    Faculty Feedback (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={gradeFeedback}
                                    onChange={(e) =>
                                      setGradeFeedback(e.target.value)
                                    }
                                    placeholder="e.g. Excellent test suite coverage."
                                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end pt-1">
                                <button
                                  type="submit"
                                  disabled={isGrading}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {isGrading ? "Saving..." : "Save Evaluation"}
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setReviewAssignment(null)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
