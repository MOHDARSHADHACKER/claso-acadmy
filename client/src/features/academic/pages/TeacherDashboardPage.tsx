import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";
import { Button, Input } from "@/components/ui";
import { academicApi, attendanceApi, learningApi, type AttendanceStatus, type ExamMarkSheetRow, type TimetableSlot } from "../api";

const WEEKDAYS: TimetableSlot["weekday"][] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const TeacherDashboardPage: React.FC = () => {
  const qc = useQueryClient();
  const { user, clearUser } = useAuthStore();
  const [onlyMine, setOnlyMine] = useState(true);
  const [batchFilter, setBatchFilter] = useState<string>("ALL");

  const [attBatchId, setAttBatchId] = useState<string>("");
  const [attDate, setAttDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [draftStatuses, setDraftStatuses] = useState<Record<number, AttendanceStatus>>({});

  const timetableQ = useQuery({ queryKey: ["timetable"], queryFn: () => academicApi.listTimetable() });
  const batchesQ = useQuery({ queryKey: ["batches"], queryFn: academicApi.listBatches });
  const subjectsQ = useQuery({ queryKey: ["subjects"], queryFn: academicApi.listSubjects });
  const doubtsQ = useQuery({ queryKey: ["learning-doubts"], queryFn: learningApi.listDoubts });
  const examsQ = useQuery({ queryKey: ["learning-exams"], queryFn: learningApi.listExams });

  const batches = batchesQ.data ?? [];
  useEffect(() => {
    if (!attBatchId && batches.length > 0) {
      setAttBatchId(String(batches[0].id));
    }
  }, [attBatchId, batches]);

  const selectedBatchNum = attBatchId ? Number(attBatchId) : undefined;
  const attSheetQ = useQuery({
    queryKey: ["attendance-sheet", selectedBatchNum, attDate],
    queryFn: () => attendanceApi.getAttendance({ batchId: selectedBatchNum, date: attDate }),
    enabled: Boolean(selectedBatchNum),
  });

  const attSummaryQ = useQuery({
    queryKey: ["attendance-summary", selectedBatchNum],
    queryFn: () => attendanceApi.getSummary(selectedBatchNum),
  });

  const sheetItems = attSheetQ.data?.sheet ?? [];

  useEffect(() => {
    const nextMap: Record<number, AttendanceStatus> = {};
    for (const row of sheetItems) {
      nextMap[row.student_id] = row.status;
    }
    setDraftStatuses(nextMap);
  }, [sheetItems]);

  const saveAttendanceM = useMutation({
    mutationFn: () => {
      if (!selectedBatchNum) throw new Error("Select a batch first");
      const records = sheetItems.map((row) => ({
        student_id: row.student_id,
        status: draftStatuses[row.student_id] || row.status || "present",
      }));
      return attendanceApi.markAttendance({
        batch_id: selectedBatchNum,
        date: attDate,
        records,
      });
    },
    onSuccess: () => {
      toast.success("Attendance saved");
      qc.invalidateQueries({ queryKey: ["attendance-sheet"] });
      qc.invalidateQueries({ queryKey: ["attendance-summary"] });
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to save attendance"),
  });

  const allSlots = timetableQ.data ?? [];
  const subjects = subjectsQ.data ?? [];

  const mySlots = useMemo(() => {
    if (!user?.id) return allSlots;
    const mine = allSlots.filter((s) => Number(s.teacher_id) === Number(user.id));
    return mine.length > 0 || onlyMine ? mine : allSlots;
  }, [allSlots, user?.id, onlyMine]);

  const baseSlots = onlyMine && user?.id ? mySlots : allSlots;

  const visibleSlots = useMemo(() => {
    if (batchFilter === "ALL") return baseSlots;
    return baseSlots.filter((s) => String(s.batch_id) === batchFilter);
  }, [baseSlots, batchFilter]);

  
  const [replyMap, setReplyMap] = useState<Record<number, string>>({});
  const [examName, setExamName] = useState("");
  const [examBatchId, setExamBatchId] = useState("");
  const [examSubjectId, setExamSubjectId] = useState("");
  const [examMaxMarks, setExamMaxMarks] = useState("100");
  const [examDate, setExamDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [scoreDrafts, setScoreDrafts] = useState<Record<number, string>>({});

  const activeExamNum = selectedExamId ? Number(selectedExamId) : undefined;
  const marksSheetQ = useQuery({
    queryKey: ["exam-marks-sheet", activeExamNum],
    queryFn: () => learningApi.getExamMarksSheet(activeExamNum!),
    enabled: Boolean(activeExamNum),
  });

  useEffect(() => {
    const rows: ExamMarkSheetRow[] = marksSheetQ.data?.sheet ?? [];
    const map: Record<number, string> = {};
    for (const r of rows) {
      map[r.student_id] = String(r.score);
    }
    setScoreDrafts(map);
  }, [marksSheetQ.data]);

  const replyDoubtM = useMutation({
    mutationFn: ({ id, message, resolve }: { id: number; message: string; resolve?: boolean }) =>
      learningApi.addDoubtMessage(id, { message, resolve }),
    onSuccess: () => {
      toast.success("Doubt reply saved");
      qc.invalidateQueries({ queryKey: ["learning-doubts"] });
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to post reply"),
  });

  const createExamM = useMutation({
    mutationFn: () =>
      learningApi.createExam({
        name: examName.trim(),
        batch_id: Number(examBatchId || batches[0]?.id || 1),
        subject_id: Number(examSubjectId || subjects[0]?.id || 1),
        max_marks: Number(examMaxMarks || 100),
        date: examDate,
      }),
    onSuccess: () => {
      toast.success("Exam created");
      setExamName("");
      qc.invalidateQueries({ queryKey: ["learning-exams"] });
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to create exam"),
  });

  const saveMarksM = useMutation({
    mutationFn: () => {
      if (!activeExamNum) throw new Error("Select an exam");
      const rows: ExamMarkSheetRow[] = marksSheetQ.data?.sheet ?? [];
      const records = rows.map((r) => ({
        student_id: r.student_id,
        score: Number(scoreDrafts[r.student_id] ?? r.score ?? 0),
      }));
      return learningApi.saveExamMarks(activeExamNum, records);
    },
    onSuccess: () => {
      toast.success("Marks saved");
      qc.invalidateQueries({ queryKey: ["learning-exams"] });
      qc.invalidateQueries({ queryKey: ["exam-marks-sheet"] });
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to save marks"),
  });

  const uniqueBatchCount = useMemo(() => new Set(baseSlots.map((s) => s.batch_id)).size, [baseSlots]);
  const uniqueSubjectCount = useMemo(() => new Set(baseSlots.map((s) => s.subject_id)).size, [baseSlots]);

  const setAllStatus = (status: AttendanceStatus) => {
    const updated: Record<number, AttendanceStatus> = {};
    for (const row of sheetItems) {
      updated[row.student_id] = status;
    }
    setDraftStatuses(updated);
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-900">
      <div className="mx-auto flex max-w-[1440px] flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b border-slate-800 bg-[#0f172a] text-slate-200 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 lg:block">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-bold text-white">
                T
              </div>
              <div>
                <p className="text-sm font-bold tracking-wide text-white">CLASO ACADEMY</p>
                <p className="text-[11px] text-slate-400">Faculty Portal</p>
              </div>
            </div>
            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/30 lg:mt-3 lg:inline-block">
              Teacher Active
            </span>
          </div>

          <div className="space-y-4 p-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 text-xs">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Faculty Summary
              </p>
              <div className="mt-2.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Teacher ID</span>
                  <span className="font-mono font-semibold text-white">#{user?.id ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Weekly Classes</span>
                  <span className="font-semibold tabular-nums text-white">{baseSlots.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Attendance Rate</span>
                  <span className="font-semibold tabular-nums text-emerald-400">
                    {attSummaryQ.data?.overall.percentage ?? 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-6 py-4 backdrop-blur">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                Faculty Schedule & Attendance
              </h1>
              <p className="text-xs text-slate-500">
                Signed in as <span className="font-semibold text-slate-700">{user?.name || "Teacher"}</span>
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
                <span className="text-xs font-medium text-slate-500">Scheduled Classes</span>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{baseSlots.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Batches Covered</span>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{uniqueBatchCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Subjects Taught</span>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{uniqueSubjectCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Attendance Rate</span>
                <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-600">
                  {attSummaryQ.data?.overall.percentage ?? 0}%
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Daily Attendance Marking</h2>
                  <p className="text-xs text-slate-500">
                    Select batch and date, mark present/absent/late, and save to database
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                    value={attBatchId}
                    onChange={(e) => setAttBatchId(e.target.value)}
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setAllStatus("present")}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700"
                  >
                    All Present
                  </button>
                  <Button
                    type="button"
                    disabled={saveAttendanceM.isPending || sheetItems.length === 0}
                    onClick={() => saveAttendanceM.mutate()}
                  >
                    {saveAttendanceM.isPending ? "Saving..." : "Save Attendance"}
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200/70">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5">Admission No.</th>
                      <th className="px-4 py-2.5">Student</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Mark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sheetItems.map((row) => {
                      const current = draftStatuses[row.student_id] || row.status;
                      return (
                        <tr key={row.student_id} className="hover:bg-slate-50/90">
                          <td className="px-4 py-2.5 font-mono font-semibold text-indigo-700">
                            {row.admission_no}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-slate-900">
                            {row.student_name}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                current === "present"
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                  : current === "late"
                                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                  : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                              }`}
                            >
                              {current}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="inline-flex gap-1">
                              {(["present", "late", "absent"] as AttendanceStatus[]).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    setDraftStatuses((prev) => ({ ...prev, [row.student_id]: st }))
                                  }
                                  className={`rounded px-2 py-1 text-[11px] font-semibold capitalize transition ${
                                    current === st
                                      ? "bg-slate-900 text-white"
                                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {sheetItems.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                          No students assigned to this batch yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            
            <section className="grid gap-6 xl:grid-cols-12">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs xl:col-span-6">
                <h2 className="mb-1 text-base font-bold text-slate-900">Student Doubts Queue</h2>
                <p className="mb-4 text-xs text-slate-500">Answer student doubts and mark them resolved</p>
                <div className="max-h-[460px] space-y-3 overflow-y-auto">
                  {(doubtsQ.data ?? []).map((d) => (
                    <div key={d.id} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900">{d.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {d.student_name} · {d.subject_name} · {d.batch_name}
                          </p>
                        </div>
                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                          {d.status}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 border-l-2 border-emerald-300 pl-2.5">
                        {d.messages.map((m) => (
                          <p key={m.id} className="text-slate-700">
                            <span className="font-semibold text-slate-900">{m.sender_name}: </span>
                            {m.message}
                          </p>
                        ))}
                      </div>
                      <div className="mt-2.5 flex gap-2">
                        <input
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                          placeholder="Write explanation / answer..."
                          value={replyMap[d.id] || ""}
                          onChange={(e) => setReplyMap((p) => ({ ...p, [d.id]: e.target.value }))}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const txt = (replyMap[d.id] || "").trim();
                            if (txt) {
                              replyDoubtM.mutate({ id: d.id, message: txt, resolve: false });
                              setReplyMap((p) => ({ ...p, [d.id]: "" }));
                            }
                          }}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Answer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs xl:col-span-6">
                <h2 className="mb-1 text-base font-bold text-slate-900">Exams & Marks Entry</h2>
                <p className="mb-4 text-xs text-slate-500">Create exams and enter student scores</p>

                <form
                  className="mb-4 grid gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (examName.trim() && Number(examMaxMarks) > 0) createExamM.mutate();
                  }}
                >
                  <Input
                    placeholder="Exam title (e.g. Physics Unit Test 1)"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max marks"
                    value={examMaxMarks}
                    onChange={(e) => setExamMaxMarks(e.target.value)}
                  />
                  <select
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700"
                    value={examBatchId}
                    onChange={(e) => setExamBatchId(e.target.value)}
                  >
                    <option value="">Default Batch</option>
                    {batches.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700"
                      value={examSubjectId}
                      onChange={(e) => setExamSubjectId(e.target.value)}
                    >
                      <option value="">Subject</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={createExamM.isPending}>
                      {createExamM.isPending ? "Creating..." : "Create Exam"}
                    </Button>
                  </div>
                </form>

                <div className="mb-3 flex items-center justify-between gap-2">
                  <select
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                  >
                    <option value="">Select Exam to Enter Marks</option>
                    {(examsQ.data ?? []).map((ex) => (
                      <option key={ex.id} value={String(ex.id)}>
                        {ex.name} ({ex.max_marks}m · {ex.date})
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    disabled={!activeExamNum || saveMarksM.isPending}
                    onClick={() => saveMarksM.mutate()}
                  >
                    {saveMarksM.isPending ? "Saving..." : "Save Marks"}
                  </Button>
                </div>

                {activeExamNum && (
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200/70">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Student</th>
                          <th className="px-3 py-2 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(marksSheetQ.data?.sheet ?? []).map((row) => (
                          <tr key={row.student_id}>
                            <td className="px-3 py-2 font-medium text-slate-800">
                              {row.admission_no} — {row.student_name}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                className="w-20 rounded border border-slate-300 px-2 py-1 text-right text-xs font-semibold"
                                value={scoreDrafts[row.student_id] ?? ""}
                                onChange={(e) =>
                                  setScoreDrafts((p) => ({ ...p, [row.student_id]: e.target.value }))
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Weekly Timetable</h2>
                  <p className="text-xs text-slate-500">
                    {onlyMine ? "Showing classes assigned to your account" : "Showing all institute timetable slots"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOnlyMine((prev) => !prev)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      onlyMine
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    {onlyMine ? "My Classes Only" : "All Institute Classes"}
                  </button>

                  <select
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                  >
                    <option value="ALL">All Batches ({baseSlots.length})</option>
                    {batches.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                {WEEKDAYS.map((day) => {
                  const daySlots = visibleSlots.filter((s) => s.weekday === day);
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
                            className="rounded-lg border border-emerald-100 bg-white p-2.5 text-xs shadow-2xs"
                          >
                            <span className="font-semibold tabular-nums text-emerald-700">
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

              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Available Subjects ({subjects.length})
                </p>
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
