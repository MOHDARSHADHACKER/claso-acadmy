const fs = require("fs"); const path = require("path");
function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === "node_modules" || e.name === ".git") continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith(".json")) { let s = fs.readFileSync(p, "utf8"); if (s.charCodeAt(0) === 0xFEFF) { fs.writeFileSync(p, s.slice(1), "utf8"); console.log("Fixed BOM:", p); } } } }
walk(process.cwd());
const tsPath = path.join(process.cwd(), "server/tsconfig.json");
fs.writeFileSync(tsPath, JSON.stringify({ compilerOptions: { target: "ES2022", module: "CommonJS", moduleResolution: "node", outDir: "./dist", rootDir: ".", strict: true, noImplicitAny: true, esModuleInterop: true, skipLibCheck: true, forceConsistentCasingInFileNames: true }, include: ["src/**/*", "tests/**/*"] }, null, 2) + "\n", "utf8");
console.log("Fix applied");
