# Translation Key Scanner

A tool for scanning Vue/TypeScript projects to find translation keys and validate their format.

## Features

- Scans for translation keys in t() calls across the project
- Validates translation keys format (no spaces, starts with lowercase, no special characters)
- Reports invalid keys with file paths and line numbers
- Outputs valid keys to a locales-keys.ts file
- Ignores specified directories and files

## Usage

### Using Deno Tasks

```bash
# Run the scanner on the current directory
# Output will be saved to ./locales-keys.ts
deno task scan

# Run the scanner on a specific directory
# Output will be saved to ./locales-keys.ts
deno task scan /path/to/scan

# Run the scanner on a specific directory with custom output directory
# Output will be saved to /path/to/output/dir/locales-keys.ts
deno task scan /path/to/scan /path/to/output/dir/

# Build the scanner executable
deno task build
```

### Using the Executable (after building)

```bash
# Run the scanner on the current directory
# Output will be saved to ./locales-keys.ts
./scan

# Run the scanner on a specific directory
# Output will be saved to ./locales-keys.ts
./scan /path/to/scan

# Run the scanner on a specific directory with custom output directory
# Output will be saved to /path/to/output/dir/locales-keys.ts
./scan /path/to/scan /path/to/output/dir/
```

## Key Format Rules

- Must start with lowercase letter
- No spaces (use camelCase, dot notation, or underscores)
- No special characters like (), {}, [], <>, !, @, #, $, %, ^, &, *, =, +
- Allowed separators: dots (.), hyphens (-), and underscores (_)
- Examples of valid keys: user.profile, account_settings, invoice-details

## Output

The scanner will:
1. Log all invalid keys with their file paths and line numbers
2. Log all translation keys that need manual review (with parameters)
3. Create a `locales-keys.ts` file in the root directory with all valid keys
4. Provide a summary of total, valid, invalid, and manual review keys
