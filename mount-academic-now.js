const fs = require("fs"); const path = require("path");
const p = path.join(process.cwd(), "server/src/app.ts");
let s = fs.readFileSync(p, "utf8");
if (!s.includes("academicRoutes")) { s = s.replace("import authRoutes from \"./modules/auth/auth.routes\";", "import authRoutes from \"./modules/auth/auth.routes\";\nimport academicRoutes from \"./routes/academic.routes\";"); }
if (!s.includes("/api/v1\", academicRoutes") && !s.includes("\x27/api/v1\x27, academicRoutes")) { s = s.replace("app.use(\"/api/v1/auth\", authRoutes);", "app.use(\"/api/v1/auth\", authRoutes);\n  app.use(\"/api/v1\", academicRoutes);"); }
fs.writeFileSync(p, s, "utf8");
console.log(fs.readFileSync(p, "utf8"));
