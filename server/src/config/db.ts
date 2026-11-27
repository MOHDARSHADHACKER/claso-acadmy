// import knex from "knex";
// import { env } from "./env";

// export const db = knex({
//   client: "mysql2",
//   connection: {
//     host: env.DB_HOST,
//     port: env.DB_PORT,
//     user: env.DB_USER,
//     password: env.DB_PASSWORD,
//     database: env.DB_NAME,
//     charset: "utf8mb4"
//   },
//   pool: { min: 2, max: 10 }
// });


import knex from "knex";
import { env } from "./env";

const isPostgres =
  env.DB_PORT === 5432 ||
  Boolean(env.DB_HOST && env.DB_HOST.includes("supabase.co"));

export const db = knex({
  client: isPostgres ? "pg" : "mysql2",
  connection: isPostgres
    ? {
        host: env.DB_HOST,
        port: env.DB_PORT || 5432,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME || "postgres",
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        charset: "utf8mb4",
      },
  pool: { min: 2, max: 10 },
});