const fs = require("fs"); const path = require("path");
const appPath = path.join(process.cwd(), "server/src/app.ts");
let src = fs.readFileSync(appPath, "utf8");
if (!src.includes("./routes/academic.routes")) { src = src.replace("import authRoutes from \"./modules/auth/auth.routes\";", "import authRoutes from \"./modules/auth/auth.routes\";\nimport academicRoutes from \"./routes/academic.routes\";"); }
if (!src.includes("academicRoutes")) { src = src.replace("app.use(\"/api/v1/auth\", authRoutes);", "app.use(\"/api/v1/auth\", authRoutes);\n  app.use(\"/api/v1\", academicRoutes);"); }
fs.writeFileSync(appPath, src, "utf8"); console.log("Mounted academicRoutes in app.ts");
