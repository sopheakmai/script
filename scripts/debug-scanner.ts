// Debug script to test the shouldIgnore function
import { bold, green, blue, red } from "https://deno.land/std@0.203.0/fmt/colors.ts";

const ignorePatterns: string[] = [
  "node_modules/",
  "dist/",
  ".output/",
  "types/",
  ".git/",
  ".idea/",
  ".vscode/",
  "*.log",
  "*.local",
  "scripts/",
  "_old/",
  "locales/",
  "i18n/",
  ".nuxt/",
];

function shouldIgnore(relPath: string): boolean {
  // Always ignore anything that has node_modules in the path
  if (relPath.includes("node_modules")) {
    console.log(`${green("MATCHED")}: '${relPath}' contains 'node_modules'`);
    return true;
  }
  
  for (const pattern of ignorePatterns) {
    // Ignore directories
    if (pattern.endsWith("/")) {
      // Check if path is this directory or any subdirectory
      if (relPath === pattern.slice(0, -1) || relPath.startsWith(pattern) || 
          relPath.includes(`/${pattern.slice(0, -1)}/`)) { // Match directory anywhere in path
        console.log(`${green("MATCHED")}: '${relPath}' with pattern '${pattern}'`);
        return true;
      }
    }
    // Ignore file extensions
    else if (pattern.startsWith("*")) {
      if (relPath.endsWith(pattern.replace("*", ""))) {
        console.log(`${green("MATCHED")}: '${relPath}' with pattern '${pattern}'`);
        return true;
      }
    }
    // Ignore specific files
    else if (pattern.includes("*")) {
      const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
      if (regex.test(relPath)) {
        console.log(`${green("MATCHED")}: '${relPath}' with pattern '${pattern}'`);
        return true;
      }
    }
    // Exact match
    else {
      if (relPath === pattern) {
        console.log(`${green("MATCHED")}: '${relPath}' with pattern '${pattern}'`);
        return true;
      }
    }
  }
  return false;
}

// Test paths
const testPaths = [
  "node_modules",
  "node_modules/",
  "node_modules/package",
  "src/node_modules",
  "src/node_modules/package",
  "/Users/pheak/innotech/scf/frontend-web-portal/node_modules/.pnpm/shepherd.js@14.5.0/node_modules/shepherd.js/src/step.ts",
  "/Users/pheak/innotech/scf/frontend-web-portal/app/components/AssigUserForm.vue",
  "dist",
  "dist/",
  "dist/file.js",
  "scripts/file.ts",
  "src/scripts/file.ts", 
  ".output/file.js",
  "file.log",
  "node_modules.log",
];

console.log(bold(green("\n──────────── Testing shouldIgnore Function ────────────")));
testPaths.forEach(path => {
  const result = shouldIgnore(path);
  console.log(`Path: '${path}' | Should ignore: ${result ? green("YES") : red("NO")}`);
});

console.log(bold(green("\n──────────── Testing shouldIgnore Function ────────────")));
testPaths.forEach(path => {
  const result = shouldIgnore(path);
  console.log(`Path: '${path}' | Should ignore: ${result ? green("YES") : red("NO")}`);
});
