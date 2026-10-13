const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const root = path.resolve(__dirname, "..");
const web = path.join(root, "www");
fs.rmSync(web, { recursive: true, force: true });
fs.mkdirSync(web, { recursive: true });
for (const file of ["index.html", "styles.css", "app.js", "manifest.json", "sw.js"]) {
  fs.copyFileSync(path.join(root, file), path.join(web, file));
}
execFileSync(process.execPath, [path.join(root, "node_modules", "esbuild", "bin", "esbuild"), "native-reminders.js", "--bundle", "--format=iife", "--outfile=www/native-reminders.bundle.js"], { cwd: root, stdio: "inherit" });
