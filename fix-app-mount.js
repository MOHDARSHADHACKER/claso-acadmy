const fs = require("fs"); const path = require("path");
const p = path.join(process.cwd(), "server/src/app.ts");
let s = fs.readFileSync(p, "utf8");
if (!s.includes("academic.routes")) {
  s = s.replace(/import authRoutes from ["\x27]\.\/modules\/auth\/auth\.routes["\x27];?/, "import authRoutes from \"./modules/auth/auth.routes\";\nimport academicRoutes from \"./routes/academic.routes\";");
  s = s.replace(/app\.use\(["\x27]\/api\/v1\/auth["\x27],\s*authRoutes\);?/, "app.use(\"/api/v1/auth\", authRoutes);\n  app.use(\"/api/v1\", academicRoutes);");
  fs.writeFileSync(p, s, "utf8");
}
console.log(fs.readFileSync(p, "utf8"));
