const fs = require("fs"); const path = require("path");
const appPath = path.join(process.cwd(), "client/src/app/App.tsx");
let src = fs.readFileSync(appPath, "utf8");
if (!src.includes("AdminDashboardPage")) { src = src.replace("import { LoginPage } from \"@/features/auth/pages/LoginPage\";", "import { LoginPage } from \"@/features/auth/pages/LoginPage\";\nimport { AdminDashboardPage } from \"@/features/academic/pages/AdminDashboardPage\";"); }
src = src.replace("<Route path=\"/admin/dashboard\" element={<DashboardPlaceholder portal=\"Admin\" />} />", "<Route path=\"/admin/dashboard\" element={<AdminDashboardPage />} />");
fs.writeFileSync(appPath, src, "utf8"); console.log("Wired AdminDashboardPage");
