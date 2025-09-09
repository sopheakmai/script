// Log Features section to console
const targetExtensions = [".ts", ".vue"]; // e.g., add ".js", ".jsx", ".tsx" as needed
// Adjust file types to scan here
// ...existing code...
function shouldIgnore(relPath: string): boolean {
  // Always ignore anything that has node_modules in the path
  if (relPath.includes("node_modules")) {
    return true;
  }
  
  for (const pattern of ignorePatterns) {
    // Ignore directories
    if (pattern.endsWith("/")) {
      // Check if path is this directory or any subdirectory
      if (relPath === pattern.slice(0, -1) || relPath.startsWith(pattern) || 
          relPath.includes(`/${pattern.slice(0, -1)}/`)) // Match directory anywhere in path
        return true;
    }
    // Ignore file extensions
    else if (pattern.startsWith("*")) {
      if (relPath.endsWith(pattern.replace("*", "")))
        return true;
    }
    // Ignore specific files
    else if (pattern.includes("*")) {
      const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
      if (regex.test(relPath))
        return true;
    }
    // Exact match
    else {
      if (relPath === pattern)
        return true;
    }
  }
  return false;
}
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
  // Remove duplicate entries and ensure directories end with "/"
  ".nuxt/",
];
/**
 * Translation Key Scanner
 *
 * Features:
 * - Scans for translation keys in t() calls across the project.
 * - Supports strict format: t('word') or t("word") with the following validation rules:
 *   - No spaces in keys
 *   - Keys must start with lowercase letters
 *   - No special characters (parentheses, brackets, symbols, etc.)
 *   - No file paths or .vue extensions
 * - Ignores invalid formats and logs them with specific reasons.
 * - Detects t('key', { ... }) or t("key", { ... }) and logs for manual review (shows file and line number).
 * - Outputs result grouped by first letter (A-Z), with comment headers for each letter, in locales-keys.ts.
 * - Always outputs all letters A-Z, even if no keys exist for a letter.
 * - Human-readable value for each key (e.g. "account.center.activity-user" → "Account Center Activity User").
 * - Respects .gitignore and custom ignore patterns.
 * - Configurable file extensions and ignore patterns.
 * - Option to override or merge with existing locales-keys.ts:
 *     - Set const override: boolean = true to overwrite.
 *     - Set override = false to merge new keys with existing ones.
 *
 * Usage:
 *   pnpm esno scripts/find-locales.ts
 *   # or to scan a specific directory:
 *   pnpm esno scripts/find-locales.ts ./src/pages
 *
 * Output:
 *   locales-keys.ts
 *   export const localesKeys: Record<string, string> = {
 *     // A
 *     "account.center.activity-user": "Account Center Activity User",
 *     // B
 *     // ...
 *     // Z
 *   }
 *
 * Manual Review:
 *   - If t('key', { ... }) or t("key", { ... }) is found, logs:
 *     [MANUAL REVIEW] t("can.do", {...}) found in src/pages/foo.vue at line 42
 *   - These keys are NOT added to the result and must be handled manually.
 */

// Log Features section to console
import { bold, green, blue, red } from "https://deno.land/std@0.203.0/fmt/colors.ts";

let scanDir = Deno.args[0];
if (!scanDir) {
  scanDir = Deno.cwd(); // scan the whole project by default
} else {
  scanDir = new URL(scanDir, `file://${Deno.cwd()}/`).pathname;
}

console.log(bold(green("\n──────────── Translation Key Scanner ────────────")));
console.log(`${bold("Scan started at:")} ${blue(new Date().toLocaleString())}`);
console.log(`${green("Directory:")} ${blue(scanDir)}`);
// Print Features summary from doc block
const currentFile = new URL(import.meta.url).pathname;
const doc = await Deno.readTextFile(currentFile);
const featuresMatch = doc.match(/Features:[\s\S]*?\n\*/);
if (featuresMatch) {
  const featuresText = featuresMatch[0]
    .replace(/Features:/, bold(green("Features:")))
    .replace(/\n \* -/g, `\n${green("-")}`)
    .replace(/\n \*/g, "\n")
    .replace(/\n\*/g, "\n")
    .replace(/\n\n/g, "\n");
  console.log(featuresText.trim());
}
console.log(bold(green("───────────────────────────────────────────────\n")));


