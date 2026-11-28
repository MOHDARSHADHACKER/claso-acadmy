import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";
import { Button, Input } from "@/components/ui";
import { academicApi, attendanceApi, feesApi, learningApi, peopleApi, type PaymentMode, type TimetableSlot } from "../api";

const WEEKDAYS: TimetableSlot["weekday"][] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

type NavSection = "overview" | "people" | "attendance" | "fees" | "learning" | "academics" | "curriculum" | "timetable";

export const AdminDashboardPage: React.FC = () => {
  const qc = useQueryClient();
  const { user, clearUser } = useAuthStore();

  const [section, setSection] = useState<NavSection>("overview");
  const [courseSearch, setCourseSearch] = useState("");
  const [peopleSearch, setPeopleSearch] = useState("");
  const [timetableBatchFilter, setTimetableBatchFilter] = useState<string>("ALL");

  const [courseName, setCourseName] = useState("");
  const [courseDesc, setCourseDesc] = useState("");

  const [batchCourseId, setBatchCourseId] = useState<string>("");
  const [batchName, setBatchName] = useState("");
  const [batchTimings, setBatchTimings] = useState("");

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");

  const [assignBatchId, setAssignBatchId] = useState<string>("");
  const [assignSubjectId, setAssignSubjectId] = useState<string>("");
  const [assignTeacherId, setAssignTeacherId] = useState<string>("");

  const [slotBatchId, setSlotBatchId] = useState<string>("");
  const [slotSubjectId, setSlotSubjectId] = useState<string>("");
  const [slotTeacherId, setSlotTeacherId] = useState<string>("");
  const [slotWeekday, setSlotWeekday] = useState<TimetableSlot["weekday"]>("MON");
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("10:30");

  // Student admission state
  const [admNo, setAdmNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [studentBatchId, setStudentBatchId] = useState<string>("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [studentPassword, setStudentPassword] = useState("");

  // Teacher create state
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");

  const statsQ = useQuery({ queryKey: ["admin-dashboard"], queryFn: academicApi.getDashboard });
  const coursesQ = useQuery({ queryKey: ["courses"], queryFn: academicApi.listCourses });
  const batchesQ = useQuery({ queryKey: ["batches"], queryFn: academicApi.listBatches });
  const subjectsQ = useQuery({ queryKey: ["subjects"], queryFn: academicApi.listSubjects });
  const timetableQ = useQuery({ queryKey: ["timetable"], queryFn: () => academicApi.listTimetable() });
  const studentsQ = useQuery({ queryKey: ["people-students"], queryFn: peopleApi.listStudents });
  const teachersQ = useQuery({ queryKey: ["people-teachers"], queryFn: peopleApi.listTeachers });
  const feePlansQ = useQuery({ queryKey: ["fee-plans"], queryFn: feesApi.listPlans });
  const invoicesQ = useQuery({ queryKey: ["fee-invoices"], queryFn: () => feesApi.listInvoices() });
  const doubtsQ = useQuery({ queryKey: ["learning-doubts"], queryFn: learningApi.listDoubts });
  const examsQ = useQuery({ queryKey: ["learning-exams"], queryFn: learningApi.listExams });
  const attSummaryQ = useQuery({ queryKey: ["attendance-summary", "all"], queryFn: () => attendanceApi.getSummary() });

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    qc.invalidateQueries({ queryKey: ["courses"] });
    qc.invalidateQueries({ queryKey: ["batches"] });
    qc.invalidateQueries({ queryKey: ["subjects"] });
    qc.invalidateQueries({ queryKey: ["timetable"] });
    qc.invalidateQueries({ queryKey: ["people-students"] });
    qc.invalidateQueries({ queryKey: ["people-teachers"] });
  };

  const createCourseM = useMutation({
    mutationFn: () =>
      academicApi.createCourse({
        name: courseName.trim(),
        description: courseDesc.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Course created");
      setCourseName("");
      setCourseDesc("");
      refreshAll();
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to create course"),
  });

  const deleteCourseM = useMutation({
    mutationFn: (id: number) => academicApi.deleteCourse(id),
    onSuccess: () => {
      toast.success("Course deleted");
      refreshAll();
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to delete course"),
  });

  const createBatchM = useMutation({
    mutationFn: () =>
      academicApi.createBatch({
        course_id: Number(batchCourseId),
        name: batchName.trim(),
        timings: batchTimings.trim(),
      }),
    onSuccess: () => {
      toast.success("Batch created");
      setBatchName("");
      setBatchTimings("");
      refreshAll();
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to create batch"),
  });

  const deleteBatchM = useMutation({
    mutationFn: (id: number) => academicApi.deleteBatch(id),
    onSuccess: () => {
      toast.success("Batch deleted");
      refreshAll();
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to delete batch"),
  });

  const createSubjectM = useMutation({
    mutationFn: () =>
      academicApi.createSubject({
        name: subjectName.trim(),
        code: subjectCode.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Subject added");
      setSubjectName("");
      setSubjectCode("");
      refreshAll();
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to add subject"),
  });

  const assignSubjectM = useMutation({
    mutationFn: () =>
      academicApi.assignBatchSubject({
        batch_id: Number(assignBatchId),
        subject_id: Number(assignSubjectId),
        teacher_id: assignTeacherId ? Number(assignTeacherId) : null,
      }),
    onSuccess: () => {
      toast.success("Subject assigned to batch");
      setAssignTeacherId("");
      refreshAll();
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to assign subject"),
  });

  const createSlotM = useMutation({
    mutationFn: () =>
      academicApi.createTimetableSlot({
        batch_id: Number(slotBatchId),
        subject_id: Number(slotSubjectId),
        teacher_id: Number(slotTeacherId),
        weekday: slotWeekday,
        start_time: slotStart,
        end_time: slotEnd,
      }),
    onSuccess: () => {
      toast.success("Timetable slot added");
      refreshAll();
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to add slot"),
  });

  const deleteSlotM = useMutation({
    mutationFn: (id: number) => academicApi.deleteTimetableSlot(id),
    onSuccess: () => {
      toast.success("Slot removed");
      refreshAll();
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to delete slot"),
  });

  const createStudentM = useMutation({
    mutationFn: () =>
      peopleApi.createStudent({
        admission_no: admNo.trim(),
        name: studentName.trim(),
        phone: studentPhone.trim() || undefined,
        batch_id: studentBatchId ? Number(studentBatchId) : null,
        guardian_name: guardianName.trim() || undefined,
        guardian_phone: guardianPhone.trim() || undefined,
        password: studentPassword.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Student admitted");
      setAdmNo("");
      setStudentName("");
      setStudentPhone("");
      setGuardianName("");
      setGuardianPhone("");
      setStudentPassword("");
      refreshAll();
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to admit student"),
  });

  const updateStudentM = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { batch_id?: number | null; status?: "active" | "inactive" } }) =>
      peopleApi.updateStudent(id, payload),
    onSuccess: () => {
      toast.success("Student updated");
      refreshAll();
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to update student"),
  });

  const createTeacherM = useMutation({
    mutationFn: () =>
      peopleApi.createTeacher({
        name: teacherName.trim(),
        email: teacherEmail.trim(),
        phone: teacherPhone.trim() || undefined,
        password: teacherPassword.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Teacher account created");
      setTeacherName("");
      setTeacherEmail("");
      setTeacherPhone("");
      setTeacherPassword("");
      refreshAll();
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to create teacher"),
  });

  const toggleTeacherStatusM = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      peopleApi.toggleTeacherStatus(id, is_active),
    onSuccess: () => {
      toast.success("Teacher status updated");
      refreshAll();
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to update teacher"),
  });

  const courses = coursesQ.data ?? [];
  const batches = batchesQ.data ?? [];
  const subjects = subjectsQ.data ?? [];
  const slots = timetableQ.data ?? [];
  const students = studentsQ.data ?? [];
  const teachers = teachersQ.data ?? [];
  const feePlans = feePlansQ.data ?? [];
  const invoices = invoicesQ.data ?? [];
  const doubts = doubtsQ.data ?? [];
  const exams = examsQ.data ?? [];
  
  const [planName, setPlanName] = useState("");
  const [planAmount, setPlanAmount] = useState("");
  const [planInstallments, setPlanInstallments] = useState("1");

  const [invStudentId, setInvStudentId] = useState("");
  const [invTitle, setInvTitle] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const [invDueDate, setInvDueDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [payInvoiceId, setPayInvoiceId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState<PaymentMode>("upi");
  const [payRef, setPayRef] = useState("");

  const createPlanM = useMutation({
    mutationFn: () =>
      feesApi.createPlan({
        name: planName.trim(),
        total_amount: Number(planAmount),
        installments: Number(planInstallments || 1),
      }),
    onSuccess: () => {
      toast.success("Fee plan created");
      setPlanName("");
      setPlanAmount("");
      setPlanInstallments("1");
      qc.invalidateQueries({ queryKey: ["fee-plans"] });
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to create plan"),
  });

  const createInvoiceM = useMutation({
    mutationFn: () =>
      feesApi.createInvoice({
        student_id: Number(invStudentId),
        title: invTitle.trim(),
        amount: Number(invAmount),
        due_date: invDueDate,
      }),
    onSuccess: () => {
      toast.success("Invoice created");
      setInvTitle("");
      setInvAmount("");
      qc.invalidateQueries({ queryKey: ["fee-invoices"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to create invoice"),
  });

  const recordPaymentM = useMutation({
    mutationFn: () => {
      if (!payInvoiceId) throw new Error("Select an invoice");
      return feesApi.recordPayment(payInvoiceId, {
        amount: Number(payAmount),
        mode: payMode,
        reference: payRef.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      setPayInvoiceId(null);
      setPayAmount("");
      setPayRef("");
      qc.invalidateQueries({ queryKey: ["fee-invoices"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (e: { message?: string }) => toast.error(e.message || "Failed to record payment"),
  });

  const stats = statsQ.data;

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
    );
  }, [courses, courseSearch]);

  const filteredSlots = useMemo(() => {
    if (timetableBatchFilter === "ALL") return slots;
    return slots.filter((s) => String(s.batch_id) === timetableBatchFilter);
  }, [slots, timetableBatchFilter]);

  const filteredStudents = useMemo(() => {
    const q = peopleSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.admission_no.toLowerCase().includes(q) ||
        (s.batch_name && s.batch_name.toLowerCase().includes(q)) ||
        (s.guardian_name && s.guardian_name.toLowerCase().includes(q))
    );
  }, [students, peopleSearch]);

  const filteredTeachers = useMemo(() => {
    const q = peopleSearch.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
    );
  }, [teachers, peopleSearch]);

  const kpis = [
    {
      label: "Active Students",
      value: stats ? stats.activeStudents.toLocaleString() : "—",
      badge: "Students",
      badgeClass: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    },
    {
      label: "Active Teachers",
      value: stats ? stats.activeTeachers.toLocaleString() : "—",
      badge: "Faculty",
      badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    {
      label: "Active Batches",
      value: stats ? stats.activeBatches.toLocaleString() : "—",
      badge: "Cohorts",
      badgeClass: "bg-sky-50 text-sky-700 ring-sky-200",
    },
    {
      label: "Open Doubts",
      value: stats ? stats.openDoubts.toLocaleString() : "—",
      badge: "Support",
      badgeClass: "bg-amber-50 text-amber-700 ring-amber-200",
    },
    {
      label: "Pending Fees",
      value: stats ? "Rs. " + stats.pendingFeesAmount.toLocaleString() : "—",
      badge: "Dues",
      badgeClass: "bg-rose-50 text-rose-700 ring-rose-200",
    },
  ];

  const navItems: { id: NavSection; label: string; meta: number }[] = [
    { id: "overview", label: "Overview", meta: courses.length + batches.length },
    { id: "people", label: "Students & Teachers", meta: students.length + teachers.length },
    { id: "attendance", label: "Attendance", meta: slots.length },
    { id: "fees", label: "Fees & Invoices", meta: invoices.length },
    { id: "learning", label: "Doubts & Exams", meta: doubts.length + exams.length },
    { id: "academics", label: "Courses & Batches", meta: batches.length },
    { id: "curriculum", label: "Subjects & Mapping", meta: subjects.length },
    { id: "timetable", label: "Weekly Timetable", meta: slots.length },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-900">
      <div className="mx-auto flex max-w-[1440px] flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b border-slate-200/90 bg-[#0f172a] text-slate-200 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r lg:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 lg:block">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-sm font-bold text-white shadow-sm">
                C
              </div>
              <div>
                <p className="text-sm font-bold tracking-wide text-white">CLASO ACADEMY</p>
                <p className="text-[11px] text-slate-400">Admin ERP Suite</p>
              </div>
            </div>
            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/30 lg:mt-3 lg:inline-block">
              DB Connected
            </span>
          </div>

          <div className="p-3 lg:p-4">
            <p className="mb-2 hidden px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:block">
              Modules
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {navItems.map((item) => {
                const isActive = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={`flex shrink-0 items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs tabular-nums ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {item.meta}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 hidden rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 lg:block">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Directory Snapshot
              </p>
              <div className="mt-2.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Students</span>
                  <span className="font-semibold tabular-nums text-white">{students.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Teachers</span>
                  <span className="font-semibold tabular-nums text-white">{teachers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Batches</span>
                  <span className="font-semibold tabular-nums text-white">{batches.length}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-6 py-4 backdrop-blur">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                {navItems.find((n) => n.id === section)?.label || "Admin Overview"}
              </h1>
              <p className="text-xs text-slate-500">
                Signed in as <span className="font-semibold text-slate-700">{user?.name || "Principal Admin"}</span> · Academic Year 2026
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={async () => {
                  await apiClient.post("/auth/logout");
                  clearUser();
                }}
              >
                Sign Out
              </Button>
            </div>
          </header>

          <main className="space-y-6 p-6">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {kpis.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">{item.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${item.badgeClass}`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  {statsQ.isLoading ? (
                    <div className="mt-3 h-7 w-24 animate-pulse rounded bg-slate-200" />
                  ) : (
                    <p className="mt-2.5 text-2xl font-bold tracking-tight tabular-nums text-slate-900">
                      {item.value}
                    </p>
                  )}
                </div>
              ))}
            </section>

            {section === "people" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Students & Teachers Directory</h2>
                    <p className="text-xs text-slate-500">
                      Admit students, assign batches, manage faculty accounts, and toggle active status (default password: Claso@123)
                    </p>
                  </div>
                  <Input
                    className="w-60 text-xs"
                    placeholder="Search admission no, name, email..."
                    value={peopleSearch}
                    onChange={(e) => setPeopleSearch(e.target.value)}
                  />
                </div>

                <div className="grid gap-6 xl:grid-cols-12">
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs xl:col-span-7">
                    <h3 className="mb-3 text-sm font-bold text-slate-900">New Student Admission</h3>
                    <form
                      className="mb-4 grid gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:grid-cols-2 lg:grid-cols-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (admNo.trim() && studentName.trim()) createStudentM.mutate();
                      }}
                    >
                      <Input
                        placeholder="Admission No. (e.g. CLS-2026-099)"
                        value={admNo}
                        onChange={(e) => setAdmNo(e.target.value)}
                      />
                      <Input
                        placeholder="Student full name"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                      />
                      <select
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                        value={studentBatchId}
                        onChange={(e) => setStudentBatchId(e.target.value)}
                      >
                        <option value="">Unassigned Batch</option>
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="Guardian name"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                      />

                      <Input
  placeholder="Guardian phone"
  value={guardianPhone}
  onChange={(e) => setGuardianPhone(e.target.value)}
  autoComplete="tel"
  required
/>
<Input
  type="password"
  placeholder="Password (default Claso@123)"
  value={studentPassword}
  onChange={(e) => setStudentPassword(e.target.value)}
  autoComplete="new-password"
/>
<div className="sm:col-span-2 lg:col-span-3">
  <Button type="submit" disabled={createStudentM.isPending}>
    {createStudentM.isPending ? "Admitting..." : "Admit Student"}
  </Button>
</div>
                      {/* <Input
                        placeholder="Guardian phone"
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                      />
                      <Input
                        type="password"
                        placeholder="Password (default Claso@123)"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                      />
                      <div className="sm:col-span-2 lg:col-span-3">
                        <Button type="submit" disabled={createStudentM.isPending}>
                          {createStudentM.isPending ? "Admitting..." : "Admit Student"}
                        </Button>
                      </div> */}
                    </form>

                    <div className="max-h-[420px] overflow-auto rounded-xl border border-slate-200/70">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-3 py-2.5">Admission</th>
                            <th className="px-3 py-2.5">Student</th>
                            <th className="px-3 py-2.5">Batch</th>
                            <th className="px-3 py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredStudents.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50/90">
                              <td className="px-3 py-2.5 font-mono font-semibold text-indigo-700">
                                {s.admission_no}
                              </td>
                              <td className="px-3 py-2.5">
                                <p className="font-semibold text-slate-900">{s.name}</p>
                                {s.guardian_name && (
                                  <p className="text-[11px] text-slate-500">
                                    G: {s.guardian_name} {s.guardian_phone ? "· " + s.guardian_phone : ""}
                                  </p>
                                )}
                              </td>
                              <td className="px-3 py-2.5">
                                <select
                                  className="rounded border border-slate-200 bg-white py-1 text-xs text-slate-700"
                                  value={s.batch_id ? String(s.batch_id) : ""}
                                  onChange={(e) =>
                                    updateStudentM.mutate({
                                      id: s.id,
                                      payload: { batch_id: e.target.value ? Number(e.target.value) : null },
                                    })
                                  }
                                >
                                  <option value="">Unassigned</option>
                                  {batches.map((b) => (
                                    <option key={b.id} value={String(b.id)}>
                                      {b.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateStudentM.mutate({
                                      id: s.id,
                                      payload: { status: s.status === "active" ? "inactive" : "active" },
                                    })
                                  }
                                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                    s.status === "active"
                                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                      : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                                  }`}
                                >
                                  {s.status}
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredStudents.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                                No students found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs xl:col-span-5">
                    <h3 className="mb-3 text-sm font-bold text-slate-900">Add Faculty Member</h3>
                    <form
                      className="mb-4 grid gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:grid-cols-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (teacherName.trim() && teacherEmail.trim()) createTeacherM.mutate();
                      }}
                    >
                      <Input
                        placeholder="Teacher name"
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                      />
                      {/* <Input
                        type="email"
                        placeholder="Email (e.g. faculty@claso.local)"
                        value={teacherEmail}
                        onChange={(e) => setTeacherEmail(e.target.value)}
                      />
                      <Input
                        placeholder="Phone (optional)"
                        value={teacherPhone}
                        onChange={(e) => setTeacherPhone(e.target.value)}
                      />
                      <Input
                        type="password"
                        placeholder="Password (default Claso@123)"
                        value={teacherPassword}
                        onChange={(e) => setTeacherPassword(e.target.value)}
                      /> */}

<Input
  type="email"
  placeholder="Email (e.g. faculty@claso.local)"
  value={teacherEmail}
  onChange={(e) => setTeacherEmail(e.target.value)}
  autoComplete="off"
  required
/>
<Input
  placeholder="Phone (optional)"
  value={teacherPhone}
  onChange={(e) => setTeacherPhone(e.target.value)}
  autoComplete="tel"
/>
<Input
  type="text"
  name="faculty_password_input"
  placeholder="Password (default Claso@123)"
  value={teacherPassword}
  onChange={(e) => setTeacherPassword(e.target.value)}
  autoComplete="new-password"
  data-lpignore="true"
  style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
/>

                      <div className="sm:col-span-2">
                        <Button type="submit" disabled={createTeacherM.isPending}>
                          {createTeacherM.isPending ? "Saving..." : "Add Teacher"}
                        </Button>
                      </div>
                    </form>

                    <div className="max-h-[420px] overflow-auto rounded-xl border border-slate-200/70">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="px-3 py-2.5">Faculty</th>
                            <th className="px-3 py-2.5">Slots</th>
                            <th className="px-3 py-2.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredTeachers.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/90">
                              <td className="px-3 py-2.5">
                                <p className="font-semibold text-slate-900">
                                  {t.name} <span className="font-mono text-[11px] text-slate-400">#{t.id}</span>
                                </p>
                                <p className="text-[11px] text-slate-500">{t.email}</p>
                              </td>
                              <td className="px-3 py-2.5 tabular-nums text-slate-600">
                                {t.slot_count} slots · {t.batch_count} batches
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleTeacherStatusM.mutate({ id: t.id, is_active: !t.is_active })
                                  }
                                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                    t.is_active
                                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                      : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                                  }`}
                                >
                                  {t.is_active ? "Active" : "Inactive"}
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredTeachers.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                                No teachers found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            
            {section === "attendance" && (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Batch Attendance Summary</h2>
                    <p className="text-xs text-slate-500">
                      Overall attendance: {attSummaryQ.data?.overall.percentage ?? 0}% ({attSummaryQ.data?.overall.present ?? 0} present, {attSummaryQ.data?.overall.absent ?? 0} absent, {attSummaryQ.data?.overall.late ?? 0} late)
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200/70">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5">Batch</th>
                        <th className="px-4 py-2.5">Present</th>
                        <th className="px-4 py-2.5">Absent</th>
                        <th className="px-4 py-2.5">Late</th>
                        <th className="px-4 py-2.5 text-right">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(attSummaryQ.data?.byBatch ?? []).map((b) => (
                        <tr key={b.batch_id} className="hover:bg-slate-50/90">
                          <td className="px-4 py-2.5 font-semibold text-slate-900">{b.batch_name}</td>
                          <td className="px-4 py-2.5 tabular-nums text-emerald-700">{b.present}</td>
                          <td className="px-4 py-2.5 tabular-nums text-rose-700">{b.absent}</td>
                          <td className="px-4 py-2.5 tabular-nums text-amber-700">{b.late}</td>
                          <td className="px-4 py-2.5 text-right font-bold tabular-nums text-indigo-700">{b.percentage}%</td>
                        </tr>
                      ))}
                      {(attSummaryQ.data?.byBatch ?? []).length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                            No attendance records marked yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            
            {section === "fees" && (
              <div className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-12">
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs xl:col-span-5">
                    <h2 className="mb-1 text-base font-bold text-slate-900">Fee Plans</h2>
                    <p className="mb-4 text-xs text-slate-500">Define tuition fee plans and installments</p>
                    <form
                      className="mb-4 space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (planName.trim() && Number(planAmount) > 0) createPlanM.mutate();
                      }}
                    >
                      <Input
                        placeholder="Plan name (e.g. NEET Crash Course)"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Total amount (Rs.)"
                          value={planAmount}
                          onChange={(e) => setPlanAmount(e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Installments"
                          value={planInstallments}
                          onChange={(e) => setPlanInstallments(e.target.value)}
                        />
                      </div>
                      <Button type="submit" disabled={createPlanM.isPending}>
                        {createPlanM.isPending ? "Saving..." : "Add Fee Plan"}
                      </Button>
                    </form>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/70 text-xs">
                      {feePlans.map((p) => (
                        <div key={p.id} className="flex items-center justify-between px-3.5 py-2.5">
                          <div>
                            <p className="font-semibold text-slate-900">{p.name}</p>
                            <p className="text-[11px] text-slate-500">{p.installments} installment(s)</p>
                          </div>
                          <span className="font-bold tabular-nums text-indigo-700">
                            Rs. {p.total_amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs xl:col-span-7">
                    <h2 className="mb-1 text-base font-bold text-slate-900">Create Student Invoice</h2>
                    <p className="mb-4 text-xs text-slate-500">Issue a fee invoice with due date</p>
                    <form
                      className="grid gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:grid-cols-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (invStudentId && invTitle.trim() && Number(invAmount) > 0 && invDueDate) {
                          createInvoiceM.mutate();
                        }
                      }}
                    >
                      <select
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                        value={invStudentId}
                        onChange={(e) => setInvStudentId(e.target.value)}
                      >
                        <option value="">Select Student</option>
                        {students.map((s) => (
                          <option key={s.id} value={String(s.id)}>
                            {s.admission_no} — {s.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="Title (e.g. Installment 2 - Tuition)"
                        value={invTitle}
                        onChange={(e) => setInvTitle(e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Invoice amount (Rs.)"
                        value={invAmount}
                        onChange={(e) => setInvAmount(e.target.value)}
                      />
                      <Input
                        type="date"
                        value={invDueDate}
                        onChange={(e) => setInvDueDate(e.target.value)}
                      />
                      <div className="sm:col-span-2">
                        <Button type="submit" disabled={createInvoiceM.isPending}>
                          {createInvoiceM.isPending ? "Creating..." : "Create Invoice"}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>

                {payInvoiceId && (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-indigo-950">
                        Record Payment for Invoice #{payInvoiceId}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setPayInvoiceId(null)}
                        className="text-xs font-semibold text-slate-600 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                    <form
                      className="grid gap-2.5 sm:grid-cols-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (Number(payAmount) > 0) recordPaymentM.mutate();
                      }}
                    >
                      <Input
                        type="number"
                        placeholder="Amount paid (Rs.)"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                      />
                      <select
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                        value={payMode}
                        onChange={(e) => setPayMode(e.target.value as PaymentMode)}
                      >
                        <option value="upi">UPI</option>
                        <option value="cash">Cash</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                      </select>
                      <Input
                        placeholder="Reference / UTR (optional)"
                        value={payRef}
                        onChange={(e) => setPayRef(e.target.value)}
                      />
                      <Button type="submit" disabled={recordPaymentM.isPending}>
                        {recordPaymentM.isPending ? "Saving..." : "Submit Payment"}
                      </Button>
                    </form>
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                  <h2 className="mb-3 text-base font-bold text-slate-900">Invoices Ledger ({invoices.length})</h2>
                  <div className="overflow-x-auto rounded-xl border border-slate-200/70">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5">Invoice</th>
                          <th className="px-4 py-2.5">Student</th>
                          <th className="px-4 py-2.5">Amount</th>
                          <th className="px-4 py-2.5">Balance</th>
                          <th className="px-4 py-2.5">Due Date</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/90">
                            <td className="px-4 py-2.5">
                              <p className="font-semibold text-slate-900">{inv.title}</p>
                              <p className="font-mono text-[11px] text-slate-400">#{inv.id}</p>
                            </td>
                            <td className="px-4 py-2.5">
                              <p className="font-semibold text-slate-800">{inv.student_name}</p>
                              <p className="font-mono text-[11px] text-slate-500">{inv.admission_no}</p>
                            </td>
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
                            <td className="px-4 py-2.5 text-right">
                              {inv.status !== "PAID" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPayInvoiceId(inv.id);
                                    setPayAmount(String(inv.balance_due));
                                  }}
                                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                >
                                  Record Payment
                                </button>
                              ) : (
                                <span className="text-[11px] font-medium text-emerald-600">Settled</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            
            {section === "learning" && (
              <div className="grid gap-6 xl:grid-cols-12">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs xl:col-span-6">
                  <h2 className="mb-3 text-base font-bold text-slate-900">Doubts Tracker ({doubts.length})</h2>
                  <div className="space-y-2.5">
                    {doubts.map((d) => (
                      <div key={d.id} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-slate-900">{d.title}</p>
                          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                            {d.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {d.student_name} · {d.subject_name} · {d.batch_name} · {d.messages.length} msg(s)
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs xl:col-span-6">
                  <h2 className="mb-3 text-base font-bold text-slate-900">Exams & Results ({exams.length})</h2>
                  <div className="space-y-2.5">
                    {exams.map((ex) => (
                      <div key={ex.id} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-slate-900">{ex.name}</p>
                          <span className="font-mono text-[11px] font-semibold text-indigo-700">
                            Max {ex.max_marks}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {ex.subject_name} · {ex.batch_name} · {ex.date} · Graded: {ex.graded_count}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(section === "overview" || section === "academics") && (
              <div className="grid gap-6 xl:grid-cols-12">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs xl:col-span-5">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Courses</h2>
                      <p className="text-xs text-slate-500">Create & manage exam programs</p>
                    </div>
                    <Input
                      className="w-36 text-xs"
                      placeholder="Filter..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                    />
                  </div>

                  <form
                    className="mb-4 space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (courseName.trim()) createCourseM.mutate();
                    }}
                  >
                    <Input
                      placeholder="Course name (e.g. JEE Foundation)"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Description (optional)"
                        value={courseDesc}
                        onChange={(e) => setCourseDesc(e.target.value)}
                      />
                      <Button type="submit" disabled={createCourseM.isPending}>
                        {createCourseM.isPending ? "Saving..." : "Add"}
                      </Button>
                    </div>
                  </form>

                  <div className="overflow-hidden rounded-xl border border-slate-200/70">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-3.5 py-2.5">Course</th>
                          <th className="px-3.5 py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCourses.map((c) => (
                          <tr key={c.id} className="transition hover:bg-slate-50/90">
                            <td className="px-3.5 py-2.5">
                              <p className="font-semibold text-slate-900">{c.name}</p>
                              {c.description && (
                                <p className="text-xs text-slate-500">{c.description}</p>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => deleteCourseM.mutate(c.id)}
                                className="rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredCourses.length === 0 && (
                          <tr>
                            <td colSpan={2} className="px-4 py-6 text-center text-xs text-slate-400">
                              No courses match your filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs xl:col-span-7">
                  <div className="mb-4">
                    <h2 className="text-base font-bold text-slate-900">Batches</h2>
                    <p className="text-xs text-slate-500">Assign batches, timings, and parent courses</p>
                  </div>

                  <form
                    className="mb-4 grid gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:grid-cols-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (batchCourseId && batchName.trim() && batchTimings.trim()) createBatchM.mutate();
                    }}
                  >
                    <select
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                      value={batchCourseId}
                      onChange={(e) => setBatchCourseId(e.target.value)}
                    >
                      <option value="">Select Course</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      placeholder="Batch name (e.g. Morning A)"
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                    />
                    <Input
                      placeholder="Timings (e.g. 08:00-10:00)"
                      value={batchTimings}
                      onChange={(e) => setBatchTimings(e.target.value)}
                    />
                    <Button type="submit" disabled={createBatchM.isPending}>
                      {createBatchM.isPending ? "Adding..." : "Add Batch"}
                    </Button>
                  </form>

                  <div className="overflow-x-auto rounded-xl border border-slate-200/70">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-3.5 py-2.5">Batch</th>
                          <th className="px-3.5 py-2.5">Course</th>
                          <th className="px-3.5 py-2.5">Timings</th>
                          <th className="px-3.5 py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {batches.map((b) => (
                          <tr key={b.id} className="transition hover:bg-slate-50/90">
                            <td className="px-3.5 py-2.5 font-semibold text-slate-900">{b.name}</td>
                            <td className="px-3.5 py-2.5">
                              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                {b.course_name || "Course #" + b.course_id}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-xs tabular-nums text-slate-600">
                              {b.timings}
                            </td>
                            <td className="px-3.5 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => deleteBatchM.mutate(b.id)}
                                className="rounded-lg border border-rose-200 bg-rose-50/70 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {batches.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-xs text-slate-400">
                              No batches created yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {(section === "overview" || section === "curriculum") && (
              <div className="grid gap-6 xl:grid-cols-12">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs xl:col-span-6">
                  <div className="mb-4">
                    <h2 className="text-base font-bold text-slate-900">Subjects Catalog</h2>
                    <p className="text-xs text-slate-500">Manage subjects and course codes</p>
                  </div>

                  <form
                    className="mb-4 flex flex-wrap gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (subjectName.trim()) createSubjectM.mutate();
                    }}
                  >
                    <Input
                      placeholder="Subject name (e.g. Physics)"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                    />
                    <Input
                      placeholder="Code (e.g. PHY101)"
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value)}
                    />
                    <Button type="submit" disabled={createSubjectM.isPending}>
                      {createSubjectM.isPending ? "Adding..." : "Add Subject"}
                    </Button>
                  </form>

                  <div className="flex flex-wrap gap-2">
                    {subjects.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2 text-xs"
                      >
                        <span className="font-semibold text-slate-800">{s.name}</span>
                        {s.code && (
                          <span className="rounded-md bg-white px-2 py-0.5 font-mono text-[11px] font-medium text-indigo-700 ring-1 ring-slate-200">
                            {s.code}
                          </span>
                        )}
                      </div>
                    ))}
                    {subjects.length === 0 && (
                      <p className="text-xs text-slate-400">No subjects added yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs xl:col-span-6">
                  <div className="mb-4">
                    <h2 className="text-base font-bold text-slate-900">Assign Subject to Batch</h2>
                    <p className="text-xs text-slate-500">Map subjects and faculty user IDs to active batches</p>
                  </div>

                  <form
                    className="grid gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:grid-cols-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (assignBatchId && assignSubjectId) assignSubjectM.mutate();
                    }}
                  >
                    <select
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                      value={assignBatchId}
                      onChange={(e) => setAssignBatchId(e.target.value)}
                    >
                      <option value="">Select Batch</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                      value={assignSubjectId}
                      onChange={(e) => setAssignSubjectId(e.target.value)}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      placeholder="Teacher ID (optional)"
                      value={assignTeacherId}
                      onChange={(e) => setAssignTeacherId(e.target.value)}
                    />
                    <Button type="submit" disabled={assignSubjectM.isPending}>
                      {assignSubjectM.isPending ? "Assigning..." : "Assign to Batch"}
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {(section === "overview" || section === "timetable") && (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Weekly Timetable</h2>
                    <p className="text-xs text-slate-500">Schedule and inspect weekly classes by day and batch</p>
                  </div>
                  <select
                    className="rounded-lg border border-slate-300 bg-white py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
                    value={timetableBatchFilter}
                    onChange={(e) => setTimetableBatchFilter(e.target.value)}
                  >
                    <option value="ALL">All Batches ({slots.length})</option>
                    {batches.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <form
                  className="mb-5 grid gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:grid-cols-2 lg:grid-cols-7"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (slotBatchId && slotSubjectId && slotTeacherId) createSlotM.mutate();
                  }}
                >
                  <select
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                    value={slotBatchId}
                    onChange={(e) => setSlotBatchId(e.target.value)}
                  >
                    <option value="">Batch</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                    value={slotSubjectId}
                    onChange={(e) => setSlotSubjectId(e.target.value)}
                  >
                    <option value="">Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    placeholder="Teacher User ID"
                    value={slotTeacherId}
                    onChange={(e) => setSlotTeacherId(e.target.value)}
                  />
                  <select
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                    value={slotWeekday}
                    onChange={(e) => setSlotWeekday(e.target.value as TimetableSlot["weekday"])}
                  >
                    {WEEKDAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <Input type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} />
                  <Input type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} />
                  <Button type="submit" disabled={createSlotM.isPending}>
                    {createSlotM.isPending ? "Adding..." : "Add Slot"}
                  </Button>
                </form>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                  {WEEKDAYS.map((day) => {
                    const daySlots = filteredSlots.filter((s) => s.weekday === day);
                    return (
                      <div
                        key={day}
                        className="flex min-h-36 flex-col rounded-xl border border-slate-200/80 bg-slate-50/60 p-3"
                      >
                        <div className="mb-2.5 flex items-center justify-between border-b border-slate-200/70 pb-1.5">
                          <span className="text-xs font-bold tracking-wide text-slate-800">{day}</span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
                            {daySlots.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {daySlots.map((t) => (
                            <div
                              key={t.id}
                              className="rounded-lg border border-indigo-100 bg-white p-2.5 text-xs shadow-2xs"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-semibold tabular-nums text-indigo-700">
                                  {t.start_time}–{t.end_time}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => deleteSlotM.mutate(t.id)}
                                  className="text-[11px] font-medium text-rose-600 hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                              <p className="mt-1 font-semibold text-slate-900">
                                {t.subject_name || "Subject #" + t.subject_id}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {t.batch_name || "Batch #" + t.batch_id} · T#{t.teacher_id}
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
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
