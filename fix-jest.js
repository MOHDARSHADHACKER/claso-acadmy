const fs = require("fs"); const path = require("path");
const w = (r, c) => { const f = path.join(process.cwd(), r); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, c, "utf8"); };
w("server/jest.config.js", "module.exports = {\n  preset: \"ts-jest\",\n  testEnvironment: \"node\",\n  roots: [\"<rootDir>/tests\"],\n  moduleFileExtensions: [\"ts\", \"js\", \"json\"]\n};\n");
w("server/src/types/bcrypt.d.ts", "declare module \"bcrypt\" {\n  export function hash(data: string | Buffer, saltOrRounds: string | number): Promise<string>;\n  export function compare(data: string | Buffer, encrypted: string): Promise<boolean>;\n}\n");
console.log("Jest & bcrypt types added");
