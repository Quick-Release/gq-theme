import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { checkTheme, packageTheme, releaseFiles, validateArchive } from "../scripts/theme.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "gq-theme-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  for (const file of [...releaseFiles, "package.json", ".gitattributes"]) {
    copyFileSync(join(root, file), join(directory, file));
  }
  return directory;
}

function replace(directory, file, before, after) {
  const path = join(directory, file);
  const content = readFileSync(path, "utf8");
  assert.ok(content.includes(before));
  writeFileSync(path, content.replace(before, after));
}

test("current theme passes metadata, syntax, and blank-output checks", () => {
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(checkTheme(root), manifest.version);
});

test("rejects mismatched package and README versions", (t) => {
  for (const file of ["package.json", "README.md"]) {
    const directory = fixture(t);
    const version = checkTheme(directory);
    replace(directory, file, version, "999.0.0");
    assert.throws(() => checkTheme(directory), /version must match/);
  }
});

test("rejects missing or duplicate required headers", (t) => {
  for (const replacement of ["", "Requires PHP: 8.4.1\nRequires PHP: 8.4.1\n"]) {
    const directory = fixture(t);
    replace(directory, "style.css", "Requires PHP: 8.4.1\n", replacement);
    assert.throws(() => checkTheme(directory), /exactly one Requires PHP/);
  }
});

test("rejects unsupported minimums and stale compatibility documentation", (t) => {
  const directory = fixture(t);
  replace(directory, "style.css", "Requires at least: 7.0", "Requires at least: 6.0");
  assert.throws(() => checkTheme(directory));
  const stale = fixture(t);
  replace(stale, "README.md", "**PHP 8.4.1+**", "**PHP 8.3+**");
  assert.throws(() => checkTheme(stale), /supported minimums/);
});

test("rejects template output and PHP syntax errors", (t) => {
  const directory = fixture(t);
  writeFileSync(join(directory, "index.php"), "<?php echo 'unexpected output';\n");
  assert.throws(() => checkTheme(directory), /produce no output/);
  writeFileSync(join(directory, "index.php"), "<?php function (\n");
  assert.throws(() => checkTheme(directory));
});

test("rejects symlinked release sources", (t) => {
  const directory = fixture(t);
  rmSync(join(directory, "LICENSE"));
  symlinkSync(join(root, "LICENSE"), join(directory, "LICENSE"));
  assert.throws(() => checkTheme(directory), /regular file/);
});

test("ZIP allowlist excludes all development files and rebuild removes stale entries", (t) => {
  const directory = fixture(t);
  for (const folder of [".agents/skills", ".git", "scripts", "tests", "dist"]) {
    mkdirSync(join(directory, folder), { recursive: true });
    writeFileSync(join(directory, folder, "do-not-deploy.txt"), "development only\n");
  }
  const archive = join(directory, "dist", "theme.zip");
  packageTheme(directory, archive);
  validateArchive(archive);
  for (const file of releaseFiles) {
    const archived = execFileSync("unzip", ["-p", archive, `gq-theme/${file}`]);
    assert.deepEqual(archived, readFileSync(join(directory, file)));
  }
  execFileSync("zip", ["-q", archive, ".agents/skills/do-not-deploy.txt"], { cwd: directory });
  assert.throws(() => validateArchive(archive), /release allowlist/);
  packageTheme(directory, archive);
  validateArchive(archive);
});

test("Composer metadata must identify the correct theme and installer directory", (t) => {
  const directory = fixture(t);
  const manifestPath = join(directory, "composer.json");
  const original = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const invalid of [
    { ...original, name: "getquick/another-theme" },
    { ...original, type: "wordpress-plugin" },
    { ...original, version: "0.1.0" },
    { ...original, require: { ...original.require, php: ">=8.3" } },
    { ...original, extra: { "installer-name": "another-theme" } },
    { ...original, archive: { exclude: [] } },
  ]) {
    writeFileSync(manifestPath, JSON.stringify(invalid));
    assert.throws(() => checkTheme(directory));
  }
});

test("Git source archives contain the same release allowlist", (t) => {
  const directory = fixture(t);
  mkdirSync(join(directory, ".agents"));
  writeFileSync(join(directory, ".agents", "local-skill.md"), "do not ship\n");
  execFileSync("git", ["init", "--quiet"], { cwd: directory });
  execFileSync("git", ["add", "--", "."], { cwd: directory });
  const tree = execFileSync("git", ["write-tree"], { cwd: directory, encoding: "utf8" }).trim();
  const archive = execFileSync("git", ["archive", "--format=tar", tree], { cwd: directory });
  const entries = execFileSync("tar", ["-tf", "-"], { input: archive, encoding: "utf8" }).trim().split("\n");
  assert.deepEqual(entries.sort(), [...releaseFiles].sort());
});

test("rejects corrupt ZIP archives", (t) => {
  const directory = fixture(t);
  const archive = join(directory, "broken.zip");
  writeFileSync(archive, "not a zip\n");
  assert.throws(() => validateArchive(archive));
});
