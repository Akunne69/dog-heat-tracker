const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const root = path.resolve(__dirname, "..");
const web = path.join(root, "www");

function buildWeb() {
  // Check that the required source files exist before building.
  const files = [
    "index.html",
    "styles.css",
    "app.js",
    "manifest.json",
    "sw.js",
    "native-reminders.js"
  ];

  for (const file of files) {
    const filePath = path.join(root, file);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Required source file not found: ${file}`);
    }
  }

  // Re-create the web output directory.
  fs.rmSync(web, { recursive: true, force: true });
  fs.mkdirSync(web, { recursive: true });

  // Copy the regular web assets.
  for (const file of files.slice(0, 5)) {
    fs.copyFileSync(
      path.join(root, file),
      path.join(web, file)
    );
  }

  // Bundle native-reminders.js using esbuild's JavaScript API.
  esbuild.buildSync({
    entryPoints: [path.join(root, "native-reminders.js")],
    bundle: true,
    format: "iife",
    platform: "browser",
    outfile: path.join(web, "native-reminders.bundle.js")
  });

  console.log("Web assets built successfully.");
}

try {
  buildWeb();
} catch (error) {
  console.error("Web build failed:", error);
  process.exitCode = 1;
}
