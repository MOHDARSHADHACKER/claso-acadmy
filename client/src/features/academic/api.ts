import { apiClient } from "@/lib/axios";

export interface AdminDashboardStats {
  activeStudents: number;
  activeTeachers: number;
  activeBatches: number;
  openDoubts: number;
  pendingFeesAmount: number;
}

export interface Course {
  id: number;
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface Batch {
  id: number;
  course_id: number;
  course_name?: string;
  name: string;
  timings: string;
  is_active?: boolean;
}

export interface Subject {
  id: number;
  name: string;
  code?: string | null;
}

export interface TimetableSlot {
  id: number;
  batch_id: number;
  batch_name?: string;
  subject_id: number;
  subject_name?: string;
  teacher_id: number;
  teacher_name?: string;
  weekday: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  start_time: string;
  end_time: string;
}

export const academicApi = {
  getDashboard: async () => (await apiClient.get<{ data: AdminDashboardStats }>("/admin/dashboard")).data.data,
  listCourses: async () => (await apiClient.get<{ data: Course[] }>("/courses")).data.data,
  createCourse: async (payload: { name: string; description?: string; is_active?: boolean }) => (await apiClient.post<{ data: Course }>("/courses", payload)).data.data,
  updateCourse: async (id: number, payload: Partial<Course>) => (await apiClient.patch<{ data: Course }>("/courses/" + id, payload)).data.data,
  deleteCourse: async (id: number) => apiClient.delete("/courses/" + id),

  listBatches: async () => (await apiClient.get<{ data: Batch[] }>("/batches")).data.data,
  createBatch: async (payload: { course_id: number; name: string; timings: string; is_active?: boolean }) => (await apiClient.post<{ data: Batch }>("/batches", payload)).data.data,
  updateBatch: async (id: number, payload: Partial<Batch>) => (await apiClient.patch<{ data: Batch }>("/batches/" + id, payload)).data.data,
  deleteBatch: async (id: number) => apiClient.delete("/batches/" + id),

  listSubjects: async () => (await apiClient.get<{ data: Subject[] }>("/subjects")).data.data,
  createSubject: async (payload: { name: string; code?: string }) => (await apiClient.post<{ data: Subject }>("/subjects", payload)).data.data,
  assignBatchSubject: async (payload: { batch_id: number; subject_id: number; teacher_id?: number | null }) => (await apiClient.post("/batch-subjects", payload)).data,

  listTimetable: async (batchId?: number) => (await apiClient.get<{ data: TimetableSlot[] }>("/timetable", { params: batchId ? { batchId } : undefined })).data.data,
  createTimetableSlot: async (payload: Omit<TimetableSlot, "id" | "batch_name" | "subject_name" | "teacher_name">) => (await apiClient.post<{ data: TimetableSlot }>("/timetable", payload)).data.data,
  deleteTimetableSlot: async (id: number) => apiClient.delete("/timetable/" + id),
};


export interface TeacherItem {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  is_active: boolean;
  slot_count: number;
  batch_count: number;
}

export interface StudentItem {
  id: number;
  user_id: number;
  admission_no: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  is_active: boolean;
  batch_id: number | null;
  batch_name?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  address?: string | null;
  status: "active" | "inactive";
}

export const peopleApi = {
  listTeachers: async () => (await apiClient.get<{ data: TeacherItem[] }>("/people/teachers")).data.data,
  createTeacher: async (payload: { name: string; email: string; phone?: string; password?: string }) =>
    (await apiClient.post<{ data: TeacherItem }>("/people/teachers", payload)).data.data,
  toggleTeacherStatus: async (id: number, is_active: boolean) =>
    (await apiClient.patch<{ data: TeacherItem }>("/people/teachers/" + id + "/status", { is_active })).data.data,

  listStudents: async () => (await apiClient.get<{ data: StudentItem[] }>("/people/students")).data.data,
  createStudent: async (payload: {
    admission_no: string;
    name: string;
    email?: string;
    phone?: string;
    password?: string;
    batch_id?: number | null;
    guardian_name?: string;
    guardian_phone?: string;
    address?: string;
  }) => (await apiClient.post<{ data: StudentItem }>("/people/students", payload)).data.data,
  updateStudent: async (id: number, payload: { batch_id?: number | null; status?: "active" | "inactive" }) =>
    (await apiClient.patch<{ data: StudentItem }>("/people/students/" + id, payload)).data.data,
};


export type AttendanceStatus = "present" | "absent" | "late";

export interface AttendanceSheetItem {
  student_id: number;
  user_id: number;
  admission_no: string;
  student_name: string;
  batch_id: number | null;
  batch_name: string | null;
  student_status: string;
  date: string;
  status: AttendanceStatus;
  recorded: boolean;
}

export interface BatchAttendanceSummary {
  batch_id: number;
  batch_name: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export interface AttendanceSummaryResponse {
  overall: {
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  byBatch: BatchAttendanceSummary[];
}

export const attendanceApi = {
  getAttendance: async (params?: { batchId?: number; date?: string }) =>
    (
      await apiClient.get<{
        data: { date: string; batchId: number | null; sheet: AttendanceSheetItem[] };
      }>("/attendance", { params })
    ).data.data,

  markAttendance: async (payload: {
    batch_id: number;
    date: string;
    records: { student_id: number; status: AttendanceStatus }[];
  }) => (await apiClient.post("/attendance", payload)).data,

  getSummary: async (batchId?: number) =>
    (
      await apiClient.get<{ data: AttendanceSummaryResponse }>("/attendance/summary", {
        params: batchId ? { batchId } : undefined,
      })
    ).data.data,
};


export type InvoiceStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
export type PaymentMode = "cash" | "upi" | "bank" | "cheque";

export interface FeePlanItem {
  id: number;
  name: string;
  total_amount: number;
  installments: number;
}

export interface InvoiceItem {
  id: number;
  student_id: number;
  student_name: string;
  admission_no: string;
  title: string;
  amount: number;
  paid_amount: number;
  balance_due: number;
  due_date: string;
  status: InvoiceStatus;
}

export const feesApi = {
  listPlans: async () => (await apiClient.get<{ data: FeePlanItem[] }>("/fees/plans")).data.data,
  createPlan: async (payload: { name: string; total_amount: number; installments?: number }) =>
    (await apiClient.post<{ data: FeePlanItem }>("/fees/plans", payload)).data.data,

  listInvoices: async (studentId?: number) =>
    (
      await apiClient.get<{ data: InvoiceItem[] }>("/fees/invoices", {
        params: studentId ? { studentId } : undefined,
      })
    ).data.data,

  createInvoice: async (payload: {
    student_id: number;
    title: string;
    amount: number;
    due_date: string;
  }) => (await apiClient.post<{ data: InvoiceItem }>("/fees/invoices", payload)).data.data,

  recordPayment: async (
    invoiceId: number,
    payload: { amount: number; mode: PaymentMode; reference?: string; paid_on?: string }
  ) => (await apiClient.post("/fees/invoices/" + invoiceId + "/payments", payload)).data,
};

export type DoubtStatus = "OPEN" | "ASSIGNED" | "ANSWERED" | "RESOLVED" | "AUTO_CLOSED";

export interface DoubtMessageItem {
  id: number;
  doubt_id: number;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

export interface DoubtItem {
  id: number;
  student_id: number;
  student_name: string;
  admission_no: string;
  batch_id: number;
  batch_name: string;
  subject_id: number;
  subject_name: string;
  assignee_id: number | null;
  assignee_name: string | null;
  title: string;
  status: DoubtStatus;
  reopen_count: number;
  messages: DoubtMessageItem[];
}

export interface ExamMarkEntry {
  id: number;
  exam_id: number;
  student_id: number;
  student_name: string;
  admission_no: string;
  score: number;
}

export interface ExamItem {
  id: number;
  name: string;
  batch_id: number;
  batch_name: string;
  subject_id: number;
  subject_name: string;
  max_marks: number;
  date: string;
  graded_count: number;
  avg_score: number | null;
  marks: ExamMarkEntry[];
}

export interface ExamMarkSheetRow {
  student_id: number;
  admission_no: string;
  student_name: string;
  batch_id: number | null;
  score: number;
  graded: boolean;
}

export const learningApi = {
  listDoubts: async () => (await apiClient.get<{ data: DoubtItem[] }>("/learning/doubts")).data.data,
  createDoubt: async (payload: {
    title: string;
    batch_id: number;
    subject_id: number;
    message: string;
    student_id?: number;
  }) => (await apiClient.post<{ data: { id: number } }>("/learning/doubts", payload)).data.data,

  addDoubtMessage: async (doubtId: number, payload: { message: string; resolve?: boolean }) =>
    (await apiClient.post("/learning/doubts/" + doubtId + "/messages", payload)).data,

  updateDoubtStatus: async (doubtId: number, status: DoubtStatus) =>
    (await apiClient.patch("/learning/doubts/" + doubtId + "/status", { status })).data,

  listExams: async () => (await apiClient.get<{ data: ExamItem[] }>("/learning/exams")).data.data,
  createExam: async (payload: {
    name: string;
    batch_id: number;
    subject_id: number;
    max_marks: number;
    date: string;
  }) => (await apiClient.post("/learning/exams", payload)).data,

  getExamMarksSheet: async (examId: number) =>
    (
      await apiClient.get<{
        data: {
          exam: { id: number; name: string; max_marks: number; date: string };
          sheet: ExamMarkSheetRow[];
        };
      }>("/learning/exams/" + examId + "/marks")
    ).data.data,

  saveExamMarks: async (examId: number, records: { student_id: number; score: number }[]) =>
    (await apiClient.post("/learning/exams/" + examId + "/marks", { records })).data,
};
