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
deno task scan

# Run the scanner on a specific directory
deno task scan /path/to/scan

# Run the scanner on a specific directory with custom output directory
deno task scan /path/to/scan /path/to/output/dir/

# Build the scanner executable
deno task build
```

### Using the Executable (after building)

```bash
# Run the scanner on the current directory
./scan

# Run the scanner on a specific directory
./scan /path/to/scan

# Run the scanner on a specific directory with custom output directory
./scan /path/to/scan /path/to/output/dir/
```

## Key Format Rules

- Must start with lowercase letter
- No spaces (use camelCase or dot notation)
- No special characters like (), {}, [], <>, !, @, #, $, %, ^, &, *, =, +
- Examples of valid keys: user.profile, accountSettings, invoiceDetails

## Output

The scanner will:
1. Log all invalid keys with their file paths and line numbers
2. Create a locales-keys.ts file with all valid keys
3. Provide a summary of total, valid, and invalid keys