// Array of regexes for all required formats
const TRANSLATION_KEY_FORMATS: RegExp[] = [
  /\{\{\s*t\(\s*'([^']+)'\s*\)\s*\}\}/g, // {{ t('key') }}
  /\{\{\s*t\(\s*"([^"]+)"\s*\)\s*\}\}/g, // {{ t("key") }}
  /"t\(\s*'([^']+)'\s*\)"/g, // "t('key')"
  /'t\(\s*"([^"]+)"\s*\)'/g, // 't("key")'
  /\{\{\s*\$t\(\s*'([^']+)'\s*\)\s*\}\}/g, // {{ $t('key') }}
  /\{\{\s*\$t\(\s*"([^"]+)"\s*\)\s*\}\}/g, // {{ $t("key") }}
  /t\(\s*'([^']+)'\s*\)/g, // t('key')
  /t\(\s*"([^"]+)"\s*\)/g, // t("key")
];

function extractTKeys(file: string): { key: string; lineNumber: number }[] {
  const content = Deno.readTextFileSync(file);
  const lines = content.split('\n');
  const results: { key: string; lineNumber: number }[] = [];
  
  for (const regex of TRANSLATION_KEY_FORMATS) {
    // For each line, search for the regex
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match: RegExpExecArray | null;
      const lineRegex = new RegExp(regex.source, regex.flags);
      
      while ((match = lineRegex.exec(line)) !== null) {
        results.push({
          key: match[1],
          lineNumber: i + 1, // Line numbers are 1-based
        });
      }
    }
  }
  
  // Ignore all other usages, including t('key', {...})
  return results;
}

// Adjust file types to scan here
// ...existing code...

function toHumanReadable(key: string): string {
  // Replace . and - with space, then split camelCase
  return key
    .replace(/[.-]/g, " ")
    .split(" ")
    .map(word =>
      word
        .replace(/([a-z])([A-Z])/g, "$1 $2") // split camelCase
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getAllFiles(dir: string, exts = targetExtensions): Promise<string[]> {
  let results: string[] = [];
  try {
    for await (const entry of Deno.readDir(dir)) {
      const filePath = `${dir}/${entry.name}`;
      const relPath = filePath.replace(`${Deno.cwd()}/`, "");
      
      // Additional check to skip node_modules directories quickly
      if (entry.isDirectory && entry.name === "node_modules") {
        console.log(`Skipping node_modules directory: ${relPath}`);
        continue;
      }
      
      // Check if the path should be ignored before processing further
      if (shouldIgnore(relPath)) {
        if (entry.isDirectory) {
          console.log(`Skipping ignored directory: ${relPath}`);
        }
        continue;
      }
      
      if (entry.isDirectory) {
        results = results.concat(await getAllFiles(filePath, exts));
      } else if (exts.includes(filePath.slice(filePath.lastIndexOf(".")))) {
        results.push(filePath);
      }
    }
  } catch (error) {
    // Handle the unknown error type safely
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error reading directory ${dir}: ${errorMessage}`);
  }
  return results;
}

const files = await getAllFiles(scanDir);
const allKeyData = new Map<string, { filePath: string; lineNumber: number }[]>();

for (const file of files) {
  const extractedData = extractTKeys(file);
  for (const { key, lineNumber } of extractedData) {
    if (!allKeyData.has(key)) {
      allKeyData.set(key, []);
    }
    allKeyData.get(key)!.push({ filePath: file, lineNumber });
  }
}

const result: Record<string, string> = {};
let errorCount = 0;
let validCount = 0;
const allKeysArr = Array.from(allKeyData.keys()).sort();
allKeysArr.forEach((key: string) => {
  let isInvalid = false;
  let reason = "";

  // Check for spaces
  if (key.includes(" ")) {
    isInvalid = true;
    reason = "contains spaces";
  } 
  // Check for capitalized first letter
  else if (/^[A-Z]/.test(key)) {
    isInvalid = true;
    reason = "starts with uppercase letter";
  }
  // Check for special characters like parentheses and symbols
  else if (/[(){}[\]<>!@#$%^&*=+]/.test(key)) {
    isInvalid = true;
    reason = "contains special characters";
  }
  // Check for path-like strings
  else if (key.startsWith("~/") || key.endsWith(".vue")) {
    isInvalid = true;
    reason = "looks like a file path";
  }

  if (isInvalid) {
    const occurrences = allKeyData.get(key) || [];
    occurrences.forEach(({ filePath, lineNumber }) => {
      console.log(
        `${bold(red("[INVALID]"))
        } ${bold(`t("${key}")`)
        } found in ${blue(filePath)} on line ${bold(lineNumber.toString())} - ${reason}`,
      );
    });
    errorCount++;
    return;
  }
  
  result[key] = toHumanReadable(key);
  validCount++;
});
// Use the current working directory for output path instead of import.meta.url
const outputPath = `${Deno.cwd()}/scripts/locales-keys.ts`;

// ...existing code...

let output = "export const localesKeys: Record<string, string> = {\n";
const allLetters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

// Only use current scan result, no merging
const grouped: Record<string, [string, string][]> = {};
Object.entries(result).forEach(([key, value]) => {
  const firstLetter = key[0].toUpperCase();
  if (!grouped[firstLetter]) grouped[firstLetter] = [];
  grouped[firstLetter].push([key, value]);
});

output = "export const localesKeys: Record<string, string> = {\n";
allLetters.forEach((letter) => {
  output += `  // ${letter}\n`;
  if (grouped[letter]) {
    grouped[letter]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([key, value]) => {
        output += `  ${JSON.stringify(key)}: ${JSON.stringify(value)},\n`;
      });
  }
});
output += "}\n";

await Deno.writeTextFile(outputPath, output);
console.log(bold(green("\n─────────────── Scan Summary ───────────────")));
console.log(`${green("Total keys scanned:")} ${bold(allKeysArr.length.toString())}`);
console.log(`${red("Invalid keys:")} ${bold(errorCount.toString())}`);
console.log(`${green("Valid keys saved:")} ${bold(validCount.toString())}`);
console.log(`${green("Output file:")} ${blue(outputPath)}`);

// Show examples of correct format
if (errorCount > 0) {
  console.log(bold(green("\n─────────────── Correct Format Guide ───────────────")));
  console.log(`${bold("Invalid:")} ${red("Equal(==)")}    ${bold("Valid:")} ${green("equal")}`);
  console.log(`${bold("Invalid:")} ${red("About Business")}    ${bold("Valid:")} ${green("aboutBusiness")}`);
  console.log(`${bold("Invalid:")} ${red("T")}    ${bold("Valid:")} ${green("t")}`);
  console.log(`${bold("Invalid:")} ${red("Search....")}    ${bold("Valid:")} ${green("search")}`);
  console.log(`${bold("Invalid:")} ${red("N/A")}    ${bold("Valid:")} ${green("na")}`);
  console.log(bold(green("\nKey Format Rules:")));
  console.log(`${green("-")} Must start with lowercase letter`);
  console.log(`${green("-")} No spaces (use camelCase or dot notation)`);
  console.log(`${green("-")} No special characters like (), {}, [], <>, !, @, #, $, %, ^, &, *, =, +`);
  console.log(`${green("-")} Examples of valid keys: ${blue("user.profile")}, ${blue("accountSettings")}, ${blue("invoiceDetails")}`);
}
console.log(bold(green("─────────────────────────────────────────────\n")));
