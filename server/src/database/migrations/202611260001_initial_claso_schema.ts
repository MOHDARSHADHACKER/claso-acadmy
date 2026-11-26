import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (t) => {
    t.increments("id").primary();
    t.enu("role", ["admin", "teacher", "student"]).notNullable().index();
    t.string("name", 120).notNullable();
    t.string("email", 160).nullable().unique();
    t.string("phone", 25).nullable();
    t.string("admission_no", 50).nullable().unique();
    t.string("password_hash", 255).notNullable();
    t.string("photo", 255).nullable();
    t.boolean("is_active").notNullable().defaultTo(true).index();
    t.boolean("must_change_pw").notNullable().defaultTo(false);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("settings", (t) => {
    t.increments("id").primary();
    t.string("centre_name", 160).notNullable().defaultTo("Claso Coaching Centre");
    t.string("logo_path", 255).nullable();
    t.string("primary_color", 20).notNullable().defaultTo("#4f46e5");
    t.string("academic_year", 30).notNullable().defaultTo("2026-2027");
    t.integer("doubt_sla_hours").notNullable().defaultTo(24);
    t.integer("daily_doubt_limit").notNullable().defaultTo(5);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("courses", (t) => {
    t.increments("id").primary();
    t.string("name", 120).notNullable().unique();
    t.text("description").nullable();
    t.boolean("is_active").notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("batches", (t) => {
    t.increments("id").primary();
    t.integer("course_id").unsigned().notNullable().references("id").inTable("courses").onDelete("RESTRICT");
    t.string("name", 120).notNullable();
    t.string("timings", 100).notNullable();
    t.boolean("is_active").notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("subjects", (t) => {
    t.increments("id").primary();
    t.string("name", 120).notNullable().unique();
    t.string("code", 30).nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("batch_subjects", (t) => {
    t.increments("id").primary();
    t.integer("batch_id").unsigned().notNullable().references("id").inTable("batches").onDelete("CASCADE");
    t.integer("subject_id").unsigned().notNullable().references("id").inTable("subjects").onDelete("CASCADE");
    t.integer("teacher_id").unsigned().nullable().references("id").inTable("users").onDelete("SET NULL");
    t.unique(["batch_id", "subject_id"]);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("students", (t) => {
    t.increments("id").primary();
    t.integer("user_id").unsigned().notNullable().unique().references("id").inTable("users").onDelete("CASCADE");
    t.string("guardian_name", 120).notNullable();
    t.string("guardian_phone", 25).notNullable();
    t.date("dob").nullable();
    t.text("address").nullable();
    t.integer("batch_id").unsigned().nullable().references("id").inTable("batches").onDelete("SET NULL");
    t.enu("status", ["active", "archived"]).notNullable().defaultTo("active").index();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("teachers", (t) => {
    t.increments("id").primary();
    t.integer("user_id").unsigned().notNullable().unique().references("id").inTable("users").onDelete("CASCADE");
    t.string("qualification", 160).nullable();
    t.date("joining_date").nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("timetable", (t) => {
    t.increments("id").primary();
    t.integer("batch_id").unsigned().notNullable().references("id").inTable("batches").onDelete("CASCADE");
    t.integer("subject_id").unsigned().notNullable().references("id").inTable("subjects").onDelete("CASCADE");
    t.integer("teacher_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.enu("weekday", ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]).notNullable();
    t.string("start_time", 10).notNullable();
    t.string("end_time", 10).notNullable();
    t.index(["batch_id", "weekday"]);
    t.index(["teacher_id", "weekday"]);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("attendance", (t) => {
    t.increments("id").primary();
    t.integer("batch_id").unsigned().notNullable().references("id").inTable("batches").onDelete("CASCADE");
    t.integer("student_id").unsigned().notNullable().references("id").inTable("students").onDelete("CASCADE");
    t.date("date").notNullable();
    t.enu("status", ["present", "absent", "late"]).notNullable();
    t.integer("marked_by").unsigned().nullable().references("id").inTable("users").onDelete("SET NULL");
    t.unique(["batch_id", "student_id", "date"]);
    t.index(["student_id", "date"]);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("staff_attendance", (t) => {
    t.increments("id").primary();
    t.integer("teacher_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.date("date").notNullable();
    t.string("check_in", 10).nullable();
    t.string("check_out", 10).nullable();
    t.unique(["teacher_id", "date"]);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("fee_plans", (t) => {
    t.increments("id").primary();
    t.string("name", 120).notNullable();
    t.decimal("total_amount", 10, 2).notNullable();
    t.integer("installments").notNullable().defaultTo(1);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("student_fees", (t) => {
    t.increments("id").primary();
    t.integer("student_id").unsigned().notNullable().references("id").inTable("students").onDelete("CASCADE");
    t.integer("plan_id").unsigned().notNullable().references("id").inTable("fee_plans").onDelete("RESTRICT");
    t.decimal("discount", 10, 2).notNullable().defaultTo(0);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("invoices", (t) => {
    t.increments("id").primary();
    t.integer("student_id").unsigned().notNullable().references("id").inTable("students").onDelete("CASCADE");
    t.string("title", 160).notNullable();
    t.decimal("amount", 10, 2).notNullable();
    t.date("due_date").notNullable().index();
    t.enu("status", ["PENDING", "PARTIAL", "PAID", "OVERDUE"]).notNullable().defaultTo("PENDING").index();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("payments", (t) => {
    t.increments("id").primary();
    t.integer("invoice_id").unsigned().notNullable().references("id").inTable("invoices").onDelete("CASCADE");
    t.decimal("amount", 10, 2).notNullable();
    t.enu("mode", ["cash", "upi", "bank", "cheque"]).notNullable();
    t.string("reference", 120).nullable();
    t.date("paid_on").notNullable().index();
    t.integer("recorded_by").unsigned().nullable().references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
  });

  await knex.schema.createTable("exams", (t) => {
    t.increments("id").primary();
    t.string("name", 140).notNullable();
    t.integer("batch_id").unsigned().notNullable().references("id").inTable("batches").onDelete("CASCADE");
    t.integer("subject_id").unsigned().notNullable().references("id").inTable("subjects").onDelete("CASCADE");
    t.decimal("max_marks", 6, 2).notNullable();
    t.date("date").notNullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("marks", (t) => {
    t.increments("id").primary();
    t.integer("exam_id").unsigned().notNullable().references("id").inTable("exams").onDelete("CASCADE");
    t.integer("student_id").unsigned().notNullable().references("id").inTable("students").onDelete("CASCADE");
    t.decimal("score", 6, 2).notNullable();
    t.unique(["exam_id", "student_id"]);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("notes", (t) => {
    t.increments("id").primary();
    t.integer("batch_id").unsigned().notNullable().references("id").inTable("batches").onDelete("CASCADE");
    t.integer("subject_id").unsigned().notNullable().references("id").inTable("subjects").onDelete("CASCADE");
    t.integer("teacher_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.string("title", 160).notNullable();
    t.enu("type", ["note", "homework"]).notNullable().index();
    t.string("file_path", 255).notNullable();
    t.date("due_date").nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("submissions", (t) => {
    t.increments("id").primary();
    t.integer("note_id").unsigned().notNullable().references("id").inTable("notes").onDelete("CASCADE");
    t.integer("student_id").unsigned().notNullable().references("id").inTable("students").onDelete("CASCADE");
    t.string("file_path", 255).notNullable();
    t.timestamp("submitted_at").defaultTo(knex.fn.now());
    t.text("feedback").nullable();
    t.unique(["note_id", "student_id"]);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("doubts", (t) => {
    t.increments("id").primary();
    t.integer("student_id").unsigned().notNullable().references("id").inTable("students").onDelete("CASCADE");
    t.integer("batch_id").unsigned().notNullable().references("id").inTable("batches").onDelete("CASCADE");
    t.integer("subject_id").unsigned().notNullable().references("id").inTable("subjects").onDelete("CASCADE");
    t.integer("assignee_id").unsigned().nullable().references("id").inTable("users").onDelete("SET NULL");
    t.string("title", 200).notNullable();
    t.enu("status", ["OPEN", "ASSIGNED", "ANSWERED", "RESOLVED", "AUTO_CLOSED"]).notNullable().defaultTo("OPEN").index();
    t.integer("reopen_count").notNullable().defaultTo(0);
    t.timestamp("sla_due_at").nullable().index();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("doubt_messages", (t) => {
    t.increments("id").primary();
    t.integer("doubt_id").unsigned().notNullable().references("id").inTable("doubts").onDelete("CASCADE");
    t.integer("sender_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.text("message").notNullable();
    t.string("image_path", 255).nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("student_flags", (t) => {
    t.increments("id").primary();
    t.integer("student_id").unsigned().notNullable().references("id").inTable("students").onDelete("CASCADE");
    t.integer("teacher_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.integer("level").notNullable();
    t.enu("reason", ["attendance", "marks", "homework", "behaviour"]).notNullable();
    t.text("notes").nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("teacher_ratings", (t) => {
    t.increments("id").primary();
    t.integer("teacher_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.string("period", 7).notNullable().index();
    t.integer("clarity").notNullable();
    t.integer("punctuality").notNullable();
    t.integer("doubt_help").notNullable();
    t.text("comment").nullable();
    t.boolean("is_hidden").notNullable().defaultTo(false);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("rating_ballots", (t) => {
    t.increments("id").primary();
    t.integer("student_id").unsigned().notNullable().references("id").inTable("students").onDelete("CASCADE");
    t.integer("teacher_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.string("period", 7).notNullable();
    t.unique(["student_id", "teacher_id", "period"]);
    t.timestamps(true, true);
  });

  await knex.schema.createTable("announcements", (t) => {
    t.increments("id").primary();
    t.string("title", 180).notNullable();
    t.text("body").notNullable();
    t.enu("target", ["all", "batch", "role"]).notNullable().defaultTo("all");
    t.integer("batch_id").unsigned().nullable().references("id").inTable("batches").onDelete("SET NULL");
    t.string("target_role", 20).nullable();
    t.integer("created_by").unsigned().nullable().references("id").inTable("users").onDelete("SET NULL");
    t.timestamps(true, true);
  });

  await knex.schema.createTable("notifications", (t) => {
    t.increments("id").primary();
    t.integer("user_id").unsigned().notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.string("title", 180).notNullable();
    t.text("body").notNullable();
    t.boolean("is_read").notNullable().defaultTo(false).index();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("daily_summaries", (t) => {
    t.increments("id").primary();
    t.date("summary_date").notNullable().unique();
    t.json("payload_json").notNullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("audit_log", (t) => {
    t.increments("id").primary();
    t.integer("actor_id").unsigned().nullable().references("id").inTable("users").onDelete("SET NULL");
    t.string("action", 80).notNullable().index();
    t.string("entity", 80).notNullable().index();
    t.string("entity_id", 80).nullable();
    t.json("old_value").nullable();
    t.json("new_value").nullable();
    t.timestamp("created_at").defaultTo(knex.fn.now()).index();
  });
}

export async function down(knex: Knex): Promise<void> {
  const tables = [
    "audit_log", "daily_summaries", "notifications", "announcements", "rating_ballots",
    "teacher_ratings", "student_flags", "doubt_messages", "doubts", "submissions",
    "notes", "marks", "exams", "payments", "invoices", "student_fees", "fee_plans",
    "staff_attendance", "attendance", "timetable", "teachers", "students",
    "batch_subjects", "subjects", "batches", "courses", "settings", "users",
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
}
