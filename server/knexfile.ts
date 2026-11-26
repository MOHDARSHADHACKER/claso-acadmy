import type { Knex } from "knex";
import dotenv from "dotenv";
dotenv.config();

const config: Record<string, Knex.Config> = {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "root",
      database: process.env.DB_NAME || "claso_db",
      charset: "utf8mb4"
    },
    pool: { min: 2, max: 10 },
    migrations: { directory: "./src/database/migrations", extension: "ts" },
    seeds: { directory: "./src/database/seeds", extension: "ts" }
  }
};

export default config;
