import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const releaseFiles = ["index.php", "style.css", "composer.json", "LICENSE", "README.md"];
const developmentFiles = [".gitignore", ".gitattributes", ".github/workflows/release.yml", "package.json", "scripts/theme.mjs", "tests/theme.test.mjs"];
const root = fileURLToPath(new URL("../", import.meta.url));

function read(directory, file) {
  assert.ok(lstatSync(join(directory, file)).isFile(), `${file} must be a regular file, not a symlink.`);
  return readFileSync(join(directory, file), "utf8");
}

function header(stylesheet, name) {
  const matches = [...stylesheet.slice(0, 8192).matchAll(new RegExp(`^${name}: (.+)$`, "gm"))];
  assert.equal(matches.length, 1, `Expected exactly one ${name} header.`);
  return matches[0][1];
}

export function checkTheme(directory) {
  const stylesheet = read(directory, "style.css");
  const template = read(directory, "index.php");
  const readme = read(directory, "README.md");
  const manifest = JSON.parse(read(directory, "package.json"));
  const composer = JSON.parse(read(directory, "composer.json"));
  read(directory, "LICENSE");

  assert.equal(composer.name, "getquick/gq-theme");
  assert.equal(composer.type, "wordpress-theme");
  assert.equal(composer.license, "GPL-2.0-only");
  assert.equal(composer.require?.php, ">=8.4.1");
  assert.equal(composer.require?.["composer/installers"], "^2.0");
  assert.equal(composer.extra?.["installer-name"], "gq-theme");
  assert.equal(composer.version, undefined, "Composer versions must be inferred from GitHub release tags.");
  assert.deepEqual(composer.archive?.exclude?.toSorted(), ["/*", "/.*", ...releaseFiles.map((file) => `!/${file}`)].sort(), "Composer archive allowlist must match the release ZIP.");

  assert.equal(header(stylesheet, "Theme Name"), "gq-theme");
  assert.equal(header(stylesheet, "Text Domain"), "gq-theme");
  assert.equal(header(stylesheet, "Requires at least"), "7.0");
  assert.equal(header(stylesheet, "Requires PHP"), "8.4.1");
  assert.equal(header(stylesheet, "License"), "GNU General Public License v2.0 only");
  assert.ok(stylesheet.startsWith("/*"), "Theme headers must be in the initial CSS comment.");
  assert.ok(stylesheet.indexOf("*/") > stylesheet.indexOf("Text Domain:"));
  const version = header(stylesheet, "Version");
  assert.match(version, /^\d+\.\d+\.\d+$/, "Expected a three-part release version.");
  assert.equal(manifest.version, version, "package.json version must match style.css.");
  assert.ok(readme.includes(`Current version: **${version}**`), "README version must match style.css.");
  assert.ok(readme.includes("**WordPress 7.0+**") && readme.includes("**PHP 8.4.1+**"), "README must document the supported minimums.");
  assert.ok(template.startsWith("<?php"), "Template must start with PHP, without a BOM.");
  assert.ok(!template.includes("?>"), "Do not add a closing PHP tag.");
  execFileSync("php", ["-l", join(directory, "index.php")], { stdio: "pipe" });
  const output = execFileSync("php", [join(directory, "index.php")], { timeout: 5000 });
  assert.equal(output.length, 0, "Placeholder template must produce no output.");
  return version;
}

export function validateArchive(archive) {
  execFileSync("unzip", ["-t", archive], { stdio: "pipe" });
  const entries = execFileSync("unzip", ["-Z1", archive], { encoding: "utf8" }).trim().split("\n").sort();
  assert.deepEqual(entries, releaseFiles.map((file) => `gq-theme/${file}`).sort(), "ZIP must contain exactly the release allowlist under gq-theme/.");
}

export function packageTheme(directory, output) {
  checkTheme(directory);
  const staging = mkdtempSync(join(tmpdir(), "gq-theme-release-"));
  try {
    mkdirSync(join(staging, "gq-theme"));
    for (const file of releaseFiles) {
      copyFileSync(join(directory, file), join(staging, "gq-theme", file));
    }
    const archive = join(staging, "release.zip");
    execFileSync("zip", ["-X", "-q", archive, ...releaseFiles.map((file) => `gq-theme/${file}`)], { cwd: staging });
    validateArchive(archive);
    mkdirSync(dirname(output), { recursive: true });
    copyFileSync(archive, output);
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

function format(directory, fix) {
  for (const file of [...releaseFiles, ...developmentFiles]) {
    // Keep the third-party license text verbatim.
    if (file === "LICENSE") continue;
    const original = read(directory, file);
    const formatted = original.replace(/\r\n?/g, "\n").replace(/[\t ]+$/gm, "").replace(/\n*$/, "\n");
    if (fix) {
      if (original !== formatted) writeFileSync(join(directory, file), formatted);
    } else {
      assert.equal(original, formatted, `Run npm run format to normalize ${file}.`);
    }
  }
}

function main() {
  const command = process.argv[2];
  if (command === "format" || command === "format:check") {
    format(root, command === "format");
  } else if (command === "lint") {
    for (const file of developmentFiles.filter((file) => file.endsWith(".mjs"))) {
      execFileSync(process.execPath, ["--check", join(root, file)], { stdio: "pipe" });
    }
    execFileSync("php", ["-l", join(root, "index.php")], { stdio: "pipe" });
  } else if (command === "check") {
    checkTheme(root);
  } else if (command === "package" || command === "validate:release") {
    const version = checkTheme(root);
    const output = resolve(root, "dist", `gq-theme-${version}.zip`);
    if (command === "package") packageTheme(root, output);
    else validateArchive(output);
    console.log(output);
  } else {
    throw new Error("Expected format, format:check, lint, check, package, or validate:release.");
  }
  console.log(`OK: ${command}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
