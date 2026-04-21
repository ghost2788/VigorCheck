const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const FORBIDDEN_PATTERNS = [
  /expo-dev-client/i,
  /expo-dev-launcher/i,
  /expo-dev-menu/i,
];

const FORBIDDEN_MODULE_PATTERNS = FORBIDDEN_PATTERNS;
const FORBIDDEN_PERMISSIONS = [
  "android.permission.SYSTEM_ALERT_WINDOW",
  "android.permission.RECORD_AUDIO",
];

const EXCLUDED_ROOTS = new Set([
  ".agents",
  ".claude",
  ".expo",
  ".git",
  ".gstack",
  ".superpowers",
  ".windsurf",
  "android",
  "dist",
  "docs",
  "ios",
  "mockups",
  "my screenshots",
  "node_modules",
  "output",
  "previews",
  "tmp",
  "web-build",
]);

function run(command, args, cwd, extraEnv = {}) {
  console.log(`[audit] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd,
    env: {
      ...process.env,
      ...extraEnv,
    },
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`[audit] Command failed with exit code ${result.status ?? 1}.`);
    process.exit(result.status ?? 1);
  }
}

function copyWorkspace(sourceDir, targetDir) {
  fs.cpSync(sourceDir, targetDir, {
    filter: (source) => {
      const relative = path.relative(sourceDir, source);

      if (!relative) {
        return true;
      }

      if (fs.lstatSync(source).isSymbolicLink()) {
        return false;
      }

      if (path.basename(source).startsWith(".tmp")) {
        return false;
      }

      if (/^\.env.*\.local$/.test(path.basename(source))) {
        return false;
      }

      const root = relative.split(path.sep)[0];

      return !EXCLUDED_ROOTS.has(root);
    },
    recursive: true,
  });
}

function collectFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function isDebugOnlyAndroidFile(relativeFile) {
  const normalized = relativeFile.replace(/\\/g, "/");

  return normalized.startsWith("app/src/debug/") || normalized.startsWith("app/src/debugOptimized/");
}

function hasUnblockedForbiddenPermission(content, permission) {
  const permissionTags = content.match(/<uses-permission\b[^>]*>/gi) ?? [];

  return permissionTags.some((tag) => {
    if (!tag.includes(permission)) {
      return false;
    }

    return !/tools:node\s*=\s*["']remove["']/i.test(tag);
  });
}

function scanAndroidProject(androidDir) {
  const files = collectFiles(androidDir);
  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const relativeFile = path.relative(androidDir, file);

    for (const pattern of FORBIDDEN_MODULE_PATTERNS) {
      if (pattern.test(content)) {
        violations.push(`${relativeFile}: ${pattern.source}`);
      }
    }

    if (!isDebugOnlyAndroidFile(relativeFile)) {
      for (const permission of FORBIDDEN_PERMISSIONS) {
        if (hasUnblockedForbiddenPermission(content, permission)) {
          violations.push(`${relativeFile}: ${permission}`);
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error("Production Android native audit failed:");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }
}

function assertCleanLockfile(workspaceDir) {
  const lockfile = fs.readFileSync(path.join(workspaceDir, "package-lock.json"), "utf8");

  for (const pattern of FORBIDDEN_MODULE_PATTERNS) {
    if (pattern.test(lockfile)) {
      console.error(`Production lockfile still contains ${pattern.source}.`);
      process.exit(1);
    }
  }
}

function main() {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vigorcheck-production-android-audit-"));
  const workspaceDir = path.join(tempRoot, "workspace");
  const npmCommand = "npm";
  const npxCommand = "npx";

  try {
    console.log(`[audit] Copying clean workspace to ${workspaceDir}`);
    copyWorkspace(repoRoot, workspaceDir);
    assertCleanLockfile(workspaceDir);
    run(npmCommand, ["ci"], workspaceDir, { EAS_BUILD_PROFILE: "production", NODE_ENV: "production" });
    run(
      npxCommand,
      ["expo", "prebuild", "--clean", "--platform", "android"],
      workspaceDir,
      { EAS_BUILD_PROFILE: "production", NODE_ENV: "production" }
    );
    scanAndroidProject(path.join(workspaceDir, "android"));
    console.log("Production Android native audit passed.");
  } finally {
    if (process.env.KEEP_RELEASE_AUDIT_DIR === "1") {
      console.log(`Kept audit workspace at ${workspaceDir}`);
    } else {
      try {
        fs.rmSync(tempRoot, { force: true, recursive: true });
      } catch (error) {
        console.warn(
          `Production Android native audit passed, but the temp workspace could not be removed: ${tempRoot}`
        );
        if (error && typeof error === "object" && "code" in error) {
          console.warn(`Cleanup error code: ${error.code}`);
        }
      }
    }
  }
}

main();
