import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Input } from "@/components/ui";
import { apiClient } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui";
import { academicApi, attendanceApi, feesApi, learningApi, type TimetableSlot } from "../api";

const WEEKDAYS: TimetableSlot["weekday"][] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const StudentDashboardPage: React.FC = () => {
  const { user, clearUser } = useAuthStore();
  const [batchFilter, setBatchFilter] = useState<string>("ALL");

  const timetableQ = useQuery({ queryKey: ["timetable"], queryFn: () => academicApi.listTimetable() });
  const batchesQ = useQuery({ queryKey: ["batches"], queryFn: academicApi.listBatches });
  const subjectsQ = useQuery({ queryKey: ["subjects"], queryFn: academicApi.listSubjects });
  const qc = useQueryClient();
  const invoicesQ = useQuery({ queryKey: ["fee-invoices", "student"], queryFn: () => feesApi.listInvoices() });
  const doubtsQ = useQuery({ queryKey: ["learning-doubts"], queryFn: learningApi.listDoubts });
  const examsQ = useQuery({ queryKey: ["learning-exams"], queryFn: learningApi.listExams });

  const selectedBatchNum = batchFilter !== "ALL" ? Number(batchFilter) : undefined;
  const attSummaryQ = useQuery({
    queryKey: ["attendance-summary", selectedBatchNum],
    queryFn: () => attendanceApi.getSummary(selectedBatchNum),
  });

  const slots = timetableQ.data ?? [];
  const batches = batchesQ.data ?? [];
  const subjects = subjectsQ.data ?? [];

  const filteredSlots = useMemo(() => {
    if (batchFilter === "ALL") return slots;
    return slots.filter((s) => String(s.batch_id) === batchFilter);
  }, [slots, batchFilter]);

  
  const [doubtTitle, setDoubtTitle] = useState("");
  const [doubtBatchId, setDoubtBatchId] = useState("");
  const [doubtSubjectId, setDoubtSubjectId] = useState("");
  const [doubtMsg, setDoubtMsg] = useState("");
  const [replyByDoubt, setReplyByDoubt] = useState<Record<number, string>>({});

  const createDoubtM = useMutation({
    mutationFn: () =>
      learningApi.createDoubt({
        title: doubtTitle.trim(),
        batch_id: Number(doubtBatchId || batches[0]?.id || 1),
        subject_id: Number(doubtSubjectId || subjects[0]?.id || 1),
        message: doubtMsg.trim(),
      }),
    onSuccess: () => {
      toast.success("Doubt posted");
      setDoubtTitle("");
      setDoubtMsg("");
      qc.invalidateQueries({ queryKey: ["learning-doubts"] });
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to post doubt"),
  });

  const replyDoubtM = useMutation({
    mutationFn: ({ id, message, resolve }: { id: number; message: string; resolve?: boolean }) =>
      learningApi.addDoubtMessage(id, { message, resolve }),
    onSuccess: () => {
      toast.success("Doubt updated");
      qc.invalidateQueries({ queryKey: ["learning-doubts"] });
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to update doubt"),
  });

  const resolveDoubtM = useMutation({
    mutationFn: (id: number) => learningApi.updateDoubtStatus(id, "RESOLVED"),
    onSuccess: () => {
      toast.success("Marked as resolved");
      qc.invalidateQueries({ queryKey: ["learning-doubts"] });
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to resolve doubt"),
  });

  const overallAtt = attSummaryQ.data?.overall;

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-900">
      <div className="mx-auto flex max-w-[1440px] flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b border-slate-800 bg-[#0f172a] text-slate-200 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 lg:block">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-sm font-bold text-white">
                S
              </div>
              <div>
                <p className="text-sm font-bold tracking-wide text-white">CLASO ACADEMY</p>
                <p className="text-[11px] text-slate-400">Student Portal</p>
              </div>
            </div>
            <span className="rounded-md bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-300 ring-1 ring-sky-500/30 lg:mt-3 lg:inline-block">
              Student Active
            </span>
          </div>

          <div className="space-y-4 p-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 text-xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Academic Snapshot
              </p>
              <div className="mt-2.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Attendance</span>
                  <span className="font-semibold tabular-nums text-sky-400">
                    {overallAtt?.percentage ?? 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Present / Late</span>
                  <span className="font-semibold tabular-nums text-white">
                    {(overallAtt?.present ?? 0) + (overallAtt?.late ?? 0)} / {overallAtt?.total ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Weekly Slots</span>
                  <span className="font-semibold tabular-nums text-white">{slots.length}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-6 py-4 backdrop-blur">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                Student Timetable & Attendance
              </h1>
              <p className="text-xs text-slate-500">
                Signed in as <span className="font-semibold text-slate-700">{user?.name || "Student"}</span>
              </p>
            </div>

            <Button
              type="button"
              onClick={async () => {
                await apiClient.post("/auth/logout");
                clearUser();
              }}
            >
              Sign Out
            </Button>
          </header>

          <main className="space-y-6 p-6">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Attendance Rate</span>
                <p className="mt-2 text-2xl font-bold tabular-nums text-sky-600">
                  {overallAtt?.percentage ?? 0}%
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Present Days</span>
                <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-600">
                  {overallAtt?.present ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Absent Days</span>
                <p className="mt-2 text-2xl font-bold tabular-nums text-rose-600">
                  {overallAtt?.absent ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Weekly Classes</span>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{filteredSlots.length}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Class Timetable</h2>
                  <p className="text-xs text-slate-500">Filter schedule and attendance summary by batch</p>
                </div>

                <select
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                >
                  <option value="ALL">All Batches ({slots.length})</option>
                  {batches.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                {WEEKDAYS.map((day) => {
                  const daySlots = filteredSlots.filter((s) => s.weekday === day);
                  return (
                    <div
                      key={day}
                      className="flex min-h-36 flex-col rounded-xl border border-slate-200/80 bg-slate-50/60 p-3"
                    >
                      <div className="mb-2.5 flex items-center justify-between border-b border-slate-200/70 pb-1.5">
                        <span className="text-xs font-bold text-slate-800">{day}</span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
                          {daySlots.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {daySlots.map((t) => (
                          <div
                            key={t.id}
                            className="rounded-lg border border-sky-100 bg-white p-2.5 text-xs shadow-2xs"
                          >
                            <span className="font-semibold tabular-nums text-sky-700">
                              {t.start_time}–{t.end_time}
                            </span>
                            <p className="mt-1 font-semibold text-slate-900">
                              {t.subject_name || "Subject #" + t.subject_id}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {t.batch_name || "Batch #" + t.batch_id}
                            </p>
                          </div>
                        ))}
                        {daySlots.length === 0 && (
                          <p className="py-6 text-center text-[11px] text-slate-400">No classes</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <h2 className="mb-3 text-base font-bold text-slate-900">Invoices & Fee Status</h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200/70">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5">Invoice</th>
                      <th className="px-4 py-2.5">Student</th>
                      <th className="px-4 py-2.5">Amount</th>
                      <th className="px-4 py-2.5">Balance Due</th>
                      <th className="px-4 py-2.5">Due Date</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(invoicesQ.data ?? []).map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/90">
                        <td className="px-4 py-2.5 font-semibold text-slate-900">{inv.title}</td>
                        <td className="px-4 py-2.5 text-slate-700">{inv.student_name}</td>
                        <td className="px-4 py-2.5 font-semibold tabular-nums text-slate-900">
                          Rs. {inv.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 font-semibold tabular-nums text-rose-700">
                          Rs. {inv.balance_due.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums text-slate-600">{inv.due_date}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              inv.status === "PAID"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                : inv.status === "PARTIAL"
                                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            
            <section className="grid gap-6 xl:grid-cols-12">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs xl:col-span-7">
                <h2 className="mb-1 text-base font-bold text-slate-900">Ask & Track Doubts</h2>
                <p className="mb-4 text-xs text-slate-500">Post subject doubts, view faculty replies, and mark resolved</p>

                <form
                  className="mb-4 grid gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (doubtTitle.trim() && doubtMsg.trim()) createDoubtM.mutate();
                  }}
                >
                  <Input
                    placeholder="Doubt title (e.g. Integration by parts step)"
                    value={doubtTitle}
                    onChange={(e) => setDoubtTitle(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700"
                      value={doubtBatchId}
                      onChange={(e) => setDoubtBatchId(e.target.value)}
                    >
                      <option value="">Default Batch</option>
                      {batches.map((b) => (
                        <option key={b.id} value={String(b.id)}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700"
                      value={doubtSubjectId}
                      onChange={(e) => setDoubtSubjectId(e.target.value)}
                    >
                      <option value="">Default Subject</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex gap-2">
                    <Input
                      placeholder="Write your question clearly..."
                      value={doubtMsg}
                      onChange={(e) => setDoubtMsg(e.target.value)}
                    />
                    <Button type="submit" disabled={createDoubtM.isPending}>
                      {createDoubtM.isPending ? "Posting..." : "Ask Doubt"}
                    </Button>
                  </div>
                </form>

                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {(doubtsQ.data ?? []).map((d) => (
                    <div key={d.id} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-slate-900">{d.title}</span>
                          <span className="ml-2 text-[11px] text-slate-500">
                            {d.subject_name} · {d.batch_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              d.status === "RESOLVED"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                : d.status === "ANSWERED"
                                ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
                                : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                            }`}
                          >
                            {d.status}
                          </span>
                          {d.status !== "RESOLVED" && (
                            <button
                              type="button"
                              onClick={() => resolveDoubtM.mutate(d.id)}
                              className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-2.5 space-y-1.5 border-l-2 border-indigo-200 pl-3">
                        {d.messages.map((m) => (
                          <div key={m.id} className="text-slate-700">
                            <span className="font-semibold text-slate-900">{m.sender_name}: </span>
                            <span>{m.message}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2.5 flex gap-2">
                        <input
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                          placeholder="Add follow-up note..."
                          value={replyByDoubt[d.id] || ""}
                          onChange={(e) => setReplyByDoubt((p) => ({ ...p, [d.id]: e.target.value }))}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const txt = (replyByDoubt[d.id] || "").trim();
                            if (txt) {
                              replyDoubtM.mutate({ id: d.id, message: txt });
                              setReplyByDoubt((p) => ({ ...p, [d.id]: "" }));
                            }
                          }}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs xl:col-span-5">
                <h2 className="mb-1 text-base font-bold text-slate-900">Exams & Marks</h2>
                <p className="mb-4 text-xs text-slate-500">Test schedules, max marks, and scores</p>
                <div className="space-y-2.5">
                  {(examsQ.data ?? []).map((ex) => {
                    const myMark = ex.marks[0];
                    return (
                      <div key={ex.id} className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-slate-900">{ex.name}</p>
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-indigo-700">
                            Max {ex.max_marks}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {ex.subject_name} · {ex.batch_name} · {ex.date}
                        </p>
                        <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2">
                          <span className="text-slate-600">
                            {myMark
                              ? `Score: ${myMark.student_name} — ${myMark.score}/${ex.max_marks}`
                              : `Graded entries: ${ex.graded_count}`}
                          </span>
                          {ex.avg_score !== null && (
                            <span className="font-semibold tabular-nums text-slate-700">Avg: {ex.avg_score}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {(examsQ.data ?? []).length === 0 && (
                    <p className="py-6 text-center text-xs text-slate-400">No exams scheduled yet.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <h2 className="mb-3 text-base font-bold text-slate-900">Batches & Timings</h2>
                <div className="divide-y divide-slate-100 text-sm">
                  {batches.map((b) => (
                    <div key={b.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="font-semibold text-slate-900">{b.name}</p>
                        <p className="text-xs text-slate-500">{b.course_name || "Course #" + b.course_id}</p>
                      </div>
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium tabular-nums text-slate-700">
                        {b.timings}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <h2 className="mb-3 text-base font-bold text-slate-900">Subjects</h2>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
                    >
                      {s.name}
                      {s.code ? " · " + s.code : ""}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};
