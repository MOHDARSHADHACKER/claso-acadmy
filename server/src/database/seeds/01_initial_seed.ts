import type { Knex } from "knex";
import bcrypt from "bcrypt";

export async function seed(knex: Knex): Promise<void> {
  const existingAdmin = await knex("users").where({ email: "admin@claso.local" }).first();
  if (existingAdmin) return;

  const adminPwHash = await bcrypt.hash("Admin@123", 12);
  const userPwHash = await bcrypt.hash("Claso@123", 12);

  const [adminRow] = await knex("users")
    .insert({
      role: "admin",
      name: "Principal Admin",
      email: "admin@claso.local",
      phone: "9800000000",
      password_hash: adminPwHash,
      is_active: true,
      must_change_pw: true,
    })
    .returning("id");

  const adminId = typeof adminRow === "object" ? adminRow.id : adminRow;

  await knex("settings").insert({
    centre_name: "Claso Academy",
    primary_color: "#4f46e5",
    academic_year: "2026-2027",
    doubt_sla_hours: 24,
    daily_doubt_limit: 5,
  });

  const [c10Row] = await knex("courses")
    .insert({ name: "Foundation Class 10", description: "Board & Olympiad prep" })
    .returning("id");
  const [cJeeRow] = await knex("courses")
    .insert({ name: "JEE Target", description: "Physics, Chemistry, Maths" })
    .returning("id");
  const [cNeetRow] = await knex("courses")
    .insert({ name: "NEET Target", description: "Physics, Chemistry, Biology" })
    .returning("id");

  const course10 = typeof c10Row === "object" ? c10Row.id : c10Row;
  const courseJee = typeof cJeeRow === "object" ? cJeeRow.id : cJeeRow;
  const courseNeet = typeof cNeetRow === "object" ? cNeetRow.id : cNeetRow;

  // Baaki neeche ka seed code (jahan adminId, course10, courseJee, courseNeet use ho rahe hain)
  const batchRows = [
    { course_id: course10, name: "Batch A1 - Class 10", timings: "04:00 PM - 06:00 PM" },
    { course_id: courseJee, name: "Batch J1 - JEE XI", timings: "07:30 AM - 10:00 AM" },
    { course_id: courseJee, name: "Batch J2 - JEE XII", timings: "04:30 PM - 07:00 PM" },
    { course_id: courseNeet, name: "Batch N1 - NEET XI", timings: "07:30 AM - 10:00 AM" },
    { course_id: courseNeet, name: "Batch N2 - NEET XII", timings: "04:30 PM - 07:00 PM" },
  ];
  const batchIds: number[] = [];
  for (const b of batchRows) {
    const [id] = await knex("batches").insert(b);
    batchIds.push(id);
  }

  const subjectNames = ["Physics", "Chemistry", "Mathematics", "Biology"];
  const subjectIds: number[] = [];
  for (const name of subjectNames) {
    const [id] = await knex("subjects").insert({ name, code: name.slice(0, 3).toUpperCase() });
    subjectIds.push(id);
  }

  const teacherUserIds: number[] = [];
  for (let i = 1; i <= 10; i++) {
    const [uid] = await knex("users").insert({
      role: "teacher",
      name: "Faculty Member " + i,
      email: "teacher" + i + "@claso.local",
      phone: "98100000" + String(i).padStart(2, "0"),
      password_hash: userPwHash,
      is_active: true,
      must_change_pw: false,
    });
    teacherUserIds.push(uid);
    await knex("teachers").insert({
      user_id: uid,
      qualification: i % 2 === 0 ? "M.Sc., B.Ed." : "B.Tech",
      joining_date: "2025-04-01",
    });
  }

  for (let bIdx = 0; bIdx < batchIds.length; bIdx++) {
    for (let sIdx = 0; sIdx < subjectIds.length; sIdx++) {
      const tId = teacherUserIds[(bIdx + sIdx) % teacherUserIds.length];
      await knex("batch_subjects").insert({
        batch_id: batchIds[bIdx],
        subject_id: subjectIds[sIdx],
        teacher_id: tId,
      });
    }
  }

  const [feePlanId] = await knex("fee_plans").insert({
    name: "Annual Tuition Plan",
    total_amount: 60000,
    installments: 3,
  });

  const studentIds: number[] = [];
  for (let i = 1; i <= 100; i++) {
    const admNo = "CLS-2026-" + String(i).padStart(3, "0");
    const [uid] = await knex("users").insert({
      role: "student",
      name: "Student " + i,
      phone: "9820000" + String(i).padStart(3, "0"),
      admission_no: admNo,
      password_hash: userPwHash,
      is_active: true,
      must_change_pw: false,
    });
    const batchId = batchIds[(i - 1) % batchIds.length];
    const [sid] = await knex("students").insert({
      user_id: uid,
      guardian_name: "Guardian of Student " + i,
      guardian_phone: "9830000" + String(i).padStart(3, "0"),
      batch_id: batchId,
      status: "active",
    });
    studentIds.push(sid);

    await knex("student_fees").insert({
      student_id: sid,
      plan_id: feePlanId,
      discount: 0,
    });

    await knex("invoices").insert({
      student_id: sid,
      title: "Installment 1 - Tuition",
      amount: 20000,
      due_date: "2026-12-10",
      status: i <= 40 ? "PAID" : "PENDING",
    });
  }

  const [examId] = await knex("exams").insert({
    name: "Mid-Term Assessment",
    batch_id: batchIds[0],
    subject_id: subjectIds[0],
    max_marks: 100,
    date: "2026-11-15",
  });

  for (let idx = 0; idx < 10; idx++) {
    await knex("marks").insert({
      exam_id: examId,
      student_id: studentIds[idx],
      score: 65 + ((idx * 3) % 30),
    });
  }

  await knex("doubts").insert({
    student_id: studentIds[0],
    batch_id: batchIds[0],
    subject_id: subjectIds[0],
    assignee_id: teacherUserIds[0],
    title: "Doubt on Newton Second Law numerical",
    status: "ASSIGNED",
    sla_due_at: new Date(Date.now() + 24 * 3600 * 1000),
  });

  await knex("audit_log").insert({
    actor_id: adminId,
    action: "SEED_INIT",
    entity: "system",
    entity_id: "initial_seed",
    new_value: JSON.stringify({ batches: 5, teachers: 10, students: 100 }),
  });
}
