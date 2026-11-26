import request from "supertest";
import { createApp } from "../src/app";

describe("Claso Server Auth & Health", () => {
  const app = createApp();
  it("returns health check ok", async () => { const res = await request(app).get("/api/v1/health"); expect(res.status).toBe(200); expect(res.body.status).toBe("ok"); });
  it("rejects unauthenticated access to /api/v1/auth/me", async () => { const res = await request(app).get("/api/v1/auth/me"); expect(res.status).toBe(401); });
  it("validates login body", async () => { const res = await request(app).post("/api/v1/auth/login").send({ role: "admin" }); expect(res.status).toBe(400); expect(res.body.code).toBe("VALIDATION_ERROR"); });
});
