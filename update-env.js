const fs = require("fs"); const path = require("path");
const envPath = path.join(process.cwd(), "server/.env");
let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const setKey = (k, v) => { const re = new RegExp("^" + k + "=.*", "m"); content = re.test(content) ? content.replace(re, k + "=" + v) : (content.trimEnd() + "\n" + k + "=" + v + "\n"); };
setKey("DB_HOST", "127.0.0.1"); setKey("DB_PORT", "3306"); setKey("DB_USER", "claso_user"); setKey("DB_PASSWORD", "ClasoPass@123"); setKey("DB_NAME", "claso_db");
fs.writeFileSync(envPath, content, "utf8"); console.log("Updated server/.env");
